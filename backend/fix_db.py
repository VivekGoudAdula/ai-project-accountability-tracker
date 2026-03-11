from app.database import engine, Base, SessionLocal
from app.models import Subject
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def fix_db():
    print("Dropping all tables to ensure clean schema...")
    with engine.connect() as conn:
        # Drop all tables in correct order
        conn.execute(text("DROP TABLE IF EXISTS submissions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS phase_tasks CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS team_projects CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS team_members CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS subjects CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS projects CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS teams CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.commit()
        print("Done dropping.")

    print("Recreating all tables from models...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Inserting initial subjects...")
        subjects = [
            'Prompt Engineering',
            'NLP',
            'Software Engineering',
            'XAI',
            'Data Warehousing and Data Mining'
        ]
        for name in subjects:
            subject = Subject(name=name)
            db.add(subject)
        db.commit()
        print("Subjects inserted successfully.")
    except Exception as e:
        print(f"Error inserting subjects: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
