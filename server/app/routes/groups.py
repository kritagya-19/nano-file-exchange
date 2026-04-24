from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse, GroupMemberAdd, GroupMemberResponse
from app.middleware.auth import get_current_user_id

router = APIRouter()

@router.post("", response_model=GroupResponse)
def create_group(group: GroupCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Create group
    new_group = Group(group_name=group.group_name, created_by=user_id)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Auto-add creator as a member
    member = GroupMember(group_id=new_group.group_id, user_id=user_id)
    db.add(member)
    db.commit()
    
    return new_group

@router.get("", response_model=List[GroupResponse])
def list_my_groups(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Groups where user is created_by OR is a member
    query = select(Group).join(GroupMember, Group.group_id == GroupMember.group_id, isouter=True).where(
        (Group.created_by == user_id) | (GroupMember.user_id == user_id)
    ).distinct()
    return db.scalars(query).all()

@router.post("/{group_id}/members", response_model=GroupMemberResponse)
def add_member(group_id: int, payload: GroupMemberAdd, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify group exists and user has permission (is creator)
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized or group not found")
        
    # Check if user to add exists
    user_to_add = db.scalar(select(User).where(User.user_id == payload.user_id))
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    existing = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == payload.user_id))
    if existing:
        raise HTTPException(status_code=400, detail="User already in group")
        
    new_member = GroupMember(group_id=group_id, user_id=payload.user_id)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return GroupMemberResponse(
        id=new_member.id,
        group_id=new_member.group_id,
        user_id=new_member.user_id,
        name=user_to_add.name,
        joined_at=new_member.joined_at
    )
