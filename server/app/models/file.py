from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, TIMESTAMP, func
from app.database import Base


class File(Base):
    __tablename__ = "files"

    file_id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(500), nullable=False)
    size = Column(BigInteger, nullable=False, default=0)
    file_path = Column(String(500))
    cloud_url = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    uploaded_at = Column(TIMESTAMP, server_default=func.now())


class StorageDetail(Base):
    __tablename__ = "storage_details"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("files.file_id", ondelete="CASCADE"), unique=True, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    file_type = Column(String(100))
    timestamp = Column(TIMESTAMP, server_default=func.now())
