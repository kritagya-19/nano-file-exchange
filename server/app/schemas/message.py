from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime, timezone


def _to_utc_isoformat(dt: Optional[datetime]) -> Optional[str]:
    """Always serialize datetimes as UTC ISO-8601 with a Z suffix so the
    browser's Date constructor parses them correctly regardless of the
    server's local timezone."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Treat naive datetimes as UTC (they come from TIMESTAMP columns
        # that SQLAlchemy reads without timezone info).
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


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

    @field_serializer("created_at")
    def serialize_created_at(self, v: Optional[datetime]) -> Optional[str]:
        return _to_utc_isoformat(v)


class MessageStarResponse(BaseModel):
    id: int
    user_id: int
    name: str  # User's name
    created_at: Optional[datetime] = None

    @field_serializer("created_at")
    def serialize_created_at(self, v: Optional[datetime]) -> Optional[str]:
        return _to_utc_isoformat(v)


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

    @field_serializer("sent_at")
    def serialize_sent_at(self, v: Optional[datetime]) -> Optional[str]:
        return _to_utc_isoformat(v)
