import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Name must be at most 100 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must include one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must include one number")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]", v):
            raise ValueError("Password must include one special character")
        return v


class DeleteAccountRequest(BaseModel):
    password: str
