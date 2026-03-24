from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes import api_router
from app.config import settings

app = FastAPI(
    title="🛰️ Nano Exchange API",
    description="File Transfer and Group Chat System API",
    version="1.0.0"
)

# CORS
# Allowing frontend origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file access (downloading chunks/files)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/files/download", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all API routes under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to Nano Exchange API. See /docs for Swagger UI documentation."}
