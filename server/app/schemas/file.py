from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FileResponse(BaseModel):
    file_id: int
    file_name: str
    size: int
    file_path: Optional[str] = None
    cloud_url: Optional[str] = None
    download_url: str
    uploaded_at: Optional[datetime] = None
    is_favorite: bool = False
    share_token: Optional[str] = None
    folder_id: Optional[int] = None

    class Config:
        from_attributes = True


class FileDeleteResponse(BaseModel):
    message: str
    file_id: int


class ShareResponse(BaseModel):
    file_id: int
    share_token: str
    share_url: str


class FolderCreate(BaseModel):
    name: str


class FolderResponse(BaseModel):
    folder_id: int
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MoveFileRequest(BaseModel):
    folder_id: Optional[int] = None
