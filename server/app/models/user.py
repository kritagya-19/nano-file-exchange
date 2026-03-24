from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, autoincrement=True)
    password_hash = Column(String(255), nullable=False)


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(Enum("active", "inactive"), default="active")
    created_at = Column(TIMESTAMP, server_default=func.now())
