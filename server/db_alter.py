import sys
import os
from sqlalchemy import create_engine, text

# add parent dir
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

def main():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE group_members ADD COLUMN status VARCHAR(50) DEFAULT 'approved'"))
            conn.commit()
            print("Successfully added status column.")
        except Exception as e:
            print("Error altering table:", e)

if __name__ == "__main__":
    main()
