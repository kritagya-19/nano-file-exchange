from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.file import Folder as FolderModel, File as FileModel
from app.schemas.file import FolderCreate, FolderResponse
from app.middleware.auth import get_current_user_id

router = APIRouter()


@router.post("", response_model=FolderResponse)
def create_folder(
    body: FolderCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    folder = FolderModel(name=body.name.strip(), user_id=user_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.get("", response_model=List[FolderResponse])
def list_folders(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    folders = db.scalars(
        select(FolderModel)
        .where(FolderModel.user_id == user_id)
        .order_by(FolderModel.created_at.desc())
    ).all()
    return folders


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(FolderModel).where(
            FolderModel.folder_id == folder_id,
            FolderModel.user_id == user_id,
        )
    )
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Move files in this folder back to root (folder_id = None)
    files_in_folder = db.scalars(
        select(FileModel).where(FileModel.folder_id == folder_id)
    ).all()
    for f in files_in_folder:
        f.folder_id = None
    db.delete(folder)
    db.commit()

    return {"message": "Folder deleted", "folder_id": folder_id}
