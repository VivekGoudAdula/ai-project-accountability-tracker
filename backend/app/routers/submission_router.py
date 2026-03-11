import logging
import shutil
import os

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.phase_engine import (
    get_current_phase,
    get_week_number,
    is_submission_open,
)
from ..services.ai_prompt_engine import divide_tasks_for_phase, evaluate_submission
from ..services.github_analysis import analyze_github_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/submission", tags=["Submissions"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/create", response_model=schemas.SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    subject: str = Query(...),
    tasks_done: str = Query(...),
    hours_spent: float = Query(...),
    user_id: int = Query(..., description="Your user ID"),
    evidence_link: str = Query(None),
    github_repo_url: str = Query(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """
    Full submission data flow:

    1. Validate deadline (Sunday 23:59:59)
    2. Determine current phase via phase engine
    3. AI task division (Groq)
    4. AI evaluation of submission (Groq)
    5. GitHub analysis — Implementation phase only
    6. Persist all results to DB
    7. Return enriched submission record
    """
    # ── Validate User ─────────────────────────────────────────────────────────
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # ── Step 1: Deadline Check ────────────────────────────────────────────────
    if not is_submission_open():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Submission deadline has passed. Your score for this phase is 0.",
        )

    phase = get_current_phase()
    week = get_week_number()

    if not phase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active academic phase at this time.",
        )

    # ── Step 2: File Upload ───────────────────────────────────────────────────
    file_path = None
    if file and file.filename:
        safe_filename = f"{user_id}_{week}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # ── Step 3: AI Task Division ──────────────────────────────────────────────
    try:
        task_division = divide_tasks_for_phase(phase=phase)
        logger.info("Task division: %s", task_division)
    except Exception as e:
        logger.warning("Task division failed: %s", e)

    # ── Step 4: AI Evaluation ─────────────────────────────────────────────────
    ai_score = consistency_score = freeload_risk = None
    pattern = evaluation_summary = None
    try:
        evaluation = evaluate_submission(
            phase=phase,
            tasks_done=tasks_done,
            evidence_link=evidence_link,
            hours_spent=hours_spent,
        )
        ai_score = float(evaluation.get("contribution_score", 0))
        consistency_score = float(evaluation.get("consistency_score", 0))
        freeload_risk = float(evaluation.get("freeload_risk", 0))
        pattern = evaluation.get("pattern")
        evaluation_summary = evaluation.get("summary")
    except Exception as e:
        logger.warning("AI evaluation failed: %s", e)

    # ── Step 5: GitHub Analysis (Implementation only) ─────────────────────────
    if phase == "Implementation" and github_repo_url:
        try:
            github_data = analyze_github_repo(github_repo_url)
            logger.info("GitHub analysis: %s", github_data.get("analysis_summary"))
        except Exception as e:
            logger.warning("GitHub analysis failed: %s", e)

    # ── Step 6: Persist ───────────────────────────────────────────────────────
    submission = models.Submission(
        user_id=user_id,
        subject=subject,
        phase=phase,
        week_number=week,
        tasks_done=tasks_done,
        hours_spent=hours_spent,
        evidence_link=evidence_link,
        file_path=file_path,
        ai_score=ai_score,
        consistency_score=consistency_score,
        freeload_risk=freeload_risk,
        pattern=pattern,
        evaluation_summary=evaluation_summary,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/history", response_model=list[schemas.SubmissionOut])
def get_submission_history(
    user_id: int = Query(..., description="Your user ID"),
    db: Session = Depends(get_db),
):
    """
    Returns all submissions for a given user, newest first.
    """
    return (
        db.query(models.Submission)
        .filter(models.Submission.user_id == user_id)
        .order_by(models.Submission.created_at.desc())
        .all()
    )


@router.get("/tasks/{phase}")
def get_task_division(
    phase: str,
    project_description: str = Query(""),
    user_id: int = Query(..., description="Your user ID"),
    db: Session = Depends(get_db),
):
    """
    On-demand AI task division for a given phase.
    """
    try:
        result = divide_tasks_for_phase(phase=phase, project_description=project_description)
        return {"phase": phase, "task_division": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}",
        )
