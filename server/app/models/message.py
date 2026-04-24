from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, TIMESTAMP, UniqueConstraint, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    msg_type = Column(Enum("text", "file", "media", "deleted"), default="text")
    content = Column(Text, nullable=False)
    file_id = Column(Integer, ForeignKey("files.file_id", ondelete="SET NULL"), nullable=True)
    is_deleted_for_everyone = Column(Boolean, default=False)
    sent_at = Column(TIMESTAMP, server_default=func.now())

    # Optional relationships to help with querying
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    stars = relationship("MessageStar", back_populates="message", cascade="all, delete-orphan")
    hides = relationship("MessageHide", back_populates="message", cascade="all, delete-orphan")


class MessageHide(Base):
    __tablename__ = "message_hides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    hidden_at = Column(TIMESTAMP, server_default=func.now())

    message = relationship("Message", back_populates="hides")
    
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="unique_hide"),
    )


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    message = relationship("Message", back_populates="reactions")
    
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="unique_reaction"),
    )


class MessageStar(Base):
    __tablename__ = "message_stars"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    message = relationship("Message", back_populates="stars")
    
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="unique_star"),
    )
