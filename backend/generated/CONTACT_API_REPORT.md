# 🔌 Contact Directory API Report (Phase XXIV-B)

**Kathir College of Engineering Management System**
**Date**: July 2, 2026

---

## 📋 Endpoint Details
- **Endpoint**: `GET /api/contacts`
- **Authentication**: JWT Required
- **Parameters**:
  - `page` (integer, default `1`)
  - `limit` (integer, default `20`, capped to `20`)
  - `search` (string, matches name, email, registerNumber, employeeId, department name/code)
  - `role` (string, `student` | `faculty` | `admin`)
  - `department` (string, ObjectId)
  - `sortBy` (string, `name` | `department` | `role`, default `name`)

---

## 🛡️ Response Field White-list
The API filters out sensitive variables to prevent leakage of credentials or internal properties:

```json
{
  "success": true,
  "data": [
    {
      "userId": "ObjectId",
      "name": "string",
      "role": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string",
      "department": "string (Department Name (Code))",
      "designation": "string (faculty only)",
      "registerNumber": "string (students only)",
      "employeeId": "string (faculty only)"
    }
  ],
  "pagination": {
    "total": 99,
    "page": 1,
    "limit": 2,
    "totalPages": 50
  }
}
```

*Note: Passwords, test flags, and system timestamps are strictly excluded.*

---

## 🧪 Integration Verification Logs
Run against MongoDB seed data:
- **Test 1**: Student Rajesh Kumar (CSE) searches student Jatin Rao (ECE) -> **0 Results** (Access Blocked)
- **Test 2**: Admin Principal Administrator searches student Jatin Rao (ECE) -> **1 Result** (Access Approved)
- **Test 3**: Page limit constraints (limit = 2) -> **2 Results returned** (Total Matches: 99)
- **Test 4**: Whitelist key check -> **PASS** (Zero unauthorized fields returned)
