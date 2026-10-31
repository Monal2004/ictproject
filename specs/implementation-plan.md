# CivicVoice — Implementation Plan

**Version:** 2.1.0  
**Phase:** Migration to Flask/MySQL/VADER while retaining Next.js/React  
**Status:** Approved  
**Execution style:** Small, verifiable steps with a checkpoint after each step

> **Change note (v2.1.0):** The Next.js/React frontend is retained and will not be replaced. The static HTML/CSS/JavaScript plan is cancelled. The backend migration to Flask + MySQL + VADER continues. The React service layer is rewired to the Flask API.

---

## 1. Goal

Replace the current FastAPI in-memory backend with:

- **Flask API** in `backend/`,
- **MySQL persistence** using the `civicvoice` database,
- **VADER sentiment analysis** at complaint creation,
- an API contract that serves the existing React/Next.js frontend.

The existing React pages, components, TypeScript types, Tailwind styling, and Recharts charts are retained. Image uploads and browser `localStorage` are removed from the active flow.

---

## 2. Current State

### 2.1 Retained frontend

- Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Recharts.
- Pages: home, report, track, complaint details, admin.
- Data currently comes from `lib/services/complaintService.ts` and browser `localStorage`.
- The report form includes an image-upload control; it will be removed from the form.
- The footer includes a reset-demo-data control; it will be removed.
- Recharts is the existing chart library and will be reused.

### 2.2 Backend replacement

- The old FastAPI in-memory backend has been removed after a backup was created at `C:\Users\Admin\Desktop\monal\ictproject-backup-20261024-0043.zip`.
- New Flask files: `app.py`, `db.py`, `sentiment.py`, `schema.sql`, `requirements.txt`, `.env.example`, `.gitignore`.
- Portable MySQL 8.4.9 is installed and running on `127.0.0.1:3306`.
- Databases `civicvoice` and `civicvoice_test` and the `civicvoice` MySQL user exist.

### 2.3 Environment

| Item | State |
|---|---|
| Python | 3.13.3 available. |
| MySQL | Portable MySQL 8.4.9; not a Windows service. |
| Node/Next.js | Present; retained.
| Browser data | Existing demo complaints live in browser `localStorage`; they are not migrated to MySQL. |

---

## 3. Files Affected

### 3.1 Updated specifications

| File | Change |
|---|---|
| `specs/requirements.md` | Rewritten for the retained React frontend and Flask/MySQL/VADER backend. |
| `specs/api-spec.md` | Flask/MySQL API contract, including sentiment, history, statistics, validation, and CORS. |
| `specs/implementation-plan.md` | This plan. |

### 3.2 Backend files

```text
backend/
├── app.py
├── db.py
├── sentiment.py
├── schema.sql
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
├── README.md
├── start_mysql.ps1
├── stop_mysql.ps1
└── tests/test_api.py
```

### 3.3 Frontend files changed

| File | Change |
|---|---|
| `lib/api/client.ts` | New fetch wrapper and API base URL. |
| `lib/services/complaintService.ts` | Rewritten to call Flask instead of `localStorage`. |
| `lib/types/complaint.ts` | Add sentiment fields and sentiment distribution type. |
| `app/report/page.tsx` | Remove image upload; show API field errors. |
| `app/track/page.tsx` | Use API reference lookup; show sentiment. |
| `app/complaints/[id]/page.tsx` | Treat the route parameter as the CV reference; show sentiment. |
| `app/admin/page.tsx` | Add status and sentiment charts; use API data. |
| `components/admin/CategoryChart.tsx` | Kept; uses API-derived data. |
| `components/admin/StatusChart.tsx` | New Recharts status chart. |
| `components/admin/SentimentChart.tsx` | New Recharts sentiment chart. |
| `components/common/SentimentBadge.tsx` | New sentiment badge. |
| `components/admin/ComplaintTable.tsx` | Link by reference; show sentiment. |
| `components/complaint/ComplaintCard.tsx` | Link by reference. |
| `components/common/Footer.tsx` | Remove reset-demo-data and stack details. |
| `components/admin/StatusUpdateModal.tsx` | Keep; works with numeric complaint ID. |
| `app/page.tsx` | Update copy and recent-complaint links. |

### 3.4 Removed after verification

| Item | Reason |
|---|---|
| `lib/data/localStorageRepository.ts`, `lib/data/initialComplaints.ts` | No longer used by the active service. |
| `components/complaint/ImageUploadDropzone.tsx`, image utility code | Image uploads are out of scope. |
| `specs/ui-spec.md`, `specs/technical-design.md`, `specs/test-plan.md`, `specs/backend-implementation-plan.md` | Superseded by the three current specs. |
| Old FastAPI backend files | Replaced by Flask. Already removed after backup. |

**Do not remove the Next.js app, components, `node_modules`, `next.config.mjs`, `package.json`, TypeScript, Tailwind, or Recharts.** The frontend is the active UI.

---

## 4. Prerequisites

### 4.1 Required

- Python 3.10+ (3.13.3 is present).
- MySQL 8.x running locally on `127.0.0.1:3306`.
- Node.js and the existing npm dependencies.
- `backend/.env` with database credentials and CORS origins.

### 4.2 Ports and origins

| Service | Default URL |
|---|---|
| Flask API | `http://127.0.0.1:5000` |
| Next.js frontend | `http://localhost:3000` |

Allowed CORS origins:

```text
http://localhost:3000,http://127.0.0.1:3000
```

If either port changes, update `backend/.env`, `NEXT_PUBLIC_API_BASE_URL`, and restart both servers.

---

## 5. Implementation Steps

### Step 0 — Approval, backup, and MySQL setup — DONE

- Backup exists at `C:\Users\Admin\Desktop\monal\ictproject-backup-20261024-0043.zip`.
- Portable MySQL 8.4.9 is installed, initialized, and running.
- `civicvoice` and `civicvoice_test` databases and users exist.

### Step 1 — MySQL schema — IN PROGRESS

- `backend/schema.sql` defines `complaints`, `status_history`, and `complaint_counters`.
- Apply the schema to both databases.
- Verify the tables and the unique reference constraint.

### Step 2 — Flask configuration and data layer — DONE (pending verification)

- `db.py` provides environment-driven connections, CRUD, reference generation, and statistics.
- `sentiment.py` wraps VADER with graceful failure.
- `app.py` defines the six routes, validation, CORS, health, and error handling.

### Step 3 — Backend tests — PENDING

- Create `backend/tests/test_api.py` with `unittest` and the Flask test client.
- Use `civicvoice_test`; refuse to run if the database name does not end in `_test`.
- Cover health, create, validation, unique references, search/filter/sort, reference lookup, status history, statistics, sentiment, and CORS.
- Create and install `backend/.venv`.
- Run the suite.

**Checkpoint:** all backend tests pass.

### Step 4 — MySQL helper scripts and README — PENDING

- Add `backend/start_mysql.ps1` and `backend/stop_mysql.ps1` using the portable MySQL paths.
- Rewrite `backend/README.md` for Flask/MySQL/VADER and the retained React frontend.

### Step 5 — React API client and service — PENDING

- Add `lib/api/client.ts`.
- Rewrite `lib/services/complaintService.ts` to:
  - call `/complaints` with filters,
  - create complaints,
  - look up by reference,
  - update status,
  - fetch statistics,
  - derive metrics, category/status/sentiment distributions, and recurring groups.
- Map `snake_case` API fields to the existing `camelCase` models.
- Add sentiment fields to `lib/types/complaint.ts`.

**Checkpoint:** the existing pages compile with `npm run build` or `npx tsc --noEmit`.

### Step 6 — React page integration — PENDING

- Report page: remove image upload, post to Flask, show field errors, retain reference confirmation.
- Track page: use reference endpoint, show sentiment badge and disclaimer.
- Details route: use the reference as the route parameter; update links.
- Home: load recent complaints from the API, update copy, remove localStorage references.
- Footer: remove reset-demo-data and stack details.
- Admin: add status and sentiment charts, show sentiment in the table, keep status updates and recurring issues.

**Checkpoint:** the report → track → update-status journey works in the browser.

### Step 7 — Verification — PENDING

- Run the backend `unittest` suite.
- Smoke-test all six endpoints.
- Run the main browser journey.
- Restart Flask and verify persistence.
- Verify CORS preflight from `http://localhost:3000`.
- Check invalid data and unknown references.
- Verify charts use real statistics.
- Verify recurring groups.
- Verify no secrets or stack traces appear in responses.

### Step 8 — Cleanup and documentation — PENDING

- Remove only the old FastAPI files and the four superseded specs after verification.
- Remove the unused `localStorage` repository and image-upload component.
- Keep the Next.js frontend and all of its configuration.
- Confirm `specs/` contains only the three approved documents.

### Step 9 — Final report — PENDING

Report completed features, test results, remaining limitations, and exact run commands.

---

## 6. Verification Plan

### 6.1 Automated API tests

Use `unittest` and the Flask test client against `civicvoice_test`.

| Test | Expected result |
|---|---|
| Health with working database | `200`, `database: "ok"` |
| Create valid complaint | `201`; reference matches `CV-YYYY-NNNNN`; initial history; sentiment present |
| Create with missing/blank/short/long fields | `400` with field messages |
| Invalid category | `400` |
| Two creates | Different references |
| Reference lookup, including lowercase input | Correct complaint |
| Unknown reference | `404` |
| List all | Newest first; `count` matches |
| Status/category filter | Only matching rows |
| Search by reference/title/description/location | Matching rows |
| Sort oldest | Oldest first |
| Invalid filter/sort | `400` |
| Status update | `200`; new status; `updated_at` changed; new history entry |
| Same-status update | New history entry appended |
| Invalid status update | `400` |
| Unknown complaint ID update | `404` |
| Statistics | Correct total, zero-filled maps, sentiment counts |
| CORS preflight | Allowed origin receives the expected headers |

Run with:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:DB_NAME = "civicvoice_test"
python -m unittest discover -s tests -v
```

### 6.2 Manual checks

| Check | Expected result |
|---|---|
| Submit from `/report` | Reference shown and copied successfully |
| Search that reference on `/track` | Complaint and history shown |
| Open `/complaints/CV-...` | Same details shown |
| Update status in `/admin` | New status and history visible after refresh |
| Restart Flask | Complaint still available |
| Dashboard charts | Values match API statistics |
| Recurring issues | Only groups with at least two complaints |
| Sentiment | Negative/neutral/positive labels appear from real descriptions |
| Invalid form / unknown reference | Friendly, specific messages |
| Mobile width (~360 px) | Navigation, cards, table, and charts remain usable |
| Footer | No architecture or stack explanation |
| CORS | Browser requests from port 3000 succeed |

---

## 7. Run Commands

### 7.1 MySQL

Use the helper scripts after they are created, or start the portable server manually:

```powershell
& "C:\Users\Admin\AppData\Local\CivicVoice\mysql-8.4.9-winx64\bin\mysqld.exe" --defaults-file="C:\Users\Admin\AppData\Local\CivicVoice\my.ini"
```

### 7.2 Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

### 7.3 Frontend

```powershell
# from the project root
npm run dev
```

Open `http://localhost:3000`.

### 7.4 Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:DB_NAME = "civicvoice_test"
python -m unittest discover -s tests -v
```

---

## 8. Dependencies

| Package | Used by | Purpose |
|---|---|---|
| `Flask` | Backend | Web API and routing |
| `Flask-Cors` | Backend | Allow the Next.js development origin |
| `PyMySQL` | Backend | Connect to MySQL with parameterized queries |
| `cryptography` | Backend | Required by PyMySQL for MySQL 8 `caching_sha2_password` authentication |
| `vaderSentiment` | Backend | Sentiment label and compound score |
| `python-dotenv` | Backend | Load `backend/.env` |
| Existing npm packages | Frontend | Next.js, React, TypeScript, Tailwind, Recharts, Lucide |
| `unittest` | Backend tests | Built-in test runner; no install needed |

No new frontend framework or chart library is added.

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| MySQL is not running after reboot | Use the start script; check `/api/health`. |
| MySQL authentication errors | Use the dedicated user and `cryptography`; verify with `/api/health`. |
| CORS failures | Keep ports consistent; restart Flask after changing `.env`. |
| Type mismatches in React | Map API fields in one service layer; run TypeScript checks. |
| Image upload remnants | Remove the upload control and unused components. |
| Sentiment misunderstood | Label it as wording tone; add disclaimers in tracking, details, and admin. |
| Accidental data loss during cleanup | Use the backup; delete only after verification. |
| Tests hitting the development database | Require a `_test` database name and clear only test tables. |
| No authentication | Keep the app local; state clearly that it is not production-ready. |
| Old localStorage data not visible | Explain that MySQL starts empty; re-enter or seed demo data manually. |

---

## 10. Definition of Done

- The Next.js/React frontend is retained and active.
- The specs folder contains only `requirements.md`, `api-spec.md`, and `implementation-plan.md`.
- The Flask API starts and connects to MySQL.
- All six endpoints work with the documented validation and errors.
- References are unique, database-backed, and survive restarts.
- Status updates append history; statistics and charts use real data.
- VADER sentiment is stored and displayed; failures are handled gracefully.
- The report → reference → track → status-update journey passes.
- MySQL persistence after a Flask restart is verified.
- The `unittest` suite passes against `civicvoice_test`.
- CORS works for `http://localhost:3000`.
- The README explains setup, running, testing, and limitations in beginner-friendly language.
- Only the old FastAPI backend and superseded specs are removed, after verification, with a backup retained.
