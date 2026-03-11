from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    roll_number = Column(String)
    class_section = Column(String)
    lg_number = Column(Integer)
    skills = Column(Text)
    availability = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    class_section = Column(String(20))
    lg_number = Column(Integer)
    is_leader = Column(Boolean, default=False)

class TeamProject(Base):
    __tablename__ = "team_projects"
    id = Column(Integer, primary_key=True, index=True)
    class_section = Column(String(20))
    lg_number = Column(Integer)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(Text)
    description = Column(Text)
    leader_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

# Keep these for now if they are used elsewhere, but we might need to migrate them
class PhaseTask(Base):
    __tablename__ = "phase_tasks"
    id = Column(Integer, primary_key=True, index=True)
    class_section = Column(String(20))
    lg_number = Column(Integer)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    phase = Column(String, nullable=False)
    member_id = Column(Integer, ForeignKey("users.id"))
    task = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    class_section = Column(String(20))
    lg_number = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    phase = Column(String, nullable=False)
    file_path = Column(String)
    github_link = Column(String)
    tasks_done = Column(Text)
    hours_spent = Column(Integer)
    ai_score = Column(Integer)
    ai_feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
