from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember, TeamProject, PhaseTask, Submission, Subject
from app.schemas import TaskOut, SubmissionOut
from app.services.phase_engine import get_current_phase, is_submission_open, get_phase_info, PHASES
from app.services.task_division_engine import divide_phase_tasks
from app.services.github_analysis import get_commit_counts
from app.services.ai_evaluator import evaluate_student_submission, generate_team_summary
from typing import Optional, List, Dict, Any
import os
import shutil
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/phase/current/{subject_id}", response_model=Dict[str, Any])
def get_current_phase_info(subject_id: int, user_id: int, db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
         raise HTTPException(status_code=404, detail="User not assigned to a team")
    
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    if not project:
        return {
            "phase_index": 0,
            "current_phase": "Project Setup",
            "submission_open": False,
            "phase_map": {i: name for i, name in enumerate(PHASES)}
        }
        
    return get_phase_info(project)

@router.get("/tasks", response_model=List[TaskOut])
def get_tasks(
    user_id: int, 
    subject_id: int, 
    db: Session = Depends(get_db)
):
    # 1. Get user's LG info
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="User not assigned to a team")
    
    # 2. Get project to find current phase
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    if not project:
        return []
        
    phase = get_current_phase(project)
    
    # 3. Check if tasks already exist for this LG, subject and phase
    tasks = db.query(PhaseTask).filter(
        PhaseTask.class_section == membership.class_section,
        PhaseTask.lg_number == membership.lg_number,
        PhaseTask.subject_id == subject_id,
        PhaseTask.phase == phase
    ).all()

    if not tasks:
        # Get all team members and their names
        team_members = db.query(User).join(TeamMember).filter(
            TeamMember.class_section == membership.class_section,
            TeamMember.lg_number == membership.lg_number
        ).all()
        
        member_names = [m.name for m in team_members]
        member_ids = [m.id for m in team_members]
        
        # Call AI engine
        try:
            divided_tasks = divide_phase_tasks(
                phase=phase,
                members=member_names
            )
            
            # Store tasks
            for i, m_id in enumerate(member_ids):
                task_key = f"member{i+1}_task"
                task_text = divided_tasks.get(task_key, "Contribute to project phase")
                
                new_task = PhaseTask(
                    subject_id=subject_id,
                    class_section=membership.class_section,
                    lg_number=membership.lg_number,
                    phase=phase,
                    member_id=m_id,
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

    return [TaskOut(id=t.id, phase=t.phase, member_id=t.member_id, task=t.task) for t in tasks]

@router.post("/submission/create")
async def create_submission(
    user_id: int = Form(...),
    subject_id: int = Form(...),
    phase: str = Form(...),
    description: str = Form(...),
    github_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not is_submission_open():
        raise HTTPException(status_code=400, detail="Submission deadline passed or window closed.")

    # 1. Save File if present
    file_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{user_id}_{subject_id}_{phase}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
        destination = os.path.join(UPLOAD_DIR, filename)
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = destination

    # 2. Fetch GitHub data if link is provided
    commit_data = {}
    if github_link:
        commit_data = get_commit_counts(github_link)

    # 3. AI Evaluation
    evaluation = evaluate_student_submission(
        phase=phase,
        description=description,
        commit_data=commit_data
    )

    # 4. Create submission record
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    new_submission = Submission(
        user_id=user_id,
        subject_id=subject_id,
        phase=phase,
        week_number=project.current_phase_index,
        file_path=file_path,
        github_link=github_link,
        description=description,
        ai_score=evaluation.get("score", 0),
        ai_feedback=evaluation.get("feedback", "")
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return {"message": "Submission successful", "submission": new_submission}

@router.get("/project/{subject_id}/evaluation")
def get_evaluation_details(subject_id: int, user_id: int, db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team_members = db.query(User).join(TeamMember).filter(
        TeamMember.class_section == membership.class_section,
        TeamMember.lg_number == membership.lg_number
    ).all()
    
    member_names = {m.id: m.name for m in team_members}
    
    submissions = db.query(Submission).filter(
        Submission.subject_id == subject_id,
        Submission.user_id.in_(member_names.keys())
    ).all()
    
    # Calculate contribution summary
    contribution_summary = {}
    commit_summary = {}
    
    for m_id, name in member_names.items():
        m_subs = [s for s in submissions if s.user_id == m_id]
        avg_score = sum(s.ai_score for s in m_subs) / len(m_subs) if m_subs else 0
        contribution_summary[name] = round(avg_score, 1)
        commit_summary[name] = 0
        
    # Get phase performance
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    phase_performance = []
    for i, p_name in enumerate(PHASES):
        if i < project.current_phase_index:
            phase_performance.append({"phase": p_name, "status": "Completed"})
        elif i == project.current_phase_index:
            phase_performance.append({"phase": p_name, "status": "Current"})
        else:
            phase_performance.append({"phase": p_name, "status": "Upcoming"})

    # Fetch total commits per user if Implementation phase submission exists
    impl_submission = db.query(Submission).filter(
        Submission.subject_id == subject_id,
        Submission.phase == "Implementation",
        Submission.github_link.isnot(None)
    ).first()
    
    if impl_submission:
        commit_counts = get_commit_counts(impl_submission.github_link)
        for name in member_names.values():
            commit_summary[name] = commit_counts.get(name.split()[0].lower(), commit_counts.get(name, 0))

    # AI Summary
    phase_data = [
        {"phase": s.phase, "student": member_names.get(s.user_id), "score": s.ai_score}
        for s in submissions
    ]
    ai_summary_res = generate_team_summary(phase_data, list(member_names.values()))

    return {
        "contribution_summary": contribution_summary,
        "commit_summary": commit_summary,
        "phase_performance": phase_performance,
        "ai_summary": ai_summary_res.get("summary", "No summary generated.")
    }

@router.get("/submission/history")
def get_submission_history(
    user_id: int,
    subject_id: int,
    db: Session = Depends(get_db)
):
    submissions = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.subject_id == subject_id
    ).order_by(Submission.created_at.desc()).all()
    
    return submissions
