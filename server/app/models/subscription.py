from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, DECIMAL, ForeignKey, func
from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    plan = Column(Enum("free", "pro", "max"), nullable=False, default="free")
    payment_method = Column(String(20), default=None)         # "card" | "upi" | None
    card_last4 = Column(String(4), default=None)
    upi_id = Column(String(100), default=None)
    amount_paid = Column(DECIMAL(10, 2), default=0)
    billing_cycle = Column(Enum("monthly", "annual"), default="monthly")
    purchased_at = Column(TIMESTAMP, server_default=func.now())
    renewal_date = Column(TIMESTAMP, default=None)
    status = Column(Enum("active", "cancelled", "expired"), default="active")
