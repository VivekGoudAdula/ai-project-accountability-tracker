from fastapi import HTTPException, status, Query
from sqlalchemy.orm import Session
from . import models


# ─── Simple User Lookup ────────────────────────────────────────────────────────
# No JWT, no tokens. Protected routes identify the user via ?user_id= query param.

def get_current_user(
    user_id: int = Query(..., description="Your user ID (returned at login)"),
    db: Session = None,
) -> models.User:
    """
    Simple identity resolution: caller passes their user_id as a query parameter.
    The database is checked to confirm the user exists.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={user_id} not found.",
        )
    return user
