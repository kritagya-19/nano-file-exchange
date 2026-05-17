from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.file import File, Folder
from app.models.group import GroupMember
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.middleware.auth import get_current_user_id

router = APIRouter()

# Fallback if plans table is empty (should not happen in production)
_DEFAULT_STORAGE_LIMIT = 20 * 1024 * 1024 * 1024  # 20 GB


def _get_storage_limit(plan_key: str, db: Session) -> int:
    """Read storage limit from DB Plan table. Falls back to free tier if not found."""
    plan = db.scalar(select(Plan).where(Plan.plan_key == plan_key))
    if plan:
        return int(plan.storage_limit_gb * 1024 ** 3)
    return _DEFAULT_STORAGE_LIMIT


@router.get("/stats")
def get_dashboard_stats(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Total files
    total_files = db.scalar(
        select(func.count(File.file_id)).where(File.user_id == user_id)
    ) or 0

    # Storage used (sum of file sizes)
    storage_used = db.scalar(
        select(func.coalesce(func.sum(File.size), 0)).where(File.user_id == user_id)
    ) or 0

    # Active groups (only count approved memberships)
    active_groups = db.scalar(
        select(func.count(GroupMember.id)).where(
            GroupMember.user_id == user_id,
            GroupMember.status == "approved",
        )
    ) or 0

    # Shared files (files with share_token)
    shared_files = db.scalar(
        select(func.count(File.file_id)).where(
            File.user_id == user_id,
            File.share_token.isnot(None)
        )
    ) or 0

    # Starred files
    starred_files = db.scalar(
        select(func.count(File.file_id)).where(
            File.user_id == user_id,
            File.is_favorite == True
        )
    ) or 0

    # Total folders
    total_folders = db.scalar(
        select(func.count(Folder.folder_id)).where(Folder.user_id == user_id)
    ) or 0

    # Recent files (last 5)
    recent_files_query = (
        select(File)
        .where(File.user_id == user_id)
        .order_by(File.uploaded_at.desc())
        .limit(5)
    )
    recent_files = db.scalars(recent_files_query).all()

    recent_files_data = []
    for f in recent_files:
        ext = f.file_name.rsplit(".", 1)[-1].lower() if "." in f.file_name else "unknown"
        recent_files_data.append({
            "file_id": f.file_id,
            "file_name": f.file_name,
            "size": f.size,
            "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
            "file_type": ext,
            "is_favorite": f.is_favorite or False,
            "share_token": f.share_token,
        })

    # File type breakdown — computed in SQL, not Python
    # We fetch (file_name, size) for this user, but only the columns we need.
    file_summary = db.execute(
        select(File.file_name, File.size).where(File.user_id == user_id)
    ).all()

    type_breakdown = {}
    for fname, fsize in file_summary:
        ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else "other"
        category = _categorize_extension(ext)
        if category not in type_breakdown:
            type_breakdown[category] = {"count": 0, "size": 0}
        type_breakdown[category]["count"] += 1
        type_breakdown[category]["size"] += fsize or 0

    # Determine user's plan-based storage limit (read from DB)
    sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(desc(Subscription.purchased_at))
    )
    current_plan = sub.plan if sub else "free"
    storage_limit = _get_storage_limit(current_plan, db)

    # Storage percentage
    storage_pct = round((storage_used / storage_limit) * 100, 2) if storage_limit else 0

    return {
        "total_files": total_files,
        "storage_used": storage_used,
        "storage_limit": storage_limit,
        "storage_pct": storage_pct,
        "active_groups": active_groups,
        "shared_files": shared_files,
        "starred_files": starred_files,
        "total_folders": total_folders,
        "recent_files": recent_files_data,
        "type_breakdown": type_breakdown,
        "current_plan": current_plan,
    }


def _categorize_extension(ext: str) -> str:
    images = {"jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff"}
    documents = {"pdf", "doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx", "csv", "rtf", "odt"}
    videos = {"mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"}
    audio = {"mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"}
    archives = {"zip", "rar", "7z", "tar", "gz", "bz2"}
    code = {"py", "js", "jsx", "ts", "tsx", "html", "css", "json", "xml", "yaml", "yml", "md", "sql", "java", "c", "cpp", "go", "rs"}

    if ext in images:
        return "images"
    elif ext in documents:
        return "documents"
    elif ext in videos:
        return "videos"
    elif ext in audio:
        return "audio"
    elif ext in archives:
        return "archives"
    elif ext in code:
        return "code"
    else:
        return "other"
