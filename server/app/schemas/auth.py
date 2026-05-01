from pydantic import BaseModel


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user_id: int
    name: str
    email: str
    message: str = "Success"


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    status: str
