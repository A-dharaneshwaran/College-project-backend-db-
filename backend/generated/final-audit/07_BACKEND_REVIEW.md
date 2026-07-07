# 07 BACKEND REVIEW
**Date:** 2026-07-06  
**Auditor:** Staff Software Engineer & Backend Architect

This document reviews the Node.js / Express backend layer, looking at API routing, middleware execution, validation pipelines, and system activity logs.

---

## 1. CENTRALIZED API ROUTING
The central router in `backend/src/routes/index.js` mounts all application routes cleanly:
- `auth`: `/api/auth` -> Protected register, login, profile check.
- `students`: `/api/students` -> CRUD, filtered queries, profiles.
- `faculty`: `/api/faculty` -> CRUD, class allocation.
- `bulk`: `/api/bulk` -> XLSX template, secure import/export.
- `messages` & `contacts`: `/api/messages` & `/api/contacts` -> Conversation threads, query user profiles, user searches.
- `notifications`: `/api/notifications` -> Push alerts, inbox unread indicators.

---

## 2. MIDDLEWARE CHAIN & EXECUTION SAFETY

Every request passes through structured middlewares:
1. **Security & Utility:** `helmet` (security headers), `cors` (origin validation), `express.json()` (JSON parsing).
2. **Rate Limiter:** Limits IP queries in production (100 requests / 15 minutes).
3. **Authentication Guard (`protect`):** Reads the Authorization header, validates the JWT, and binds the corresponding Mongoose `User` object to `req.user`.
4. **Authorization Guard (`authorize`):** Restricts execution to authorized roles (e.g. `admin`, `faculty`).
5. **Validator (`validate`):** Inspects payloads using `express-validator` and triggers `ApiError` 400 Bad Request on validation failures.
6. **Controller Dispatcher:** Async route handlers wrapped with `catchAsync` to prevent unhandled promise rejections.
7. **Error Handler (`errorHandler`):** Logs exceptions and converts errors into standard JSON structures.

---

## 3. ACTIVITY LOGGING SYSTEM INTEGRITY
- **Remediation:** Fixed parameter signature mismatch in `message.service.js` (positional args were failing destructured destructuring in `activityLog.service.js`).
- **Audit Verification:** Checked log writes across messaging features. Creating conversations, deleting messages, and sending broadcasts now write records to MongoDB with correct admin identifiers, module references, and action logs.
- **Status:** **PASS**
