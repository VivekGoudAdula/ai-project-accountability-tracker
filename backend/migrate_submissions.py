"""
Migration: Add class_section, lg_number, status columns to submissions table.
Run from backend/ directory: python migrate_submissions.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def run():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # Add class_section if missing
        try:
            conn.execute(text("ALTER TABLE submissions ADD COLUMN class_section VARCHAR(20)"))
            print("✅ Added class_section")
        except Exception as e:
            print(f"   class_section already exists or error.")

        # Add lg_number if missing
        try:
            conn.execute(text("ALTER TABLE submissions ADD COLUMN lg_number INTEGER"))
            print("✅ Added lg_number")
        except Exception as e:
            print(f"   lg_number already exists or error.")

        # Add status if missing
        try:
            conn.execute(text("ALTER TABLE submissions ADD COLUMN status VARCHAR(20) DEFAULT 'Submitted'"))
            print("✅ Added status")
        except Exception as e:
            print(f"   status already exists or error.")
    print("\n✅ Migration complete.")

if __name__ == "__main__":
    run()
