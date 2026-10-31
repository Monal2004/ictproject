# CivicVoice — API Specification

**Version:** 2.1.0  
**Phase:** 3 — Flask API  
**Status:** Approved — React frontend retained  
**Base URL:** `http://127.0.0.1:5000/api`  
**Stack:** Flask · MySQL 8.x · VADER · PyMySQL  
**Authentication:** None (development MVP only)

> **Change note (v2.1.0):** The React/Next.js frontend is retained. The API contract is unchanged in scope but now serves the existing React service layer. The details route uses a complaint reference rather than an internal numeric ID, so no extra endpoint is needed.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Format | JSON for requests and responses |
| Encoding | UTF-8 |
| Field names | `snake_case` in the API; mapped to `camelCase` in the React service |
| Dates | UTC ISO 8601, e.g. `2026-10-24T09:15:00Z` |
| IDs | `complaints.id` is a positive integer |
| References | `CV-YYYY-NNNNN`, e.g. `CV-2026-00001` |
| Content type | `application/json` for POST/PATCH bodies |
| CORS | Allowed origins come from `CORS_ORIGINS` |
| Errors | `{"error": {"code": "...", "message": "...", "fields": {...}}}` |
| Pagination | Not implemented in this MVP |

Requests with unknown JSON fields are accepted; only the documented fields are read.

---

## 2. Data Objects

### 2.1 Complaint object

Every endpoint that returns a complaint uses this shape:

```json
{
  "id": 1,
  "reference_number": "CV-2026-00001",
  "title": "Overflowing bin near the market",
  "description": "The public bin has not been collected for four days and waste is spreading onto the footpath.",
  "category": "Waste and sanitation",
  "location": "Market Road, Ward 4",
  "status": "Submitted",
  "sentiment_label": "negative",
  "sentiment_score": -0.4215,
  "created_at": "2026-10-24T09:15:00Z",
  "updated_at": "2026-10-24T09:15:00Z",
  "status_history": [
    {
      "status": "Submitted",
      "timestamp": "2026-10-24T09:15:00Z",
      "note": "Complaint submitted by citizen.",
      "updated_by": "Citizen"
    }
  ]
}
```

Notes:

- `sentiment_label` is `positive`, `neutral`, `negative`, or `null`.
- `sentiment_score` is the VADER compound score rounded to four decimal places, or `null`.
- `status_history` is ordered oldest first.
- The database column for a history timestamp is `changed_at`; the API exposes it as `timestamp`.
- `updated_at` changes on every status update.

### 2.2 Status values

`Submitted`, `Under Review`, `Assigned`, `In Progress`, `Resolved`, `Closed`

### 2.3 Category values

`Roads and footpaths`, `Waste and sanitation`, `Water supply`, `Drainage and flooding`, `Streetlights and electricity`, `Public transportation`, `Parks and public spaces`, `Public buildings and facilities`, `Traffic safety`, `Trees and greenery`, `Encroachments and obstructions`, `Other municipal services`

---

## 3. Endpoints

### 3.1 Health check

**`GET /api/health`**

Checks that Flask is running and MySQL is reachable.

**Success — `200 OK`**

```json
{
  "status": "ok",
  "database": "ok"
}
```

**Database unavailable — `503 Service Unavailable`**

```json
{
  "status": "degraded",
  "database": "unavailable"
}
```

No credentials or raw database errors are returned.

---

### 3.2 Create a complaint

**`POST /api/complaints`**

Creates a complaint, analyzes the description with VADER, generates a database-backed reference number, inserts the initial `Submitted` history row, and returns the stored complaint.

**Request body**

```json
{
  "title": "Overflowing bin near the market",
  "description": "The public bin has not been collected for four days and waste is spreading onto the footpath.",
  "category": "Waste and sanitation",
  "location": "Market Road, Ward 4"
}
```

The server supplies `reference_number`, `status`, `sentiment_label`, `sentiment_score`, timestamps, and the initial history entry. Values supplied by the client for those fields are ignored.

**Validation**

| Field | Rule |
|---|---|
| `title` | Required; trimmed; 5–100 characters |
| `description` | Required; trimmed; 20–2000 characters |
| `category` | Required; one of the twelve categories |
| `location` | Required; trimmed; 3–150 characters |

Whitespace-only values are invalid.

**Success — `201 Created`**

```json
{
  "complaint": {
    "id": 1,
    "reference_number": "CV-2026-00001",
    "status": "Submitted",
    "sentiment_label": "negative",
    "sentiment_score": -0.4215,
    "status_history": [
      {
        "status": "Submitted",
        "timestamp": "2026-10-24T09:15:00Z",
        "note": "Complaint submitted by citizen.",
        "updated_by": "Citizen"
      }
    ]
  }
}
```

The full object also includes all fields from section 2.1.

**Validation failure — `400 Bad Request`**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "description": "Description must be at least 20 characters.",
      "category": "Choose a valid category."
    }
  }
}
```

**Malformed JSON — `400 Bad Request`**

```json
{
  "error": {
    "code": "invalid_json",
    "message": "Request body must be a JSON object."
  }
}
```

Sentiment analysis failure must not reject the complaint. The complaint is saved with `sentiment_label: null` and `sentiment_score: null`.

---

### 3.3 List, search, filter, and sort complaints

**`GET /api/complaints`**

**Query parameters**

| Parameter | Required | Values | Meaning |
|---|---|---|---|
| `status` | No | One of the six statuses | Exact status filter |
| `category` | No | One of the twelve categories | Exact category filter |
| `search` | No | Text, up to 100 characters | Case-insensitive search across reference, title, description, and location |
| `sort` | No | `newest` (default) or `oldest` | Sort by `created_at` |

An empty query returns all complaints, newest first. There is no pagination.

**Success — `200 OK`**

```json
{
  "complaints": [
    {
      "id": 2,
      "reference_number": "CV-2026-00002",
      "title": "Streetlight not working",
      "description": "The streetlight outside the community hall has been dark for three nights.",
      "category": "Streetlights and electricity",
      "location": "Community Hall Road",
      "status": "Under Review",
      "sentiment_label": "negative",
      "sentiment_score": -0.3182,
      "created_at": "2026-10-24T10:00:00Z",
      "updated_at": "2026-10-24T11:30:00Z",
      "status_history": []
    }
  ],
  "count": 1
}
```

If no records match, return `{"complaints": [], "count": 0}` with `200 OK`.

**Invalid filter — `400 Bad Request`**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Unknown status filter."
  }
}
```

An invalid category, invalid `sort`, or overlong search also returns `400`.

Search is a literal substring match after trimming; leading/trailing whitespace is ignored. SQL wildcard characters typed by the user are escaped so they are treated as ordinary text.

---

### 3.4 Find a complaint by reference

**`GET /api/complaints/reference/<reference_number>`**

The reference is matched case-insensitively and trimmed. Example:

```text
GET /api/complaints/reference/CV-2026-00001
```

**Success — `200 OK`**

```json
{
  "complaint": {
    "id": 1,
    "reference_number": "CV-2026-00001"
  }
}
```

The full object includes all fields from section 2.1, including its complete status history.

**Not found — `404 Not Found`**

```json
{
  "error": {
    "code": "not_found",
    "message": "No complaint was found with that reference number."
  }
}
```

---

### 3.5 Update complaint status

**`PATCH /api/complaints/<complaint_id>/status`**

`complaint_id` is the internal integer ID returned by the list or create endpoint.

**Request body**

```json
{
  "status": "Under Review",
  "note": "Forwarded to the ward office.",
  "updated_by": "Admin (demo)"
}
```

| Field | Rule |
|---|---|
| `status` | Required; one of the six statuses |
| `note` | Optional; trimmed; maximum 500 characters; empty becomes `null` |
| `updated_by` | Optional; trimmed; maximum 100 characters; defaults to `Admin (demo)` |

Any status may transition to any other status, including the same status. Each successful update appends a history entry, even when the status value is unchanged.

**Success — `200 OK`**

```json
{
  "complaint": {
    "id": 1,
    "status": "Under Review",
    "updated_at": "2026-10-24T11:30:00Z"
  }
}
```

The full object includes all fields from section 2.1. The new history entry is the last item in `status_history`.

**Validation failure — `400 Bad Request`**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "status": "Choose a valid status."
    }
  }
}
```

**Complaint not found — `404 Not Found`**

```json
{
  "error": {
    "code": "not_found",
    "message": "No complaint was found with that ID."
  }
}
```

No authentication or role check is performed in this development version.

---

### 3.6 Dashboard statistics

**`GET /api/statistics`**

Returns counts calculated directly from MySQL.

**Success — `200 OK`**

```json
{
  "statistics": {
    "total": 5,
    "by_status": {
      "Submitted": 2,
      "Under Review": 1,
      "Assigned": 1,
      "In Progress": 0,
      "Resolved": 1,
      "Closed": 0
    },
    "by_category": {
      "Roads and footpaths": 2,
      "Waste and sanitation": 1,
      "Water supply": 1,
      "Drainage and flooding": 0,
      "Streetlights and electricity": 1,
      "Public transportation": 0,
      "Parks and public spaces": 0,
      "Public buildings and facilities": 0,
      "Traffic safety": 0,
      "Trees and greenery": 0,
      "Encroachments and obstructions": 0,
      "Other municipal services": 0
    },
    "by_sentiment": {
      "positive": 0,
      "neutral": 1,
      "negative": 3,
      "unavailable": 1
    }
  }
}
```

Every status and category key is present with `0` when no records match.

`unavailable` counts complaints whose `sentiment_label` is `NULL`.

The frontend derives the dashboard summary cards from `by_status`:

- active = `Submitted` + `Under Review` + `Assigned` + `In Progress`
- resolved = `Resolved`
- closed = `Closed`

Recurring-issue combinations are **not** returned by this endpoint. The React service calculates them from the complaint list, grouped by category + normalized location (trim, lowercase, collapse repeated spaces), counting only groups with at least two complaints.

---

## 4. Error Summary

| Status | When | Body |
|---|---|---|
| `400` | Invalid field, invalid filter/sort, malformed JSON | `{"error": {"code": "...", "message": "...", "fields": {...}}}` |
| `404` | Unknown complaint ID or reference, unknown endpoint | `{"error": {"code": "not_found", "message": "..."}}` |
| `405` | Wrong HTTP method | `{"error": {"code": "method_not_allowed", "message": "..."}}` |
| `500` | Unexpected server error | `{"error": {"code": "internal_error", "message": "..."}}` |
| `503` | Database unavailable | `{"error": {"code": "database_unavailable", "message": "..."}}` or health response |

The backend must not expose stack traces, SQL statements, passwords, or connection strings.

---

## 5. Reference Number Generation

Reference numbers are database-backed:

1. Start a transaction.
2. Ensure a row exists in `complaint_counters` for the current UTC year.
3. Lock that row with `SELECT ... FOR UPDATE`.
4. Increment `last_number`.
5. Format the reference as `CV-<year>-<number padded to 5 digits>`.
6. Insert the complaint; the `UNIQUE` constraint on `reference_number` is the final safeguard.
7. Insert the initial `Submitted` history row in the same transaction.
8. Commit.
9. If a duplicate-key error occurs, retry the generate/insert sequence a small number of times.

This works across Flask restarts and multiple workers; it is not an in-memory counter. A new year starts at `00001` because counters are per year.

---

## 6. Validation and Sentiment Rules

### 6.1 Text handling

- Trim leading/trailing whitespace before validation and storage.
- Reject whitespace-only required fields.
- Store plain text; React renders it as text (React escapes HTML automatically).
- `description` may contain line breaks, which the UI should preserve.

### 6.2 Sentiment

Use `vaderSentiment.SentimentIntensityAnalyzer`:

```text
compound = analyzer.polarity_scores(description)["compound"]

if compound >= 0.05:  label = "positive"
elif compound <= -0.05: label = "negative"
else: label = "neutral"
```

- Round the stored score to four decimal places.
- Run sentiment only on create.
- Catch all analysis exceptions, log a warning, and store `NULL`/`NULL`.
- The UI must state: “Sentiment reflects the wording of the complaint, not its severity or whether it is true.”

---

## 7. CORS

Use `Flask-Cors` only for `/api/*`.

Environment variable:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

- Split on commas, trim whitespace, and ignore empty entries.
- Allowed methods: `GET`, `POST`, `PATCH`, `OPTIONS`.
- Do not enable credentials.
- If the Next.js frontend is served from a different port, update `.env` and restart Flask.

---

## 8. Database Mapping

### 8.1 `complaints`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED AUTO_INCREMENT` | Primary key |
| `reference_number` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE` |
| `title` | `VARCHAR(100)` | `NOT NULL` |
| `description` | `TEXT` | `NOT NULL` |
| `category` | `VARCHAR(64)` | `NOT NULL` |
| `location` | `VARCHAR(150)` | `NOT NULL` |
| `status` | `VARCHAR(20)` | `NOT NULL`, default `Submitted` |
| `sentiment_label` | `VARCHAR(12)` | `NULL` |
| `sentiment_score` | `DECIMAL(7,4)` | `NULL` |
| `created_at` | `DATETIME` | `NOT NULL`, UTC |
| `updated_at` | `DATETIME` | `NOT NULL`, UTC |

Indexes: `status`, `category`, `created_at`, and `location`.

### 8.2 `status_history`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED AUTO_INCREMENT` | Primary key |
| `complaint_id` | `INT UNSIGNED` | FK → `complaints.id`, `ON DELETE CASCADE` |
| `status` | `VARCHAR(20)` | `NOT NULL` |
| `note` | `VARCHAR(500)` | `NULL` |
| `updated_by` | `VARCHAR(100)` | `NOT NULL`, default `Admin (demo)` |
| `changed_at` | `DATETIME` | `NOT NULL`, UTC |

Index: `(complaint_id, changed_at)`.

### 8.3 `complaint_counters`

| Column | Type | Notes |
|---|---|---|
| `counter_year` | `SMALLINT UNSIGNED` | Primary key |
| `last_number` | `INT UNSIGNED` | `NOT NULL`, default `0` |

### 8.4 UTC handling

- Application timestamps are generated in UTC.
- MySQL `DATETIME` stores the UTC value without a timezone suffix.
- API serialization appends `Z` and uses second precision.

---

## 9. Frontend Integration Contract

- `lib/api/client.ts` defines the API base URL and a small `fetch` helper.
- `NEXT_PUBLIC_API_BASE_URL` defaults to `http://127.0.0.1:5000/api`.
- `lib/services/complaintService.ts` maps API `snake_case` objects to the existing `camelCase` TypeScript models.
- `app/report/page.tsx` posts JSON to `/complaints`.
- `app/track/page.tsx` and `app/complaints/[id]/page.tsx` use `/complaints/reference/<reference>`.
- The details route uses the reference number as its URL parameter.
- `app/admin/page.tsx` uses `/statistics`, `/complaints`, and the status PATCH endpoint.
- The home page uses `/complaints` and displays the first four records.
- Existing Recharts components render category, status, and sentiment charts.
- Network failures show a friendly message; they must not leave the page blank.

---

## 10. Limitations

- No authentication: anyone who can reach the API can update a status.
- Sentiment is a rough tone indicator, not an assessment of urgency or truth.
- No pagination; acceptable for a small local dataset.
- No rate limiting, audit log, or production security hardening.
- The API is intended for local development only.
