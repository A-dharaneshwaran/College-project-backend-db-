# 🏗️ System Architecture Documentation

## Kathir College of Engineering Management System

This document outlines the detailed architecture, data flows, security design, and key engineering choices of the Kathir College of Engineering Management System.

---

## 📐 High-Level Architecture Overview

The system follows a standard three-tier decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Frontend)                     │
│    React Native (Expo Web / Mobile) + React Context State   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / HTTPS (JSON REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer (Backend)                 │
│    Node.js + Express.js API + Middleware Guards + Swagger  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer (Data)                     │
│               MongoDB Atlas (Cloud Cluster)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Frontend Architecture

### File-based Navigation (Expo Router)
The user interface uses **Expo Router** to manage application routes cleanly using directory structure:
- `/app/index.jsx`: Role selection and entry point.
- `/app/login.jsx`: Unified login interface handling role-based credentials.
- `/app/student/*`: Protected student layout and feature tabs (`academics`, `achievements`, `discipline`, `query`, `profile`).
- `/app/faculty/*`: Protected faculty layout (`students`, `discipline`, `updates`, `profile`).
- `/app/admin/*`: Comprehensive executive administration dashboard (`manage-students`, `manage-faculty`, `departments`, `activity-history`, `discipline`, `illegal-activities`).

### State Management & API Layer
- **Global Auth Context (`AuthContext.jsx`)**: Encapsulates user session, authentication state (`isAuthenticated`, `isLoading`), token persistence in `AsyncStorage`, and automatic session restoration upon application mount (`GET /api/auth/me`).
- **Centralized API Client (`services/api.js`)**: Encapsulates HTTP requests (`GET`, `POST`, `PUT`, `DELETE`), binary file uploads via `multipart/form-data`, blob downloads for Excel reports, and automatic injection of the JWT `Authorization: Bearer <token>` header.

---

## ⚙️ Backend Architecture

### Layered Architecture Pattern
The backend adheres strictly to the **Controller-Service-Model** architectural pattern:
1. **Routes Layer (`src/routes/`)**: Defines HTTP endpoints, applies validation middleware, and embeds inline OpenAPI 3.0 JSDoc annotations.
2. **Controllers Layer (`src/controllers/`)**: Manages HTTP request parsing, response status formatting, and delegates complex business logic to services.
3. **Services Layer (`src/services/`)**: Implements business rules, performs database transactions via Mongoose, triggers automatic activity logging, and constructs analytical summaries.
4. **Models Layer (`src/models/`)**: Defines Mongoose ODM schemas, field validation rules, data indexes, and pre-save password hashing hooks.

---

## 🗄️ Database Schema & Entity Relationships

```
              ┌───────────┐
              │   User    │
              └─────┬─────┘
                    │ 1:1
        ┌───────────┼───────────┐
        │ 1:1       │ 1:1       │ 1:1
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Student │ │ Faculty │ │  Admin  │
   └────┬────┘ └────┬────┘ └─────────┘
        │           │
        │ N:1       │ N:1
        ▼           ▼
   ┌─────────────────────┐
   │     Department      │
   └──────────┬──────────┘
              │ 1:N
              ▼
   ┌─────────────────────┐
   │       Subject       │
   └──────────┬──────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
  ┌───────────┐ ┌───────┐
  │Attendance │ │ Marks │
  └───────────┘ └───────┘
```

---

## 🔐 Authentication & Authorization Lifecycle

```
Client                      Backend Server                  MongoDB Atlas
  │                              │                                │
  │─── POST /api/auth/login ────>│                                │
  │     { email, password }      │─── Find User by Email ────────>│
  │                              │<── User Doc + Password Hash ───│
  │                              │                                │
  │                              │─── Compare Bcrypt Hash         │
  │                              │─── Sign JWT Token              │
  │<── 200 OK { token, user } ───│                                │
  │                              │                                │
  │                              │                                │
  │─── GET /api/students ───────>│                                │
  │     Bearer <token>           │─── Verify JWT Token            │
  │                              │─── Check User Role ('admin')   │
  │                              │─── Fetch Query ───────────────>│
  │<── 200 OK { data } ──────────│<── Document Stream ────────────│
```

---

## 🛡️ Security Architecture & Defensive Design

1. **Password Security**: Passwords are never stored in plain text. They are hashed using `bcryptjs` with 10 salt rounds before persistence. The `password` field is configured with `select: false` in Mongoose to prevent accidental leaks.
2. **Role-Based Guards (`protect` & `authorize`)**: Router endpoints are guarded by higher-order Express middleware that verifies token validity and enforces strict role hierarchy (`student`, `faculty`, `admin`).
3. **Error Sanitization**: In production mode (`NODE_ENV=production`), global error handling middleware suppresses internal stack traces, file paths, and database execution details from HTTP responses while maintaining detailed server-side error logs.
4. **Audit Trail Automation**: All modifications to core collections executed by administrators trigger asynchronous logging into the `ActivityLogs` collection, detailing the target module, action type, IP address, and human-readable description.
