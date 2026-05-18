"""
Admin Report Generation — CSV exports.
All endpoints are admin-only (JWT protected).
Uses Python's built-in csv + io — zero new dependencies.
"""

import csv
import io
import json as _json
from datetime import datetime, UTC
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.user import User
from app.models.file import File
from app.models.group import Group, GroupMember
from app.models.subscription import Subscription
from app.models.activity_log import ActivityLog
from app.routes.admin import get_admin_id

router = APIRouter()


# ─────────────── helpers ───────────────

def _csv_response(rows: list[list], headers: list[str], filename: str) -> StreamingResponse:
    """Build a StreamingResponse containing a CSV file."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _fmt_bytes(b: int) -> str:
    if not b:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    val = float(b)
    while val >= 1024 and i < len(units) - 1:
        val /= 1024
        i += 1
    return f"{val:.1f} {units[i]}" if i > 1 else f"{int(val)} {units[i]}"


def _fmt_dt(dt) -> str:
    return dt.strftime("%Y-%m-%d %H:%M") if dt else ""


# ─────────────── 1. PLATFORM SUMMARY ───────────────

@router.get("/platform-summary")
def report_platform_summary(
    start: Optional[str] = None,
    end: Optional[str] = None,
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)

    # ── Users
    user_q = select(func.count(User.user_id))
    if start_dt:
        user_q = user_q.where(User.created_at >= start_dt)
    if end_dt:
        user_q = user_q.where(User.created_at <= end_dt)
    total_users = db.scalar(user_q) or 0
    active_users = db.scalar(
        select(func.count(User.user_id)).where(User.status == "active")
    ) or 0

    # ── Files
    file_q = select(func.count(File.file_id))
    storage_q = select(func.coalesce(func.sum(File.size), 0))
    if start_dt:
        file_q = file_q.where(File.uploaded_at >= start_dt)
        storage_q = storage_q.where(File.uploaded_at >= start_dt)
    if end_dt:
        file_q = file_q.where(File.uploaded_at <= end_dt)
        storage_q = storage_q.where(File.uploaded_at <= end_dt)
    total_files = db.scalar(file_q) or 0
    total_storage = db.scalar(storage_q) or 0

    # ── Revenue
    rev_q = select(func.coalesce(func.sum(Subscription.amount_paid), 0))
    if start_dt:
        rev_q = rev_q.where(Subscription.purchased_at >= start_dt)
    if end_dt:
        rev_q = rev_q.where(Subscription.purchased_at <= end_dt)
    total_revenue = float(db.scalar(rev_q) or 0)

    # ── Groups
    total_groups = db.scalar(select(func.count(Group.group_id))) or 0

    # ── Plan distribution (always current snapshot)
    plan_rows = db.execute(
        select(Subscription.plan, func.count(func.distinct(Subscription.user_id)))
        .where(Subscription.status == "active")
        .group_by(Subscription.plan)
    ).all()
    plan_dist = {r[0]: r[1] for r in plan_rows}
    total_sub_users = sum(plan_dist.values())
    all_users_count = db.scalar(select(func.count(User.user_id))) or 0
    plan_dist["free"] = plan_dist.get("free", 0) + max(0, all_users_count - total_sub_users)

    date_label = ""
    if start_dt or end_dt:
        s = start_dt.strftime("%Y-%m-%d") if start_dt else "beginning"
        e = end_dt.strftime("%Y-%m-%d") if end_dt else "now"
        date_label = f" ({s} to {e})"

    rows = [
        ["Metric", "Value"],
        [f"Total Users{date_label}", total_users],
        ["Active Users (current)", active_users],
        [f"Total Files{date_label}", total_files],
        [f"Total Storage{date_label}", _fmt_bytes(int(total_storage))],
        [f"Total Revenue (₹){date_label}", f"{total_revenue:.2f}"],
        ["Total Groups (current)", total_groups],
    ]
    for plan, count in sorted(plan_dist.items()):
        rows.append([f"Users on {plan.capitalize()} Plan", count])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(
        rows[1:], rows[0],
        f"platform_summary_{now}.csv",
    )


# ─────────────── 2. USER REPORT ───────────────

@router.get("/users")
def report_users(
    start: Optional[str] = None,
    end: Optional[str] = None,
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)

    query = select(User)
    if start_dt:
        query = query.where(User.created_at >= start_dt)
    if end_dt:
        query = query.where(User.created_at <= end_dt)

    headers = ["User ID", "Name", "Email", "Plan", "Status", "Storage Used",
               "Storage (bytes)", "Files Uploaded", "Groups Joined", "Signup Date"]

    users = db.scalars(query.order_by(desc(User.created_at))).all()
    if not users:
        now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
        return _csv_response([], headers, f"users_report_{now}.csv")

    # ── Batch aggregation: 2 queries instead of 3N ──
    user_ids = [u.user_id for u in users]

    storage_rows = db.execute(
        select(
            File.user_id,
            func.coalesce(func.sum(File.size), 0).label("total_size"),
            func.count(File.file_id).label("file_count"),
        )
        .where(File.user_id.in_(user_ids))
        .group_by(File.user_id)
    ).all()
    storage_map = {r[0]: {"size": int(r[1]), "count": r[2]} for r in storage_rows}

    group_rows = db.execute(
        select(GroupMember.user_id, func.count(GroupMember.id))
        .where(GroupMember.user_id.in_(user_ids), GroupMember.status == "approved")
        .group_by(GroupMember.user_id)
    ).all()
    group_map = {r[0]: r[1] for r in group_rows}

    sub_rows = db.execute(
        select(Subscription.user_id, Subscription.plan)
        .where(Subscription.user_id.in_(user_ids), Subscription.status == "active")
        .order_by(desc(Subscription.purchased_at))
    ).all()
    plan_map: dict = {}
    for uid, plan_name in sub_rows:
        if uid not in plan_map:
            plan_map[uid] = plan_name

    rows = []
    for u in users:
        st = storage_map.get(u.user_id, {"size": 0, "count": 0})
        rows.append([
            u.user_id, u.name, u.email,
            plan_map.get(u.user_id, "free").upper(),
            u.status,
            _fmt_bytes(st["size"]), st["size"],
            st["count"],
            group_map.get(u.user_id, 0),
            _fmt_dt(u.created_at),
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"users_report_{now}.csv")


# ─────────────── 3. REVENUE REPORT ───────────────

@router.get("/revenue")
def report_revenue(
    start: Optional[str] = None,
    end: Optional[str] = None,
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)

    query = (
        select(Subscription, User.name, User.email)
        .join(User, Subscription.user_id == User.user_id)
    )
    if start_dt:
        query = query.where(Subscription.purchased_at >= start_dt)
    if end_dt:
        query = query.where(Subscription.purchased_at <= end_dt)

    results = db.execute(query.order_by(desc(Subscription.purchased_at))).all()

    headers = ["Subscription ID", "User", "Email", "Plan", "Amount Paid (₹)",
               "Billing Cycle", "Payment Method", "Status", "Purchase Date", "Renewal Date"]
    rows = []
    for sub, name, email in results:
        rows.append([
            sub.id, name, email, sub.plan.upper(),
            f"{float(sub.amount_paid):.2f}", sub.billing_cycle,
            sub.payment_method or "N/A", sub.status,
            _fmt_dt(sub.purchased_at), _fmt_dt(sub.renewal_date),
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"revenue_report_{now}.csv")


# ─────────────── 4. FILE REPORT ───────────────

@router.get("/files")
def report_files(
    start: Optional[str] = None,
    end: Optional[str] = None,
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)

    query = select(File, User.name, User.email).outerjoin(User, File.user_id == User.user_id)
    if start_dt:
        query = query.where(File.uploaded_at >= start_dt)
    if end_dt:
        query = query.where(File.uploaded_at <= end_dt)

    results = db.execute(query.order_by(desc(File.uploaded_at))).all()

    headers = ["File ID", "File Name", "Size", "Size (bytes)", "Owner", "Owner Email",
               "Shared", "Upload Date"]
    rows = []
    for f, owner_name, owner_email in results:
        rows.append([
            f.file_id, f.file_name, _fmt_bytes(f.size), f.size,
            owner_name or "Unknown", owner_email or "",
            "Yes" if f.share_token else "No",
            _fmt_dt(f.uploaded_at),
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"files_report_{now}.csv")


# ─────────────── 5. STORAGE REPORT ───────────────

@router.get("/storage")
def report_storage(
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    total_storage = db.scalar(select(func.coalesce(func.sum(File.size), 0))) or 0

    per_user = db.execute(
        select(
            User.user_id, User.name, User.email,
            func.coalesce(func.sum(File.size), 0).label("usage"),
            func.count(File.file_id).label("fcount"),
        )
        .outerjoin(File, File.user_id == User.user_id)
        .group_by(User.user_id, User.name, User.email)
        .order_by(desc("usage"))
    ).all()

    # ── Batch plan lookup: 1 query instead of N ──
    all_user_ids = [r[0] for r in per_user]
    sub_rows = db.execute(
        select(Subscription.user_id, Subscription.plan)
        .where(Subscription.user_id.in_(all_user_ids), Subscription.status == "active")
        .order_by(desc(Subscription.purchased_at))
    ).all()
    plan_map: dict = {}
    for uid, plan_name in sub_rows:
        if uid not in plan_map:
            plan_map[uid] = plan_name

    headers = ["User ID", "Name", "Email", "Plan", "Storage Used", "Storage (bytes)",
               "File Count", "% of Total"]
    rows = []
    for uid, name, email, usage, fcount in per_user:
        plan = plan_map.get(uid, "free").upper()
        pct = (int(usage) / int(total_storage) * 100) if total_storage > 0 else 0
        rows.append([
            uid, name, email, plan, _fmt_bytes(int(usage)),
            int(usage), fcount, f"{pct:.1f}%",
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"storage_report_{now}.csv")


# ─────────────── 6. GROUP REPORT ───────────────

@router.get("/groups")
def report_groups(
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    results = db.execute(
        select(Group, User.name)
        .outerjoin(User, Group.created_by == User.user_id)
        .order_by(desc(Group.created_at))
    ).all()

    # ── Batch member counts: 3 queries instead of 3N ──
    group_ids = [grp.group_id for grp, _ in results]
    total_rows = db.execute(
        select(GroupMember.group_id, func.count(GroupMember.id))
        .where(GroupMember.group_id.in_(group_ids))
        .group_by(GroupMember.group_id)
    ).all()
    total_map = {r[0]: r[1] for r in total_rows}

    approved_rows = db.execute(
        select(GroupMember.group_id, func.count(GroupMember.id))
        .where(GroupMember.group_id.in_(group_ids), GroupMember.status == "approved")
        .group_by(GroupMember.group_id)
    ).all()
    approved_map = {r[0]: r[1] for r in approved_rows}

    pending_rows = db.execute(
        select(GroupMember.group_id, func.count(GroupMember.id))
        .where(GroupMember.group_id.in_(group_ids), GroupMember.status == "pending")
        .group_by(GroupMember.group_id)
    ).all()
    pending_map = {r[0]: r[1] for r in pending_rows}

    headers = ["Group ID", "Group Name", "Creator", "Total Members", "Approved Members",
               "Pending Members", "Created At"]
    rows = []
    for grp, creator_name in results:
        rows.append([
            grp.group_id, grp.group_name, creator_name or "Unknown",
            total_map.get(grp.group_id, 0),
            approved_map.get(grp.group_id, 0),
            pending_map.get(grp.group_id, 0),
            _fmt_dt(grp.created_at),
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"groups_report_{now}.csv")


# ─────────────── 7. ACTIVITY LOG EXPORT ───────────────

@router.get("/activity-logs")
def report_activity_logs(
    start: Optional[str] = None,
    end: Optional[str] = None,
    action: Optional[str] = None,
    admin_id: int = Depends(get_admin_id),
    db: Session = Depends(get_db),
):
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)

    query = select(ActivityLog)
    if start_dt:
        query = query.where(ActivityLog.created_at >= start_dt)
    if end_dt:
        query = query.where(ActivityLog.created_at <= end_dt)
    if action:
        query = query.where(ActivityLog.action == action)

    logs = db.scalars(query.order_by(desc(ActivityLog.created_at))).all()

    headers = ["Log ID", "Action", "Detail", "User ID", "IP Address", "Timestamp"]
    rows = []
    for log in logs:
        rows.append([
            log.id, log.action, log.detail or "", log.user_id or "",
            log.ip_address or "", _fmt_dt(log.created_at),
        ])

    now = datetime.now(UTC).strftime("%Y%m%d_%H%M")
    return _csv_response(rows, headers, f"activity_logs_{now}.csv")
