# 💬 Conversation Creation Report (Phase XXIV-A)

**Kathir College of Engineering Management System**
**Date**: July 2, 2026

---

## 📋 Endpoint Specifications
- **Route**: `POST /api/messages/conversations`
- **Method**: `POST`
- **Body Schema**:
  ```json
  {
    "type": "direct",
    "participants": ["targetUserId"]
  }
  ```
- **Response Format**: Direct JSON Object containing the populated conversation document.

---

## 🔄 Conversation Deduplication Logic

To guarantee that duplicate direct chats are never created between the same two users, the backend implements the following lifecycle checks:

```
[Selected Target User]
       │
       ▼
[GET/POST Request to /api/messages/conversations]
       │
       ▼
[Check if type === 'direct']
       │
       ▼
[Query Mongoose: Conversation.findOne({ type: 'direct', participants: { $all: participants, $size: 2 } })]
       ├──► (Existing Match Found) ──► Populate participants ──► Return conversation (HTTP 200/201)
       └──► (No Match Found) ──────► Create new Conversation ──► Populate participants ──► Return (HTTP 201)
```

---

## 🧪 Verification Log & Diffs

1. **Backend Integration Test**:
   - Simulated creating a direct conversation twice between Admin (`Principal Administrator`) and Faculty (`Dr. A. Sharma`).
   - Run results:
     - Conversation 1 ID: `6a45bf71d1bdf4d0765b23a6`
     - Conversation 2 ID: `6a45bf71d1bdf4d0765b23a6`
     - Verification Verdict: **`PASS`**. Both attempts resolved to the same unique conversation ID, demonstrating correct deduplication and reuse logic.

2. **Frontend UI Interaction Flow**:
   - Users type in the debounced **"🔍 Search users to chat..."** input.
   - User result card is rendered displaying basic details.
   - Selecting a card invokes `handleStartChat` which issues the `POST` request.
   - The returned conversation object is set as the `activeConversation`.
   - The active conversation panel automatically updates, loading the message threads and setting focus to the input element.
