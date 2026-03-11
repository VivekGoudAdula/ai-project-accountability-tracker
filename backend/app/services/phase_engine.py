from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

# Ordered Phase List
PHASES: List[str] = [
    "Literature Survey",
    "Project Design",
    "Implementation",
    "Project Report",
    "Presentation",
    "Evaluation"
]

def get_current_phase(project) -> str:
    """
    Returns the current phase name based on the project's phase index.
    """
    if project.current_phase_index < len(PHASES):
        return PHASES[project.current_phase_index]
    return PHASES[-1] # Default to Evaluation if somehow exceeded

def is_submission_open() -> bool:
    """
    Submissions are open until Sunday 11:59 PM.
    """
    now = datetime.now(tz=timezone.utc)
    # ISO weekday: 1=Mon, 7=Sun
    if now.isoweekday() < 7:
        return True
    
    # It is Sunday
    if now.hour < 23:
        return True
    if now.hour == 23 and now.minute <= 59:
        return True
        
    return False

def get_phase_info(project) -> dict:
    """
    Returns phase info for a specific project.
    """
    phase_name = get_current_phase(project)
    
    # Map phases for the timeline
    phase_map = {i: name for i, name in enumerate(PHASES)}
    
    return {
        "phase_index": project.current_phase_index,
        "current_phase": phase_name,
        "submission_open": is_submission_open() if phase_name != "Evaluation" else False,
        "phase_map": phase_map
    }

def update_projects_phase(db_session):
    """
    Logic to be run to auto-progress phases.
    Increments current_phase_index for all projects if deadline passed (Sunday midnight).
    Normally run via a scheduler or check.
    """
    from app.models import TeamProject
    
    # In a real scenario, this would be triggered at Monday 00:00:00
    # For now, we provide the logic to increment.
    projects = db_session.query(TeamProject).all()
    for project in projects:
        if project.current_phase_index < len(PHASES) - 1:
            project.current_phase_index += 1
    db_session.commit()
