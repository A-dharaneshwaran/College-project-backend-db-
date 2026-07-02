# Conversation Management Backend Report — Phase XXIV-C.1

## 1. Objective
Provide production-quality conversation management features (Pin/Unpin and Archive/Restore) in a fully backward-compatible, safe manner with zero database structure refactoring.

## 2. API Endpoints Exposed
We implemented and registered the following new PUT routes:
- `PUT /api/messages/conversations/:id/pin`: Toggles whether the calling user has pinned this conversation.
- `PUT /api/messages/conversations/:id/archive`: Toggles whether the calling user has archived this conversation.

Additionally, the existing conversation fetch route was updated:
- `GET /api/messages/conversations?limit=50&archived=true`: Retreives only archived conversations.
- `GET /api/messages/conversations?limit=50&archived=false`: Retrieves active conversations (default).

## 3. Database Schema Reuse
We strictly adhered to the "Safe Implementation Mode" guidelines and avoided modifying the database schema. Instead, we reused the existing arrays on the `Conversation` schema:
- `pinnedBy`: Array of user ObjectIds. When a user pins a conversation, their ID is pushed here.
- `archivedBy`: Array of user ObjectIds. When a user archives a conversation, their ID is pushed here.

## 4. Aggregation and Sorting Pipeline
Inside `message.service.js`, the `getConversations` aggregation pipeline was updated to dynamically project the following flags for the requesting user:
- `isPinned`: Evaluates to `1` (true) if the user's ObjectId is inside the `pinnedBy` array, otherwise `0` (false).
- `hasUnread`: Evaluates to `1` if the current user's unread count for the conversation is greater than `0`.
- `isArchived`: Evaluates to `true` if the user's ObjectId is in the `archivedBy` array.

The conversations are sorted with the following priority order:
1. **Pinned** (descending)
2. **Unread** (descending)
3. **Latest Activity** (`lastMessageAt` descending)

This enforces the sorting rules requested: `Pinned -> Unread -> Latest Activity`.

## 5. Participant Enrichment (Lookup & Populate)
For each conversation in the output list:
- We execute a post-aggregation lookup querying the `Student` and `Faculty` collections.
- We resolve the participant's name, profile photo, user role, and department code (e.g. "CSE", "ECE").
- This populates the conversation card layout with all required user metadata without complex database join overhead.
- Initials are automatically calculated as fallbacks (e.g., "Principal Administrator" -> "PA").

## 6. Backward Compatibility
All existing response payloads are fully preserved. No existing client-side integrations are broken.
