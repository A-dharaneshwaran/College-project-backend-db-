# CRITICAL BUG FIX REPORT
**Date:** 2026-07-06  
**Auditor/Engineer Role:** Principal Software Architect, Security Engineer & QA Lead

This report details the verification and resolution status of the security and UI/UX issues identified during the stability audit. All modifications conform strictly to safe implementation mode without introducing architectural changes.

---

## SECURITY FIXES SUMMARY

| Reference | Target Endpoint / File | Finding | Verification | Fix Status |
|---|---|---|---|---|
| **SEC-01** | `GET /api/students/:id` | Unauthorized student profile enumeration | **VERIFIED** — Lacked `authorize` role checks. | **FIXED** — Added `authorize('admin', 'faculty')` to route. |
| **SEC-02** | `GET /api/faculty/:id` | Unauthorized faculty profile enumeration | **VERIFIED** — Lacked `authorize` role checks. | **FIXED** — Added `authorize('admin', 'faculty')` to route. |
| **SEC-03** | `POST /api/auth/register` | Unauthenticated registration of admin accounts | **FALSE POSITIVE** — Route already enforces `protect, authorize('admin')`. | **ALREADY FIXED** — No changes made. |
| **SEC-04** | Bulk Import (Student/Faculty) | Plaintext credentials returned in JSON response | **VERIFIED** — `importedRecords` with passwords sent in JSON. | **FIXED** — Implemented secure in-memory server cache and token download. |
| **SEC-05** | Regex Search queries (6 files) | ReDoS vulnerability via unescaped input | **VERIFIED** — Raw query strings used in `new RegExp` and `$regex`. | **FIXED** — Escaped all search queries using RegExp escape regex helper. |
| **SEC-06** | `POST /api/notifications/test` | Non-admin access to test notifications | **VERIFIED** — Lacked role authorization. | **FIXED** — Added `authorize('admin')` to route. |
| **SEC-07** | Activity Logging Call | Silent logging failure in message service | **VERIFIED** — Parameter signature mismatch (positional vs object). | **FIXED** — Restructured all calls to pass single configuration objects. |

---

## UI/UX FIXES SUMMARY

| Reference | Target File / Component | Finding | Verification | Fix Status |
|---|---|---|---|---|
| **UI-01** | `app/<role>/_layout.jsx` | Contact screen unregistered in layouts | **VERIFIED** — Missing `Stack.Screen` entries for contacts. | **FIXED** — Registered contact screen inside layouts for all 3 roles. |
| **UI-02** | `app/<role>/messages.jsx` | Inverted FlatList date headers rendered below | **FALSE POSITIVE** — Headers render above group as index increases. | **ALREADY FIXED** — No changes made. |
| **UI-03** | `context/MessageContext.jsx` | Polling fails to resume on foreground | **VERIFIED** — AppState change listener resets state. | **FIXED** — Persisted polling intent ref across pause cycles. |
| **UI-04** | `context/MessageContext.jsx` | Overlapping duplicate fetches | **VERIFIED** — Overlapping calls on archive filter switch. | **FIXED** — Integrated interval reset and clear logic. |

---

## DETAILED VERIFICATION & RESOLUTION LOGS

### SEC-01 & SEC-02: Student & Faculty Profile Security
- **File Path:** `backend/src/routes/student.routes.js:110` and `backend/src/routes/faculty.routes.js:110`
- **Verification:** Both endpoints were only protected by `protect` (JWT validation), allowing any user (including students) to query other profiles by ID.
- **Resolution:** Added `authorize('admin', 'faculty')` roles to ensure students cannot access individual profile endpoints.

### SEC-04: Bulk Import Passwords Leak
- **File Path:** `backend/src/controllers/bulk.controller.js` and `app/admin/manage-*` screens
- **Verification:** Plaintext temporary passwords returned in JSON payload were held in client memory, posing exposure risks.
- **Resolution:** Plaintext passwords are now deleted from the JSON response. A secure in-memory server cache maps imports to temporary download tokens (`credentialsDownloadId`). The client downloads the XLSX report securely using this token instead of sending credentials back.

### SEC-05: Regex Injection (ReDoS) Prevention
- **File Paths:** `paginateQuery.js`, `notification.service.js`, `message.service.js`, `message.controller.js`, `contact.controller.js`, `activityLog.service.js`
- **Verification:** Catastrophic backtracking payloads could crash the database node.
- **Resolution:** Implemented safe user input regex escaping: `str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` prior to all RegExp instantiation.

### SEC-07: Activity Logging Mismatch
- **File Path:** `backend/src/services/message.service.js`
- **Verification:** Positional params were rejected by `logActivity` parameter object destructuring.
- **Resolution:** Refactored calls to: `await activityService.logActivity({ adminUser: userId, action, module, description })`.
