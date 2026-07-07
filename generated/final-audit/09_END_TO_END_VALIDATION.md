# 09 END-TO-END VALIDATION
**Date:** 2026-07-06  
**Auditor:** QA Lead & Senior MERN Engineer

This document traces the complete execution flow of critical workflows from the mobile UI down to Mongoose model actions and DB queries, verifying data transport and response rendering.

---

## 1. END-TO-END TRANSACTION PATHS

### 🔐 Transaction 1: Authentication Flow
1. **Frontend:** Login component takes email/password inputs, triggers `AuthContext.login()`, and POSTs JSON payloads to the login endpoint.
2. **API Router:** `backend/src/routes/auth.routes.js` receives `POST /login`, validates email format via validator middleware, and hands off to the controller.
3. **Controller:** `backend/src/controllers/auth.controller.js` maps arguments, fetches the user using `User.findOne({ email }).select('+password')`, and compares hash using `comparePassword()`.
4. **Mongoose/DB:** Checks the `User` collection. Returns matching document.
5. **Response:** Controller signs a JWT token and returns `200 OK` with user details.
6. **Frontend Render:** `AuthContext` saves the JWT to AsyncStorage and updates internal state, routing the user to the correct role dashboard (`/admin`, `/faculty`, or `/student`).
- **Verdict:** **PASS**

---

### 📥 Transaction 2: Bulk Import & Credentials Download
1. **Frontend:** Admin uploads an Excel file from `manage-students.jsx`, sending a multipart form-data payload to `/bulk/students/import`.
2. **API Router:** Route processes files via `multer` memory storage and forwards the file buffer to the controller.
3. **Controller/Service:** `bulkImport.service.js` parses the Excel buffer, validates headers/columns, hashes generated user passwords, and inserts rows into `User` and `Student` collections.
4. **Mongoose/DB:** Creates `User` and `Student` records in a MongoDB transaction.
5. **Hardening Caching:** Plaintext passwords are cached in `credentialsCache` associated with a unique UUID (`credentialsDownloadId`), and are stripped from the controller JSON response.
6. **Response:** Returns import details and the `credentialsDownloadId` token.
7. **Frontend Render:** Modal displays import counts and shows the "Download Credentials" button. Clicking this triggers a POST request with the token to download the Excel credentials file securely.
- **Verdict:** **PASS**

---

### 💬 Transaction 3: Messaging Polling & Thread Rendering
1. **Frontend:** Opening a thread in `messages.jsx` mounts the chat window, calling `startPolling()` in `MessageContext.jsx` to fetch conversations on a 5-second interval.
2. **API Router:** Mounts `GET /api/messages/:conversationId`. Enforces `protect` validation.
3. **Controller/Service:** Service validates that the caller is a participant in the conversation, queries messages, sorts them descending, and applies population rules to the sender names and attachments.
4. **Mongoose/DB:** Executes `$match` and `$sort` aggregations in the `Message` collection.
5. **Response:** Returns list of messages.
6. **Frontend Render:** `addDateHeaders` parses the array, inserts date headers, and FlatList renders the feed from the bottom (newest) to the top (oldest) using the `inverted` layout.
- **Verdict:** **PASS**
