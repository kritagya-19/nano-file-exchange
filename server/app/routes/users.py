import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.file import File
from app.models.group import GroupMember
from app.middleware.auth import get_current_user_id
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.utils.file_ops import delete_file_from_disk as _delete_file_from_disk
from app.schemas.user import UpdateProfileRequest, ChangePasswordRequest, DeleteAccountRequest

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me")
def get_profile(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_files = db.scalar(
        select(func.count(File.file_id)).where(File.user_id == user_id)
    ) or 0

    storage_used = db.scalar(
        select(func.coalesce(func.sum(File.size), 0)).where(File.user_id == user_id)
    ) or 0

    active_groups = db.scalar(
        select(func.count(GroupMember.id)).where(
            GroupMember.user_id == user_id,
            GroupMember.status == "approved",
        )
    ) or 0

    shared_files = db.scalar(
        select(func.count(File.file_id)).where(
            File.user_id == user_id,
            File.share_token.isnot(None)
        )
    ) or 0

    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "total_files": total_files,
        "storage_used": storage_used,
        "active_groups": active_groups,
        "shared_files": shared_files,
    }


@router.patch("/me")
def update_profile(
    body: UpdateProfileRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None:
        user.name = body.name  # already validated + stripped by Pydantic

    db.commit()
    db.refresh(user)

    # Re-issue token so frontend gets fresh name immediately
    token = create_access_token({"sub": str(user.user_id)})

    return {
        "message": "Profile updated successfully",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "token": token,
    }


@router.post("/me/change-password")
def change_password(
    body: ChangePasswordRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    user.password_hash = get_password_hash(body.new_password)
    db.commit()

    # Re-issue token after password change
    token = create_access_token({"sub": str(user.user_id)})

    return {"message": "Password changed successfully", "token": token}


@router.delete("/me")
def delete_account(
    body: DeleteAccountRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    user_files = db.scalars(select(File).where(File.user_id == user_id)).all()
    for file in user_files:
        _delete_file_from_disk(file.file_path)

    db.delete(user)
    db.commit()

    return {"message": "Account deleted successfully", "deleted_files_count": len(user_files)}
