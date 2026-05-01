# Group Communication & Chat Guide

Date: 2026-04-28

## Overview

This guide explains how groups and chat functionality work in Nano File Exchange. The system supports group workspaces where members can send text messages, share files, react with emojis, and manage their chat view.

---

## 1. Group Lifecycle & Membership

### Creating a Group
- Any logged-in user can create a group.
- The person who creates it becomes the **Creator** (Admin) of that group.
- The Creator is automatically added as an **Approved Member**.

### Joining a Group (2 Methods)
**Method A: Request to Join (Explore)**
1. Users can see a list of public groups they haven't joined yet on the "Explore" tab.
2. A user clicks "Join".
3. A `GroupMember` record is created with `status = "pending"`.
4. The Group Creator sees this request in their pending list and can **Approve** or **Reject** it.

**Method B: Email Invitation**
1. The Group Creator enters an email address to invite someone.
2. The system generates a unique invitation token and emails it to the user.
3. The user clicks the link (`/invite/<token>`).
4. If they log in (or create an account), they can accept the invite.
5. They bypass the "pending" stage and immediately become an **Approved Member**.

---

## 2. How Chat Works

### Sending Messages
Only **Approved Members** (and the Creator) can send or read messages in a group.

When a user types a message and hits send:
1. The frontend calls `POST /api/chat/{group_id}`.
2. Payload: `{ "content": "Hello team!", "msg_type": "text" }`
3. (If attaching a file, `file_id` is included and `msg_type` is `"file"`).
4. The backend saves the message in the `messages` table.

### Receiving Messages (Polling)
- The app currently uses **HTTP Polling** rather than WebSockets.
- If a user has a group chat open, the frontend automatically calls `GET /api/chat/{group_id}` **every 5 seconds** to fetch the latest messages.
- The backend returns up to the latest 50 messages, ordered by time.

---

## 3. Message Features & Interactions

### Reactions (Emojis)
- Users can react to any message with an emoji (e.g., 👍, ❤️, 😂).
- Handled via `POST /api/chat/{group_id}/react/{msg_id}`.
- Reactions are stored in the `message_reactions` table, linking the user, the message, and the emoji.

### Star Messages
- Users can "star" important messages to highlight them.
- Handled via `POST /api/chat/{group_id}/star/{msg_id}`.
- Stored in the `message_stars` table.

---

## 4. Deleting & Hiding Messages

Nano File Exchange has a very specific way of handling deleted messages:

### Option A: "Delete for Me" (Hiding)
- **Effect:** The message disappears from *your* screen, but everyone else can still see it.
- **How it works:** 
  - Instead of actually deleting the message, the backend adds a record to the `message_hides` table (linking `message_id` and `user_id`).
  - When you fetch messages, the database query filters out any messages that appear in your `message_hides` list.

### Option B: "Delete for Everyone"
- **Effect:** The message is redacted for all members of the group.
- **Rules:** You can only do this for messages *you* sent.
- **How it works:**
  - The backend does NOT drop the row from the database.
  - Instead, it modifies the row: 
    - Changes `msg_type` to `"deleted"`
    - Changes `content` to `"This message was deleted"`
    - Clears any attached `file_id`
    - Hard-deletes all associated reactions and stars from the database.
  - Everyone's chat window will update to show the grey "[deleted]" placeholder.

### Clear Chat (Entire History)
- **Effect:** Wipes the chat screen clean for you, but leaves the history intact for other members.
- **How it works:** 
  - The backend loops through every single message currently in the group.
  - It bulk-adds a record into the `message_hides` table for *every* message, tied to your `user_id`.
  - Your next fetch returns 0 messages, giving you a fresh start.

---

## 5. Security & Access Rules

- **Strict Access Check:** Every time the chat polling fires or a message is sent, the backend verifies that the user is still an `approved` member. 
- **Auto-Kicking:** If an admin deletes the group, or if a user's account is deactivated, all subsequent chat requests immediately return a `403 Forbidden` or `404 Not Found`, locking them out of the chat UI instantly.
- **Deletion:** Only the Group Creator can completely delete the group. Doing so hard-deletes all messages, reactions, stars, member records, and the group itself from the database.

---

## Summary Data Model for Chat

To understand how it connects in the database:
- **`groups`**: The room itself
- **`group_members`**: Who is allowed inside (`status = 'approved'`)
- **`messages`**: The actual text or file link
- **`message_reactions`**: User ID + Message ID + Emoji
- **`message_stars`**: User ID + Message ID
- **`message_hides`**: User ID + Message ID (Filters out messages for specific users)