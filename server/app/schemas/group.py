from pydantic import BaseModel
from typing import Optional, List
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
    joined_at: Optional[datetime] = None
