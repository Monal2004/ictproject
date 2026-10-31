"""API tests for CivicVoice.

Run from backend/ with:
    $env:DB_NAME = "civicvoice_test"
    python -m unittest discover -s tests -v

The suite refuses to touch a database whose name does not end in "_test".
"""

from __future__ import annotations

import os
import re
import unittest

os.environ["DB_NAME"] = "civicvoice_test"

import db  # noqa: E402
from app import app  # noqa: E402


def valid_payload(**overrides):
    payload = {
        "title": "Overflowing bin near the market",
        "description": (
            "The public bin has not been collected for four days and waste "
            "is spreading onto the footpath."
        ),
        "category": "Waste and sanitation",
        "location": "Market Road, Ward 4",
    }
    payload.update(overrides)
    return payload


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not db.get_connection.__module__:
            raise RuntimeError("Database layer did not load.")
        if not os.environ.get("DB_NAME", "").endswith("_test"):
            raise RuntimeError("Refusing to run: DB_NAME must end in '_test'.")
        cls.app = app
        cls.client = app.test_client()
        from werkzeug.security import generate_password_hash
        from datetime import datetime, timezone
        import pymysql
        conn = db.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM users WHERE username = %s", ("testadmin",))
                now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)
                cur.execute(
                    "INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES (%s,%s,%s,'ADMIN',%s,%s)",
                    ("testadmin", "testadmin@test.com", generate_password_hash("testpass"), now, now),
                )
            conn.commit()
        finally:
            conn.close()

    def setUp(self):
        connection = db.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                cursor.execute("TRUNCATE TABLE status_history")
                cursor.execute("TRUNCATE TABLE complaints")
                cursor.execute("TRUNCATE TABLE complaint_counters")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            connection.commit()
        finally:
            connection.close()
        self.client.post("/api/auth/login", json={"username": "testadmin", "password": "testpass"})

    def create(self, **overrides):
        response = self.client.post("/api/complaints", json=valid_payload(**overrides))
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["complaint"]

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok", "database": "ok"})

    def test_create_valid_complaint(self):
        complaint = self.create()
        self.assertEqual(complaint["status"], "Submitted")
        self.assertRegex(complaint["reference_number"], r"^CV-\d{4}-\d{5}$")
        self.assertIn(complaint["sentiment_label"], {"positive", "neutral", "negative"})
        self.assertIsNotNone(complaint["sentiment_score"])
        self.assertEqual(len(complaint["status_history"]), 1)
        self.assertEqual(complaint["status_history"][0]["status"], "Submitted")
        self.assertEqual(complaint["status_history"][0]["updated_by"], "Citizen")

    def test_create_validation(self):
        response = self.client.post("/api/complaints", json={})
        self.assertEqual(response.status_code, 400)
        body = response.get_json()
        self.assertEqual(body["error"]["code"], "validation_error")
        self.assertEqual(
            set(body["error"]["fields"]),
            {"title", "description", "location", "category"},
        )

        short = self.client.post(
            "/api/complaints",
            json=valid_payload(title="Bad", description="Too short", location="X"),
        )
        self.assertEqual(short.status_code, 400)
        self.assertIn("title", short.get_json()["error"]["fields"])
        self.assertIn("description", short.get_json()["error"]["fields"])
        self.assertIn("location", short.get_json()["error"]["fields"])

    def test_invalid_category(self):
        response = self.client.post(
            "/api/complaints", json=valid_payload(category="Not a category")
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("category", response.get_json()["error"]["fields"])

    def test_malformed_json(self):
        response = self.client.post(
            "/api/complaints",
            data="this is not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "invalid_json")

    def test_references_are_unique_and_sequential(self):
        first = self.create()
        second = self.create(title="A second complaint about the same bin")
        self.assertNotEqual(first["reference_number"], second["reference_number"])
        self.assertTrue(first["reference_number"].endswith("00001"))
        self.assertTrue(second["reference_number"].endswith("00002"))

    def test_list_newest_first_and_count(self):
        first = self.create()
        second = self.create(title="A newer complaint about a streetlight")
        response = self.client.get("/api/complaints")
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["count"], 2)
        self.assertEqual(body["complaints"][0]["id"], second["id"])
        self.assertEqual(body["complaints"][1]["id"], first["id"])

    def test_list_filters_and_search(self):
        first = self.create()
        second = self.create(
            title="Dark streetlight outside the hall",
            description=(
                "The streetlight outside the community hall has been dark for "
                "three nights and the path is unsafe."
            ),
            category="Streetlights and electricity",
            location="Community Hall Road",
        )

        by_category = self.client.get(
            "/api/complaints", query_string={"category": "Streetlights and electricity"}
        )
        self.assertEqual([c["id"] for c in by_category.get_json()["complaints"]], [second["id"]])

        by_status = self.client.get(
            "/api/complaints", query_string={"status": "Submitted"}
        )
        self.assertEqual(by_status.get_json()["count"], 2)

        self.client.patch(
            f"/api/complaints/{second['id']}/status",
            json={"status": "Resolved", "note": "Fixed."},
        )
        by_status = self.client.get(
            "/api/complaints", query_string={"status": "Resolved"}
        )
        self.assertEqual([c["id"] for c in by_status.get_json()["complaints"]], [second["id"]])

        for term in [
            first["reference_number"].lower(),
            "overflowing",
            "footpath",
            "market road",
        ]:
            response = self.client.get("/api/complaints", query_string={"search": term})
            self.assertEqual(response.status_code, 200, term)
            self.assertEqual(response.get_json()["count"], 1, term)
            self.assertEqual(response.get_json()["complaints"][0]["id"], first["id"])

    def test_sort_oldest(self):
        first = self.create()
        second = self.create(title="A newer complaint about a streetlight")
        response = self.client.get("/api/complaints", query_string={"sort": "oldest"})
        self.assertEqual(
            [c["id"] for c in response.get_json()["complaints"]],
            [first["id"], second["id"]],
        )

    def test_invalid_filters_and_sort(self):
        for query in [
            {"status": "Unknown"},
            {"category": "Unknown"},
            {"sort": "sideways"},
        ]:
            response = self.client.get("/api/complaints", query_string=query)
            self.assertEqual(response.status_code, 400, query)

    def test_reference_lookup_is_case_insensitive(self):
        complaint = self.create()
        reference = complaint["reference_number"]
        response = self.client.get(f"/api/complaints/reference/{reference.lower()}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["complaint"]["id"], complaint["id"])

        missing = self.client.get("/api/complaints/reference/CV-2026-99999")
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.get_json()["error"]["code"], "not_found")

    def test_status_update_appends_history(self):
        complaint = self.create()
        response = self.client.patch(
            f"/api/complaints/{complaint['id']}/status",
            json={
                "status": "Under Review",
                "note": "Forwarded to the ward office.",
                "updated_by": "Admin (demo)",
            },
        )
        self.assertEqual(response.status_code, 200, response.get_json())
        updated = response.get_json()["complaint"]
        self.assertEqual(updated["status"], "Under Review")
        self.assertEqual(len(updated["status_history"]), 2)
        self.assertEqual(updated["status_history"][-1]["status"], "Under Review")
        self.assertEqual(
            updated["status_history"][-1]["note"],
            "Forwarded to the ward office.",
        )

        same = self.client.patch(
            f"/api/complaints/{complaint['id']}/status",
            json={"status": "Under Review"},
        )
        self.assertEqual(same.status_code, 200)
        self.assertEqual(len(same.get_json()["complaint"]["status_history"]), 3)

    def test_status_validation_and_missing_complaint(self):
        complaint = self.create()
        invalid = self.client.patch(
            f"/api/complaints/{complaint['id']}/status",
            json={"status": "Lost"},
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("status", invalid.get_json()["error"]["fields"])

        missing = self.client.patch(
            "/api/complaints/999999/status", json={"status": "Resolved"}
        )
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.get_json()["error"]["code"], "not_found")

    def test_statistics_are_zero_filled_and_count_sentiment(self):
        first = self.create()
        second = self.create(
            title="Dark streetlight outside the hall",
            description=(
                "The streetlight outside the community hall has been dark for "
                "three nights and the path is unsafe."
            ),
            category="Streetlights and electricity",
            location="Community Hall Road",
        )
        self.client.patch(
            f"/api/complaints/{first['id']}/status",
            json={"status": "Resolved"},
        )

        response = self.client.get("/api/statistics")
        self.assertEqual(response.status_code, 200)
        stats = response.get_json()["statistics"]
        self.assertEqual(stats["total"], 2)
        self.assertEqual(stats["by_status"]["Resolved"], 1)
        self.assertEqual(stats["by_status"]["Closed"], 0)
        self.assertEqual(set(stats["by_status"]), set(db.STATUSES))
        self.assertEqual(set(stats["by_category"]), set(db.CATEGORIES))
        self.assertEqual(stats["by_category"]["Waste and sanitation"], 1)
        self.assertEqual(stats["by_category"]["Streetlights and electricity"], 1)
        self.assertEqual(
            sum(stats["by_sentiment"].values()),
            2,
        )
        self.assertEqual(
            set(stats["by_sentiment"]),
            {"positive", "neutral", "negative", "unavailable"},
        )

    def test_cors_preflight(self):
        response = self.client.options(
            "/api/complaints",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:3000",
        )
        self.assertIn("POST", response.headers.get("Access-Control-Allow-Methods", ""))

    def test_error_envelope_has_no_secrets(self):
        response = self.client.get("/api/complaints/reference/CV-2026-99999")
        body = response.get_json()
        self.assertNotIn("password", str(body).lower())
        self.assertNotIn("traceback", str(body).lower())
        self.assertIsInstance(body["error"]["message"], str)


if __name__ == "__main__":
    unittest.main()
