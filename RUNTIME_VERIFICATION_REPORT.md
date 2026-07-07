# RUNTIME VERIFICATION REPORT
**Date:** 2026-07-06  
**Auditor:** Senior QA Automation Engineer & Production Release Engineer

This report documents the runtime execution and API verification tests performed on the College Management System using a live database and local Express backend server.

---

## 1. RUNTIME VERIFICATION LOGS

### 🔐 Authentication & Session Persistence
- **Login Verification:** Valid credentials for Admin, Faculty, and Student return `200 OK` with JSON signature token payloads. (Status: **PASS**)
- **Logout / Session:** Local context clears stored tokens on client logout. (Status: **PASS**)
- **Unauthorized Actions:** Attempting requests without credentials correctly returns `401 Unauthorized`. (Status: **PASS**)
- **Role Restrictions:** Standard student role accounts attempting to request admin routes are blocked with `403 Forbidden`. (Status: **PASS**)

### 👨‍🎓 Core Student and Faculty Operations
- **Student Profile Query:** Retrieving the logged-in student's information returns correct personal/academic fields. (Status: **PASS**)
- **Faculty Lookup:** Querying faculty profiles by ID retrieves matching department details. (Status: **PASS**)
- **IDOR Protection:** Authenticated students querying specific profile identifiers by database ID (e.g. `GET /api/students/:id`) are correctly blocked with `403 Forbidden`. (Status: **PASS**)

### 💬 Messaging & Search
- **Inbox Queries:** Retrieving conversation lists returning thread payloads. (Status: **PASS**)
- **Regex Query Sanitization:** Searching using regular expression control characters (`a*b+c?d^`) does not trigger MongoDB database compilation exceptions or ReDoS CPU spikes. Input strings are escaped successfully. (Status: **PASS**)

### 🔔 Notification Delivery
- **Admin Dispatch Check:** Admin user calling `/notifications/test` succeeds with `201 Created` status. (Status: **PASS**)
- **Student Query Check:** Gating ensures students are blocked with `403 Forbidden` on test trigger endpoint, but can fetch alerts normally using `GET /notifications`. (Status: **PASS**)

---

## 2. API ENDPOINT MATRIX STATUS

All test scripts executed against the live API confirm consistent payload schema mappings:

| Endpoint | Method | Code | Outcome | Status |
|---|---|---|---|---|
| `/api/auth/login` | POST | 200 | Auth Success | **PASS** |
| `/api/auth/login` | POST | 401 | Invalid Credentials | **PASS** |
| `/api/auth/me` | GET | 200 | Profile Retrieved | **PASS** |
| `/api/students` | GET | 200 | List Retrieved | **PASS** |
| `/api/students/:id` | GET | 403 | IDOR Blocked | **PASS** |
| `/api/faculty/:id` | GET | 200 | Allowed (Faculty Token) | **PASS** |
| `/api/messages/search-users`| GET | 200 | Safe Escaped Match | **PASS** |
| `/api/messages/search` | GET | 200 | Safe Escaped Match | **PASS** |
| `/api/notifications/test` | POST | 403 | Blocked (Student Token) | **PASS** |
| `/api/notifications/test` | POST | 201 | Created (Admin Token) | **PASS** |
| `/api/notifications` | GET | 200 | Inbox Loaded | **PASS** |

---

## 3. VERDICT
**VERIFIED**
