# FIX LOG
**Date:** 2026-07-06  
**Auditor:** Tech Lead & Principal Software Architect

This document logs all fixes applied, verified, and hardened during the stabilization phases of the College Management System.

---

## 1. COMPLETED BUG REMEDIATION LOG

### Access Controls & IDOR Protections (SEC-01 & SEC-02)
- **Problem:** Missing `authorize('admin', 'faculty')` role gates on student and faculty individual profile lookups by ID.
- **Fix:** Applied role gates to profile routes in `student.routes.js` and `faculty.routes.js`.
- **Result:** Students can only request their own profile records via token-contextual `/me` routes; access to specific lookup parameters is restricted to privileged roles.

### Plaintext Credentials Leak in Imports (SEC-04)
- **Problem:** Plaintext password fields returned in raw JSON payloads from student and faculty bulk uploads.
- **Fix:** Stripped credentials from API outputs. Created a secure in-memory server cache and tokenized credentials file download using a temporary `credentialsDownloadId` token.

### Regex Backtracking & ReDoS Prevention (SEC-05)
- **Problem:** Raw user inputs directly compiled into regular expression queries, posing catastrophic backtracking risks.
- **Fix:** Integrated regex escaping routines to filter search parameters globally.

### Notification Test Gating (SEC-06)
- **Problem:** Test notifications could be posted by any authenticated account.
- **Fix:** Added the `authorize('admin')` guard to gate `/notifications/test`.

### Activity Logging Call Integration (SEC-07)
- **Problem:** Calling signature mismatch (positional parameters sent to structured configuration parameters) prevented activity logging records from writing successfully.
- **Fix:** Restructured logger dispatch arguments.

### Layout Stack Registration (UI-01)
- **Problem:** Unregistered contact page navigation stack routes caused navigation layout formatting issues.
- **Fix:** Registered `contact` screens across all layouts.

### AppState Lifecycle Polling Resume (UI-03 & UI-04)
- **Problem:** React Native background-to-foreground transitions lost polling state, preventing automatic resume.
- **Fix:** Checked AppState status, pausing the polling interval during backgrounding without clearing the polling intent state, allowing immediate resume on foreground focus.
