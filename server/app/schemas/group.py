from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GroupCreate(BaseModel):
    group_name: str


class GroupResponse(BaseModel):
    group_id: int
    group_name: str
    created_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GroupMemberAdd(BaseModel):
    user_id: int


class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    name: str
    status: str
    joined_at: Optional[datetime] = None


class InviteByEmail(BaseModel):
    email: str


class InvitationResponse(BaseModel):
    id: int
    group_id: int
    invited_email: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

