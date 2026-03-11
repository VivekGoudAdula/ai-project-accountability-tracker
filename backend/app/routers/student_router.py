from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.phase_engine import get_current_phase, is_submission_open, get_week_number

router = APIRouter(prefix="/api/student", tags=["Student"])


@router.get("/dashboard", response_model=schemas.DashboardOut)
def get_dashboard(
    user_id: int = Query(..., description="Your user ID"),
    db: Session = Depends(get_db),
):
    """
    Returns the student's dashboard:
    - Personal profile
    - Current academic phase and week
    - Whether submissions are currently open
    - All past submissions with AI scores
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    submissions = (
        db.query(models.Submission)
        .filter(models.Submission.user_id == user_id)
        .order_by(models.Submission.created_at.desc())
        .all()
    )

    return {
        "user": user,
        "current_phase": get_current_phase() or "Out of phase window",
        "week_number": get_week_number(),
        "submission_open": is_submission_open(),
        "submissions": submissions,
    }
