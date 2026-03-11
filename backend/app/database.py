import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from ROOT .env
dotenv_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(dotenv_path)

# Fallback: also load local if it exists
load_dotenv()

# Change to YOUR database URL or keep local default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Vivvi#2405@localhost:5432/ai_tracker")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
