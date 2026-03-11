import random
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/project", tags=["Project"])


@router.post("/create", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: schemas.ProjectCreate,
    user_id: int = Query(..., description="Your user ID"),
    db: Session = Depends(get_db),
):
    """
    Create a new group project.

    Team Leader Selection:
      The system randomly selects a leader from all users sharing the same
      class_section + lg_number. Falls back to the requesting user if no
      peers are found.

    Prevents duplicate projects for the same section/LG/subject.
    """
    # Confirm the requesting user exists
    requesting_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not requesting_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Prevent duplicate project
    existing = db.query(models.Project).filter(
        models.Project.class_section == project_in.class_section,
        models.Project.lg_number == project_in.lg_number,
        models.Project.subject == project_in.subject,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project for this class, LG group, and subject already exists.",
        )

    # Pick a random leader from the peer group
    peers = (
        db.query(models.User)
        .filter(
            models.User.class_section == project_in.class_section,
            models.User.lg_number == project_in.lg_number,
        )
        .all()
    )
    leader = random.choice(peers) if peers else requesting_user

    project = models.Project(
        class_section=project_in.class_section,
        lg_number=project_in.lg_number,
        subject=project_in.subject,
        title=project_in.title,
        description=project_in.description,
        leader_id=leader.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/list", response_model=list[schemas.ProjectOut])
def list_projects(
    user_id: int = Query(..., description="Your user ID"),
    db: Session = Depends(get_db),
):
    """
    Returns all projects in the current user's class section and LG group.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return db.query(models.Project).filter(
        models.Project.class_section == user.class_section,
        models.Project.lg_number == user.lg_number,
    ).all()
