from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember, TeamProject, PhaseTask, Submission, Subject
from app.schemas import TaskOut, SubmissionOut
from app.services.phase_engine import get_current_phase, is_submission_open, get_phase_info, PHASES
from app.services.task_division_engine import divide_phase_tasks
from app.services.task_division_engine import divide_phase_tasks
from app.services.github_analysis import get_commit_counts, analyze_github_repo
from app.services.ai_evaluator import evaluate_student_submission, generate_team_summary
from app.services.phase_controller import check_phase_completion, move_to_next_phase
from app.services.vision_service import analyze_image_content
from typing import Optional, List, Dict, Any
import os
import shutil
import json
from datetime import datetime
import PyPDF2

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
            "phase_map": {i: name for i, name in enumerate(PHASES)},
            "time_remaining": 0,
            "can_advance": False
        }
    
    # Check if we should advance the phase dynamically based on submissions/time
    completion_data = check_phase_completion(db, project)
    
    base_info = get_phase_info(project)
    
    if completion_data:
        base_info["current_phase"] = completion_data["new_phase"]
        base_info["time_remaining"] = completion_data["time_remaining"]
        base_info["can_advance"] = completion_data.get("can_advance", False)
    else:
        base_info["time_remaining"] = 300 # Default fallback if error
        base_info["can_advance"] = False
        
    return base_info

@router.post("/phase/advance/{subject_id}")
def advance_project_phase(subject_id: int, user_id: int, db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
         raise HTTPException(status_code=404, detail="User not assigned to a team")
    
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    completion_data = check_phase_completion(db, project)
    if completion_data.get("can_advance"):
        result = move_to_next_phase(db, project)
        return {"message": "Phase advanced successfully", "new_phase": result["new_phase"]}
    else:
        raise HTTPException(status_code=400, detail="Phase cannot be advanced yet")

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
    files: List[UploadFile] = File([]), # Changed to support multiple files
    db: Session = Depends(get_db)
):
    if not is_submission_open():
        raise HTTPException(status_code=400, detail="Submission deadline passed or window closed.")

    # 1. Save Files if present
    file_paths = []
    for i, file in enumerate(files):
        file_ext = os.path.splitext(file.filename)[1]
        # Generate a perfectly safe filename without the original file's name to avoid OS errors
        safe_filename = f"{user_id}_{subject_id}_{phase}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{i}{file_ext}"
        destination = os.path.join(UPLOAD_DIR, safe_filename)
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_paths.append(destination)
    
    file_paths_str = ",".join(file_paths) if file_paths else None

    # 2. Fetch GitHub data if link is provided
    github_context = "No GitHub link provided."
    commit_data = {}
    if github_link:
        if phase == "Implementation":
            github_data = analyze_github_repo(github_link)
            if "error" not in github_data:
                github_context = github_data.get("analysis_summary", "")
                # Add recent commit messages for more deep analysis
                recent_commits = github_data.get("recent_commits", [])
                if recent_commits:
                    github_context += "\n\nRecent Commit Messages:\n"
                    for c in recent_commits[:10]:
                        github_context += f"- {c['message']} (by {c['author']})\n"
                commit_data = {c['login']: c['contributions'] for c in github_data.get('contributors', [])}
            else:
                github_context = f"Error analyzing GitHub link: {github_data['error']}"
        else:
            commit_data = get_commit_counts(github_link)
            github_context = f"GitHub Commit Counts: {json.dumps(commit_data)}"

    # 3. Fetch project context 
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    
    class_section = None
    lg_number = None
    week_number = 0 # Default if no project found
    project_title = "Unknown Project"
    
    if membership:
        class_section = membership.class_section
        lg_number = membership.lg_number
        project = db.query(TeamProject).filter(
            TeamProject.class_section == class_section,
            TeamProject.lg_number == lg_number,
            TeamProject.subject_id == subject_id
        ).first()
        if project:
            week_number = project.current_phase_index
            project_title = project.title or "Unknown Project"

    # 4. Extract PDF text for context (e.g., Literature Survey)
    extracted_chunks = []
    for fp in file_paths:
        if fp.lower().endswith(".pdf"):
            try:
                with open(fp, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages[:10]: # read up to first 10 pages per PDF
                        text_content = page.extract_text()
                        if isinstance(text_content, str):
                            extracted_chunks.append(text_content)
            except Exception as e:
                print(f"Failed to read PDF {fp}: {e}")
                
    # Cap extracted text length to stay within token limits
    extracted_text = "\n".join(extracted_chunks)[:12000]
    
    # 5. Image Content Analysis (Actually seeing what's inside)
    image_contents = []
    for fp in file_paths:
        ext = fp.lower().split('.')[-1]
        if ext in ['jpg', 'jpeg', 'png', 'webp']:
            content_labels = analyze_image_content(fp)
            image_contents.append(f"File: {os.path.basename(fp)} contains: {content_labels}")

    # original file names context
    file_names_str = ", ".join([f.filename for f in files]) if files else "No files uploaded"
    image_context = "\n".join(image_contents) if image_contents else "No images provided for visual analysis."

    # 6. AI Evaluation
    evaluation = evaluate_student_submission(
        phase=phase,
        description=f"User description: {description}\n\nUploaded Files: {file_names_str}\n\nVisual Analysis of Images:\n{image_context}\n\nGitHub Activity Context:\n{github_context}",
        commit_data=commit_data,
        project_title=project_title,
        extracted_text=extracted_text
    )

    # 7. Create submission record
    new_submission = Submission(
        user_id=user_id,
        subject_id=subject_id,
        phase=phase,
        class_section=class_section, # Added
        lg_number=lg_number,         # Added
        week_number=week_number,
        file_path=file_paths_str,     # Updated to handle multiple paths
        github_link=github_link,
        description=description,
        ai_score=evaluation.get("score", 0),
        ai_feedback=evaluation.get("feedback", ""),
        status="Submitted"            # Added
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    # Automatically check phase completion after submission
    if project:
        check_phase_completion(db, project)

    # Return serialized dict with score instead of full ORM object 
    return {
        "message": "Submission stored successfully",
        "submission": {
            "id": new_submission.id,
            "phase": new_submission.phase,
            "status": new_submission.status,
            "ai_score": new_submission.ai_score,
            "ai_feedback": new_submission.ai_feedback,
            "created_at": str(new_submission.created_at)
        }
    }

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

@router.get("/submission/team-status")
def get_team_submission_status(subject_id: int, user_id: int, db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
        
    project = db.query(TeamProject).filter(
        TeamProject.class_section == membership.class_section,
        TeamProject.lg_number == membership.lg_number,
        TeamProject.subject_id == subject_id
    ).first()
    
    if not project:
        return []
        
    current_phase = PHASES[project.current_phase_index]
    if current_phase == "Evaluation":
        return []

    # Get team members
    team_members = db.query(User).join(TeamMember).filter(
        TeamMember.class_section == membership.class_section,
        TeamMember.lg_number == membership.lg_number
    ).all()
    
    # Get submissions for this phase
    submissions = db.query(Submission).filter(
        Submission.subject_id == subject_id,
        Submission.class_section == membership.class_section,
        Submission.lg_number == membership.lg_number,
        Submission.phase == current_phase
    ).all()
    
    submitted_user_ids = {s.user_id for s in submissions}
    
    status_list = []
    for member in team_members:
        status_list.append({
            "id": member.id,
            "name": member.name,
            "submitted": member.id in submitted_user_ids
        })
        
    return status_list

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
