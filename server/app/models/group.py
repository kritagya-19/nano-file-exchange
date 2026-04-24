from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, UniqueConstraint, func
from app.database import Base


class Group(Base):
    __tablename__ = "groups"

    group_id = Column(Integer, primary_key=True, autoincrement=True)
    group_name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="approved") # pending, approved, rejected
    joined_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="unique_membership"),
    )


class GroupInvitation(Base):
    __tablename__ = "group_invitations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    invited_email = Column(String(255), nullable=False)
    invite_token = Column(String(64), unique=True, nullable=False)
    invited_by = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending")  # pending, accepted, expired
    created_at = Column(TIMESTAMP, server_default=func.now())

