"""
Subscription / Checkout routes.

This module handles demo payment processing. Pricing is read from the Plan
table in the database so that admin changes are immediately reflected.

When migrating to Razorpay:
  1. Replace the POST /checkout logic with Razorpay order creation + verification.
  2. The Subscription model, GET /me endpoint, and frontend remain unchanged.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import asyncio
import json as _json

from app.database import get_db
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.activity_log import ActivityLog
from app.middleware.auth import get_current_user_id

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan: str                           # "pro" | "max"
    billing_cycle: str = "monthly"      # "monthly" | "annual"
    payment_method: str                 # "card" | "upi"
    # Card fields (optional — required when payment_method == "card")
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvc: Optional[str] = None
    card_name: Optional[str] = None
    # UPI fields (optional — required when payment_method == "upi")
    upi_id: Optional[str] = None


def _get_plan_pricing(db: Session):
    """Read plan pricing from the database."""
    plans = db.scalars(select(Plan)).all()
    pricing = {}
    storage_limits = {}
    for p in plans:
        pricing[p.plan_key] = {
            "monthly": p.monthly_price,
            "annual": p.annual_price,
        }
        storage_limits[p.plan_key] = int(p.storage_limit_gb * 1024**3)
    return pricing, storage_limits


@router.post("/checkout")
async def checkout(body: CheckoutRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """
    Demo payment endpoint. Validates inputs, simulates processing delay, and creates a Subscription record.
    Pricing is read from the Plan table so admin changes take effect immediately.
    """

    # ── Read pricing from DB ──
    plan_pricing, _ = _get_plan_pricing(db)

    if body.plan not in plan_pricing or body.plan == "free":
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'pro' or 'max'.")

    if body.billing_cycle not in ("monthly", "annual"):
        raise HTTPException(status_code=400, detail="Invalid billing cycle.")

    # ── Validate payment method details ──
    card_last4 = None
    upi_id_clean = None

    if body.payment_method == "card":
        if not body.card_number or not body.card_expiry or not body.card_cvc or not body.card_name:
            raise HTTPException(status_code=400, detail="All card fields are required.")
        digits = body.card_number.replace(" ", "").replace("-", "")
        if not digits.isdigit() or len(digits) < 13 or len(digits) > 19:
            raise HTTPException(status_code=400, detail="Invalid card number.")
        card_last4 = digits[-4:]

    elif body.payment_method == "upi":
        if not body.upi_id or "@" not in body.upi_id:
            raise HTTPException(status_code=400, detail="Invalid UPI ID. Must contain '@'.")
        upi_id_clean = body.upi_id.strip()

    else:
        raise HTTPException(status_code=400, detail="Payment method must be 'card' or 'upi'.")

    # ── Calculate amount from DB pricing ──
    amount = plan_pricing[body.plan][body.billing_cycle]

    # ── Simulate payment processing (replace with Razorpay verify_payment) ──
    await asyncio.sleep(1.5)

    # ── Calculate renewal date ──
    now = datetime.utcnow()
    if body.billing_cycle == "annual":
        renewal = now + timedelta(days=365)
    else:
        renewal = now + timedelta(days=30)

    # ── Deactivate previous active subscriptions for this user ──
    old_subs = db.scalars(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        )
    ).all()
    for old in old_subs:
        old.status = "cancelled"

    # ── Create subscription record ──
    subscription = Subscription(
        user_id=user_id,
        plan=body.plan,
        payment_method=body.payment_method,
        card_last4=card_last4,
        upi_id=upi_id_clean,
        amount_paid=amount,
        billing_cycle=body.billing_cycle,
        purchased_at=now,
        renewal_date=renewal,
        status="active",
    )
    db.add(subscription)

    # ── Log the activity ──
    db.add(ActivityLog(
        user_id=user_id,
        action="plan_upgrade",
        detail=f"User {user_id} upgraded to {body.plan.upper()} plan ({body.billing_cycle}) — ₹{amount} via {body.payment_method}",
    ))

    db.commit()
    db.refresh(subscription)

    return {
        "success": True,
        "message": f"Successfully upgraded to {body.plan.upper()} plan!",
        "subscription": {
            "id": subscription.id,
            "plan": subscription.plan,
            "amount_paid": float(subscription.amount_paid),
            "billing_cycle": subscription.billing_cycle,
            "payment_method": subscription.payment_method,
            "card_last4": subscription.card_last4,
            "purchased_at": subscription.purchased_at.isoformat() if subscription.purchased_at else None,
            "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        },
    }


@router.get("/me")
def get_subscription(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Return the user's most recent active subscription, or free plan defaults."""

    # Read storage limits from DB
    _, storage_limits = _get_plan_pricing(db)

    sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(desc(Subscription.purchased_at))
    )

    if not sub:
        return {
            "plan": "free",
            "payment_method": None,
            "card_last4": None,
            "upi_id": None,
            "amount_paid": 0,
            "billing_cycle": None,
            "purchased_at": None,
            "renewal_date": None,
            "storage_limit": storage_limits.get("free", 20 * 1024**3),
        }

    return {
        "plan": sub.plan,
        "payment_method": sub.payment_method,
        "card_last4": sub.card_last4,
        "upi_id": sub.upi_id,
        "amount_paid": float(sub.amount_paid),
        "billing_cycle": sub.billing_cycle,
        "purchased_at": sub.purchased_at.isoformat() if sub.purchased_at else None,
        "renewal_date": sub.renewal_date.isoformat() if sub.renewal_date else None,
        "storage_limit": storage_limits.get(sub.plan, storage_limits.get("free", 20 * 1024**3)),
    }

