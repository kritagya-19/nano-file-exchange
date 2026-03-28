# Nano File Exchange - Complete Project Overview

## 🎯 Project Summary

**Nano File Exchange** is a full-stack file sharing and group collaboration platform with integrated chat functionality. It allows users to upload, store, and share files while collaborating with others in groups with built-in messaging capabilities.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NANO FILE EXCHANGE                          │
├───────────────────────────────┬───────────────────────────────────┤
│         FRONTEND (React)       │      BACKEND (FastAPI/Python)     │
│  (Vite, TailwindCSS)          │     (SQLAlchemy ORM, MySQL)       │
└───────────────────────────────┴───────────────────────────────────┘
```

---

## 📋 Frontend Architecture

### Technology Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.11
- **Styling**: TailwindCSS 3.4.17, PostCSS
- **Routing**: React Router 6.28.0
- **Icons**: Lucide React 0.468.0
- **UI Components**: Radix UI, CVA (Class Variance Authority)

### Directory Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   │
│   ├── components/            # Reusable UI components
│   │   ├── AuthLayout.jsx         # Auth page layout wrapper
│   │   ├── RequireAuth.jsx        # Route protection component
│   │   ├── Navbar.jsx            # Navigation bar
│   │   ├── Footer.jsx            # Footer component
│   │   ├── SectionGlow.jsx       # Visual effects
│   │   ├── CTA.jsx               # Call-to-action sections
│   │   ├── BrushUnderline.jsx    # Decorative elements
│   │   ├── PasswordRuleList.jsx  # Password validation UI
│   │   ├── Hero.jsx              # Landing page hero
│   │   ├── Features.jsx          # Features display
│   │   ├── ForWhom.jsx           # Target audience section
│   │   ├── Process.jsx           # How it works section
│   │   ├── dashboard/
│   │   │   └── DashboardLayout.jsx  # Dashboard main layout
│   │   └── ui/
│   │       └── [UI Components]
│   │
│   ├── context/                # Global state management
│   │   └── AuthContext.jsx        # Authentication context (user, login, logout)
│   │
│   ├── pages/                  # Page components
│   │   ├── Landing.jsx            # Home page (/)
│   │   ├── Login.jsx              # Login page (/login)
│   │   ├── Register.jsx           # Registration page (/register)
│   │   └── dashboard/
│   │       ├── DashboardHome.jsx      # Dashboard overview
│   │       ├── MyFiles.jsx            # File management page
│   │       ├── Groups.jsx             # Groups management
│   │       ├── Shared.jsx             # Shared files/groups
│   │       ├── StarredPage.jsx        # Starred/favorited items
│   │       ├── TrashPage.jsx          # Deleted files
│   │       ├── ProfilePage.jsx        # User profile
│   │       ├── SettingsPage.jsx       # User settings
│   │       └── HelpPage.jsx           # Help/documentation
│   │
│   ├── utils/                  # Utility functions
│   │   ├── api.js                 # API client (apiFetch function)
│   │   ├── validation.js          # Form validation logic
│   │   └── displayName.js         # Display name utilities
│   │
│   └── lib/                    # Library code
│
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # TailwindCSS configuration
├── postcss.config.js          # PostCSS configuration
├── package.json               # Dependencies
└── public/                    # Static assets
```

### Key Frontend Flows

#### 1. **Authentication Flow**

```
User → Landing Page
  ↓
User clicks "Sign Up" or "Sign In"
  ↓
Register/Login Form
  ↓
API Call: POST /api/auth/register or /api/auth/login
  ↓
Save token + user info to localStorage (via AuthContext.login)
  ↓
Navigate to /dashboard
```

#### 2. **File Management Flow**

```
User in Dashboard → MyFiles Page
  ↓
Click Upload Button
  ↓
Select File
  ↓
FormData sent to: POST /api/files/upload
  ↓
File stored on server, DB record created
  ↓
File list refreshed from: GET /api/files
  ↓
Display files in grid/list view
  ↓
User can Download or Delete files
```

#### 3. **Group Collaboration Flow**

```
User → Groups Page
  ↓
Create Group → POST /api/groups
  ↓
Add Members → POST /api/groups/{id}/members
  ↓
Send Messages → POST /api/chat/{group_id}
  ↓
View Chat History → GET /api/chat/{group_id}
```

### AuthContext (Global State)

```javascript
// Structure stored in localStorage
{
  token: "jwt_token_string",
  user_id: 123,
  name: "John Doe",
  email: "john@example.com"
}

// Functions
useAuth() → { user, login(), logout(), ready }
```

### API Client (api.js)

```javascript
apiFetch(endpoint, options)
  ↓
Automatically adds Bearer token from localStorage
  ↓
Handles JSON serialization
  ↓
Throws error if response not ok
  ↓
Returns parsed JSON response
```

---

## 🔙 Backend Architecture

### Technology Stack

- **Framework**: FastAPI 0.115.6
- **Server**: Uvicorn 0.34.0
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT (PyJWT) with BCrypt hashing
- **File Handling**: AsyncIO with aiofiles
- **Real-time**: WebSockets (14.1)

### Directory Structure

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization, CORS setup
│   ├── config.py               # Settings & configuration (DB, JWT, etc.)
│   ├── database.py             # SQLAlchemy engine, session factory
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py                # User & Admin models
│   │   ├── file.py                # File & StorageDetail models
│   │   ├── group.py               # Group & GroupMember models
│   │   └── message.py             # Message model
│   │
│   ├── schemas/                # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── auth.py                # UserRegister, UserLogin, TokenResponse
│   │   ├── file.py                # FileResponse, FileDeleteResponse
│   │   ├── group.py               # GroupCreate, GroupResponse, etc.
│   │   └── message.py             # MessageCreate, MessageResponse
│   │
│   ├── routes/                 # API endpoint handlers
│   │   ├── __init__.py            # Router aggregation
│   │   ├── auth.py                # /api/auth/* endpoints
│   │   ├── files.py               # /api/files/* endpoints
│   │   ├── groups.py              # /api/groups/* endpoints
│   │   ├── chat.py                # /api/chat/* endpoints
│   │   └── health.py              # /api/health endpoint
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── __init__.py
│   │   └── auth.py                # JWT verification, get_current_user_id
│   │
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── security.py            # Password hashing, token creation
│       └── file_ops.py            # File operations
│
├── sql/
│   └── init.sql               # Database initialization script
│
├── uploads/                   # User uploaded files storage
├── run.py                     # Application entry point
└── requirements.txt           # Python dependencies
```

### Database Schema

#### Users Table

```sql
users
├── user_id (PK)
├── name
├── email (UNIQUE)
├── password_hash
├── status (active/inactive)
└── created_at
```

#### Files Table

```sql
files
├── file_id (PK)
├── file_name
├── size
├── file_path (physical file location)
├── cloud_url
├── user_id (FK → users)
└── uploaded_at

storage_details (1:1 with files)
├── id (PK)
├── file_id (FK → files, UNIQUE)
├── sender_id (FK → users)
├── file_type
└── timestamp
```

#### Groups & Members

```sql
groups
├── group_id (PK)
├── group_name
├── created_by (FK → users)
└── created_at

group_members
├── id (PK)
├── group_id (FK → groups)
├── user_id (FK → users)
├── joined_at
└── UNIQUE(group_id, user_id)
```

#### Messages Table

```sql
messages
├── id (PK)
├── group_id (FK → groups)
├── sender_id (FK → users)
├── msg_type (text/file/media)
├── content (TEXT)
└── sent_at
```

### API Endpoints

#### Authentication (`/api/auth/`)

```
POST /api/auth/register
  Request:  { name, email, password }
  Response: { token, user_id, name, email, message }

POST /api/auth/login
  Request:  { email, password }
  Response: { token, user_id, name, email, message }
```

#### Files (`/api/files/`)

```
POST /api/files/upload
  Request:  FormData { file }
  Response: { status, file_id, download_url }
  Auth:     Required ✓

GET /api/files
  Response: List[FileResponse]
  Auth:     Required ✓

GET /api/files/{file_id}
  Response: File binary (download)
  Auth:     Not required

DELETE /api/files/{file_id}
  Response: { status, message }
  Auth:     Required ✓
```

#### Groups (`/api/groups/`)

```
POST /api/groups
  Request:  { group_name }
  Response: GroupResponse (creator auto-added as member)
  Auth:     Required ✓

GET /api/groups
  Response: List[GroupResponse] (groups where user is creator or member)
  Auth:     Required ✓

POST /api/groups/{group_id}/members
  Request:  { user_id }
  Response: GroupMemberResponse
  Auth:     Required ✓ (only group creator can add members)
```

#### Chat/Messages (`/api/chat/`)

```
POST /api/chat/{group_id}
  Request:  { msg_type, content }
  Response: MessageResponse
  Auth:     Required ✓ (must be group member)

GET /api/chat/{group_id}
  Response: List[MessageResponse] (last 50 messages)
  Auth:     Required ✓ (must be group member)
```

### Authentication Flow (Backend)

#### Registration

```python
1. Validate email not already in database
2. Hash password using BCrypt
3. Create User record in DB
4. Generate JWT token with user_id
5. Return token + user info
```

#### Login

```python
1. Find user by email
2. Verify password hash
3. Generate JWT token
4. Return token + user info
```

#### Protected Routes

```python
1. Extract JWT from Authorization header
2. Verify JWT signature using SECRET_KEY
3. Decode and extract user_id
4. Return user_id to route handler
5. Allow access to protected resource
```

### Key Security Features

- **Password Hashing**: BCrypt with salt
- **Token Authentication**: JWT (HS256 algorithm)
- **CORS**: Restricted to localhost:3000 for development
- **Authorization**: User can only access/modify their own files
- **Group Authorization**: Only creators can add members

### File Upload Flow (Backend)

```python
1. Receive file from client
2. Generate unique filename: {uuid}_{original_name}
3. Save to uploads/ directory
4. Create File record in DB
5. Create 1:1 StorageDetail record (file_type, sender_id)
6. Return file_id and download_url
```

### Configuration (config.py)

```python
DATABASE_URL: mysql+pymysql://nano:nano123@localhost:3306/nano_exchange
SECRET_KEY: nano-super-secret-2024-change-in-production
ALGORITHM: HS256
ACCESS_TOKEN_EXPIRE_HOURS: 24
UPLOAD_DIR: uploads/
```

---

## 🔄 Complete Request Flow Example

### Example: Upload & Share File

```
CLIENT SIDE (React)
├─ User clicks upload button in MyFiles.jsx
├─ User selects file from system
├─ Create FormData with file
├─ Call: apiFetch("/files/upload", { method: "POST", body: formData })
│
├─ apiFetch adds Authorization header with JWT
├─ Send POST request to http://localhost:8000/api/files/upload
│
└─ On response, refresh file list via GET /api/files

SERVER SIDE (FastAPI)
├─ Receive POST /api/files/upload with file
├─ Middleware: verify_token() extracts user_id from JWT
│
├─ Route handler (files.py):
│   ├─ Read file content
│   ├─ Generate unique filename
│   ├─ Save to /uploads/ directory
│   ├─ Create File model record (files table)
│   ├─ Create StorageDetail record (storage_details table)
│   ├─ Commit to database
│   ├─ Return file_id and download_url
│
└─ Static file mount at /api/files/download serves uploaded files

CLIENT SIDE (React) Receives Response
├─ Update files state
├─ Re-render MyFiles page
├─ Display new file in list
└─ User can now download or delete file
```

---

## 🔗 Data Flow Diagram

```
FRONTEND (React)                    BACKEND (FastAPI)              DATABASE (MySQL)
════════════════════════════════════════════════════════════════════════════════

Landing Page
    ↓
Login/Register
    ↓ apiFetch("/auth/login")      POST /api/auth/login
    ├──────────────────────────────→ verify credentials
                                     create JWT token
    ← TokenResponse ←────────────────
    ↓
Save to localStorage (AuthContext)
    ↓
Dashboard
    ├─ MyFiles.jsx
    │  ├─ GET /api/files ──────────→ Query: SELECT * FROM files WHERE user_id=?
    │  │                             Database
    │  ← List[FileResponse] ←────────
    │  ├─ POST /api/files/upload ──→ Save file, insert records
    │  │                             Database: files + storage_details
    │  ← { file_id, download_url } ←
    │  └─ DELETE /api/files/{id} ───→ Delete file record & disk file
    │                                Database
    │
    ├─ Groups.jsx
    │  ├─ POST /api/groups ────────→ Create group, add creator
    │  │                             Database: groups + group_members
    │  ← GroupResponse ←────────────
    │  ├─ GET /api/groups ─────────→ Query user's groups
    │  │                             Database
    │  ← List[GroupResponse] ←──────
    │  └─ POST /api/groups/{id}/members
    │                    ────────────→ Add member to group
    │                                Database: group_members
    │
    └─ Chat (future implementation)
       ├─ POST /api/chat/{group_id}
       │                    ────────→ Send message
       │                             Database: messages
       └─ GET /api/chat/{group_id}
                              ─────→ Fetch chat history
                                    Database: messages
```

---

## 🎯 User Workflows

### 1. New User Registration

1. Visit `/register`
2. Enter name, email, password
3. Form validates: email format, password strength
4. Submit → API: POST `/auth/register`
5. Success → Save auth token to localStorage
6. Redirect to `/dashboard`

### 2. Existing User Login

1. Visit `/login`
2. Enter email, password
3. Submit → API: POST `/auth/login`
4. Success → Save auth token to localStorage
5. Redirect to `/dashboard`
6. Browser refresh: AuthContext loads token from localStorage → stays logged in

### 3. Upload & Manage Files

1. In Dashboard, go to "My Files" tab
2. Click "Upload File" button
3. Select file from system
4. File uploaded → API: POST `/files/upload`
5. File appears in list
6. User can download or delete

### 4. Create & Collaborate in Group

1. Go to "Groups" tab
2. Click "Create Group"
3. Enter group name
4. Group created → current user is auto-added
5. Add members by email
6. Group members can send messages
7. Messages persist in database
8. View chat history when accessing group

---

## 🔐 Security & Permissions

### Authentication

- All protected endpoints require JWT token in Authorization header
- Token generated on login/register
- Token stored in localStorage (frontend)
- Token verified on each request (backend)

### Authorization

- Users can only access their own files
- Users can only delete their own files
- Only group creators can add members
- Only group members can send/read messages
- Users cannot modify other users' data

---

## 📦 Dependencies Summary

### Frontend

- React: UI library
- React Router: Client-side routing
- TailwindCSS: Styling framework
- Vite: Fast build tool
- Lucide React: Icon library
- Radix UI: Headless components

### Backend

- FastAPI: Web framework
- SQLAlchemy: ORM
- PyMySQL: MySQL driver
- PyJWT: JWT token handling
- Passlib: Password hashing
- Bcrypt: Encryption
- Pydantic: Data validation
- WebSockets: Real-time communication (installed, not yet used)

---

## 🚀 How to Run

### Backend

```bash
cd server
pip install -r requirements.txt
python run.py
# Server runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173 (Vite default)
```

---

## 📝 Summary Table

| Aspect             | Technology      | Purpose                |
| ------------------ | --------------- | ---------------------- |
| Frontend Framework | React 18        | UI building            |
| Frontend Build     | Vite            | Fast bundling          |
| Styling            | TailwindCSS     | Utility-first CSS      |
| Routing            | React Router 6  | Client-side navigation |
| Backend            | FastAPI         | REST API server        |
| Database           | MySQL           | Data persistence       |
| ORM                | SQLAlchemy      | Database abstraction   |
| Authentication     | JWT + BCrypt    | Secure user auth       |
| File Storage       | Disk + Database | File management        |
| Real-time (Future) | WebSockets      | Live updates           |

---

## 🎨 Component Hierarchy

```
App
├── Landing (public)
├── Login (public)
├── Register (public)
└── RequireAuth (protected)
    └── DashboardLayout
        ├── Navbar
        ├── Sidebar (implicit in layout)
        ├── Routes
        │   ├── DashboardHome
        │   ├── MyFiles
        │   ├── Groups
        │   ├── Shared
        │   ├── Starred
        │   ├── Trash
        │   ├── Profile
        │   ├── Settings
        │   └── Help
        └── Footer
```

---

## 🔮 Future Enhancements

- Real-time chat using WebSockets
- File sharing with expiration links
- Advanced group permissions
- File versioning
- Cloud storage integration
- Email notifications
- Two-factor authentication
- Rate limiting
- Search & filtering enhancements

---

This document provides a complete understanding of the Nano File Exchange project architecture, data flows, and implementations.
