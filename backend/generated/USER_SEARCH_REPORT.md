# 🔍 User Search Report (Phase XXIV-A)

**Kathir College of Engineering Management System**
**Date**: July 2, 2026

---

## 📋 Endpoint Specifications
- **Route**: `GET /api/messages/search-users`
- **Query Parameter**: `q=<search_string>`
- **Authentication**: JWT Protected (via `protect` middleware)
- **Response Format**: Direct JSON Object (`{ success: true, data: [...] }`)

---

## 🛡️ Role-Based Search Matrix

The search interface enforces strict privacy boundaries and access guidelines:

| Logged-In Role | Target Profile | Visibility Rule | Assertion Status |
| :--- | :--- | :--- | :---: |
| **Admin** | Student | Visible (All Departments) | 🟢 **PASS** |
| **Admin** | Faculty | Visible (All Departments) | 🟢 **PASS** |
| **Admin** | Admin | Visible | 🟢 **PASS** |
| **Faculty** | Student | Visible (All Departments) | 🟢 **PASS** |
| **Faculty** | Faculty | Visible (All Departments) | 🟢 **PASS** |
| **Faculty** | Admin | Visible | 🟢 **PASS** |
| **Student** | Student | Visible **only** if in the same department | 🟢 **PASS** |
| **Student** | Student | **Hidden** if in a different department | 🟢 **PASS** |
| **Student** | Faculty | Visible (All Departments) | 🟢 **PASS** |
| **Student** | Admin | Visible | 🟢 **PASS** |

---

## 🔒 Data Protection & Field Redaction

To prevent exposure of sensitive student/faculty data, the search query only returns a redacted sub-document per user:

```json
{
  "userId": "ObjectId",
  "name": "string",
  "role": "string",
  "email": "string",
  "avatar": "string",
  "department": "string (Department Name (Code))",
  "registerNumber": "string (students only)",
  "employeeId": "string (faculty only)",
  "designation": "string (faculty only)"
}
```

*Note: Sensitive fields like passwords, parent details, salary logs, joining/admission dates, and internal hashes are completely excluded.*

---

## 🧪 Search Accuracy & Limits Verification

1. **Self-Exclusion**: The current logged-in user is explicitly omitted from search suggestions via `{ _id: { $ne: currentUser._id } }`.
2. **Cap Limit**: Mongoose `.limit(20)` is appended, restricting results to a maximum of 20 elements.
3. **Regex Pattern Matching**: Searches match partially on the following fields:
   - User Name
   - User Email
   - Student Register Number
   - Faculty Employee ID
   - Department Name
   - Department Code
4. **Validation Test Case**:
   - Query: `node scratch/verify_user_search.js`
   - Log Output:
     - Admin searching Student B (different dept): Found `Jatin Rao` (`PASS`)
     - Student A searching Student B (different dept): Found `null` / Blocked (`PASS`)
     - Student A searching Faculty: Found `Dr. A. Sharma` (`PASS`)
