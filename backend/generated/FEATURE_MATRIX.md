# Feature Matrix — Messaging System

This MERN feature matrix maps all features from Phases XXIV-A through XXIV-C.2 to their specific backend Mongoose/Express logic and React Native/Web components.

| Phase | Feature Name | Backend Logic / File / Query | Frontend Component / View | Status |
|---|---|---|---|---|
| **XXIV-A** | User Search | `/api/messages/search-users` (regex queries on User, Student, Faculty collections) | `messages.jsx`: Search Bar results overlay | **Complete** |
| **XXIV-A** | Conversation Reuse | `Conversation.findOne({ type: 'direct', participants: { $all: participants } })` | `ContactDirectory.jsx:120-134` (routes to message screen with active conversation ID) | **Complete** |
| **XXIV-A** | Role-Based Search Visibility | Checks `currentUser.role === 'student'` and limits student-student lookups to same department | `ContactDirectory.jsx:90-117` | **Complete** |
| **XXIV-B** | Contact Directory API | `/api/contacts?page=1&limit=20` with text search matching employee/register IDs | `ContactDirectory.jsx:72-100` | **Complete** |
| **XXIV-B** | Contacts Filters/Sort | Picker hooks binding role/department params; sorting by name, department, role | `ContactDirectory.jsx:217-267` | **Complete** |
| **XXIV-B** | Profile Modal Actions | Detailed profile views with linking hooks for phone calls and email clients | `ContactDirectory.jsx:389-445` (linking APIs) | **Complete** |
| **XXIV-C.1**| Pin / Unpin Chats | `Conversation.findByIdAndUpdate` pulling/pushing requesting user ID to `pinnedBy` | `ConversationList.jsx:169-184` (actions modal options) | **Complete** |
| **XXIV-C.1**| Archive / Restore Chats | `Conversation.findByIdAndUpdate` pulling/pushing user ID to `archivedBy` | `ConversationList.jsx:186-201` (actions modal options) | **Complete** |
| **XXIV-C.1**| Conversation Search | Debounced filtering on client-side state across name, email, department, last message | `messages.jsx`: Conversation search bar | **Complete** |
| **XXIV-C.1**| Sorting Rules | Aggregation sorting: `{ isPinned: -1, hasUnread: -1, lastMessageAt: -1 }` | `ConversationList.jsx:58` (pinned background highlighting) | **Complete** |
| **XXIV-C.2**| Message Reply | `/api/messages/:id` passing `replyTo` parent message ID | `MessageBubble.jsx:45-54` (reply parent block), `ChatInput.jsx:22-38` (input reply preview) | **Complete** |
| **XXIV-C.2**| Message Edit | `Message.findOne` checking sender match and `Date.now() - message.createdAt < 15 * 60 * 1000` | `MessageBubble.jsx:108-112` (`(edited)` indicator), `ChatInput.jsx:40-56` (edit input mode) | **Complete** |
| **XXIV-C.2**| Message Delete | Soft-deletes by setting `isDeleted: true` in DB. Projects `"This message was deleted"` | `MessageBubble.jsx:71-77` (muted italic text rendering) | **Complete** |
| **XXIV-C.2**| Message Forward | `/api/messages/:id` passing `forwardedFrom` message ID | `messages.jsx:Modal` (conversation selector scroll), `MessageBubble.jsx:34-40` ("Forwarded" tag) | **Complete** |
| **XXIV-C.2**| Date Separators | Injected into FlatList array dynamically between different dates | `messages.jsx:addDateHeaders` (Yesterday, Today, and full dates rendering) | **Complete** |
| **XXIV-C.2**| Intelligent Auto-Scroll | Monitored scroll coordinates `offsetY < 100` | `messages.jsx:handleScroll` (toggles floating button and scrolls to bottom) | **Complete** |
| **XXIV-C.2**| Skeletons & Empty Views| Renders alternating bubbles during fetch, renders comment illustration for empty chats | `messages.jsx`: `renderSkeleton`, `renderEmptyState` | **Complete** |
