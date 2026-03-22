from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List
import os
import hashlib
import aiofiles
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import json

app = FastAPI(title="🛰️ Nano Exchange File Transfer System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://nano:nano123@localhost:3306/nano_exchange")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "nano-super-secret-2024-change-in-production!")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str = None):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

# Serve uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class Login(BaseModel):
    email: str
    password: str

class FileResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    file_size: int
    download_url: str

class GroupCreate(BaseModel):
    group_name: str

class MessageCreate(BaseModel):
    message_text: str

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def send_message(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message)
                except:
                    self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

# Routes
@app.get("/")
async def root():
    return {"message": "🛰️ Nano Exchange File Transfer System", "docs": "/docs"}

# AUTH ROUTES
@app.post("/api/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    result = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user.email}).fetchone()
    if result:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    result = db.execute(
        text("INSERT INTO users (name, email, password) VALUES (:name, :email, :password)"),
        {"name": user.name, "email": user.email, "password": hashed_password}
    )
    db.commit()
    
    user_id = result.lastrowid
    token = create_access_token({"sub": str(user_id)})
    return {"token": token, "user_id": user_id, "message": "User created successfully"}

@app.post("/api/auth/login")
async def login(credentials: Login, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT id, password FROM users WHERE email = :email"), {"email": credentials.email}).fetchone()
    if not result or not verify_password(credentials.password, result[1]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(result[0])})
    return {"token": token, "user_id": result[0]}

# FILE ROUTES (Large File Upload with Chunking)
@app.post("/api/files/upload")
async def upload_file(
    file: UploadFile = File(),
    chunk_index: int = Form(0),
    total_chunks: int = Form(1),
    token: str = Form(),
    db: Session = Depends(get_db)
):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Create file hash for resumable upload
    content = await file.read()
    file_hash = hashlib.md5(f"{file.filename}_{len(content)}".encode()).hexdigest()
    chunk_filename = f"uploads/{file_hash}_chunk_{chunk_index}"
    
    # Save chunk
    async with aiofiles.open(chunk_filename, 'wb') as f:
        await f.write(content)
    
    # Check if all chunks uploaded
    uploaded_chunks = []
    for i in range(total_chunks):
        chunk_path = f"uploads/{file_hash}_chunk_{i}"
        if os.path.exists(chunk_path):
            uploaded_chunks.append(i)
    
    if len(uploaded_chunks) == total_chunks:
        # Assemble final file
        final_path = f"uploads/{file_hash}_{file.filename}"
        with open(final_path, "wb") as final_file:
            for i in uploaded_chunks:
                chunk_path = f"uploads/{file_hash}_chunk_{i}"
                with open(chunk_path, "rb") as chunk:
                    final_file.write(chunk.read())
                os.remove(chunk_path)  # Cleanup
        
        # Save to database (Local Storage by default)
        storage_id_result = db.execute(text("SELECT id FROM storage_info WHERE provider = 'local'")).fetchone()
        storage_id = storage_id_result[0] if storage_id_result else 1
        
        db.execute(
            text("INSERT INTO files (filename, filepath, file_size, user_id, storage_id) VALUES (:filename, :filepath, :file_size, :user_id, :storage_id)"),
            {
                "filename": file.filename,
                "filepath": f"{file_hash}_{file.filename}",
                "file_size": len(content) * total_chunks,
                "user_id": user_id,
                "storage_id": storage_id
            }
        )
        db.commit()
        
        download_url = f"http://localhost:8000/uploads/{file_hash}_{file.filename}"
        return {"status": "complete", "download_url": download_url}
    
    return {"status": "chunk_uploaded", "progress": len(uploaded_chunks) / total_chunks}

@app.get("/api/files", response_model=List[FileResponse])
async def get_files(token: str = None, db: Session = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = db.execute(
        text("""
            SELECT f.id, f.filename, f.filepath, f.file_size, 
                   CONCAT('http://localhost:8000/uploads/', f.filepath) as download_url
            FROM files f WHERE f.user_id = :user_id
        """), {"user_id": user_id}
    ).fetchall()
    
    return [{"id": r[0], "filename": r[1], "filepath": r[2], "file_size": r[3], "download_url": r[4]} for r in result]

@app.get("/api/files/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT filepath FROM files WHERE id = :id")
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="File not found")
    
    filepath = f"uploads/{result[0]}"
    if os.path.exists(filepath):
        return FileResponse(filepath, filename=result[0], media_type='application/octet-stream')
    raise HTTPException(status_code=404, detail="File not found")

# GROUP ROUTES
@app.post("/api/groups")
async def create_group(group: GroupCreate, token: str = Form(), db: Session = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = db.execute(
        text("INSERT INTO groups (group_name, created_by) VALUES (:group_name, :created_by)"),
        {"group_name": group.group_name, "created_by": user_id}
    )
    db.commit()
    return {"group_id": result.lastrowid, "message": "Group created"}

@app.get("/api/groups")
async def get_groups(token: str = None, db: Session = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        user_id = 1  # Default for demo
    
    result = db.execute(
        text("""
            SELECT id, group_name, created_by 
            FROM groups 
            WHERE created_by = :user_id OR id IN (
                SELECT group_id FROM group_members WHERE user_id = :user_id
            )
        """), {"user_id": user_id}
    ).fetchall()
    
    return [{"id": r[0], "name": r[1], "created_by": r[2]} for r in result]

# CHAT ROUTES
@app.post("/api/chat/{group_id}")
async def send_message(group_id: int, message: MessageCreate, token: str = Form(), db: Session = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db.execute(
        text("INSERT INTO messages (group_id, sender_id, message_text) VALUES (:group_id, :sender_id, :message_text)"),
        {"group_id": group_id, "sender_id": user_id, "message_text": message.message_text}
    )
    db.commit()
    
    # Send via WebSocket
    ws_message = json.dumps({
        "group_id": group_id,
        "sender_id": user_id,
        "message": message.message_text,
        "timestamp": datetime.now().isoformat()
    })
    await manager.send_message(ws_message, f"group_{group_id}")
    
    return {"status": "sent"}

@app.get("/api/chat/{group_id}")
async def get_messages(group_id: int, token: str = None, db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT m.id, m.sender_id, u.name, m.message_text, m.sent_at 
            FROM messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.group_id = :group_id 
            ORDER BY m.sent_at DESC 
            LIMIT 50
        """), {"group_id": group_id}
    ).fetchall()
    
    return [
        {"id": r[0], "sender_id": r[1], "sender_name": r[2], "message": r[3], "time": r[4].isoformat()}
        for r in result
    ]

# WebSocket for Real-time Chat
@app.websocket("/ws/group/{group_id}")
async def websocket_group(websocket: WebSocket, group_id: int):
    await manager.connect(websocket, f"group_{group_id}")
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_message(data, f"group_{group_id}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"group_{group_id}")

# Health Check
@app.get("/api/health")
async def health():
    return {"status": "healthy", "storage": "local", "database": "mysql"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)