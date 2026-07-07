# 13 BUG LIST
**Date:** 2026-07-06  
**Auditor:** QA Director & Code Reviewer

This document compiles all security vulnerabilities, lifecycle bugs, and layout issues audited, verified, and resolved across Phase XXV-A and Phase XXV-B.

---

## 1. COMPLETED SECURITY BUG FIXES

### Bug 1: IDOR on Student and Faculty Profiles
- **Path:** `backend/src/routes/student.routes.js:110` and `backend/src/routes/faculty.routes.js:110`
- **Severity:** **Critical**
- **Verification:** Verified that student ID lookup endpoints lacked role checks, allowing any authenticated student to view other profiles.
- **Fix:** Added `authorize('admin', 'faculty')` to gate access. Only admins and faculty can access individual student/faculty profile lookup endpoints.

### Bug 2: Plaintext Password Exposure in Bulk Import Response
- **Path:** `backend/src/controllers/bulk.controller.js`
- **Severity:** **High**
- **Verification:** Verified that student/faculty bulk imports returned a list of created records containing plaintext temporary passwords in the JSON payload.
- **Fix:** Stripped passwords from the JSON response. Implemented a secure in-memory server cache and tokenized credentials file download using a `credentialsDownloadId` token.

### Bug 3: Regular Expression Denial of Service (ReDoS)
- **Paths:** `paginateQuery.js`, `notification.service.js`, `message.service.js`, `message.controller.js`, `contact.controller.js`, `activityLog.service.js`
- **Severity:** **High**
- **Verification:** Verified that raw user input from queries was passed directly into `new RegExp` and `$regex` queries.
- **Fix:** Sanitized input strings using a regex character escaping utility prior to compiling regular expressions.

---

## 2. COMPLETED UI/UX BUG FIXES

### Bug 4: Polling Resume Cycle in MessageContext
- **Path:** `context/MessageContext.jsx`
- **Severity:** **Medium**
- **Verification:** Verified that `stopPolling()` cleared the `isPolling` intent state on AppState change, preventing the polling loop from resuming when the app returned to the foreground.
- **Fix:** Changed the AppState listener to clear the interval timer on backgrounding without resetting the `isPolling` intent state, allowing polling to successfully resume in the foreground.

### Bug 5: Contact Screen Registration in Layout Stack
- **Path:** `app/admin/_layout.jsx`, `app/faculty/_layout.jsx`, `app/student/_layout.jsx`
- **Severity:** **Medium**
- **Verification:** Verified that contact screens were not registered in layouts, causing navigation header glitches.
- **Fix:** Registered `contact` Stack screens across all three role layouts.

---

## 3. UNRESOLVED CRITICAL BUGS
- **Total Outstanding Bugs:** **0**
- **System Readiness Status:** **Stable**
