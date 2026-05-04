from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "nano"
    DB_PASSWORD: str = "nano123"
    DB_NAME: str = "nano_exchange"

    # JWT
    SECRET_KEY: str  # REQUIRED: must be set in .env — no default to prevent accidental weak keys
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # File storage
    UPLOAD_DIR: str = "uploads"

    # Email (SMTP) for invitations
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    # Frontend URL for invitation links
    FRONTEND_URL: str = "http://localhost:5173"

    # Direct Database URL (useful for PaaS like Aiven/Render)
    DB_URL: str | None = None

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_URL:
            return self.DB_URL
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"


settings = Settings()
