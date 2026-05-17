from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import datetime


class GroupCreate(BaseModel):
    group_name: str

    @field_validator("group_name")
    @classmethod
    def validate_group_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Group name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Group name must be at most 100 characters")
        return v


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
    email: EmailStr


class InvitationResponse(BaseModel):
    id: int
    group_id: int
    invited_email: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
