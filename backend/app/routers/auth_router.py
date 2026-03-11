import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember
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

    # 3. LG Team Formation Validation
    if user_data.class_section and user_data.lg_number:
        # Check count of users already in this LG
        member_count = db.query(TeamMember).filter(
            TeamMember.class_section == user_data.class_section,
            TeamMember.lg_number == user_data.lg_number
        ).count()

        if member_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LG already full"
            )

    # 4. Create new user
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

    # 5. Insert into team_members
    if new_user.class_section and new_user.lg_number:
        new_member = TeamMember(
            user_id=new_user.id,
            class_section=new_user.class_section,
            lg_number=new_user.lg_number
        )
        db.add(new_member)
        db.commit()

        # 6. Check if LG now has 3 members to assign leader
        lg_members = db.query(TeamMember).filter(
            TeamMember.class_section == new_user.class_section,
            TeamMember.lg_number == new_user.lg_number
        ).all()

        if len(lg_members) == 3:
            # Check if leader already assigned (shouldn't be)
            leader_exists = any(m.is_leader for m in lg_members)
            if not leader_exists:
                leader = random.choice(lg_members)
                leader.is_leader = True
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
