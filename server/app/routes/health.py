from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "nano_exchange_api",
        "db_host": settings.DB_HOST,
        "db_name": settings.DB_NAME
    }
