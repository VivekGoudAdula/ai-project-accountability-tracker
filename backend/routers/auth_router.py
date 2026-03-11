import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Team, TeamMember, Project
from app.schemas import UserSignup, UserLogin

router = APIRouter()

@router.post("/register")
def register(user_data: UserSignup, db: Session = Depends(get_db)):
    # 1. Validate email domain
    if not user_data.email.endswith("aurora.edu.in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email must end with aurora.edu.in"
        )

    # 2. Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    # 3. Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password, 
        roll_number=user_data.roll_number,
        class_section=user_data.class_section,
        lg_number=user_data.lg_number,
        skills=user_data.skills,
        availability=user_data.availability
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Team Formation Logic
    if new_user.class_section and new_user.lg_number:
        # Check how many users in this LG
        lg_users = db.query(User).filter(
            User.class_section == new_user.class_section,
            User.lg_number == new_user.lg_number
        ).all()

        if len(lg_users) == 3:
            # Check if team already exists for this LG
            existing_team = db.query(Team).filter(
                Team.class_section == new_user.class_section,
                Team.lg_number == new_user.lg_number
            ).first()

            if not existing_team:
                # Randomly select leader
                leader = random.choice(lg_users)
                
                # Create team
                new_team = Team(
                    class_section=new_user.class_section,
                    lg_number=new_user.lg_number,
                    leader_id=leader.id
                )
                db.add(new_team)
                db.commit()
                db.refresh(new_team)

                # Add members to team_members table
                for u in lg_users:
                    tm = TeamMember(team_id=new_team.id, user_id=u.id)
                    db.add(tm)
                
                # Auto Create 5 Subject Workspaces
                subjects = [
                    "Prompt Engineering",
                    "NLP",
                    "Software Engineering",
                    "XAI",
                    "Data Warehousing and Data Mining"
                ]
                for sub in subjects:
                    proj = Project(team_id=new_team.id, subject=sub)
                    db.add(proj)
                
                db.commit()

    return {"message": "User registered successfully"}

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # 1. Search user in database
    user = db.query(User).filter(User.email == login_data.email).first()

    # 2. If email not found
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email"
        )

    # 3. If password incorrect (Plain text compare)
    if user.password != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # 4. Return user data
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "class_section": user.class_section,
            "lg_number": user.lg_number
        }
    }
