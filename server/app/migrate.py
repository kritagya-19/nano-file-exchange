"""
Database migration script to add new columns and tables for file upload features.
Run this once to update the existing database schema.

Usage:
  cd server
  python -m app.migrate
"""
import pymysql
from app.config import settings


def run_migration():
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    cursor = conn.cursor()

    migrations = [
        # Create folders table
        """
        CREATE TABLE IF NOT EXISTS folders (
            folder_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """,
        # Add is_favorite column to files
        """
        ALTER TABLE files ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE
        """,
        # Add share_token column to files
        """
        ALTER TABLE files ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE DEFAULT NULL
        """,
        # Add folder_id column to files
        """
        ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id INT DEFAULT NULL
        """,
    ]

    # Try adding foreign key for folder_id separately
    fk_migration = """
        ALTER TABLE files ADD CONSTRAINT fk_files_folder 
        FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE SET NULL
    """

    for sql in migrations:
        try:
            cursor.execute(sql)
            print(f"✓ Executed: {sql.strip()[:60]}...")
        except Exception as e:
            # Column/table may already exist
            print(f"⚠ Skipped (may already exist): {str(e)[:80]}")

    try:
        cursor.execute(fk_migration)
        print(f"✓ Added foreign key constraint for folder_id")
    except Exception as e:
        print(f"⚠ FK constraint skipped (may already exist): {str(e)[:80]}")

    conn.commit()
    cursor.close()
    conn.close()
    print("\n✅ Migration complete!")


if __name__ == "__main__":
    run_migration()
