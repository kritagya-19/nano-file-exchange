from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_
from typing import List, Optional
import jwt

from app.database import get_db
from app.models.message import Message, MessageReaction, MessageStar, MessageHide
from app.models.group import GroupMember, Group
from app.models.user import User
from app.models.file import File
from app.schemas.message import MessageCreate, MessageResponse, MessageReactionResponse, MessageStarResponse
from app.middleware.auth import get_current_user_id
from app.config import settings
from app.ws_manager import manager

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper — build a serialisable dict from a Message ORM row
# ---------------------------------------------------------------------------
def _build_message_dict(msg: Message, sender_name: str, file_record, user_map: dict) -> dict:
    reactions = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "name": user_map.get(r.user_id, "Unknown"),
            "emoji": r.emoji,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in msg.reactions
    ]
    stars = [
        {
            "id": s.id,
            "user_id": s.user_id,
            "name": user_map.get(s.user_id, "Unknown"),
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in msg.stars
    ]
    file_name = file_record.file_name if file_record else None
    file_url = None
    if file_record:
        file_url = file_record.cloud_url or f"/api/files/{file_record.file_id}"

    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "sender_id": msg.sender_id,
        "sender_name": sender_name,
        "msg_type": msg.msg_type,
        "content": msg.content,
        "file_id": msg.file_id,
        "file_name": file_name,
        "file_url": file_url,
        "is_deleted_for_everyone": msg.is_deleted_for_everyone,
        # Always emit UTC with Z so the browser parses it correctly
        "sent_at": (
            msg.sent_at.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            if msg.sent_at else None
        ),
        "reactions": reactions,
        "stars": stars,
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint  — ws://<host>/api/chat/ws/<group_id>?token=<jwt>
# ---------------------------------------------------------------------------
@router.websocket("/ws/{group_id}")
async def websocket_chat(
    websocket: WebSocket,
    group_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    # 1. Authenticate via token query param (WS can't send custom headers)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        await websocket.close(code=4001)
        return

    # 2. Confirm the user is an approved member of this group
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        await websocket.close(code=4004)
        return
    is_member = db.scalar(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    )
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        await websocket.close(code=4003)
        return

    # 3. Join the group room
    await manager.connect(websocket, group_id)
    try:
        # Keep the socket alive — we only use it for server→client push.
        # The client can send a ping to keep it alive; we just ignore payloads.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket, group_id)


# ---------------------------------------------------------------------------
# POST  /chat/{group_id}  — send a message + broadcast via WebSocket
# ---------------------------------------------------------------------------
@router.post("/{group_id}", response_model=MessageResponse)
async def send_message(
    group_id: int,
    payload: MessageCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    is_member = db.scalar(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    )
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")

    sender = db.scalar(select(User).where(User.user_id == user_id))
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    new_message = Message(
        group_id=group_id,
        sender_id=user_id,
        msg_type=payload.msg_type,
        content=payload.content,
        file_id=payload.file_id,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    file_record = None
    if new_message.file_id:
        file_record = db.scalar(select(File).where(File.file_id == new_message.file_id))

    msg_dict = _build_message_dict(new_message, sender.name, file_record, {})

    # Broadcast to all WebSocket clients in this group room (instant delivery)
    await manager.broadcast(group_id, {"type": "new_message", "message": msg_dict})

    return msg_dict


# ---------------------------------------------------------------------------
# GET  /chat/{group_id}  — fetch message history (REST fallback + initial load)
# ---------------------------------------------------------------------------
@router.get("/{group_id}", response_model=List[MessageResponse])
def get_messages(
    group_id: int,
    limit: int = Query(50, ge=1, le=200),
    before_id: Optional[int] = Query(None, description="Return messages with id < before_id (cursor pagination)"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    is_member = db.scalar(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    )
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")

    hidden_subquery = select(MessageHide.message_id).where(MessageHide.user_id == user_id)
    filter_conditions = [
        Message.group_id == group_id,
        Message.id.not_in(hidden_subquery),
    ]
    if before_id is not None:
        filter_conditions.append(Message.id < before_id)

    query = (
        select(Message, User.name, File)
        .join(User, Message.sender_id == User.user_id)
        .outerjoin(File, Message.file_id == File.file_id)
        .options(selectinload(Message.reactions), selectinload(Message.stars))
        .where(and_(*filter_conditions))
        .order_by(Message.sent_at.desc())
        .limit(limit)
    )
    results = db.execute(query).all()

    user_ids = set()
    for msg, _, _ in results:
        for r in msg.reactions:
            user_ids.add(r.user_id)
        for s in msg.stars:
            user_ids.add(s.user_id)

    user_map = {}
    if user_ids:
        users = db.execute(select(User).where(User.user_id.in_(user_ids))).scalars().all()
        user_map = {u.user_id: u.name for u in users}

    messages = []
    for msg, sender_name, file_record in reversed(results):
        messages.append(_build_message_dict(msg, sender_name, file_record, user_map))
    return messages


# ---------------------------------------------------------------------------
# Reactions
# ---------------------------------------------------------------------------
@router.post("/{group_id}/react/{msg_id}")
def add_reaction(
    group_id: int,
    msg_id: int,
    emoji: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    msg = db.scalar(select(Message).where(Message.id == msg_id, Message.group_id == group_id))
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    existing = db.scalar(select(MessageReaction).where(
        MessageReaction.message_id == msg_id,
        MessageReaction.user_id == user_id,
        MessageReaction.emoji == emoji,
    ))
    if not existing:
        reaction = MessageReaction(message_id=msg_id, user_id=user_id, emoji=emoji)
        db.add(reaction)
        db.commit()
    return {"status": "success"}


@router.delete("/{group_id}/react/{msg_id}/{emoji}")
def remove_reaction(
    group_id: int,
    msg_id: int,
    emoji: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    reaction = db.scalar(select(MessageReaction).where(
        MessageReaction.message_id == msg_id,
        MessageReaction.user_id == user_id,
        MessageReaction.emoji == emoji,
    ))
    if reaction:
        db.delete(reaction)
        db.commit()
    return {"status": "success"}


# ---------------------------------------------------------------------------
# Stars
# ---------------------------------------------------------------------------
@router.post("/{group_id}/star/{msg_id}")
def add_star(
    group_id: int,
    msg_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    msg = db.scalar(select(Message).where(Message.id == msg_id, Message.group_id == group_id))
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    existing = db.scalar(select(MessageStar).where(MessageStar.message_id == msg_id, MessageStar.user_id == user_id))
    if not existing:
        star = MessageStar(message_id=msg_id, user_id=user_id)
        db.add(star)
        db.commit()
    return {"status": "success"}


@router.delete("/{group_id}/star/{msg_id}")
def remove_star(
    group_id: int,
    msg_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    star = db.scalar(select(MessageStar).where(MessageStar.message_id == msg_id, MessageStar.user_id == user_id))
    if star:
        db.delete(star)
        db.commit()
    return {"status": "success"}


# ---------------------------------------------------------------------------
# Delete / Clear
# ---------------------------------------------------------------------------
@router.delete("/{group_id}/{msg_id}")
def delete_message(
    group_id: int,
    msg_id: int,
    delete_for_everyone: bool = Query(False),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    msg = db.scalar(select(Message).where(Message.id == msg_id, Message.group_id == group_id))
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if delete_for_everyone:
        if msg.sender_id != user_id:
            raise HTTPException(status_code=403, detail="Only sender can delete for everyone")
        msg.is_deleted_for_everyone = True
        msg.content = "This message was deleted"
        msg.msg_type = "deleted"
        msg.file_id = None
        db.execute(MessageReaction.__table__.delete().where(MessageReaction.message_id == msg_id))
        db.execute(MessageStar.__table__.delete().where(MessageStar.message_id == msg_id))
        db.commit()
        return {"status": "deleted_for_everyone"}
    else:
        existing = db.scalar(select(MessageHide).where(
            MessageHide.message_id == msg_id, MessageHide.user_id == user_id
        ))
        if not existing:
            hide = MessageHide(message_id=msg_id, user_id=user_id)
            db.add(hide)
            db.commit()
        return {"status": "deleted_for_me"}


@router.delete("/{group_id}/clear/all")
def clear_chat(
    group_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")

    already_hidden_query = select(MessageHide.message_id).where(MessageHide.user_id == user_id)
    messages_to_hide = db.scalars(
        select(Message.id).where(
            Message.group_id == group_id,
            Message.id.not_in(already_hidden_query),
        )
    ).all()

    if messages_to_hide:
        hides = [MessageHide(message_id=mid, user_id=user_id) for mid in messages_to_hide]
        db.add_all(hides)
        db.commit()

    return {"status": "success", "cleared_count": len(messages_to_hide)}
