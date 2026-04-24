from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.message import Message
from app.models.group import GroupMember
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse
from app.middleware.auth import get_current_user_id

router = APIRouter()

@router.post("/{group_id}", response_model=MessageResponse)
def send_message(group_id: int, payload: MessageCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify user is in the group
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    sender = db.scalar(select(User).where(User.user_id == user_id))
    
    new_message = Message(
        group_id=group_id,
        sender_id=user_id,
        msg_type=payload.msg_type,
        content=payload.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return {
        "id": new_message.id,
        "group_id": new_message.group_id,
        "sender_id": new_message.sender_id,
        "sender_name": sender.name,
        "msg_type": new_message.msg_type,
        "content": new_message.content,
        "sent_at": new_message.sent_at
    }

@router.get("/{group_id}", response_model=List[MessageResponse])
def get_messages(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify user is in the group
    is_member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    query = select(Message, User.name).join(User, Message.sender_id == User.user_id).where(Message.group_id == group_id).order_by(Message.sent_at.desc()).limit(50)
    results = db.execute(query).all()
    
    return [
        {
            "id": msg.id,
            "group_id": msg.group_id,
            "sender_id": msg.sender_id,
            "sender_name": name,
            "msg_type": msg.msg_type,
            "content": msg.content,
            "sent_at": msg.sent_at
        } for msg, name in results
    ]
