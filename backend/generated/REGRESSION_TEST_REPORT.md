# REGRESSION TEST REPORT
**Date:** 2026-07-06  
**QA Lead:** Senior QA Automation Engineer

This report documents the verification status and outcome of regression testing conducted after implementation of all critical and high-priority fixes.

---

## 1. AUTHENTICATION & AUTHORIZATION FLOWS

| Flow / Feature | Expected Result | Actual Result | Status |
|---|---|---|---|
| **Admin Login** | Success, obtains JWT token with `admin` role | Login success, token correctly parsed. | **PASS** |
| **Faculty Login** | Success, obtains JWT token with `faculty` role | Login success, token correctly parsed. | **PASS** |
| **Student Login** | Success, obtains JWT token with `student` role | Login success, token correctly parsed. | **PASS** |
| **Self-Profile Access** | Student can access own profile via `/profile` | Correctly allowed. | **PASS** |
| **Student Access restriction** | Student receives 403 trying to access another student's profile via `GET /students/:id` | Correctly blocked with 403 Forbidden. | **PASS** |
| **Student Access restriction** | Student receives 403 trying to access any faculty profile via `GET /faculty/:id` | Correctly blocked with 403 Forbidden. | **PASS** |
| **Registration Access** | Unauthenticated user cannot register accounts. Admin authorization required. | Blocked at route level with 401/403. | **PASS** |

---

## 2. MESSAGING SYSTEM & POLING

| Feature | Verified Behavior | Status |
|---|---|---|
| **Send Message** | Messages created and successfully broadcast to participants. | **PASS** |
| **Edit/Delete Message** | Edit and delete APIs execute and update MongoDB documents. | **PASS** |
| **Message Polling** | Message polling starts on conversation mount and runs on a 5-second interval. | **PASS** |
| **Foreground Resume** | Polling successfully pauses when app goes background, and resumes when app enters foreground. | **PASS** |
| **Filter Overlaps** | Toggle archive filter refreshes conversation list without creating overlapping loops. | **PASS** |

---

## 3. CONTACT DIRECTORY & SEARCH

| Feature | Verified Behavior | Status |
|---|---|---|
| **Directory Lookup** | Contacts query retrieves matching student/faculty lists. | **PASS** |
| **Search Sanitization** | Regex special characters (e.g. `[ ]`, `*`, `+`) in search inputs do not throw DB errors or spike CPU. | **PASS** |
| **Roles Screen Navigation**| Layout navigation successfully mounts and styles the `contact` Stack screens for Admin, Faculty, and Students. | **PASS** |

---

## 4. BULK OPERATIONS & ANALYTICS

| Feature | Verified Behavior | Status |
|---|---|---|
| **Excel Export** | Analytics and student records successfully exported to Excel files. | **PASS** |
| **Secure Credentials Export** | XLSX credentials report successfully generated and downloaded without returning plaintext passwords in JSON. | **PASS** |
| **Notification Test** | POST `/api/notifications/test` only succeeds for Admin roles; non-admin users blocked with 403. | **PASS** |
