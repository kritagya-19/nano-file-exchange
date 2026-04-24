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

    class Config:
        from_attributes = True


class FileDeleteResponse(BaseModel):
    message: str
    file_id: int
