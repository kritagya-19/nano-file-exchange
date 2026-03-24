from fastapi import APIRouter
from app.routes import auth, files, groups, chat, health

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(health.router, tags=["Health"])
