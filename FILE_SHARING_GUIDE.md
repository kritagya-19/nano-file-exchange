# File Sharing & Large File Upload Guide

Date: 2026-04-28

## Overview

This guide explains how file sharing works in Nano File Exchange and how large files are uploaded efficiently.

---

## Part 1: FILE SHARING (3 Methods)

There are **3 different ways** to share files:

### Method 1: Public Share Links (Anyone can download, no login needed)

**How it works:**
1. User is in the dashboard on the "My Files" page
2. User clicks the "Share Link" button (🔗 icon) on a file
3. Backend generates a random token and stores it with the file record
4. Backend returns a public URL like: `http://localhost:5173/share/abc123xyz...`
5. User can copy this link and send it to anyone (email, WhatsApp, etc.)
6. Anyone who opens the link can download the file WITHOUT logging in

**What happens on the backend:**
- Endpoint: `POST /api/files/{file_id}/share`
- Creates a unique token (UUID)
- Stores it in the file's `share_token` column in the database
- Returns the shareable URL
- The URL uses `FRONTEND_URL` config (default: `http://localhost:5173`)

**To revoke access:**
- User clicks the "Unshare" button or "Revoke Link" option
- Backend removes the share token
- Old links stop working

**Security notes:**
- The URL is essentially a "secret link" — anyone with the link can download
- URLs are long random strings, hard to guess
- No expiration time (link works forever until revoked)
- No download count limit

---

### Method 2: Share inside a Group (via Group Chat)

**How it works:**
1. User is inside a group chat
2. User clicks the attachment button (📎 icon)
3. Selects a file from their uploads
4. The file is attached and sent as a message in the group chat
5. All group members can see the file and download it

**What happens on the backend:**
- Endpoint: `POST /api/chat/{group_id}` with `file_id` parameter
- Creates a message record with `msg_type: "file"` and the `file_id`
- Stores who sent it, when it was sent, etc.
- Returns the message to all group members

**Access control:**
- Only approved members of the group can see/download the file
- Shared directly in the group conversation
- Can be deleted (for sender only "delete for me" or "delete for everyone")

---

### Method 3: Direct Download (if you know the file ID)

**How it works:**
1. Backend endpoint: `GET /api/files/{file_id}`
2. Returns the raw file bytes as a download

**Security note (⚠️ Issue):**
- Currently does NOT verify ownership or access rights
- Anyone who knows/guesses a file_id could download it
- **Recommendation**: This should require authentication and verify the user owns the file or is in an authorized group

---

## Part 2: LARGE FILE UPLOADS

### How the thresholds work

The system automatically chooses between two upload methods:

```
File Size ≤ 5 MB          → Regular upload
File Size > 5 MB          → Chunked upload
```

The 5 MB threshold is defined in the frontend:
```javascript
const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5 MB
```

---

### Method A: Regular Upload (files ≤ 5 MB)

**Frontend behavior:**
1. User selects a file
2. Frontend creates a FormData object with the file
3. Sends the entire file in one HTTP request using `XMLHttpRequest`
4. Shows a progress bar as it uploads (tracks bytes sent / total bytes)

**Example progress:**
```
Uploading photo.jpg: 0% → 25% → 50% → 75% → 100% ✓
```

**What the backend does:**
1. Receives the file in one request
2. Generates a unique filename: `<uuid>_<originalName>`
3. Saves to: `server/uploads/<uuid>_photo.jpg`
4. Creates a database record in the `files` table
5. Returns success with the file_id

**Code location:**
- Frontend: `frontend/src/utils/api.js` → `uploadFileWithProgress()`
- Backend: `server/app/routes/files.py` → `POST /api/files/upload`

---

### Method B: Chunked Upload (files > 5 MB)

**Why chunked upload?**
- Large files (GB+) can fail if sent all at once
- Network timeout risk
- Can pause/resume
- Shows more accurate progress
- Browser memory usage is better

**Frontend behavior:**

1. File is split into **2 MB chunks**
2. Each chunk is uploaded separately
3. All chunks share a unique `upload_id` (UUID)
4. Each chunk has metadata:
   - `chunk_index` (0, 1, 2, ...)
   - `total_chunks` (how many chunks total)
   - `file_name` (original filename)
   - `total_size` (expected final size)

**Example for a 50 MB file:**
```
file.mp4 = 50 MB
Split into chunks:
- Chunk 0 (2 MB)
- Chunk 1 (2 MB)
- Chunk 2 (2 MB)
- ...
- Chunk 24 (2 MB)
- Chunk 25 (2 MB)

Total = 26 chunks
```

**Upload process:**
1. Upload chunk 0 → backend stores in temporary folder
2. Upload chunk 1 → backend stores in temporary folder
3. ... continue
4. Upload chunk 25 → backend ASSEMBLES all chunks into one file

**Progress tracking:**
```
Uploading largefile.mp4:
0% (chunk 0 uploaded)
→ 8% (chunk 1 uploaded)
→ 15% (chunk 2 uploaded)
→ ...
→ 92% (chunk 24 uploaded)
→ 100% (chunk 25 uploaded, assembly complete) ✓
```

**Backend behavior during chunked upload:**

1. Each chunk request goes to: `POST /api/files/upload/chunk`
2. Backend stores chunks in temporary location:
   - `server/uploads/chunks/<upload_id>/chunk_0`
   - `server/uploads/chunks/<upload_id>/chunk_1`
   - etc.
3. After each chunk arrives, backend checks: "Are all chunks here?"
4. If NOT all here: returns `{"status": "uploading", ...}`
5. If ALL chunks here: 
   - Reads all chunks from disk
   - Assembles them into final file
   - Verifies total size matches
   - Saves final file to: `server/uploads/<uuid>_largefile.mp4`
   - Creates database record
   - **Deletes** the temporary chunk folder
   - Returns success

**Size verification:**
- If client sends `total_size: 52428800` (50 MB)
- After assembly, backend checks actual size
- If it doesn't match → reject + delete the bad file

**Code location:**
- Frontend: `frontend/src/utils/api.js` → `uploadFileChunked()`
- Backend: `server/app/routes/files.py` → `POST /api/files/upload/chunk`

---

## Part 3: SENDING FILES TO OTHER USERS

### Scenario 1: Share via Public Link
**User A wants to share a file with User B:**

1. User A uploads `report.pdf` (size: 3 MB)
2. User A clicks "Share" button
3. Gets public URL: `http://localhost:5173/share/token123abc`
4. Copies URL and sends via email/chat/etc.
5. User B opens the URL in browser
6. Frontend calls `GET /api/files/shared/token123abc/info` (no login needed)
7. Shows file name, size, upload date
8. User B clicks "Download"
9. Frontend calls `GET /api/files/shared/token123abc`
10. Browser downloads the file

**File path on disk:** `server/uploads/<uuid>_report.pdf`
**Database reference:** Stored in `files` table with `share_token = token123abc`

---

### Scenario 2: Share via Group Chat
**User A wants to share a file with Group Members:**

1. User A uploads `budget.xlsx` (size: 8 MB)
   - Since > 5 MB, uses chunked upload
   - Uploaded as 4 chunks (2 MB each)
   - Assembled on backend
   - Saved to: `server/uploads/<uuid>_budget.xlsx`
   
2. User A opens "Q3 Planning" group chat
3. Clicks attachment button (📎)
4. Selects `budget.xlsx`
5. Frontend calls `POST /api/chat/<group_id>` with:
   ```json
   {
     "msg_type": "file",
     "content": "",
     "file_id": 42
   }
   ```
6. Backend creates a message record linking to file_id 42
7. Message appears in group: "User A shared budget.xlsx"
8. Other group members see the message + file preview
9. They click "Download" → backend returns file

**File storage:** Same disk location `server/uploads/<uuid>_budget.xlsx`
**Database reference:** 
   - File record in `files` table with `user_id = User_A`
   - Message record in `messages` table with `file_id = 42, group_id = <group_id>`

---

### Scenario 3: Send Large File through Email (hypothetical)
Currently, the system does NOT have "send to another user's inbox" functionality.
Instead, users must:
1. Share via public link (Option 1) → send link via external email
2. Share via group chat (Option 2) → invite the person to the group first

---

## Part 4: BANDWIDTH & STORAGE CONSIDERATIONS

### Upload bandwidth
- **Regular upload:** File sent in 1 request → ~10 MB/sec typical speed
- **Chunked upload:** Multiple parallel requests possible (if frontend supports) → potentially faster

### Storage on disk
- Uploaded files stored in: `server/uploads/`
- Chunk files temporarily stored in: `server/uploads/chunks/<upload_id>/`
- Chunks cleaned up after assembly
- File records stored in MySQL (metadata only, not the actual bytes)

### Database storage (MySQL)
- `files` table stores: filename, size, owner, path, share_token, folder_id, upload date, etc.
- `messages` table stores: group_id, sender_id, file_id (if file message)
- Messages with deleted status remain but show "[deleted]"

### Plans & quotas
- **Free plan:** 20 GB storage limit
- **Pro plan:** 300 GB storage limit
- **Max plan:** 1 TB storage limit
- Per-file limits:
  - Free: 500 MB max file size
  - Pro: 10 GB max file size
  - Max: 50 GB max file size

---

## Part 5: EXAMPLE FLOW (Complete End-to-End)

### Uploading and Sharing a Large Video

**User: Alice**
**File:** `vacation_2025.mp4` (250 MB)
**Goal:** Send to her friend Bob

---

**Step 1: Upload**
- Alice is in "My Files" dashboard
- Drags `vacation_2025.mp4` onto the upload area
- Size: 250 MB > 5 MB threshold → **chunked upload triggered**
- Split into 125 chunks (2 MB each)

*Progress shown:*
```
Uploading vacation_2025.mp4
[████████░░░░░░░░░░░░░░░░░░] 33%
Chunk 41/125 uploaded
```

- After ~5 minutes (depending on network):
  - All 125 chunks uploaded
  - Backend assembles file
  - Saved to: `server/uploads/abc123def456_vacation_2025.mp4`
  - Database record created with file_id = 789

---

**Step 2: Generate Share Link**
- Alice clicks the Share button (🔗 icon) on `vacation_2025.mp4`
- Backend generates share_token: `xa9kd8sj2kl9...`
- Alice gets URL: `http://localhost:5173/share/xa9kd8sj2kl9...`
- Alice copies and sends to Bob via WhatsApp:
  ```
  "Check out my vacation video! http://localhost:5173/share/xa9kd8sj2kl9..."
  ```

---

**Step 3: Bob Opens the Link**
- Bob clicks the link on his phone
- Frontend loads public share page
- Calls backend: `GET /api/files/shared/xa9kd8sj2kl9.../info`
- Backend returns:
  ```json
  {
    "file_name": "vacation_2025.mp4",
    "size": 262144000,
    "uploaded_at": "2026-04-28T10:30:00Z"
  }
  ```
- Page shows: "Alice shared vacation_2025.mp4 (250 MB) — Uploaded Apr 28"
- Bob clicks "Download"

---

**Step 4: Bob Downloads**
- Frontend calls: `GET /api/files/shared/xa9kd8sj2kl9...`
- Backend locates file at: `server/uploads/abc123def456_vacation_2025.mp4`
- Returns file bytes as HTTP response
- Browser downloads `vacation_2025.mp4` to Bob's device
- Download completes

---

**What Alice can do later:**
- Click "Unshare" button → revokes the share link
- Old link no longer works
- Bob would get a 404 if he tries again

---

## Part 6: SECURITY & BEST PRACTICES

### What's Secure ✓
- Public share links use random tokens (not sequential IDs)
- Tokens are cryptographically random (UUID)
- Shared files stored outside web root (not directly accessible)
- Group files require membership
- Passwords hashed with bcrypt
- JWTs signed with SECRET_KEY

### What's NOT Secure ⚠️
- Direct file download by ID has no auth check (see known issue #3)
- Share URLs have no expiration
- No download limits
- No password protection on shares
- Plain text HTTP (should be HTTPS in production)

### Recommendations
1. Enable HTTPS in production
2. Add expiration dates to share links (optional)
3. Add download count limits
4. Fix file download endpoint to require auth + ownership check
5. Consider adding password protection to share links

---

## Part 7: API ENDPOINTS REFERENCE

### File Upload
- `POST /api/files/upload` — regular upload
- `POST /api/files/upload/chunk` — chunked upload (one chunk)

### File Operations
- `GET /api/files` — list your files
- `GET /api/files/{file_id}` — download (should require auth)
- `PATCH /api/files/{file_id}/favorite` — star a file
- `POST /api/files/{file_id}/share` — generate share link
- `DELETE /api/files/{file_id}/share` — revoke share link
- `DELETE /api/files/{file_id}` — delete file

### Public Sharing
- `GET /api/files/shared/{token}` — download shared file (no login)
- `GET /api/files/shared/{token}/info` — view share metadata (no login)

### Group Chat (file sharing)
- `POST /api/chat/{group_id}` — send message (with optional file_id)
- `GET /api/chat/{group_id}` — get messages

---

## Summary

**File Sharing Methods:**
1. Public links (share token URL)
2. Group chat (attach to message)
3. Direct download (if you know the file ID)

**Large File Upload:**
1. Files ≤ 5 MB use regular upload (single request)
2. Files > 5 MB use chunked upload (2 MB chunks, multiple requests)
3. All uploads show progress bar
4. Uploads can be cancelled

**Storage:**
- Files saved to disk at `server/uploads/`
- Metadata stored in MySQL
- Unique filenames prevent collisions
