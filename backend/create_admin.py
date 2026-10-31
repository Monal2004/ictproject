from __future__ import annotations

import argparse
import getpass
import os
from datetime import datetime, timezone
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin user for CivicVoice")
    parser.add_argument("--username", required=False)
    parser.add_argument("--email", required=False)
    parser.add_argument("--password", required=False)
    args = parser.parse_args()

    username = args.username or input("Admin username: ").strip()
    email = args.email or input("Admin email: ").strip()
    password = args.password or getpass.getpass("Admin password: ")
    if not password:
        raise SystemExit("Password is required")

    password_hash = generate_password_hash(password)
    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    conn = pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "civicvoice"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "civicvoice"),
        charset="utf8mb4",
        autocommit=False,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
                VALUES (%s, %s, %s, 'ADMIN', %s, %s)
                """,
                (username, email, password_hash, now, now),
            )
        conn.commit()
        print(f"Created admin user: {username} ({email})")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
