from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


def current_user(x_user_id: int | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    # ponytail: mock auth. The frontend sends the chosen account id in X-User-Id.
    # Real auth = replace this one function with a session/JWT check.
    user = db.get(User, x_user_id) if x_user_id else None
    if not user:
        raise HTTPException(401, "Log in to continue")
    return user


def require_host(user: User = Depends(current_user)) -> User:
    if not user.is_host:
        raise HTTPException(403, "Only hosts can do this")
    return user
