# 02 SECURITY AUDIT
**Date:** 2026-07-06  
**Auditor:** Security Auditor & Senior Security Engineer

This document presents a comprehensive security audit of the College Management System using OWASP Top 10 guidelines and source-code vulnerability scanning.

---

## 1. OWASP TOP 10 ASSESSMENT

### A01:2021-Broken Access Control (Low / Informational - Previously High)
- **Vulnerability:** Unauthenticated students were previously able to enumerate personal data of students/faculty by calling `GET /api/students/:id` or `GET /api/faculty/:id`.
- **Remediation:** Both routes now require `authorize('admin', 'faculty')` roles. Only administrative users and staff can access individual student/faculty profile lookup endpoints.
- **Vulnerability:** Gated `/api/notifications/test` behind `authorize('admin')` to prevent non-privileged users from triggering mock notification dispatches.

### A02:2021-Cryptographic Failures (Low / Informational - Previously High)
- **Vulnerability:** Bulk imports returned temporary credentials (including plaintext passwords) directly inside the JSON response.
- **Remediation:** Plaintext passwords are deleted from the JSON response before sending it to the client. Instead, the server uses a secure temporary in-memory credentials cache and returns a `credentialsDownloadId` token. The client can request the spreadsheet download securely using this token, and the credentials cache is cleared after retrieval.
- **Result:** Plaintext passwords are never leaked in API response JSON payloads or client-side logs.

### A03:2021-Injection (Low / Informational - Previously High)
- **Vulnerability:** Regular Expression Injection (ReDoS). Unsanitized search queries passed directly into Mongoose `$regex` filters or `new RegExp(...)` constructs could lead to catastrophic backtracking.
- **Remediation:** Implemented character escaping for all regular expression constructs:
  ```javascript
  const escapedSearch = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ```
  This sanitizes global searches, messages, and contact directories.

### A04:2021-Insecure Design (Low)
- **Vulnerability:** Rate limiting was disabled globally.
- **Remediation:** Configured `express-rate-limit` inside `app.js` to protect `/api/` endpoints in production with a max ceiling of 100 requests per 15 minutes per IP.

---

## 2. RATING & SEVERITY ASSESSMENT

Following modifications completed in Phase XXV-A, there are **no critical or high vulnerability classes** remaining:

| Issue Reference | Vulnerability | Severity | Remediation | Status |
|---|---|---|---|---|
| **SEC-01** | Student Profile Access IDOR | Critical | Gated with `authorize('admin', 'faculty')` | **FIXED** |
| **SEC-02** | Faculty Profile Access IDOR | Critical | Gated with `authorize('admin', 'faculty')` | **FIXED** |
| **SEC-03** | Test Notification Auth Bypass | High | Restricted endpoint to `admin` | **FIXED** |
| **SEC-04** | Plaintext Credentials Leak | High | Created server credentials cache and tokenized download | **FIXED** |
| **SEC-05** | Regex Injection ReDoS | High | Escaped query inputs in regex compilers | **FIXED** |

---

## 3. SECURITY COMPLIANCE ASSURANCES
- **helmet configuration:** Active, setting secure HTTP headers (e.g., X-Frame-Options, X-Content-Type-Options) with `crossOriginResourcePolicy: false` to allow static content loading during development.
- **cors:** Configured dynamically using wildcard in dev and bounded configuration settings in production environment variables.
- **jwt handling:** Signed using HMAC-SHA256, utilizing `JWT_SECRET` key, expiring in 7 days.
