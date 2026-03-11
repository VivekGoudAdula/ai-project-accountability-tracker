from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Team, TeamMember, Project, PhaseTask, Submission
from app.schemas import PhaseInfo, TaskOut, SubmissionOut
from app.services.phase_engine import get_phase_info, get_current_phase
from app.services.ai_prompt_engine import divide_tasks_for_phase, evaluate_submission
from app.services.github_analysis import analyze_github_repo
from typing import Optional, List
import os
import shutil
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/phase/current", response_model=PhaseInfo)
def get_current_phase_info():
    return get_phase_info()

@router.get("/tasks", response_model=List[TaskOut])
def get_tasks(
    user_id: int, 
    subject: str, 
    db: Session = Depends(get_db)
):
    # 1. Get current phase
    phase = get_current_phase()
    if not phase:
        return []

    # 2. Get user's team
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="User not assigned to a team")
    
    team_id = membership.team_id

    # 3. Check if tasks already exist for this team, subject and phase
    tasks = db.query(PhaseTask).filter(
        PhaseTask.team_id == team_id,
        PhaseTask.subject == subject,
        PhaseTask.phase == phase
    ).all()

    if not tasks:
        # 4. Trigger AI task division if tasks don't exist
        project = db.query(Project).filter(
            Project.team_id == team_id,
            Project.subject == subject
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not initialized")

        # Get all team members
        members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
        if len(members) < 3:
            # Maybe not enough members yet, but we'll try to divide anyway or wait
            pass
        
        # Call AI engine
        try:
            divided_tasks = divide_tasks_for_phase(
                phase=phase,
                project_description=project.description or ""
            )
            
            # Store tasks mapping member_id to task
            # Assuming 3 members as per requirements
            for i, member in enumerate(members):
                task_key = f"member{i+1}_task"
                task_text = divided_tasks.get(task_key, "Contribute to project phase")
                
                new_task = PhaseTask(
                    team_id=team_id,
                    subject=subject,
                    phase=phase,
                    member_id=member.user_id,
                    task=task_text
                )
                db.add(new_task)
            
            db.commit()
            
            # Re-fetch tasks
            tasks = db.query(PhaseTask).filter(
                PhaseTask.team_id == team_id,
                PhaseTask.subject == subject,
                PhaseTask.phase == phase
            ).all()
        except Exception as e:
            print(f"Error in task division: {e}")
            return []

    return tasks

@router.post("/submission/create")
async def create_submission(
    team_id: int = Form(...),
    user_id: int = Form(...),
    subject: str = Form(...),
    phase: str = Form(...),
    tasks_done: str = Form(...),
    hours_spent: int = Form(...),
    github_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Check if submission is open (handled by phase engine logic in service)
    # For now, we trust the phase passed or re-verify
    
    file_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{team_id}_{phase}_{user_id}{file_ext}"
        destination = os.path.join(UPLOAD_DIR, filename)
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = destination

    # 2. AI Evaluation
    ai_score = 0
    ai_feedback = ""
    
    try:
        # If it's implementation phase and github link is provided, analyze it
        github_summary = ""
        if phase == "Implementation" and github_link:
            analysis = analyze_github_repo(github_link)
            github_summary = analysis.get("analysis_summary", "")
        
        # Evaluate with AI
        evidence = github_link if phase == "Implementation" else file_path
        evaluation = evaluate_submission(
            phase=phase,
            tasks_done=tasks_done,
            evidence_link=evidence,
            hours_spent=float(hours_spent)
        )
        
        ai_score = evaluation.get("contribution_score", 0)
        feedback_text = evaluation.get("feedback", "")
        risk = evaluation.get("freeload_risk", "Low")
        
        ai_feedback = f"Evaluation: {feedback_text}\nRisk Level: {risk}"
        if github_summary:
            ai_feedback = f"GitHub Analysis:\n{github_summary}\n\n{ai_feedback}"

    except Exception as e:
        print(f"Error in evaluation: {e}")
        ai_feedback = "Evaluation failed. Please contact admin."

    # 3. Create submission record
    submission = Submission(
        team_id=team_id,
        user_id=user_id,
        subject=subject,
        phase=phase,
        file_path=file_path,
        github_link=github_link,
        tasks_done=tasks_done,
        hours_spent=hours_spent,
        ai_score=ai_score,
        ai_feedback=ai_feedback
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {"message": "Submission successful", "submission_id": submission.id}

@router.get("/submission/history", response_model=List[SubmissionOut])
def get_submission_history(
    team_id: int,
    subject: str,
    db: Session = Depends(get_db)
):
    submissions = db.query(Submission).filter(
        Submission.team_id == team_id,
        Submission.subject == subject
    ).order_by(Submission.created_at.desc()).all()
    
    # Convert to schema compatible format (string datetime)
    results = []
    for s in submissions:
        results.append(SubmissionOut(
            id=s.id,
            team_id=s.team_id,
            user_id=s.user_id,
            subject=s.subject,
            phase=s.phase,
            file_path=s.file_path,
            github_link=s.github_link,
            tasks_done=s.tasks_done,
            hours_spent=s.hours_spent,
            ai_score=s.ai_score,
            ai_feedback=s.ai_feedback,
            created_at=s.created_at.isoformat() if s.created_at else ""
        ))
    return results
