from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, TIMESTAMP, func
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    msg_type = Column(Enum("text", "file", "media"), default="text")
    content = Column(Text, nullable=False)
    sent_at = Column(TIMESTAMP, server_default=func.now())
