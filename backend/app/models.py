from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(Text, nullable=False)
    roll_number = Column(String(50), nullable=True)
    class_section = Column(String(20), nullable=True)
    lg_number = Column(Integer, nullable=True)
    skills = Column(Text, nullable=True)
    availability = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    team_membership = relationship("TeamMember", back_populates="user", uselist=False)

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    class_section = Column(String(20), nullable=False)
    lg_number = Column(Integer, nullable=False)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    members = relationship("TeamMember", back_populates="team")
    projects = relationship("Project", back_populates="team")
    leader = relationship("User")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_membership")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    title = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    team = relationship("Team", back_populates="projects")

class PhaseTask(Base):
    __tablename__ = "phase_tasks"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    phase = Column(String(50), nullable=False)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task = Column(Text, nullable=False)

    # Relationships
    team = relationship("Team")
    member = relationship("User")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    phase = Column(String(50), nullable=False)

    file_path = Column(Text, nullable=True)
    github_link = Column(Text, nullable=True)

    tasks_done = Column(Text, nullable=True)
    hours_spent = Column(Integer, nullable=True)

    ai_score = Column(Integer, nullable=True)
    ai_feedback = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    team = relationship("Team")
    user = relationship("User")
