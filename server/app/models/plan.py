"""
Plan model — persists plan configuration in the database so that admin changes
are durable across server restarts and visible to the public API.
"""

from sqlalchemy import Column, Integer, String, Float, Text, TIMESTAMP, func
from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_key = Column(String(20), unique=True, nullable=False)      # "free", "pro", "max"
    name = Column(String(50), nullable=False)                        # Display name
    storage_limit_gb = Column(Float, nullable=False, default=20)
    monthly_price = Column(Float, nullable=False, default=0)
    annual_price = Column(Float, nullable=False, default=0)
    features = Column(Text, nullable=False, default="[]")            # JSON array stored as string
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
