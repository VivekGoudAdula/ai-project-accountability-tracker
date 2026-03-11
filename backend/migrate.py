"""
Comprehensive schema migration - run once to fix missing columns.
Safe to re-run (IF NOT EXISTS).
"""
from app.database import engine
from sqlalchemy import text

migrations = [
    # team_projects
    "ALTER TABLE team_projects ADD COLUMN IF NOT EXISTS current_phase_index INTEGER DEFAULT 0;",
    # submissions
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS week_number INTEGER;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_path TEXT;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS github_link TEXT;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS description TEXT;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_feedback TEXT;",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS phase VARCHAR(50);",
    # phase_tasks
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS subject_id INTEGER;",
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS class_section VARCHAR(20);",
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS lg_number INTEGER;",
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS phase VARCHAR(50);",
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS member_id INTEGER;",
    "ALTER TABLE phase_tasks ADD COLUMN IF NOT EXISTS task TEXT;",
]

with engine.connect() as conn:
    for sql in migrations:
        print(f"  {sql[:65]}...")
        conn.execute(text(sql))
    conn.commit()

print("\n✅ All migrations applied!")
