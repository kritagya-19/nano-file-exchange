"""
Public plans API — serves plan configuration to the website without authentication.
This is the single source of truth for plan pricing shown to users.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
import json

from app.database import get_db
from app.models.plan import Plan

router = APIRouter()


@router.get("/")
def get_all_plans(db: Session = Depends(get_db)):
    """Return all plans — public endpoint, no auth required."""
    plans = db.scalars(select(Plan).order_by(Plan.id)).all()

    result = {}
    for p in plans:
        try:
            features = json.loads(p.features) if isinstance(p.features, str) else p.features
        except (json.JSONDecodeError, TypeError):
            features = []

        result[p.plan_key] = {
            "name": p.name,
            "storage_limit_gb": p.storage_limit_gb,
            "monthly_price": p.monthly_price,
            "annual_price": p.annual_price,
            "features": features,
        }

    return {"plans": result}
