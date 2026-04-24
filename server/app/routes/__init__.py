from fastapi import APIRouter
from app.routes import auth, files, folders, groups, chat, health, dashboard, users, subscriptions, admin, plans, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(folders.router, prefix="/folders", tags=["Folders"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
api_router.include_router(plans.router, prefix="/plans", tags=["Plans"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(reports.router, prefix="/admin/reports", tags=["Admin Reports"])


