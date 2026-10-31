"""CivicVoice Flask API.

Six public endpoints back the existing Next.js frontend:

    GET    /api/health
    GET    /api/complaints
    POST   /api/complaints
    GET    /api/complaints/reference/<reference_number>
    PATCH  /api/complaints/<complaint_id>/status
    GET    /api/statistics
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

import db
from sentiment import analyze_sentiment

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _error(code: str, message: str, status: int, fields: dict | None = None):
    payload = {"error": {"code": code, "message": message}}
    if fields:
        payload["error"]["fields"] = fields
    return jsonify(payload), status


def _required_text(
    data: dict,
    field: str,
    label: str,
    min_length: int,
    max_length: int,
) -> tuple[str | None, str | None]:
    value = data.get(field)
    if not isinstance(value, str):
        return None, f"{label} is required."
    value = value.strip()
    if len(value) < min_length:
        return None, f"{label} must be at least {min_length} characters."
    if len(value) > max_length:
        return None, f"{label} must be {max_length} characters or fewer."
    return value, None


def _optional_text(
    data: dict,
    field: str,
    label: str,
    max_length: int,
    default: str | None = None,
) -> tuple[str | None, str | None]:
    value = data.get(field, default)
    if value is None:
        return None, None
    if not isinstance(value, str):
        return None, f"{label} must be text."
    value = value.strip()
    if len(value) > max_length:
        return None, f"{label} must be {max_length} characters or fewer."
    return value or None, None


def create_app() -> Flask:
    app = Flask(__name__)
    app.json.sort_keys = False
    app.secret_key = os.getenv("SECRET_KEY") or os.urandom(32)

    origins = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
        ).split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": origins, "supports_credentials": True}})

    @app.get("/api/health")
    def health():
        if db.check_database():
            return jsonify({"status": "ok", "database": "ok"})
        return jsonify({"status": "degraded", "database": "unavailable"}), 503

    @app.get("/api/complaints")
    def list_complaints():
        status = request.args.get("status", "").strip() or None
        category = request.args.get("category", "").strip() or None
        search = request.args.get("search", "").strip() or None
        sort = request.args.get("sort", "newest").strip().lower()

        if status and status not in db.STATUSES:
            return _error("validation_error", "Unknown status filter.", 400)
        if category and category not in db.CATEGORIES:
            return _error("validation_error", "Unknown category filter.", 400)
        if sort not in {"newest", "oldest"}:
            return _error("validation_error", "sort must be 'newest' or 'oldest'.", 400)
        if search and len(search) > 100:
            return _error("validation_error", "Search must be 100 characters or fewer.", 400)

        complaints = db.list_complaints(
            status=status,
            category=category,
            search=search,
            sort=sort,
        )
        return jsonify({"complaints": complaints, "count": len(complaints)})

    def _current_user():
        user_id = session.get("user_id")
        if not user_id:
            return None
        return db.get_user_by_id(user_id)

    def _require_admin():
        user = _current_user()
        if not user:
            return None, _error("unauthorized", "Authentication required.", 401)
        if user.get("role") != "ADMIN":
            return None, _error("forbidden", "Admin access required.", 403)
        return user, None

    @app.post("/api/auth/login")
    def login():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return _error("invalid_json", "Request body must be a JSON object.", 400)
        username = data.get("username", "").strip()
        password = data.get("password", "")
        if not username or not password:
            return _error("validation_error", "Username and password are required.", 400)
        user = db.get_user_by_username(username)
        if not user or not check_password_hash(user.get("password_hash", ""), password):
            return _error("invalid_credentials", "Invalid username or password.", 401)
        session["user_id"] = user["id"]
        session["role"] = user["role"]
        return jsonify({"user": {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]}})

    @app.post("/api/auth/logout")
    def logout():
        session.clear()
        return jsonify({"ok": True})

    @app.get("/api/auth/me")
    def me():
        user = _current_user()
        if not user:
            return jsonify({"user": None})
        return jsonify({"user": {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]}})

    @app.post("/api/complaints")
    def create_complaint():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return _error("invalid_json", "Request body must be a JSON object.", 400)

        errors: dict[str, str] = {}
        title, title_error = _required_text(data, "title", "Title", 5, 100)
        if title_error:
            errors["title"] = title_error
        description, description_error = _required_text(
            data, "description", "Description", 20, 2000
        )
        if description_error:
            errors["description"] = description_error
        location, location_error = _required_text(
            data, "location", "Location", 3, 150
        )
        if location_error:
            errors["location"] = location_error

        category = data.get("category")
        if not isinstance(category, str) or not category.strip():
            errors["category"] = "Category is required."
        elif category.strip() not in db.CATEGORIES:
            errors["category"] = "Choose a valid category."

        if errors:
            return _error(
                "validation_error",
                "Please correct the highlighted fields.",
                400,
                errors,
            )

        sentiment_label, sentiment_score = analyze_sentiment(description)
        complaint = db.create_complaint(
            title=title,
            description=description,
            category=category.strip(),
            location=location,
            sentiment_label=sentiment_label,
            sentiment_score=sentiment_score,
        )
        return jsonify({"complaint": complaint}), 201

    @app.get("/api/complaints/reference/<reference_number>")
    def get_complaint_by_reference(reference_number: str):
        complaint = db.get_complaint_by_reference(reference_number)
        if not complaint:
            return _error(
                "not_found",
                "No complaint was found with that reference number.",
                404,
            )
        return jsonify({"complaint": complaint})

    @app.patch("/api/complaints/<int:complaint_id>/status")
    def update_status(complaint_id: int):
        user, err = _require_admin()
        if err:
            return err
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return _error("invalid_json", "Request body must be a JSON object.", 400)

        errors: dict[str, str] = {}
        status = data.get("status")
        if not isinstance(status, str) or not status.strip():
            errors["status"] = "Status is required."
        elif status.strip() not in db.STATUSES:
            errors["status"] = "Choose a valid status."

        note, note_error = _optional_text(data, "note", "Note", 500)
        if note_error:
            errors["note"] = note_error

        if errors:
            return _error(
                "validation_error",
                "Please correct the highlighted fields.",
                400,
                errors,
            )

        complaint = db.update_complaint_status(
            complaint_id=complaint_id,
            status=status.strip(),
            note=note,
            updated_by=user.get("username") or "Admin",
        )
        if not complaint:
            return _error("not_found", "No complaint was found with that ID.", 404)
        return jsonify({"complaint": complaint})

    @app.get("/api/statistics")
    def statistics():
        return jsonify({"statistics": db.get_statistics()})

    @app.errorhandler(pymysql.MySQLError)
    def handle_database_error(_error_value):
        logger.exception("Database operation failed.")
        return _error(
            "database_unavailable",
            "The database is unavailable. Please check that MySQL is running.",
            503,
        )

    @app.errorhandler(404)
    def handle_not_found(_error_value):
        return _error("not_found", "The requested endpoint does not exist.", 404)

    @app.errorhandler(405)
    def handle_method_not_allowed(_error_value):
        return _error("method_not_allowed", "That method is not allowed here.", 405)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_ENV", "development") == "development",
    )
