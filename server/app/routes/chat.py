from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_
from typing import List

from app.database import get_db
from app.models.message import Message, MessageReaction, MessageStar, MessageHide
from app.models.group import GroupMember, Group
from app.models.user import User
from app.models.file import File
from app.schemas.message import MessageCreate, MessageResponse, MessageReactionResponse, MessageStarResponse
from app.middleware.auth import get_current_user_id

router = APIRouter()

@router.post("/{group_id}", response_model=MessageResponse)
def send_message(group_id: int, payload: MessageCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify user is approved member or creator
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
        
    sender = db.scalar(select(User).where(User.user_id == user_id))
    
    new_message = Message(
        group_id=group_id,
        sender_id=user_id,
        msg_type=payload.msg_type,
        content=payload.content,
        file_id=payload.file_id
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    file_name = None
    file_url = None
    if new_message.file_id:
        file_record = db.scalar(select(File).where(File.file_id == new_message.file_id))
        if file_record:
            file_name = file_record.file_name
            file_url = file_record.cloud_url or f"/api/files/{file_record.file_id}"
    
    return {
        "id": new_message.id,
        "group_id": new_message.group_id,
        "sender_id": new_message.sender_id,
        "sender_name": sender.name,
        "msg_type": new_message.msg_type,
        "content": new_message.content,
        "file_id": new_message.file_id,
        "file_name": file_name,
        "file_url": file_url,
        "is_deleted_for_everyone": False,
        "sent_at": new_message.sent_at,
        "reactions": [],
        "stars": []
    }

@router.get("/{group_id}", response_model=List[MessageResponse])
def get_messages(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify user is approved member or creator
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
        
    # We query messages and eagerly load reactions and stars
    # We must exclude messages hidden by this user
    # Subquery for messages hidden by this user
    hidden_subquery = select(MessageHide.message_id).where(MessageHide.user_id == user_id)
    
    query = (
        select(Message, User.name, File)
        .join(User, Message.sender_id == User.user_id)
        .outerjoin(File, Message.file_id == File.file_id)
        .options(selectinload(Message.reactions), selectinload(Message.stars))
        .where(
            and_(
                Message.group_id == group_id,
                Message.id.not_in(hidden_subquery)
            )
        )
        .order_by(Message.sent_at.desc())
        .limit(50)
    )
    results = db.execute(query).all()
    
    # Needs a separate query to map user IDs to names for reactions and stars, or we can look them up
    # We will gather all user ids involved in reactions/stars
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
    # Results are in desc order, we might want them in asc order for the chat UI, but let's keep original sorting and reverse client-side if needed, or reverse here.
    for msg, sender_name, file_record in reversed(results):
        reactions = [
            MessageReactionResponse(
                id=r.id,
                user_id=r.user_id,
                name=user_map.get(r.user_id, "Unknown"),
                emoji=r.emoji,
                created_at=r.created_at
            ) for r in msg.reactions
        ]
        stars = [
            MessageStarResponse(
                id=s.id,
                user_id=s.user_id,
                name=user_map.get(s.user_id, "Unknown"),
                created_at=s.created_at
            ) for s in msg.stars
        ]
        
        file_name = file_record.file_name if file_record else None
        file_url = None
        if file_record:
            file_url = file_record.cloud_url or f"/api/files/{file_record.file_id}"
            
        messages.append({
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
            "sent_at": msg.sent_at,
            "reactions": reactions,
            "stars": stars
        })
    return messages

@router.post("/{group_id}/react/{msg_id}")
def add_reaction(group_id: int, msg_id: int, emoji: str, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Check if member or creator
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
        
    msg = db.scalar(select(Message).where(Message.id == msg_id, Message.group_id == group_id))
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    existing = db.scalar(select(MessageReaction).where(MessageReaction.message_id == msg_id, MessageReaction.user_id == user_id, MessageReaction.emoji == emoji))
    if not existing:
        reaction = MessageReaction(message_id=msg_id, user_id=user_id, emoji=emoji)
        db.add(reaction)
        db.commit()
    return {"status": "success"}

@router.delete("/{group_id}/react/{msg_id}/{emoji}")
def remove_reaction(group_id: int, msg_id: int, emoji: str, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
        
    reaction = db.scalar(select(MessageReaction).where(MessageReaction.message_id == msg_id, MessageReaction.user_id == user_id, MessageReaction.emoji == emoji))
    if reaction:
        db.delete(reaction)
        db.commit()
    return {"status": "success"}

@router.post("/{group_id}/star/{msg_id}")
def add_star(group_id: int, msg_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
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
def remove_star(group_id: int, msg_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
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

@router.delete("/{group_id}/{msg_id}")
def delete_message(group_id: int, msg_id: int, delete_for_everyone: bool = Query(False), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
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
        # Remove reactions and stars manually if you want or let cascade keep them? They are mostly useless now.
        # Actually relationship cascade deals with deleting the message, not modifying.
        db.execute(MessageReaction.__table__.delete().where(MessageReaction.message_id == msg_id))
        db.execute(MessageStar.__table__.delete().where(MessageStar.message_id == msg_id))
        db.commit()
        return {"status": "deleted_for_everyone"}
    else:
        existing = db.scalar(select(MessageHide).where(MessageHide.message_id == msg_id, MessageHide.user_id == user_id))
        if not existing:
            hide = MessageHide(message_id=msg_id, user_id=user_id)
            db.add(hide)
            db.commit()
        return {"status": "deleted_for_me"}

@router.delete("/{group_id}/clear/all")
def clear_chat(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if group.created_by != user_id and (not is_member or is_member.status != "approved"):
        raise HTTPException(status_code=403, detail="Not an approved member of this group")
    
    # Get all messages user has NOT ALREADY hidden
    already_hidden_query = select(MessageHide.message_id).where(MessageHide.user_id == user_id)
    
    messages_to_hide = db.scalars(select(Message.id).where(
        Message.group_id == group_id,
        Message.id.not_in(already_hidden_query)
    )).all()
    
    if messages_to_hide:
        hides = [MessageHide(message_id=mid, user_id=user_id) for mid in messages_to_hide]
        db.add_all(hides)
        db.commit()
        
    return {"status": "success", "cleared_count": len(messages_to_hide)}

