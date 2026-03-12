from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import TeamProject, Submission
from app.services.phase_engine import PHASES

def check_phase_completion(db: Session, project: TeamProject):
    """
    Checks if a phase is complete either by 3 submissions or a 5-minute timer expiration.
    Returns a dict with 'new_phase', 'time_remaining' (in seconds), and 'is_completed' bool.
    """
    # If project is already at the last phase (Evaluation), just return it
    if project.current_phase_index >= len(PHASES) - 1:
        return {
            "new_phase": PHASES[-1],
            "time_remaining": 0,
            "is_completed": True
        }

    current_phase = PHASES[project.current_phase_index]
    
    # 1. Count submissions for current phase
    submission_count = db.query(Submission).filter(
        Submission.phase == current_phase,
        Submission.class_section == project.class_section,
        Submission.lg_number == project.lg_number,
        Submission.subject_id == project.subject_id
    ).count()

    # 2. Timer check (5 minutes = 300 seconds)
    start_time = project.phase_start_time
    if not start_time:
        start_time = project.created_at
        
    now = datetime.utcnow()
    time_elapsed = (now - start_time).total_seconds()
    time_remaining = max(0, int(300 - time_elapsed))

    # Move to next phase if either condition met
    if submission_count >= 3 or time_remaining <= 0:
        return {
            "new_phase": current_phase,
            "time_remaining": 0,
            "is_completed": True,
            "can_advance": True
        }

    return {
        "new_phase": current_phase,
        "time_remaining": time_remaining,
        "is_completed": False,
        "can_advance": False
    }

def move_to_next_phase(db: Session, project: TeamProject):
    """
    Increments phase index and resets the timer, returning the newly selected phase.
    """
    if project.current_phase_index < len(PHASES) - 1:
        project.current_phase_index += 1
        project.phase_start_time = datetime.utcnow()
        db.commit()
        db.refresh(project)
        
    new_phase = PHASES[project.current_phase_index]
    return {
        "new_phase": new_phase,
        "time_remaining": 300 if project.current_phase_index < len(PHASES) - 1 else 0, # Full 5m again
        "is_completed": True
    }
