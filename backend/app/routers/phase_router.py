from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember, TeamProject, PhaseTask, Submission, Subject
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
    subject_id: int, 
    db: Session = Depends(get_db)
):
    # 1. Get current phase
    phase = get_current_phase()
    if not phase:
        return []

    # 2. Get user's LG info
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="User not assigned to a team")
    
    # 3. Check if tasks already exist for this LG, subject and phase
    tasks = db.query(PhaseTask).filter(
        PhaseTask.class_section == membership.class_section,
        PhaseTask.lg_number == membership.lg_number,
        PhaseTask.subject_id == subject_id,
        PhaseTask.phase == phase
    ).all()

    if not tasks:
        # 4. Trigger AI task division if tasks don't exist
        project = db.query(TeamProject).filter(
            TeamProject.class_section == membership.class_section,
            TeamProject.lg_number == membership.lg_number,
            TeamProject.subject_id == subject_id
        ).first()
        
        if not project:
            # We skip task division if project not initialized
            return []

        # Get all team members
        members = db.query(TeamMember).filter(
            TeamMember.class_section == membership.class_section,
            TeamMember.lg_number == membership.lg_number
        ).all()
        
        # Call AI engine
        try:
            divided_tasks = divide_tasks_for_phase(
                phase=phase,
                project_description=project.description or ""
            )
            
            # Store tasks mapping member_id to task
            for i, member in enumerate(members):
                task_key = f"member{i+1}_task"
                task_text = divided_tasks.get(task_key, "Contribute to project phase")
                
                new_task = PhaseTask(
                    class_section=membership.class_section,
                    lg_number=membership.lg_number,
                    subject_id=subject_id,
                    phase=phase,
                    member_id=member.user_id,
                    task=task_text
                )
                db.add(new_task)
            
            db.commit()
            
            # Re-fetch tasks
            tasks = db.query(PhaseTask).filter(
                PhaseTask.class_section == membership.class_section,
                PhaseTask.lg_number == membership.lg_number,
                PhaseTask.subject_id == subject_id,
                PhaseTask.phase == phase
            ).all()
        except Exception as e:
            print(f"Error in task division: {e}")
            return []

    # Convert to TaskOut schema
    return [TaskOut(id=t.id, phase=t.phase, member_id=t.member_id, task=t.task) for t in tasks]

@router.post("/submission/create")
async def create_submission(
    class_section: str = Form(...),
    lg_number: int = Form(...),
    user_id: int = Form(...),
    subject_id: int = Form(...),
    phase: str = Form(...),
    tasks_done: str = Form(...),
    hours_spent: int = Form(...),
    github_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    file_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{class_section}_{lg_number}_{phase}_{user_id}{file_ext}"
        destination = os.path.join(UPLOAD_DIR, filename)
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = destination

    # 2. AI Evaluation
    ai_score = 0
    ai_feedback = ""
    
    try:
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

    except Exception as e:
        print(f"Error in evaluation: {e}")
        ai_feedback = "Evaluation failed. Please contact admin."

    # 3. Create submission record
    submission = Submission(
        class_section=class_section,
        lg_number=lg_number,
        user_id=user_id,
        subject_id=subject_id,
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
    class_section: str,
    lg_number: int,
    subject_id: int,
    db: Session = Depends(get_db)
):
    submissions = db.query(Submission).filter(
        Submission.class_section == class_section,
        Submission.lg_number == lg_number,
        Submission.subject_id == subject_id
    ).order_by(Submission.created_at.desc()).all()
    
    results = []
    for s in submissions:
        results.append(SubmissionOut(
            id=s.id,
            class_section=s.class_section,
            lg_number=s.lg_number,
            user_id=s.user_id,
            subject_id=s.subject_id,
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
