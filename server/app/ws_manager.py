"""
WebSocket Connection Manager
Manages per-group WebSocket rooms. When a message is sent, it broadcasts
to every connected client in that group so all users see it instantly
(no polling delay).
"""
import asyncio
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # group_id -> list of active WebSocket connections
        self._rooms: Dict[int, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        async with self._lock:
            if group_id not in self._rooms:
                self._rooms[group_id] = []
            self._rooms[group_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, group_id: int):
        async with self._lock:
            room = self._rooms.get(group_id, [])
            if websocket in room:
                room.remove(websocket)
            if not room and group_id in self._rooms:
                del self._rooms[group_id]

    async def broadcast(self, group_id: int, payload: dict):
        """Send a JSON payload to every client in the group room."""
        async with self._lock:
            connections = list(self._rooms.get(group_id, []))

        dead = []
        for ws in connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                room = self._rooms.get(group_id, [])
                for ws in dead:
                    if ws in room:
                        room.remove(ws)


# Singleton shared across the app
manager = ConnectionManager()
