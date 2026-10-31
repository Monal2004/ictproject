# CivicVoice — Requirements Specification

**Version:** 2.1.0  
**Phase:** 1 — Requirements  
**Status:** Approved — React frontend retained  
**Target stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Recharts · Flask · MySQL · VADER

> **Change note (v2.1.0):** The existing React/Next.js frontend is retained. The earlier plan to replace it with static HTML/CSS/JavaScript is cancelled. The backend migration to Flask + MySQL + VADER continues. The React data layer will call the Flask API instead of browser `localStorage`. The existing Recharts chart components are retained.

---

## 1. Purpose

CivicVoice is a beginner-friendly civic issue reporting and tracking application.

Citizens can:

- report a local civic problem,
- receive a unique reference number,
- track the complaint and its status history.

Administrators can:

- view complaint totals,
- see category, status, and sentiment charts,
- search and filter complaints,
- update complaint statuses,
- identify frequently reported category/location combinations.

The application is a development MVP, not a production service.

---

## 2. Users and Goals

| User | Main goal |
|---|---|
| Citizen | Report an issue quickly and track it with a reference number. |
| Administrator | Understand complaint patterns and move complaints through the six statuses. |
| Project owner / student | Demonstrate a simple full-stack application using the retained React frontend and the new Flask/MySQL backend. |

---

## 3. Technology Constraints

### 3.1 Active technologies

**Frontend — existing stack, retained**

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Recharts (existing chart components)
- Lucide React icons (existing)

**Backend**

- Python 3.10+ (the current machine has Python 3.13.3)
- Flask
- MySQL 8.x
- VADER (`vaderSentiment`) for sentiment analysis

**Backend supporting packages**

| Package | Purpose |
|---|---|
| `Flask` | HTTP API and routing |
| `Flask-Cors` | Explicitly configured development CORS |
| `PyMySQL` | MySQL database driver |
| `cryptography` | Required by PyMySQL for MySQL 8 `caching_sha2_password` authentication |
| `vaderSentiment` | Sentiment analysis of complaint descriptions |
| `python-dotenv` | Load database and CORS settings from `backend/.env` |

Python's built-in `unittest` is used for backend tests. No new test framework is required.

### 3.2 Explicitly excluded technologies and features

Do **not** add:

- FastAPI, Express, SQLAlchemy
- new frontend frameworks or a second chart library
- authentication, email notifications, image uploads, maps/geocoding
- machine-learning models or external sentiment APIs
- Docker or deployment tooling
- browser `localStorage` as the active complaint store

### 3.3 Separation

- The retained React frontend lives in the project root: `app/`, `components/`, `lib/`.
- Python/API/database code lives only in `backend/`.
- The React frontend calls the backend with `fetch()`.
- The backend does not render React pages and the frontend does not connect directly to MySQL.
- The old FastAPI backend is removed; the old Next.js frontend is **not** removed.

---

## 4. Project Structure

```text
ictproject/
├── app/
│   ├── page.tsx
│   ├── report/page.tsx
│   ├── track/page.tsx
│   ├── complaints/[id]/page.tsx       # route param is the CV reference
│   └── admin/page.tsx
├── components/
│   ├── admin/
│   ├── common/
│   └── complaint/
├── lib/
│   ├── api/client.ts                  # NEW: Flask fetch client
│   ├── services/complaintService.ts   # rewritten to call the API
│   ├── types/complaint.ts
│   └── utils/
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── sentiment.py
│   ├── schema.sql
│   ├── requirements.txt
│   ├── .env.example
│   ├── README.md
│   └── tests/test_api.py
├── specs/
│   ├── requirements.md
│   ├── api-spec.md
│   └── implementation-plan.md
├── package.json
└── next.config.mjs
```

The four superseded specification files are removed after verification. The browser `localStorage` repository is no longer used by the active service; it can be removed after verification.

---

## 5. Functional Requirements

### FR-01 — Home page (`app/page.tsx`)

The home page must show:

- a short CivicVoice introduction,
- primary actions to **Report an Issue** and **Track a Complaint**,
- all twelve civic categories with short descriptions,
- up to four recent complaints loaded from the API, with reference, title, category, status, location, and date,
- a clear empty state if there are no complaints or the API is unavailable.

The footer must **not** explain the architecture or list the technology stack. It contains only simple brand text, navigation links, and a short disclaimer. The "reset demo data" control is removed.

There must be no duplicate “Report an Issue” calls to action beyond the main navigation, home hero, and normal page-level actions.

### FR-02 — Report an issue (`app/report/page.tsx`)

The form must include:

- title,
- description,
- civic category,
- location.

The page must:

- validate fields in the browser and show the backend's validation messages,
- submit with `POST /api/complaints`,
- show a confirmation containing the unique reference number,
- offer copy-reference and “Track this complaint” actions,
- show a friendly error if the API is unavailable,
- preserve the selected category when the page is opened with `?category=...` from the home page.

Image uploads are **not** included. The existing image-upload control is removed from the report form.

### FR-03 — Track a complaint (`app/track/page.tsx`)

The page must:

- accept a reference number such as `CV-2026-00001`,
- look it up with `GET /api/complaints/reference/<reference_number>`,
- display the complaint information, current status, dates, sentiment, and full status timeline,
- show a clear “not found” message for an unknown reference,
- trim and uppercase the entered reference before searching.

### FR-04 — Complaint details (`app/complaints/[id]/page.tsx`)

This is the deep-link view used by recent-complaint links, tracking results, and the admin table.

- The route parameter is the reference number, e.g. `/complaints/CV-2026-00001`.
- It uses the reference endpoint and the same rendering data as the tracking page.
- It shows complaint details, sentiment, and the chronological status timeline.
- If the reference is unknown, it shows a clear not-found state and a link back to tracking.

No “get by internal numeric ID” endpoint is required.

### FR-05 — Admin dashboard (`app/admin/page.tsx`)

The dashboard must show:

- complaint count cards:
  - total = all complaints,
  - active = `Submitted` + `Under Review` + `Assigned` + `In Progress`,
  - resolved = `Resolved`,
  - closed = `Closed`,
- a complaint-by-category chart,
- a complaint-by-status chart,
- a sentiment-distribution chart,
- a searchable/filterable complaint table,
- status update controls with an optional note,
- a simple recurring-issues panel.

Charts must use real API data, not hardcoded values. Existing Recharts components are retained and extended with status and sentiment charts.

Recurring issues are calculated in the frontend service from complaint records:

1. group by category + normalized location (trim, lowercase, and collapse repeated spaces),
2. count each group,
3. show groups with at least two complaints,
4. sort by count descending, then show the top five.

The dashboard is open in development. There is **no authentication or role checking**.

### FR-06 — MySQL persistence

- Complaints, status history, and reference counters are stored in MySQL.
- Data must still be available after the Flask process restarts.
- Complaint rows and status-history rows are stored separately.
- Database connection details come from environment variables; passwords must never be committed to source code.
- All SQL uses parameter placeholders.

### FR-07 — Unique reference numbers

- Format: `CV-YYYY-NNNNN`, for example `CV-2026-00001`.
- The number is generated from a database table, not from an in-memory counter or a row count.
- The `complaints.reference_number` column has a `UNIQUE` constraint.
- Generation happens inside a database transaction.
- A per-year counter starts at `00001` for each new year.
- If a duplicate is ever detected, the insert is retried a small number of times before returning an error.

### FR-08 — Sentiment analysis

- VADER analyzes the complaint **description** when the complaint is created.
- The response and database store:
  - `sentiment_label`: `positive`, `neutral`, `negative`, or `null`,
  - `sentiment_score`: VADER compound score from `-1.0` to `1.0`, or `null`.
- Classification uses the standard VADER thresholds:
  - compound `>= 0.05` → `positive`,
  - compound `<= -0.05` → `negative`,
  - otherwise → `neutral`.
- If analysis fails, the complaint is still saved with `null` sentiment values. The failure is logged and must not cause a 500 response.
- The admin sentiment chart includes `positive`, `neutral`, `negative`, and `unavailable` counts.
- Sentiment is shown on tracking, details, and admin views as a badge.
- The UI must explain that sentiment describes the **wording/tone** of the complaint, not the severity or truth of the issue.

Sentiment is calculated only at creation time. Status updates do not recalculate it.

### FR-09 — Complaint listing, search, and filters

`GET /api/complaints` returns a JSON object containing a `complaints` array sorted newest first by default.

Supported query parameters:

| Parameter | Meaning |
|---|---|
| `status` | Exact status filter |
| `category` | Exact category filter |
| `search` | Case-insensitive text search across reference number, title, description, and location |
| `sort` | `newest` (default) or `oldest` |

There is no pagination in this MVP. This is acceptable because the project is a small local demonstration.

### FR-10 — Status updates and history

- The six statuses are: `Submitted`, `Under Review`, `Assigned`, `In Progress`, `Resolved`, `Closed`.
- Any status may move to any other status, including the same status.
- Every update:
  - changes `complaints.status`,
  - updates `complaints.updated_at`,
  - appends a status-history row with status, timestamp, optional note, and actor label.
- The initial `Submitted` entry is created with the complaint.
- History is returned in chronological order (oldest first) so the timeline can be rendered top-to-bottom.

There are no complex transition rules in this MVP.

### FR-11 — Statistics

`GET /api/statistics` returns:

- total complaint count,
- counts for every one of the six statuses,
- counts for every one of the twelve categories,
- sentiment counts for positive, neutral, negative, and unavailable.

All status and category keys are present even when their count is zero.

### FR-12 — Validation and errors

Required validation:

| Field | Rule |
|---|---|
| `title` | Required; trimmed; 5–100 characters |
| `description` | Required; trimmed; 20–2000 characters |
| `category` | Required; must be one of the twelve categories |
| `location` | Required; trimmed; 3–150 characters |
| `status` (update) | Required; must be one of the six statuses |
| `note` (update) | Optional; trimmed; maximum 500 characters |
| `updated_by` (update) | Optional; trimmed; maximum 100 characters; defaults to `Admin (demo)` |

Whitespace-only values are invalid.

API errors use JSON:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "title": "Title must be at least 5 characters."
    }
  }
}
```

- `400` — invalid input, invalid status/category filter, or malformed JSON
- `404` — complaint or reference not found
- `500` — unexpected server error
- `503` — database unavailable

Unknown fields in request bodies are ignored. No stack traces or database credentials are returned to the browser.

### FR-13 — Frontend/backend integration and CORS

- The React frontend uses `fetch()` with JSON requests.
- API base URL is configured in `lib/api/client.ts` through `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://127.0.0.1:5000/api`.
- Development URLs:
  - frontend: `http://localhost:3000` (Next.js dev server)
  - backend: `http://127.0.0.1:5000`
- CORS is handled with `Flask-Cors` for `/api/*`.
- Allowed origins come from the `CORS_ORIGINS` environment variable.
- Default allowed origins: `http://localhost:3000,http://127.0.0.1:3000`.
- If the frontend port changes, update `.env` and restart Flask.
- The service layer maps API `snake_case` fields to the existing TypeScript `camelCase` models.

### FR-14 — Responsive, accessible interface

- The existing green-and-white visual theme is retained.
- Responsive from small phones (about 360 px) to desktop.
- Accessible labels for every form field.
- Visible keyboard focus styles.
- Sufficient color contrast.
- Tables scroll horizontally on small screens.
- Charts have text summaries or accessible labels in addition to chart rendering.
- No new UI framework is added.

---

## 6. Data Model

### 6.1 Complaint

| Field | Type / rule |
|---|---|
| `id` | Internal auto-increment integer; primary key |
| `reference_number` | `VARCHAR(20)`, unique, not null, e.g. `CV-2026-00001` |
| `title` | `VARCHAR(100)`, not null |
| `description` | `TEXT`, not null |
| `category` | `VARCHAR(64)`, not null |
| `location` | `VARCHAR(150)`, not null |
| `status` | `VARCHAR(20)`, not null, default `Submitted` |
| `sentiment_label` | `VARCHAR(12)`, nullable |
| `sentiment_score` | `DECIMAL(7,4)`, nullable, `-1.0000` to `1.0000` |
| `created_at` | UTC datetime, not null |
| `updated_at` | UTC datetime, not null |

### 6.2 Status history

| Field | Type / rule |
|---|---|
| `id` | Auto-increment integer; primary key |
| `complaint_id` | Foreign key → `complaints.id`, `ON DELETE CASCADE` |
| `status` | One of the six statuses |
| `note` | `VARCHAR(500)`, nullable |
| `updated_by` | `VARCHAR(100)`, not null, default `Admin (demo)` |
| `changed_at` | UTC datetime, not null |

### 6.3 Reference counter

| Field | Type / rule |
|---|---|
| `counter_year` | `SMALLINT UNSIGNED`, primary key |
| `last_number` | `INT UNSIGNED`, not null, default `0` |

### 6.4 Categories

These exact names are used in the frontend, backend validation, and MySQL rows.

| Category | Short description |
|---|---|
| Roads and footpaths | Potholes, damaged roads, and broken footpaths. |
| Waste and sanitation | Garbage accumulation, overflowing bins, and missed collections. |
| Water supply | Water shortages, leaking pipes, and water quality concerns. |
| Drainage and flooding | Blocked drains, stagnant water, and flooding. |
| Streetlights and electricity | Broken streetlights and exposed electrical hazards. |
| Public transportation | Damaged bus stops and public transport service issues. |
| Parks and public spaces | Damaged benches, playground equipment, and public litter. |
| Public buildings and facilities | Damaged public buildings and poorly maintained facilities. |
| Traffic safety | Unsafe crossings, damaged traffic signs, and road safety hazards. |
| Trees and greenery | Fallen trees, damaged greenery, and overgrown vegetation. |
| Encroachments and obstructions | Blocked footpaths and unauthorized obstructions. |
| Other municipal services | Civic problems that do not fit another category. |

### 6.5 Statuses

`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` → `Closed`

This is the display order. It is **not** a mandatory transition rule.

---

## 7. API Summary

Detailed request/response contracts are in [`api-spec.md`](./api-spec.md).

| # | Method | Endpoint | Purpose |
|---|---|---|---|
| 1 | GET | `/api/health` | Check the API and database connection |
| 2 | POST | `/api/complaints` | Create a complaint and analyze sentiment |
| 3 | GET | `/api/complaints` | List, search, filter, and sort complaints |
| 4 | GET | `/api/complaints/reference/<reference_number>` | Find one complaint by reference |
| 5 | PATCH | `/api/complaints/<complaint_id>/status` | Update status and append history |
| 6 | GET | `/api/statistics` | Dashboard statistics |

No other endpoints are required for this phase.

---

## 8. Non-Functional Requirements

| Requirement | Expectation |
|---|---|
| Simplicity | Beginner-readable code with short comments and no unnecessary layers. |
| Separation | React frontend and Flask backend are independent; no new backend framework. |
| Security | Parameterized SQL, `.env` secrets, no credentials in source. No authentication (explicitly out of scope). |
| Performance | Indexed status/category/date columns; suitable for small local datasets. |
| Reliability | Transactions for complaint creation and status updates. |
| Accessibility | Labels, focus states, semantic HTML, responsive layout. |
| Documentation | One short README and exactly three specification documents. |
| Honesty | The UI and README must state that this is a development MVP, not production-ready. |

---

## 9. Out of Scope

- User accounts, login, roles, or permissions
- Email/SMS notifications
- Image or file uploads
- Maps, geocoding, or GPS
- AI/ML beyond VADER sentiment analysis
- Complex status-transition or escalation rules
- Pagination, infinite scroll, or full-text search engines
- Docker, cloud deployment, CI/CD
- Production security hardening, rate limiting, or audit trails
- Automatic migration of existing browser `localStorage` demo data

The admin dashboard is intentionally open in this development version.

---

## 10. Acceptance Criteria

The phase is complete when:

1. The Flask API starts locally and connects to MySQL.
2. All six endpoints work, including filters, search, and sorting.
3. A complaint can be submitted from the React report page and receives a unique `CV-YYYY-NNNNN` reference.
4. The reference is stored in MySQL and survives a backend restart.
5. The tracking page finds the complaint and shows its current status and full history.
6. An admin can update the status; the change is persisted and a new history entry appears.
7. Statistics and the category, status, and sentiment charts are calculated from real complaint records.
8. Sentiment is stored at creation and shown in the admin sentiment chart and complaint views.
9. Recurring category/location groups are calculated from real records.
10. Invalid form data and unknown references show clear messages.
11. The CORS preflight from `http://localhost:3000` succeeds.
12. The main user journey works at desktop and mobile widths.
13. The small `unittest` suite passes against the MySQL test database.
14. `/api/health` reports database status accurately.
15. The old FastAPI backend has been removed only after the new implementation passes verification, with a backup retained.

---

## 11. Assumptions and Dependencies

- Portable MySQL 8.4.9 is installed locally and runs on `127.0.0.1:3306`. It is not a Windows service and may need restarting after a reboot.
- Databases `civicvoice` and `civicvoice_test` and the `civicvoice` MySQL user exist.
- Python 3.13.3 is available. Backend dependencies are installed in `backend/.venv`.
- Node.js and the existing `node_modules` are available for `npm run dev`.
- Development ports are `5000` (Flask) and `3000` (Next.js). Either port can be changed, but CORS and the frontend API base URL must be updated together.
- The application targets a small local dataset; no pagination is needed.
- Existing browser `localStorage` demo data is not migrated. MySQL starts empty unless fictional sample rows are added manually.
- The old FastAPI backend and extra specification documents remain in the backup zip until cleanup is confirmed.

---

## 12. Definition of Done

- The existing React frontend remains the active UI and uses the Flask API.
- `backend/` contains `app.py`, `db.py`, `sentiment.py`, `schema.sql`, `requirements.txt`, `.env.example`, `README.md`, and one test file.
- `specs/` contains only `requirements.md`, `api-spec.md`, and `implementation-plan.md`.
- Setup, run, and test commands are documented in simple language.
- The README explains MySQL setup, environment variables, CORS, reference-number behavior, sentiment limitations, and the non-production status.
- No feature outside the approved scope is added.
