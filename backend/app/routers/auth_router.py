from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new student.
    Password is stored as-is (plain text). Email must be unique.
    Returns the created user profile including their user_id.
    """
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=user_in.password,   # stored plain — no hashing
        roll_number=user_in.roll_number,
        class_section=user_in.class_section,
        lg_number=user_in.lg_number,
        skills=user_in.skills,
        availability=user_in.availability,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login with email + password.
    Returns the user object and their user_id.
    Use the returned user_id as ?user_id= on all protected endpoints.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.password_hash != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return {
        "message": "Login successful",
        "user": user,
    }
