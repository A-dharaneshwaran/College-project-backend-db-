# 08 API VERIFICATION
**Date:** 2026-07-06  
**Auditor:** QA Automation Lead

This document records the endpoint contract audits, response formats, HTTP method structures, status codes, and authorization validations for the API.

---

## 1. ENDPOINT AUTH & ROLE MATRIX

All endpoints are mapped to their required access levels:

| Route Pattern | HTTP Method | Auth Gated | Target Roles | Status |
|---|---|---|---|---|
| `/api/auth/login` | POST | ❌ No | Public | **PASS** |
| `/api/auth/register` | POST | Yes | `admin` | **PASS** |
| `/api/students` | POST | Yes | `admin` | **PASS** |
| `/api/students/:id` | GET | Yes | `admin`, `faculty` | **PASS** |
| `/api/students/:id` | PUT / DELETE | Yes | `admin` | **PASS** |
| `/api/faculty` | POST | Yes | `admin` | **PASS** |
| `/api/faculty/:id` | GET | Yes | `admin`, `faculty` | **PASS** |
| `/api/faculty/:id` | PUT / DELETE | Yes | `admin` | **PASS** |
| `/api/notifications/test` | POST | Yes | `admin` | **PASS** |
| `/api/bulk/students/import`| POST | Yes | `admin` | **PASS** |
| `/api/bulk/faculty/import` | POST | Yes | `admin` | **PASS** |
| `/api/bulk/students/credentials`| POST| Yes | `admin` | **PASS** |

---

## 2. RESPONSE FORMAT CONSISTENCY
All API responses return consistent JSON structures using `ApiResponse` and `ApiError` utilities:

### Success Response Format (200 / 201)
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

### Error Response Format (400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "message": "Error details and description",
  "errors": [ ... ]
}
```

---

## 3. FILE DOWNLOAD & STREAM CONTRACTS
- **Template Downloads:** `GET /api/bulk/students/template` and `GET /api/bulk/faculty/template` set correct `Content-Type` headers (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) and stream raw Excel buffers directly.
- **Bulk Exports:** `GET /api/bulk/students/export` and `GET /api/bulk/faculty/export` dynamically stream CSV/XLSX attachments based on query format parameters.
- **Credentials Report:** `/api/bulk/*/credentials` endpoint successfully checks temporary download tokens, retrieves plaintext credentials from cache, streams the spreadsheet, and purges the temporary cache.
