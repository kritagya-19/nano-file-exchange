import os
import aiofiles
import hashlib
from app.config import settings

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

async def handle_chunk_upload(file_content: bytes, filename: str, chunk_index: int, total_chunks: int) -> dict:
    # Use MD5 of filename + expected total size as a unique upload session ID
    # Note: In a real app we'd pass a session_id from frontend. Here we use filename
    file_hash = hashlib.md5(filename.encode()).hexdigest()
    chunk_filename = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_chunk_{chunk_index}")
    
    # Save the chunk
    async with aiofiles.open(chunk_filename, 'wb') as f:
        await f.write(file_content)
    
    # Check if all chunks are received
    uploaded_chunks = []
    for i in range(total_chunks):
        chunk_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_chunk_{i}")
        if os.path.exists(chunk_path):
            uploaded_chunks.append(i)
            
    if len(uploaded_chunks) == total_chunks:
        # Assemble chunks
        final_filename = f"{file_hash}_{filename}"
        final_path = os.path.join(settings.UPLOAD_DIR, final_filename)
        
        # Calculate total size
        total_size = 0
        with open(final_path, "wb") as final_file:
            for i in range(total_chunks):
                chunk_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_chunk_{i}")
                with open(chunk_path, "rb") as chunk:
                    data = chunk.read()
                    total_size += len(data)
                    final_file.write(data)
                os.remove(chunk_path)  # Cleanup chunk
                
        return {"status": "complete", "filepath": final_filename, "size": total_size}
        
    return {"status": "chunk_uploaded", "progress": len(uploaded_chunks) / total_chunks}
