import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.file import File as FileModel, StorageDetail
from app.schemas.file import FileResponse, FileDeleteResponse
from app.middleware.auth import get_current_user_id
from app.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    content = await file.read()
    
    # Save standard file to disk with unique id
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
        
    # Create DB record in `files` table
    new_file = FileModel(
        file_name=file.filename,
        size=len(content),
        file_path=unique_filename,
        user_id=user_id
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    # Create 1:1 record in `storage_details`
    file_ext = os.path.splitext(file.filename)[1][1:].lower() or "unknown"
    storage_detail = StorageDetail(
        file_id=new_file.file_id,
        sender_id=user_id,
        file_type=file_ext
    )
    db.add(storage_detail)
    db.commit()
    
    return {
        "status": "complete", 
        "file_id": new_file.file_id,
        "download_url": f"http://localhost:8000/api/files/{new_file.file_id}"
    }

@router.get("", response_model=List[FileResponse])
def get_user_files(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    files = db.scalars(select(FileModel).where(FileModel.user_id == user_id)).all()
    
    res = []
    for f in files:
        res.append(FileResponse(
            file_id=f.file_id,
            file_name=f.file_name,
            size=f.size,
            file_path=f.file_path,
            cloud_url=f.cloud_url,
            download_url=f"http://localhost:8000/api/files/{f.file_id}",
            uploaded_at=f.uploaded_at
        ))
    return res

@router.get("/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    file_record = db.scalar(select(FileModel).where(FileModel.file_id == file_id))
    if not file_record or not file_record.file_path:
        raise HTTPException(status_code=404, detail="File not found")
        
    full_path = os.path.join(settings.UPLOAD_DIR, file_record.file_path)
    if os.path.exists(full_path):
        return FastAPIFileResponse(full_path, filename=file_record.file_name)
    raise HTTPException(status_code=404, detail="File not found on disk")

@router.delete("/{file_id}", response_model=FileDeleteResponse)
def delete_file(file_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    file_record = db.scalar(select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id))
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")
        
    # Remove from disk if exists
    if file_record.file_path:
        full_path = os.path.join(settings.UPLOAD_DIR, file_record.file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            
    # Delete from DB
    db.delete(file_record)
    db.commit()
    
    return FileDeleteResponse(message="File deleted successfully", file_id=file_id)
