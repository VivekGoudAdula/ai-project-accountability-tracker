from app.database import engine, Base, SessionLocal
from app.models import Subject
import sys
import os

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if subjects already exist
        if db.query(Subject).count() == 0:
            print("Inserting subjects...")
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
        else:
            print("Subjects already exist.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
