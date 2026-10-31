"""MySQL data access for CivicVoice.

The module keeps SQL in one place and returns dictionaries that the Flask routes
can serialize directly. All queries use parameter placeholders.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

logger = logging.getLogger(__name__)

CATEGORIES = [
    "Roads and footpaths",
    "Waste and sanitation",
    "Water supply",
    "Drainage and flooding",
    "Streetlights and electricity",
    "Public transportation",
    "Parks and public spaces",
    "Public buildings and facilities",
    "Traffic safety",
    "Trees and greenery",
    "Encroachments and obstructions",
    "Other municipal services",
]

STATUSES = [
    "Submitted",
    "Under Review",
    "Assigned",
    "In Progress",
    "Resolved",
    "Closed",
]

SENTIMENT_KEYS = ["positive", "neutral", "negative", "unavailable"]


def get_connection():
    """Open a new MySQL connection using environment settings."""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "civicvoice"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "civicvoice"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
        connect_timeout=5,
    )


def get_user_by_username(username: str):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            return cursor.fetchone()
    finally:
        connection.close()


def get_user_by_id(user_id: int):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email, role FROM users WHERE id = %s", (user_id,))
            return cursor.fetchone()
    finally:
        connection.close()


def check_database() -> bool:
    """Return True if MySQL answers a simple query."""
    try:
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 AS ok")
                cursor.fetchone()
        finally:
            connection.close()
        return True
    except Exception:
        logger.warning("Database health check failed.", exc_info=True)
        return False


def _utc_now() -> datetime:
    """Return a naive UTC datetime for MySQL DATETIME columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def _iso_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _history_item(row: dict) -> dict:
    return {
        "status": row["status"],
        "timestamp": _iso_utc(row["changed_at"]),
        "note": row["note"],
        "updated_by": row["updated_by"],
    }


def _complaint(row: dict, history: list[dict]) -> dict:
    score = row["sentiment_score"]
    return {
        "id": int(row["id"]),
        "reference_number": row["reference_number"],
        "title": row["title"],
        "description": row["description"],
        "category": row["category"],
        "location": row["location"],
        "status": row["status"],
        "sentiment_label": row["sentiment_label"],
        "sentiment_score": float(score) if score is not None else None,
        "created_at": _iso_utc(row["created_at"]),
        "updated_at": _iso_utc(row["updated_at"]),
        "status_history": history,
    }


def _history_for(cursor, complaint_id: int) -> list[dict]:
    cursor.execute(
        """
        SELECT status, changed_at, note, updated_by
        FROM status_history
        WHERE complaint_id = %s
        ORDER BY changed_at ASC, id ASC
        """,
        (complaint_id,),
    )
    return [_history_item(row) for row in cursor.fetchall()]


def _histories_for(cursor, complaint_ids: list[int]) -> dict[int, list[dict]]:
    if not complaint_ids:
        return {}
    placeholders = ", ".join(["%s"] * len(complaint_ids))
    cursor.execute(
        f"""
        SELECT complaint_id, status, changed_at, note, updated_by
        FROM status_history
        WHERE complaint_id IN ({placeholders})
        ORDER BY complaint_id ASC, changed_at ASC, id ASC
        """,
        complaint_ids,
    )
    grouped: dict[int, list[dict]] = {complaint_id: [] for complaint_id in complaint_ids}
    for row in cursor.fetchall():
        grouped[int(row["complaint_id"])].append(_history_item(row))
    return grouped


def create_complaint(
    title: str,
    description: str,
    category: str,
    location: str,
    sentiment_label: str | None,
    sentiment_score: float | None,
) -> dict:
    """Create a complaint and return its full representation.

    The reference counter is locked inside the same transaction as the insert.
    A unique database constraint is the final duplicate safeguard.
    """
    year = datetime.now(timezone.utc).year

    for attempt in range(3):
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO complaint_counters (counter_year, last_number)
                    VALUES (%s, 0)
                    ON DUPLICATE KEY UPDATE last_number = last_number
                    """,
                    (year,),
                )
                cursor.execute(
                    "SELECT last_number FROM complaint_counters WHERE counter_year = %s FOR UPDATE",
                    (year,),
                )
                last_number = int(cursor.fetchone()["last_number"]) + 1
                cursor.execute(
                    "UPDATE complaint_counters SET last_number = %s WHERE counter_year = %s",
                    (last_number, year),
                )

                reference_number = f"CV-{year}-{last_number:05d}"
                now = _utc_now()
                cursor.execute(
                    """
                    INSERT INTO complaints (
                        reference_number, title, description, category, location,
                        status, sentiment_label, sentiment_score, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        reference_number,
                        title,
                        description,
                        category,
                        location,
                        "Submitted",
                        sentiment_label,
                        sentiment_score,
                        now,
                        now,
                    ),
                )
                complaint_id = int(cursor.lastrowid)
                cursor.execute(
                    """
                    INSERT INTO status_history
                        (complaint_id, status, note, updated_by, changed_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        complaint_id,
                        "Submitted",
                        "Complaint submitted by citizen.",
                        "Citizen",
                        now,
                    ),
                )
            connection.commit()
        except pymysql.err.IntegrityError as exc:
            connection.rollback()
            # 1062 = duplicate key. Retry with a fresh counter value.
            if exc.args and exc.args[0] == 1062 and attempt < 2:
                continue
            raise
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

        return get_complaint_by_id(complaint_id)

    raise RuntimeError("Could not generate a unique complaint reference.")


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_complaints(
    status: str | None = None,
    category: str | None = None,
    search: str | None = None,
    sort: str = "newest",
) -> list[dict]:
    where = []
    params: list[str] = []

    if status:
        where.append("status = %s")
        params.append(status)
    if category:
        where.append("category = %s")
        params.append(category)
    if search:
        pattern = f"%{_escape_like(search)}%"
        where.append(
            "(reference_number LIKE %s OR title LIKE %s OR description LIKE %s OR location LIKE %s)"
        )
        params.extend([pattern, pattern, pattern, pattern])

    order = "ASC" if sort == "oldest" else "DESC"
    sql = "SELECT * FROM complaints"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += f" ORDER BY created_at {order}, id {order}"

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            if not rows:
                return []
            ids = [int(row["id"]) for row in rows]
            histories = _histories_for(cursor, ids)
            return [_complaint(row, histories.get(int(row["id"]), [])) for row in rows]
    finally:
        connection.close()


def get_complaint_by_id(complaint_id: int) -> dict | None:
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM complaints WHERE id = %s", (complaint_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return _complaint(row, _history_for(cursor, int(row["id"])))
    finally:
        connection.close()


def get_complaint_by_reference(reference_number: str) -> dict | None:
    reference_number = reference_number.strip().upper()
    if not reference_number:
        return None
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM complaints WHERE reference_number = %s",
                (reference_number,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return _complaint(row, _history_for(cursor, int(row["id"])))
    finally:
        connection.close()


def update_complaint_status(
    complaint_id: int,
    status: str,
    note: str | None,
    updated_by: str,
) -> dict | None:
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM complaints WHERE id = %s FOR UPDATE",
                (complaint_id,),
            )
            if not cursor.fetchone():
                connection.rollback()
                return None

            now = _utc_now()
            cursor.execute(
                "UPDATE complaints SET status = %s, updated_at = %s WHERE id = %s",
                (status, now, complaint_id),
            )
            cursor.execute(
                """
                INSERT INTO status_history
                    (complaint_id, status, note, updated_by, changed_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (complaint_id, status, note, updated_by, now),
            )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return get_complaint_by_id(complaint_id)


def get_statistics() -> dict:
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM complaints")
            total = int(cursor.fetchone()["total"])

            by_status = {status: 0 for status in STATUSES}
            cursor.execute("SELECT status, COUNT(*) AS count FROM complaints GROUP BY status")
            for row in cursor.fetchall():
                if row["status"] in by_status:
                    by_status[row["status"]] = int(row["count"])

            by_category = {category: 0 for category in CATEGORIES}
            cursor.execute("SELECT category, COUNT(*) AS count FROM complaints GROUP BY category")
            for row in cursor.fetchall():
                if row["category"] in by_category:
                    by_category[row["category"]] = int(row["count"])

            by_sentiment = {key: 0 for key in SENTIMENT_KEYS}
            cursor.execute(
                """
                SELECT COALESCE(sentiment_label, 'unavailable') AS label, COUNT(*) AS count
                FROM complaints
                GROUP BY COALESCE(sentiment_label, 'unavailable')
                """
            )
            for row in cursor.fetchall():
                if row["label"] in by_sentiment:
                    by_sentiment[row["label"]] = int(row["count"])

            return {
                "total": total,
                "by_status": by_status,
                "by_category": by_category,
                "by_sentiment": by_sentiment,
            }
    finally:
        connection.close()
