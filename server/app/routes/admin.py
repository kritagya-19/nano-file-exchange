"""
Admin panel API routes.
Covers: authentication, user management, file management, group management,
plan/subscription management, storage analytics, revenue, activity logs,
and dashboard statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_, extract, case, text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os

from app.database import get_db
from app.models.user import User, Admin
from app.models.file import File, Folder, StorageDetail
from app.models.group import Group, GroupMember, GroupInvitation
from app.models.subscription import Subscription
from app.models.activity_log import ActivityLog
from app.models.plan import Plan
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.middleware.auth import verify_token

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
import jwt

router = APIRouter()

def _resolve_abs_file_path(file_path: str | None) -> str | None:
    if not file_path:
        return None
    if os.path.isabs(file_path):
        return file_path
    return os.path.join(settings.UPLOAD_DIR, file_path)


def _delete_file_from_disk(file_path: str | None) -> None:
    full_path = _resolve_abs_file_path(file_path)
    if not full_path:
        return
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass


# ─────────────────────── Admin Auth Middleware ───────────────────────

def get_admin_id(credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())):
    """Verify JWT and ensure the token belongs to an admin (subject starts with 'admin:')."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None or not str(sub).startswith("admin:"):
            raise HTTPException(status_code=403, detail="Admin access required")
        return int(str(sub).replace("admin:", ""))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─────────────────────── Schemas ────────────────────────────────────

class AdminLogin(BaseModel):
    admin_id: int
    password: str


class PlanUpdate(BaseModel):
    storage_limit_gb: Optional[float] = None
    monthly_price: Optional[float] = None
    annual_price: Optional[float] = None
    features: Optional[List[str]] = None


# ─────────────────────── 1. ADMIN AUTHENTICATION ─────────────────────

@router.post("/login")
def admin_login(body: AdminLogin, db: Session = Depends(get_db)):
    admin = db.scalar(select(Admin).where(Admin.admin_id == body.admin_id))
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token({"sub": f"admin:{admin.admin_id}", "role": "admin"})

    # Log activity
    log = ActivityLog(action="admin_login", detail=f"Admin {admin.admin_id} logged in")
    db.add(log)
    db.commit()

    return {"token": token, "admin_id": admin.admin_id, "role": "admin", "message": "Admin login successful"}


@router.get("/me")
def admin_me(admin_id: int = Depends(get_admin_id)):
    return {"admin_id": admin_id, "role": "admin"}


# ─────────────────────── 2. DASHBOARD STATS ──────────────────────────

@router.get("/dashboard")
def admin_dashboard(admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    """Complete dashboard stats for admin panel."""
    # Total users
    total_users = db.scalar(select(func.count(User.user_id))) or 0

    # Active users (status = 'active')
    active_users = db.scalar(select(func.count(User.user_id)).where(User.status == "active")) or 0

    # Total files
    total_files = db.scalar(select(func.count(File.file_id))) or 0

    # Total storage used
    total_storage = db.scalar(select(func.coalesce(func.sum(File.size), 0))) or 0

    # Total groups
    total_groups = db.scalar(select(func.count(Group.group_id))) or 0

    # Plan distribution
    plan_dist_query = (
        select(Subscription.plan, func.count(Subscription.id))
        .where(Subscription.status == "active")
        .group_by(Subscription.plan)
    )
    plan_rows = db.execute(plan_dist_query).all()
    plan_distribution = {row[0]: row[1] for row in plan_rows}

    # Users with no active subscription → free
    users_with_sub = db.scalar(
        select(func.count(func.distinct(Subscription.user_id))).where(Subscription.status == "active")
    ) or 0
    plan_distribution["free"] = plan_distribution.get("free", 0) + max(0, total_users - users_with_sub)

    # Revenue
    total_revenue = float(db.scalar(
        select(func.coalesce(func.sum(Subscription.amount_paid), 0))
    ) or 0)

    # Monthly revenue (current month)
    now = datetime.utcnow()
    monthly_revenue = float(db.scalar(
        select(func.coalesce(func.sum(Subscription.amount_paid), 0))
        .where(
            extract("year", Subscription.purchased_at) == now.year,
            extract("month", Subscription.purchased_at) == now.month,
        )
    ) or 0)

    # New users this month
    new_users_month = db.scalar(
        select(func.count(User.user_id)).where(
            extract("year", User.created_at) == now.year,
            extract("month", User.created_at) == now.month,
        )
    ) or 0

    # Recent 6 months revenue for chart
    monthly_revenue_chart = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        rev = float(db.scalar(
            select(func.coalesce(func.sum(Subscription.amount_paid), 0))
            .where(
                extract("year", Subscription.purchased_at) == d.year,
                extract("month", Subscription.purchased_at) == d.month,
            )
        ) or 0)
        monthly_revenue_chart.append({
            "month": d.strftime("%b %Y"),
            "revenue": rev,
        })

    # Recent 6 months user signups for chart
    user_growth_chart = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        count = db.scalar(
            select(func.count(User.user_id)).where(
                extract("year", User.created_at) == d.year,
                extract("month", User.created_at) == d.month,
            )
        ) or 0
        user_growth_chart.append({
            "month": d.strftime("%b %Y"),
            "users": count,
        })

    # Recent 6 months file uploads for chart
    upload_chart = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        count = db.scalar(
            select(func.count(File.file_id)).where(
                extract("year", File.uploaded_at) == d.year,
                extract("month", File.uploaded_at) == d.month,
            )
        ) or 0
        upload_chart.append({
            "month": d.strftime("%b %Y"),
            "uploads": count,
        })

    # Top 5 users by storage
    top_storage_users = []
    top_rows = db.execute(
        select(User.user_id, User.name, User.email, func.coalesce(func.sum(File.size), 0).label("total_size"))
        .outerjoin(File, File.user_id == User.user_id)
        .group_by(User.user_id, User.name, User.email)
        .order_by(desc("total_size"))
        .limit(5)
    ).all()
    for row in top_rows:
        top_storage_users.append({
            "user_id": row[0], "name": row[1], "email": row[2], "storage_used": int(row[3])
        })

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_files": total_files,
        "total_storage": total_storage,
        "total_groups": total_groups,
        "plan_distribution": plan_distribution,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "new_users_month": new_users_month,
        "monthly_revenue_chart": monthly_revenue_chart,
        "user_growth_chart": user_growth_chart,
        "upload_chart": upload_chart,
        "top_storage_users": top_storage_users,
    }


# ─────────────────────── 3. USER MANAGEMENT ──────────────────────────

@router.get("/users")
def list_users(
    search: Optional[str] = None,
    status: Optional[str] = None,
    plan: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    query = select(User)
    if search:
        query = query.where(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if status:
        query = query.where(User.status == status)

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    users = db.scalars(query.order_by(desc(User.created_at)).offset((page - 1) * per_page).limit(per_page)).all()

    result = []
    for u in users:
        # Get storage used
        storage = db.scalar(select(func.coalesce(func.sum(File.size), 0)).where(File.user_id == u.user_id)) or 0
        file_count = db.scalar(select(func.count(File.file_id)).where(File.user_id == u.user_id)) or 0

        # Get plan
        sub = db.scalar(
            select(Subscription)
            .where(Subscription.user_id == u.user_id, Subscription.status == "active")
            .order_by(desc(Subscription.purchased_at))
        )
        user_plan = sub.plan if sub else "free"

        result.append({
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "status": u.status,
            "plan": user_plan,
            "storage_used": int(storage),
            "total_files": file_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"users": result, "total": total, "page": page, "per_page": per_page}


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    storage = db.scalar(select(func.coalesce(func.sum(File.size), 0)).where(File.user_id == user_id)) or 0
    file_count = db.scalar(select(func.count(File.file_id)).where(File.user_id == user_id)) or 0
    group_count = db.scalar(select(func.count(GroupMember.id)).where(GroupMember.user_id == user_id, GroupMember.status == "approved")) or 0

    sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(desc(Subscription.purchased_at))
    )

    # Recent files
    recent_files = db.scalars(
        select(File).where(File.user_id == user_id).order_by(desc(File.uploaded_at)).limit(10)
    ).all()

    # Subscription history
    all_subs = db.scalars(
        select(Subscription).where(Subscription.user_id == user_id).order_by(desc(Subscription.purchased_at))
    ).all()

    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "plan": sub.plan if sub else "free",
        "storage_used": int(storage),
        "total_files": file_count,
        "group_count": group_count,
        "recent_files": [
            {"file_id": f.file_id, "file_name": f.file_name, "size": f.size, "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None}
            for f in recent_files
        ],
        "subscription_history": [
            {
                "id": s.id, "plan": s.plan, "amount_paid": float(s.amount_paid),
                "billing_cycle": s.billing_cycle, "status": s.status,
                "purchased_at": s.purchased_at.isoformat() if s.purchased_at else None,
            }
            for s in all_subs
        ],
    }


@router.patch("/users/{user_id}/block")
def block_user(user_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "inactive"
    db.add(ActivityLog(action="user_blocked", detail=f"Admin blocked user {user_id} ({user.email})"))
    db.commit()
    return {"message": f"User {user_id} blocked"}


@router.patch("/users/{user_id}/unblock")
def unblock_user(user_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "active"
    db.add(ActivityLog(action="user_unblocked", detail=f"Admin unblocked user {user_id} ({user.email})"))
    db.commit()
    return {"message": f"User {user_id} unblocked"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_files = db.scalars(select(File).where(File.user_id == user_id)).all()
    for file in user_files:
        _delete_file_from_disk(file.file_path)
    db.add(ActivityLog(action="user_deleted", detail=f"Admin deleted user {user_id} ({user.email})"))
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted permanently", "deleted_files_count": len(user_files)}


# ─────────────────────── 4. FILE MANAGEMENT ──────────────────────────

@router.get("/files")
def list_all_files(
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    sort_by: Optional[str] = Query("uploaded_at", pattern="^(uploaded_at|size|file_name)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    query = select(File, User.name, User.email).outerjoin(User, File.user_id == User.user_id)

    if search:
        query = query.where(File.file_name.ilike(f"%{search}%"))
    if user_id:
        query = query.where(File.user_id == user_id)
    if min_size:
        query = query.where(File.size >= min_size)
    if max_size:
        query = query.where(File.size <= max_size)

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    sort_col = getattr(File, sort_by, File.uploaded_at)
    order = desc(sort_col) if sort_order == "desc" else sort_col

    rows = db.execute(query.order_by(order).offset((page - 1) * per_page).limit(per_page)).all()

    result = []
    for file_obj, owner_name, owner_email in rows:
        result.append({
            "file_id": file_obj.file_id,
            "file_name": file_obj.file_name,
            "size": file_obj.size,
            "user_id": file_obj.user_id,
            "owner_name": owner_name,
            "owner_email": owner_email,
            "uploaded_at": file_obj.uploaded_at.isoformat() if file_obj.uploaded_at else None,
            "is_favorite": file_obj.is_favorite or False,
            "share_token": file_obj.share_token,
        })

    return {"files": result, "total": total, "page": page, "per_page": per_page}


@router.delete("/files/{file_id}")
def admin_delete_file(file_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    file = db.scalar(select(File).where(File.file_id == file_id))
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    _delete_file_from_disk(file.file_path)

    db.add(ActivityLog(action="file_deleted_admin", detail=f"Admin deleted file {file.file_name} (ID: {file_id})"))
    db.delete(file)
    db.commit()
    return {"message": f"File {file_id} deleted permanently"}


# ─────────────────────── 5. GROUP MANAGEMENT ─────────────────────────

@router.get("/groups")
def list_all_groups(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    query = select(Group, User.name).outerjoin(User, Group.created_by == User.user_id)

    if search:
        query = query.where(Group.group_name.ilike(f"%{search}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.execute(query.order_by(desc(Group.created_at)).offset((page - 1) * per_page).limit(per_page)).all()

    result = []
    for grp, creator_name in rows:
        member_count = db.scalar(
            select(func.count(GroupMember.id)).where(GroupMember.group_id == grp.group_id, GroupMember.status == "approved")
        ) or 0
        result.append({
            "group_id": grp.group_id,
            "group_name": grp.group_name,
            "created_by": grp.created_by,
            "creator_name": creator_name,
            "member_count": member_count,
            "created_at": grp.created_at.isoformat() if grp.created_at else None,
        })

    return {"groups": result, "total": total, "page": page, "per_page": per_page}


@router.get("/groups/{group_id}")
def get_group_detail(group_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    grp = db.scalar(select(Group).where(Group.group_id == group_id))
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    members = db.execute(
        select(GroupMember, User.name, User.email)
        .join(User, GroupMember.user_id == User.user_id)
        .where(GroupMember.group_id == group_id)
    ).all()

    creator = db.scalar(select(User).where(User.user_id == grp.created_by))

    return {
        "group_id": grp.group_id,
        "group_name": grp.group_name,
        "created_by": grp.created_by,
        "creator_name": creator.name if creator else "Unknown",
        "created_at": grp.created_at.isoformat() if grp.created_at else None,
        "members": [
            {"user_id": m.user_id, "name": name, "email": email, "status": m.status,
             "joined_at": m.joined_at.isoformat() if m.joined_at else None}
            for m, name, email in members
        ]
    }


@router.delete("/groups/{group_id}")
def admin_delete_group(group_id: int, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    grp = db.scalar(select(Group).where(Group.group_id == group_id))
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")
    # Hard-delete all message records first so group deletion is deterministic,
    # even if DB foreign keys are inconsistent in older environments.
    db.execute(text("DELETE FROM message_hides WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM message_stars WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM messages WHERE group_id = :gid"), {"gid": group_id})

    db.add(ActivityLog(action="group_deleted_admin", detail=f"Admin deleted group '{grp.group_name}' (ID: {group_id})"))
    db.delete(grp)
    db.commit()
    return {"message": f"Group {group_id} deleted permanently"}


# ─────────────────────── 6. PLAN & SUBSCRIPTION MANAGEMENT ──────────

import json as _json


@router.get("/plans")
def list_plans(admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    """Return all plans from the database."""
    plans = db.scalars(select(Plan).order_by(Plan.id)).all()
    result = {}
    for p in plans:
        try:
            features = _json.loads(p.features) if isinstance(p.features, str) else p.features
        except (_json.JSONDecodeError, TypeError):
            features = []
        result[p.plan_key] = {
            "name": p.name,
            "storage_limit_gb": p.storage_limit_gb,
            "monthly_price": p.monthly_price,
            "annual_price": p.annual_price,
            "features": features,
        }
    return {"plans": result}


@router.put("/plans/{plan_key}")
def update_plan(plan_key: str, body: PlanUpdate, admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    """Update a plan's configuration in the database."""
    plan = db.scalar(select(Plan).where(Plan.plan_key == plan_key))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    changes = []
    if body.storage_limit_gb is not None:
        plan.storage_limit_gb = body.storage_limit_gb
        changes.append(f"storage={body.storage_limit_gb}GB")
    if body.monthly_price is not None:
        plan.monthly_price = body.monthly_price
        changes.append(f"monthly=₹{body.monthly_price}")
    if body.annual_price is not None:
        plan.annual_price = body.annual_price
        changes.append(f"annual=₹{body.annual_price}")
    if body.features is not None:
        plan.features = _json.dumps(body.features)
        changes.append(f"features updated ({len(body.features)} items)")

    # Log the admin action
    db.add(ActivityLog(
        action="plan_updated",
        detail=f"Admin {admin_id} updated plan '{plan_key}': {', '.join(changes)}",
    ))
    db.commit()
    db.refresh(plan)

    try:
        features = _json.loads(plan.features) if isinstance(plan.features, str) else plan.features
    except (_json.JSONDecodeError, TypeError):
        features = []

    return {
        "message": f"Plan '{plan_key}' updated",
        "plan": {
            "name": plan.name,
            "storage_limit_gb": plan.storage_limit_gb,
            "monthly_price": plan.monthly_price,
            "annual_price": plan.annual_price,
            "features": features,
        },
    }


# ─────────────────────── 7. STORAGE MANAGEMENT ───────────────────────

@router.get("/storage")
def storage_overview(admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    total_storage = db.scalar(select(func.coalesce(func.sum(File.size), 0))) or 0
    total_files = db.scalar(select(func.count(File.file_id))) or 0

    # Storage per user (top 20)
    per_user = db.execute(
        select(User.user_id, User.name, User.email, func.coalesce(func.sum(File.size), 0).label("usage"))
        .outerjoin(File, File.user_id == User.user_id)
        .group_by(User.user_id, User.name, User.email)
        .order_by(desc("usage"))
        .limit(20)
    ).all()

    return {
        "total_storage": int(total_storage),
        "total_files": total_files,
        "per_user": [
            {"user_id": r[0], "name": r[1], "email": r[2], "storage_used": int(r[3])}
            for r in per_user
        ],
    }


# ─────────────────────── 8. REVENUE TRACKING ─────────────────────────

@router.get("/revenue")
def revenue_stats(admin_id: int = Depends(get_admin_id), db: Session = Depends(get_db)):
    total_revenue = float(db.scalar(select(func.coalesce(func.sum(Subscription.amount_paid), 0))) or 0)

    now = datetime.utcnow()

    # Monthly revenue for last 12 months
    monthly = []
    for i in range(11, -1, -1):
        d = now - timedelta(days=30 * i)
        rev = float(db.scalar(
            select(func.coalesce(func.sum(Subscription.amount_paid), 0))
            .where(
                extract("year", Subscription.purchased_at) == d.year,
                extract("month", Subscription.purchased_at) == d.month,
            )
        ) or 0)
        count = db.scalar(
            select(func.count(Subscription.id))
            .where(
                extract("year", Subscription.purchased_at) == d.year,
                extract("month", Subscription.purchased_at) == d.month,
            )
        ) or 0
        monthly.append({"month": d.strftime("%b %Y"), "revenue": rev, "subscriptions": count})

    # Users per plan
    plan_dist_query = (
        select(Subscription.plan, func.count(func.distinct(Subscription.user_id)))
        .where(Subscription.status == "active")
        .group_by(Subscription.plan)
    )
    plan_rows = db.execute(plan_dist_query).all()
    users_per_plan = {row[0]: row[1] for row in plan_rows}

    total_users = db.scalar(select(func.count(User.user_id))) or 0
    users_with_sub = sum(users_per_plan.values())
    users_per_plan["free"] = max(0, total_users - users_with_sub)

    # Recent subscriptions
    recent_subs = db.execute(
        select(Subscription, User.name, User.email)
        .join(User, Subscription.user_id == User.user_id)
        .order_by(desc(Subscription.purchased_at))
        .limit(20)
    ).all()

    return {
        "total_revenue": total_revenue,
        "monthly_chart": monthly,
        "users_per_plan": users_per_plan,
        "recent_subscriptions": [
            {
                "id": s.id, "user_name": name, "email": email, "plan": s.plan,
                "amount": float(s.amount_paid), "billing_cycle": s.billing_cycle,
                "status": s.status,
                "purchased_at": s.purchased_at.isoformat() if s.purchased_at else None,
            }
            for s, name, email in recent_subs
        ],
    }


# ─────────────────────── 9. ACTIVITY LOGS ────────────────────────────

@router.get("/activity-logs")
def get_activity_logs(
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    query = select(ActivityLog)
    if action:
        query = query.where(ActivityLog.action == action)
    if user_id:
        query = query.where(ActivityLog.user_id == user_id)

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    logs = db.scalars(query.order_by(desc(ActivityLog.created_at)).offset((page - 1) * per_page).limit(per_page)).all()

    return {
        "logs": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "action": l.action,
                "detail": l.detail,
                "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ─────────────────────── SEED / RESET ADMIN (dev convenience) ──────────

@router.post("/seed")
def seed_admin(db: Session = Depends(get_db)):
    """Upsert default admin: creates if not exists, resets password if it does. Admin ID=1, password=admin123"""
    existing = db.scalar(select(Admin).where(Admin.admin_id == 1))
    if existing:
        # Always reset to known password so credentials are never stale
        existing.password_hash = get_password_hash("admin123")
        db.commit()
        return {"message": "Admin password reset to 'admin123'", "admin_id": 1}

    admin = Admin(admin_id=1, password_hash=get_password_hash("admin123"))
    db.add(admin)
    db.commit()
    return {"message": "Admin seeded successfully", "admin_id": 1, "password": "admin123"}


@router.post("/reset-password")
def reset_admin_password(db: Session = Depends(get_db)):
    """Emergency password reset — always sets admin ID=1 password to 'admin123'."""
    existing = db.scalar(select(Admin).where(Admin.admin_id == 1))
    if existing:
        existing.password_hash = get_password_hash("admin123")
    else:
        existing = Admin(admin_id=1, password_hash=get_password_hash("admin123"))
        db.add(existing)
    db.commit()
    return {"message": "Admin password reset to 'admin123'", "admin_id": 1}
