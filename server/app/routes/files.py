import os
import uuid
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models.file import File as FileModel, StorageDetail
from app.schemas.file import FileResponse, FileDeleteResponse, ShareResponse, MoveFileRequest
from app.middleware.auth import get_current_user_id
from app.config import settings

router = APIRouter()

def _resolve_abs_file_path(file_path: Optional[str]) -> Optional[str]:
    if not file_path:
        return None
    if os.path.isabs(file_path):
        return file_path
    return os.path.join(settings.UPLOAD_DIR, file_path)


def _delete_file_from_disk(file_path: Optional[str]) -> None:
    full_path = _resolve_abs_file_path(file_path)
    if not full_path:
        return
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass


def _build_file_response(f: FileModel) -> FileResponse:
    return FileResponse(
        file_id=f.file_id,
        file_name=f.file_name,
        size=f.size,
        file_path=f.file_path,
        cloud_url=f.cloud_url,
        download_url=f"http://localhost:8000/api/files/{f.file_id}",
        uploaded_at=f.uploaded_at,
        is_favorite=f.is_favorite or False,
        share_token=f.share_token,
        folder_id=f.folder_id,
    )


# ── Upload (single file, with progress on frontend via XHR) ──────────────────
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    content = await file.read()
    safe_filename = os.path.basename(file.filename or "uploaded_file")

    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as f:
        f.write(content)
    actual_size = os.path.getsize(filepath)

    new_file = FileModel(
        file_name=safe_filename,
        size=actual_size,
        file_path=unique_filename,
        user_id=user_id,
        folder_id=int(folder_id) if folder_id else None,
        uploaded_at=datetime.now(UTC),
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    file_ext = os.path.splitext(safe_filename)[1][1:].lower() or "unknown"
    storage_detail = StorageDetail(
        file_id=new_file.file_id,
        sender_id=user_id,
        file_type=file_ext,
    )
    db.add(storage_detail)
    db.commit()

    return {
        "status": "complete",
        "file_id": new_file.file_id,
        "file_name": new_file.file_name,
        "size": new_file.size,
        "download_url": f"http://localhost:8000/api/files/{new_file.file_id}",
    }


# ── Chunked upload — receives one chunk at a time ────────────────────────────
@router.post("/upload/chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    file_name: str = Form(...),
    total_size: int = Form(0),
    folder_id: Optional[int] = Form(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if chunk_index < 0 or total_chunks <= 0 or chunk_index >= total_chunks:
        raise HTTPException(status_code=400, detail="Invalid chunk index or total chunks")

    chunk_content = await file.read()
    chunk_dir = os.path.join(settings.UPLOAD_DIR, "chunks", upload_id)
    os.makedirs(chunk_dir, exist_ok=True)

    chunk_path = os.path.join(chunk_dir, f"chunk_{chunk_index}")
    with open(chunk_path, "wb") as f:
        f.write(chunk_content)

    # Count how many chunks are uploaded
    uploaded = sum(
        1
        for i in range(total_chunks)
        if os.path.exists(os.path.join(chunk_dir, f"chunk_{i}"))
    )

    if uploaded < total_chunks:
        return {"status": "uploading", "uploaded_chunks": uploaded, "total_chunks": total_chunks}

    # All chunks received — assemble
    unique_filename = f"{uuid.uuid4().hex}_{file_name}"
    final_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    assembled_size = 0
    with open(final_path, "wb") as out:
        for i in range(total_chunks):
            cp = os.path.join(chunk_dir, f"chunk_{i}")
            with open(cp, "rb") as chunk_file:
                data = chunk_file.read()
                assembled_size += len(data)
                out.write(data)

    # If client provided expected size, verify integrity before committing DB row.
    if total_size and assembled_size != total_size:
        try:
            os.remove(final_path)
        except OSError:
            pass
        raise HTTPException(status_code=400, detail="Uploaded file size mismatch")

    # Clean up chunk files
    import shutil
    shutil.rmtree(chunk_dir, ignore_errors=True)

    new_file = FileModel(
        file_name=file_name,
        size=assembled_size,
        file_path=unique_filename,
        user_id=user_id,
        folder_id=int(folder_id) if folder_id else None,
        uploaded_at=datetime.now(UTC),
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    file_ext = os.path.splitext(file_name)[1][1:].lower() or "unknown"
    storage_detail = StorageDetail(
        file_id=new_file.file_id,
        sender_id=user_id,
        file_type=file_ext,
    )
    db.add(storage_detail)
    db.commit()

    return {
        "status": "complete",
        "file_id": new_file.file_id,
        "file_name": new_file.file_name,
        "size": new_file.size,
        "download_url": f"http://localhost:8000/api/files/{new_file.file_id}",
    }


# ── List user files ──────────────────────────────────────────────────────────
@router.get("", response_model=List[FileResponse])
def get_user_files(
    folder_id: Optional[int] = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    q = select(FileModel).where(FileModel.user_id == user_id)
    if folder_id is not None:
        q = q.where(FileModel.folder_id == folder_id)
    files = db.scalars(q.order_by(FileModel.uploaded_at.desc())).all()
    return [_build_file_response(f) for f in files]


# ── Starred files ─────────────────────────────────────────────────────────────
@router.get("/starred", response_model=List[FileResponse])
def get_starred_files(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    files = db.scalars(
        select(FileModel)
        .where(FileModel.user_id == user_id, FileModel.is_favorite == True)
        .order_by(FileModel.uploaded_at.desc())
    ).all()
    return [_build_file_response(f) for f in files]


# ── Shared files list ─────────────────────────────────────────────────────────
@router.get("/shared-list", response_model=List[FileResponse])
def get_shared_files(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    files = db.scalars(
        select(FileModel)
        .where(FileModel.user_id == user_id, FileModel.share_token.isnot(None))
        .order_by(FileModel.uploaded_at.desc())
    ).all()
    return [_build_file_response(f) for f in files]


# ── Public shared download (no auth required) ─────────────────────────────────
@router.get("/shared/{share_token}")
def download_shared_file(share_token: str, db: Session = Depends(get_db)):
    file_record = db.scalar(
        select(FileModel).where(FileModel.share_token == share_token)
    )
    if not file_record or not file_record.file_path:
        raise HTTPException(status_code=404, detail="Shared file not found or link expired")

    full_path = os.path.join(settings.UPLOAD_DIR, file_record.file_path)
    if os.path.exists(full_path):
        return FastAPIFileResponse(
            full_path,
            filename=file_record.file_name,
            media_type="application/octet-stream",
        )
    raise HTTPException(status_code=404, detail="File not found on disk")


# ── Get shared file info (no auth required) ───────────────────────────────────
@router.get("/shared/{share_token}/info")
def get_shared_file_info(share_token: str, db: Session = Depends(get_db)):
    file_record = db.scalar(
        select(FileModel).where(FileModel.share_token == share_token)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="Shared file not found or link expired")
    return {
        "file_name": file_record.file_name,
        "size": file_record.size,
        "uploaded_at": file_record.uploaded_at.isoformat() if file_record.uploaded_at else None,
    }


# ── Download file (authenticated) ────────────────────────────────────────────
@router.get("/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    file_record = db.scalar(select(FileModel).where(FileModel.file_id == file_id))
    if not file_record or not file_record.file_path:
        raise HTTPException(status_code=404, detail="File not found")

    full_path = os.path.join(settings.UPLOAD_DIR, file_record.file_path)
    if os.path.exists(full_path):
        return FastAPIFileResponse(
            full_path,
            filename=file_record.file_name,
            media_type="application/octet-stream",
        )
    raise HTTPException(status_code=404, detail="File not found on disk")


# ── Toggle favorite ──────────────────────────────────────────────────────────
@router.patch("/{file_id}/favorite")
def toggle_favorite(
    file_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    file_record.is_favorite = not file_record.is_favorite
    db.commit()
    db.refresh(file_record)
    return {"file_id": file_id, "is_favorite": file_record.is_favorite}


# ── Generate / revoke share link ─────────────────────────────────────────────
@router.post("/{file_id}/share", response_model=ShareResponse)
def create_share_link(
    file_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    token = uuid.uuid4().hex
    file_record.share_token = token
    db.commit()
    db.refresh(file_record)

    return ShareResponse(
        file_id=file_id,
        share_token=token,
        share_url=f"{settings.FRONTEND_URL}/share/{token}",
    )


@router.delete("/{file_id}/share")
def revoke_share_link(
    file_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    file_record.share_token = None
    db.commit()
    return {"message": "Share link revoked", "file_id": file_id}


# ── Move file to folder ─────────────────────────────────────────────────────
@router.patch("/{file_id}/move")
def move_file(
    file_id: int,
    body: MoveFileRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Validate folder exists and belongs to user
    if body.folder_id is not None:
        from app.models.file import Folder as FolderModel
        folder = db.scalar(
            select(FolderModel).where(
                FolderModel.folder_id == body.folder_id,
                FolderModel.user_id == user_id,
            )
        )
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    file_record.folder_id = body.folder_id
    db.commit()
    return {"message": "File moved successfully", "file_id": file_id, "folder_id": body.folder_id}


# ── Delete file ──────────────────────────────────────────────────────────────
@router.delete("/{file_id}", response_model=FileDeleteResponse)
def delete_file(
    file_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(FileModel).where(FileModel.file_id == file_id, FileModel.user_id == user_id)
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    if file_record.file_path:
        _delete_file_from_disk(file_record.file_path)

    db.delete(file_record)
    db.commit()

    return FileDeleteResponse(message="File deleted successfully", file_id=file_id)
