# 03 PERFORMANCE AUDIT
**Date:** 2026-07-06  
**Auditor:** Senior Performance Engineer

This document audits backend and frontend performance bottlenecks, polling logic overheads, database aggregations, and layout rendering within the College Management System.

---

## 1. DATABASE COMPENSATIONS & QUERY EFFICIENCY

### Index Usage Analysis
- **User Collection:** Unique index on `email`, standalone indexes on `name`, `role`, and `isActive`.
- **Student Collection:** Compound index on `[department, year, semester]` matches the academic filter patterns on the student list page. Unique index on `registerNumber`.
- **Faculty Collection:** Standalone indexes on `department` and unique index on `employeeId`.
- **DisciplineReport Collection:** Indexes on `students`, `status`, and `severity`.

### Query Aggregations
- Messaging system search (`searchMessages`) utilizes MongoDB pipelines (`$match`, `$sort`, `$limit`, `$lookup`, `$unwind`, `$project`). The search matches user conversation IDs, matches queries using `$regex`, and limits results to 20, keeping lookup operations efficient.

---

## 2. BACKEND API COMPENSATIONS

- **Rate Limiting:** Protects endpoints in production from spam/DDoS.
- **Pagination:** Global pagination helper (`paginateQuery`) limits page loads to maximum size 100 to prevent large memory spikes.
- **Payload Size:** Serves static uploads (`/uploads`) directly using `express.static` with caching support.

---

## 3. FRONTEND / MOBILE RENDERING PERFORMANCES

### Re-renders & React Contexts
- **MessageContext.jsx:** Manages conversations state, unread counts, and active interval indicators.
- **Polling Loop Tuning:**
  - Timer pauses when the app goes background to save mobile battery and thread bandwidth.
  - Toggling message filters (e.g. active vs archived) clears active interval timers before spinning up a new loop, eliminating overlapping duplicate fetches.
- **FlatList Optimization:** Chat screen renders using `FlatList` with standard `keyExtractor={item => item._id}` and `scrollEventThrottle={16}` for smooth scrolling on lists of any size.
- **Asset Loader:** Serves avatars and templates using optimized locally-cached static assets and Expo icons.
