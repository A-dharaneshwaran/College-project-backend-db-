# 05 DATABASE REVIEW
**Date:** 2026-07-06  
**Auditor:** Database Architect

This document outlines the schema design, index patterns, transactional behavior, cascading rules, and data integrity constraints in the MongoDB database layer.

---

## 1. SCHEMA VALIDATION & INTEGRITY CONSTRAINTS
Schemas are defined using Mongoose models. Data types, validation constraints, and defaults are enforced at the schema level:

- **Unique Constraints:** Enforced on `User.email` (implicitly indexed via Mongoose unique: true), `Student.registerNumber`, and `Faculty.employeeId`.
- **References Constraints:** References are mapped using Mongoose ObjectIds (`ref` definitions):
  - `Student.user` references `User`
  - `Student.department` references `Department`
  - `Faculty.department` references `Department`
  - `Subject.faculty` references `Faculty`
  - `Subject.department` references `Department`
  - `DisciplineReport.students` references array of `Student`

---

## 2. CASCADING OPERATIONS AUDIT
We audited the cascades triggered during the deletion of user documents:

### Student Deletion Cascade
- **File:** `backend/src/services/student.service.js:99`
- **Actions:**
  - Cascades delete to `Attendance` records.
  - Cascades delete to `Marks` records.
  - Cascades delete to `Query` records.
  - Cascades delete to `Achievement` records.
  - Cascades delete to `IllegalActivity` logs.
  - Cascades delete to `Notification` records.
  - Updates `DisciplineReport` records. If no students remain, the discipline report is deleted.
  - Deletes `Student` record and the parent `User` record.
- **Status:** **PASS**

### Faculty Deletion Cascade
- **File:** `backend/src/services/faculty.service.js:117`
- **Actions:**
  - Updates matching `Department` records HOD pointer to `null`.
  - Updates matching `Subject` records faculty pointer to `null`.
  - Cascades delete to `Notification` records.
  - Cascades delete to `DisciplineReport` records.
  - Deletes `Faculty` record and the parent `User` record.
- **Status:** **PASS**

---

## 3. INDEX STRATEGY AUDIT

All queries are evaluated against database indices to prevent full-collection scans:

- **Compound Indexing:** `Student.index({ department: 1, year: 1, semester: 1 })` maps academic lookup filters.
- **Search Optimization:** `User.index({ name: 1 })` and `User.index({ role: 1 })` accelerate global user listing, directory, and contact lookups.
- **Foreign Key Indexing:** References like `Conversation.index({ participants: 1 })` ensure messaging lookups scale efficiently under large conversation sets.
