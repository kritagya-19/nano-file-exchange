from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    content: str
    msg_type: str = "text"


class MessageResponse(BaseModel):
    id: int
    group_id: int
    sender_id: int
    sender_name: str
    msg_type: str
    content: str
    sent_at: Optional[datetime] = None
