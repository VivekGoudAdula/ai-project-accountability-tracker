import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

# Set up database engine
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def run():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        try:
            conn.execute(text("ALTER TABLE team_projects ADD COLUMN phase_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            print("✅ Added phase_start_time to team_projects")
        except Exception as e:
            print(f"   phase_start_time already exists or error.")

        # Set default for existing projects
        try:
            conn.execute(text("UPDATE team_projects SET phase_start_time = CURRENT_TIMESTAMP WHERE phase_start_time IS NULL"))
        except Exception as e:
            pass

    print("\n✅ Migration complete.")

if __name__ == "__main__":
    run()
