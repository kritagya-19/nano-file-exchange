from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_id(
    token_user_id: int = Security(verify_token),
    db: Session = Depends(get_db),
):
    """
    Resolve user id from token and validate the account still exists and is active.
    This ensures deleted/blocked users lose access immediately even with old JWTs.
    """
    user = db.get(User, token_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="User account is inactive")
    return token_user_id
