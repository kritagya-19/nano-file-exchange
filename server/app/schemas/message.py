from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    content: str
    msg_type: str = "text"
    file_id: Optional[int] = None


class MessageReactionResponse(BaseModel):
    id: int
    user_id: int
    name: str  # User's name
    emoji: str
    created_at: Optional[datetime] = None


class MessageStarResponse(BaseModel):
    id: int
    user_id: int
    name: str  # User's name
    created_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    id: int
    group_id: int
    sender_id: int
    sender_name: str
    msg_type: str
    content: str
    file_id: Optional[int] = None
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    is_deleted_for_everyone: bool = False
    sent_at: Optional[datetime] = None
    reactions: List[MessageReactionResponse] = []
    stars: List[MessageStarResponse] = []
