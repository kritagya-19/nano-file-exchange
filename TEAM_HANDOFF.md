# Nano File Exchange — Team Handoff (Non‑Coder Friendly)

Date: 2026-04-23

## 1) What this project is (in simple words)

**Nano File Exchange** is a web app where people can:

- create an account and sign in
- upload files and organize them into folders
- mark files as “starred/favorite”
- generate a public share link to let someone download a file without logging in
- create groups (like a small workspace) and chat with group members
- invite people to groups by email using an invitation link
- (admin users) manage users/files/groups, change plans, and download reports

Think of it like:

- **Google Drive-style file storage** (but self-hosted)
- plus **WhatsApp/Slack-style group chat**
- plus **an admin dashboard** for monitoring and management

---

## 2) Big picture: the 3 main parts

### A) Frontend (the website users see)

- Location: `frontend/`
- Tech: React + Vite + TailwindCSS
- Runs in the browser and shows pages like Login, Dashboard, My Files, Groups, Admin, etc.

### B) Backend (the “brain” server)

- Location: `server/`
- Tech: FastAPI (Python)
- Provides **API endpoints** (URLs the frontend calls) to do actions like login, upload, list files, send messages, etc.
- Runs at: `http://localhost:8000`
- API base path: `http://localhost:8000/api`
- API docs (Swagger UI): `http://localhost:8000/docs`

### C) Database + File Storage

- Database: **MySQL** (stores users, file records, groups, messages, plans, etc.)
- File storage: saved on disk inside `server/uploads/`

So:

- the **database stores information about files** (name, size, owner, where it is saved)
- the **actual file bytes** are stored in the `uploads` folder

---

## 3) How the website and server “talk”

When you click a button in the frontend (example: “Upload file”), the frontend sends a request to the backend, like:

- `POST http://localhost:8000/api/files/upload`

The backend then:

1. checks who you are (using your login token)
2. saves the file to disk (`server/uploads/...`)
3. writes a record into MySQL (so it appears in your file list)
4. returns a response (success + file id)

The frontend then refreshes the screen by calling:

- `GET http://localhost:8000/api/files`

---

## 4) Frontend (what pages exist and what they do)

Main routing file: `frontend/src/App.jsx`

### Public pages (no login needed)

- `/` → Landing page (marketing)
- `/login` → Login form
- `/register` → Register form
- `/share/:token` → Public download page for shared files
- `/invite/:token` → Public invitation page (shows invite info; asks you to login if needed)

### User dashboard pages (login required)

All routes under `/dashboard/...` are protected by `RequireAuth`.

- `/dashboard` → Dashboard overview
- `/dashboard/files` → File manager (“My Files”)
- `/dashboard/groups` → Group list + join/create
- `/dashboard/shared` → List of your shared links
- `/dashboard/starred` → Starred files
- `/dashboard/trash` → Trash page (UI exists; behavior depends on backend logic)
- `/dashboard/help` → Help
- `/dashboard/profile` → Profile
- `/dashboard/settings` → Settings
- `/dashboard/pricing` → Pricing page (plans)
- `/dashboard/checkout/:planId` → Checkout
- `/dashboard/payment-success` → Payment success confirmation

### Admin pages (admin login required)

Admin routes use `RequireAdmin`.

- `/admin/login` → Admin login screen
- `/admin` → Admin dashboard
- `/admin/users` → Manage users
- `/admin/files` → Manage files
- `/admin/groups` → Manage groups
- `/admin/plans` → Edit plans
- `/admin/storage` → Storage analytics
- `/admin/revenue` → Revenue analytics
- `/admin/activity` → Activity logs
- `/admin/reports` → Download CSV reports

---

## 5) Login: how “sessions” work

File: `frontend/src/context/AuthContext.jsx`

### What happens when a user logs in

1. Frontend calls the backend login endpoint.
2. Backend returns a **JWT token** (a signed “digital pass”).
3. The frontend saves this into the browser’s local storage under the key:
   - `nanofile_user`

That saved object looks like:

```json
{ "token": "...", "user_id": 123, "name": "...", "email": "..." }
```

### How future requests stay logged in

For every API call, the frontend attaches this header:

- `Authorization: Bearer <token>`

The backend uses that token to know which user is making the request.

### Auto-logout behavior

If the backend replies with HTTP `401` (token invalid/expired), the frontend clears `nanofile_user` and redirects to `/login`.

---

## 6) Backend: where the API is and what it provides

Backend entry:

- `server/run.py` starts Uvicorn on port `8000`.
- Main app: `server/app/main.py`

### API prefix

All real API endpoints are under:

- `/api/...`

Example:

- `/api/auth/login`
- `/api/files/upload`

### Automatic “startup setup”

In `server/app/main.py` the app runs two startup tasks:

1. `_run_migrations()`
   - creates tables (if missing)
   - attempts to add new columns like `is_favorite`, `share_token`, `folder_id`, etc.
   - if a column already exists, it just skips it
2. `_seed_plans()`
   - inserts default plans (Free/Pro/Max) into the `plans` table if empty

This means: you usually don’t have to run a separate migration tool during development.

### CORS (browser permission)

The backend allows browser requests from `localhost` or `127.0.0.1` on any port.
This is why the frontend (5173) can talk to the backend (8000).

---

## 7) Files: uploading, listing, downloading, sharing

Backend file routes: `server/app/routes/files.py`

### 7.1 Upload (normal upload)

Endpoint:

- `POST /api/files/upload`

What happens:

1. Backend reads the uploaded file.
2. It creates a unique filename like: `<uuid>_<originalName>`
3. It saves bytes to: `server/uploads/<uuid>_<originalName>`
4. It creates a database record in the `files` table.

Frontend behavior:

- Uses `XMLHttpRequest` so it can show a progress bar while uploading.

### 7.2 Upload (chunked upload for big files)

Endpoint:

- `POST /api/files/upload/chunk`

What happens:

1. The frontend breaks the file into 2MB pieces (“chunks”).
2. It uploads chunks one by one with an `upload_id`.
3. The backend stores chunks temporarily in:
   - `server/uploads/chunks/<upload_id>/chunk_0`, `chunk_1`, ...
4. When all chunks arrive, the backend assembles them into the final file in `server/uploads/`.
5. It verifies total size (if provided) to detect corrupted uploads.
6. It deletes the temporary chunk folder.

This makes big uploads more reliable (and allows showing progress for long uploads).

### 7.3 List files

Endpoint:

- `GET /api/files`

It returns your files, newest first.
It supports optional `folder_id` filtering.

### 7.4 Download (logged-in)

Endpoint:

- `GET /api/files/{file_id}`

It returns the raw file bytes as a download.

### 7.5 Star (favorite)

Endpoint:

- `PATCH /api/files/{file_id}/favorite`

It toggles `is_favorite` true/false for that file.

### 7.6 Share links (public download)

Endpoints:

- `POST /api/files/{file_id}/share` → creates a `share_token`
- `DELETE /api/files/{file_id}/share` → removes the share token
- `GET /api/files/shared/{token}` → anyone can download (no login)
- `GET /api/files/shared/{token}/info` → anyone can view metadata

Important note (current code behavior):

- The backend returns a share URL like `http://localhost:3000/share/<token>`.
- But the configured frontend default is `http://localhost:5173`.
  So in development, if you click the returned URL, it may point to the wrong port.

---

## 8) Folders (organizing files)

Folder routes: `server/app/routes/folders.py`

Conceptually:

- A folder is just a “label/group” owned by a user.
- Each file can optionally have a `folder_id`.

Moving a file to a folder is done via:

- `PATCH /api/files/{file_id}/move` with body `{ "folder_id": 123 }`

---

## 9) Groups + Chat (collaboration)

Group routes: `server/app/routes/groups.py`
Chat routes: `server/app/routes/chat.py`

### 9.1 Creating and joining groups

- Create group: `POST /api/groups`

  - creator automatically becomes an approved member

- List my groups: `GET /api/groups`

  - shows groups you created OR groups where you are an approved member

- Explore groups: `GET /api/groups/explore`

  - shows groups where you are not a member

- Join group: `POST /api/groups/{group_id}/join`
  - creates a **pending request**
  - the group creator must approve

### 9.2 Approval (admin of the group)

Only the group creator can:

- view pending join requests: `GET /api/groups/{group_id}/requests`
- approve: `POST /api/groups/{group_id}/requests/{user_id}/approve`
- reject: `POST /api/groups/{group_id}/requests/{user_id}/reject`

### 9.3 Members list

- `GET /api/groups/{group_id}/members`
  Only approved members (or the creator) can see this.

### 9.4 Sending messages

- `POST /api/chat/{group_id}`
  A message has:
- `msg_type` (example: text/file/deleted)
- `content` (text)
- optional `file_id` (attach an uploaded file)

### 9.5 Reading messages

- `GET /api/chat/{group_id}`
  It returns up to the latest 50 messages.

Important behavior:

- If you “delete for me”, the message is **hidden only for you** (others still see it).
- If you “delete for everyone”, only the sender is allowed to do that, and the message becomes a “deleted” placeholder.

### 9.6 Reactions and stars

People can react to messages (emoji) and star messages.
Endpoints exist to add/remove reactions and stars.

### 9.7 Clear chat

- `DELETE /api/chat/{group_id}/clear/all`
  This hides all messages in that group for that user.

### 9.8 Delete group

- `DELETE /api/groups/{group_id}`
  Only the creator can delete the group.
  The backend explicitly deletes message-related rows for cleanup.

---

## 10) Email invitations (invite link flow)

Email invite sending happens in `server/app/routes/groups.py` and `server/app/utils/email.py`.

### Step-by-step

1. Group creator invites an email:
   - `POST /api/groups/{group_id}/invite` with `{ "email": "person@example.com" }`
2. Backend creates an invitation token and stores it in the database.
3. Backend sends an email containing a link:
   - `http://localhost:5173/invite/<token>` (uses `FRONTEND_URL` from config)
4. Invitee opens the link:
   - the frontend calls `GET /api/groups/invite/<token>/info` (public) to show details
5. If the invitee logs in with the same email, frontend calls:
   - `POST /api/groups/invite/<token>/accept`
6. Backend checks the logged-in user email matches the invited email, then adds them as an approved member.

If SMTP is not configured, invitation records still get created, but emails may fail to send.

---

## 11) Plans + subscriptions (pricing)

There are two related concepts:

- **Plans** = definitions like Free/Pro/Max (storage limits, prices, features)
- **Subscription** = what a specific user currently purchased

Plans are seeded automatically on backend startup (`_seed_plans()` in `server/app/main.py`).

Public endpoint for plans:

- `GET /api/plans`

Checkout/subscription endpoints:

- `POST /api/subscriptions/checkout` (simulates purchase behavior)
- `GET /api/subscriptions/me` (returns current user subscription)

---

## 12) Admin panel (platform management)

Admin API: `server/app/routes/admin.py`
Admin login is separate from user login.

### How admin authentication works

- Admin logs in via `POST /api/admin/login`
- The backend returns a JWT token where the subject looks like: `admin:<id>`
- Admin-only endpoints require this admin token.

### What the admin can do

From the code, admin endpoints include:

- dashboard totals (users/files/groups/storage/revenue)
- list/search users; block/unblock users; delete users
- file moderation (list/delete files)
- group moderation
- plan updates (`PUT /api/admin/plans/{plan_key}`)
- analytics for storage/revenue/activity
- CSV report downloads (`/api/admin/reports/...`)

---

## 13) Security model (how access is controlled)

### Passwords

- Passwords are stored as **bcrypt hashes** (not plain text).

### JWT tokens

- After login, a token is issued.
- The backend verifies the token signature using `SECRET_KEY`.
- The token contains a `sub` (subject) which is the user id.

### Active user checks

Even if someone has an old token, the backend checks the user still exists and is active:

- if the account is deleted → access denied
- if `status != active` → access denied

### Public links

Shared file downloads and invitation “info” endpoints do not require login.
They rely on random tokens that act like “secret links”.

---

## 14) Configuration (what to change for different environments)

Main backend config: `server/app/config.py`

Defaults (development):

- Backend runs on `8000` (`server/run.py`)
- Frontend runs on Vite default `5173`
- API base URL in frontend is hard-coded in `frontend/src/utils/api.js`:
  - `http://localhost:8000/api`

Database settings (defaults):

- host: `localhost`
- port: `3306`
- user: `nano`
- password: `nano123`
- db: `nano_exchange`

Email settings:

- SMTP host/port/user/password/from

Frontend URL:

- `FRONTEND_URL` is used to generate invitation links

Production note:

- `SECRET_KEY` must be changed for real deployment.

---

## 15) Data model (what is stored in the database)

You don’t need to know SQL to understand this. Think of the database as spreadsheets (“tables”).

Typical important tables (high-level):

- `users` — user accounts
- `admins` — admin accounts
- `files` — records of uploaded files (name, size, owner, where stored)
- `folders` — folders created by users
- `storage_details` — metadata about file uploads (type, sender)
- `groups` — group workspaces
- `group_members` — who belongs to which group + status (pending/approved)
- `group_invitations` — email invitation tokens
- `messages` — chat messages
- `message_reactions` — emoji reactions
- `message_stars` — starred messages
- `message_hides` — “deleted for me” hiding
- `plans` — plan definitions (limits/prices/features)
- `subscriptions` — what plan a user purchased
- `activity_logs` — admin/user activities (used for admin analytics)

Relationships (plain English):

- One user can have many files.
- One user can create many folders.
- One group can have many members.
- One group can have many messages.
- A message can optionally refer to a file (attachment).

---

## 16) How to run locally on Windows (cmd) — runbook

### Prerequisites

Install these on your machine:

- Node.js (for frontend)
- Python 3.x (for backend)
- MySQL server (database)

### Step 1: Create the MySQL database (one-time)

You need a DB named `nano_exchange` and a user that matches the backend config.
If you’re using defaults from `server/app/config.py`, create:

- user: `nano`
- password: `nano123`
- database: `nano_exchange`

Example (mysql CLI) — run as a MySQL admin user:

```sql
CREATE DATABASE nano_exchange;
CREATE USER 'nano'@'localhost' IDENTIFIED BY 'nano123';
GRANT ALL PRIVILEGES ON nano_exchange.* TO 'nano'@'localhost';
FLUSH PRIVILEGES;
```

If your MySQL is not on the same machine, replace `'localhost'` with the correct host.

Optional: you can create a backend `.env` file to override defaults.

- Create `server/.env`
- Add values like:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=nano
DB_PASSWORD=nano123
DB_NAME=nano_exchange

FRONTEND_URL=http://localhost:5173
SECRET_KEY=change-me-in-production
```

### Step 2: Start the backend

From the repo root, in **cmd.exe**:

```cmd
cd server
python -m pip install -r requirements.txt
python run.py
```

Backend should be available at:

- `http://localhost:8000`
- docs: `http://localhost:8000/docs`

### Step 3: Start the frontend

Open a second terminal, from the repo root:

```cmd
cd frontend
npm install
npm run dev
```

Frontend should show a URL similar to:

- `http://localhost:5173`

### Step 4: Use the app

Open the frontend URL in your browser.

---

## 16A) Known issues / risks (worth telling the team)

These are based on the current code as of this document date.

1. ~~Share links return port `3000`~~ **FIXED**

- ~~Backend endpoint `POST /api/files/{file_id}/share` returns `http://localhost:3000/share/<token>`.~~
- ~~But dev frontend is typically `5173` (and `FRONTEND_URL` default is `5173`).~~
- **FIX APPLIED**: The share URL now uses `FRONTEND_URL` from config (default: `http://localhost:5173`), so share links correctly point to where the frontend is running.

2. Frontend API base URL is hard-coded

- `frontend/src/utils/api.js` uses `API_BASE_URL = "http://localhost:8000/api"`.
- If backend host/port changes, the frontend must be edited (or updated to use env variables).

3. Auth check missing on file download by id

- Backend endpoint `GET /api/files/{file_id}` does not currently require `get_current_user_id`.
- That means anyone who knows/guesses a `file_id` could potentially download it.
- Recommended: require authentication and verify ownership (or membership rules) before returning the file.

---

## 17) Common troubleshooting (plain-language)

### “Frontend opens but actions fail”

- Check backend is running on `8000`.
- The frontend calls `http://localhost:8000/api` (hard-coded), so if you changed the backend port, update `frontend/src/utils/api.js`.

### “Login/register fails with database errors”

- The backend needs MySQL running.
- Confirm the credentials in `server/app/config.py` match your MySQL.

### “CORS error in browser console”

- Backend allows localhost/127.0.0.1 on any port.
- If you are using a different hostname (not localhost), you may need to adjust CORS settings.

### "Share link opens wrong port"

- **FIXED**: Backend now uses `FRONTEND_URL` config (default: `http://localhost:5173`) for share URLs.
- If you changed the frontend port, update `FRONTEND_URL` in `server/.env` or `server/app/config.py`.

### “Invite emails not sending”

- Configure SMTP settings in environment variables or `.env` used by backend.
- Even if email fails, the invitation is still created; you can copy the invite link manually if you have the token.

---

## 18) Glossary (quick meanings)

- **Frontend**: the website part you open in the browser.
- **Backend**: the server program that does the work (auth, DB, file saving).
- **API**: a list of URLs the frontend calls to “ask the backend to do something”.
- **Database**: a structured storage (MySQL) for records like users/files/groups.
- **JWT token**: a signed “login pass” stored in the browser.
- **CORS**: browser security rule about which sites can call your backend.
- **Upload directory**: folder where the raw uploaded files are saved (`server/uploads`).

---

## 19) What to send to the team

If you’re sending this document to the team, include:

- this `TEAM_HANDOFF.md`
- the repo link
- the local run steps (Section 16)
- the two important URLs:
  - frontend `http://localhost:5173`
  - backend docs `http://localhost:8000/docs`
