# 🎓 Kathir College of Engineering — Management System API & Web App

A production-ready, full-stack enterprise College Management System built with **React Native (Expo Web)**, **Node.js**, **Express.js**, and **MongoDB Atlas**.

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Database Design & Collections](#database-design--collections)
- [User Roles & Access Control](#user-roles--access-control)
- [API Overview & Swagger Docs](#api-overview--swagger-docs)
- [Getting Started & Installation](#getting-started--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment](#deployment)
- [License & Author](#license--author)

---

## 🏫 Project Overview
The **Kathir College of Engineering Management System** is a comprehensive campus management solution designed to streamline academic administration, student tracking, faculty operations, and institutional governance. It provides dedicated modules for Students, Faculty, and Administrators with role-based access control, real-time analytics, automated audit logging, and bulk data operations.

---

## ✨ Key Features

### 👨‍🎓 Student Module
- **Dashboard & Analytics**: Real-time attendance percentage, CGPA tracking, backlog metrics, and active campus alerts.
- **Academic Records**: Comprehensive semester-by-semester grade breakdown, internal marks, and subject credits.
- **Conduct & Discipline**: Transparent view of conduct reports and resolution statuses.
- **Achievements & Awards**: Track academic, sports, and cultural achievements.
- **Helpdesk Queries**: Raise support tickets to administration and track real-time resolution progress.

### 👩‍🏫 Faculty Module
- **Student Directory**: Access assigned department students and academic profiles.
- **Attendance & Marks Management**: Record daily attendance and upload exam marks individually or in bulk.
- **Discipline Reporting**: File student conduct reports directly to campus administration.
- **Course & Department Analytics**: View course enrollment and department academic progress.

### 🛡️ Admin Module
- **Enterprise Management**: Full CRUD operations for Students, Faculty, Departments, and Subjects.
- **Bulk Import / Export**: High-performance Excel/CSV bulk import with automated account credential generation and data export filters.
- **Automated Activity Logging**: Immutable audit logs tracking every administrative action (Create, Update, Delete) with IP and timestamp logging.
- **Governance & Compliance**: Manage institutional announcements, discipline resolution, and regulatory breaches.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo) | Cross-platform UI (Web, Android, iOS) using React 19 & Reanimated |
| **Backend** | Node.js & Express.js | High-performance RESTful API framework |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL database with Mongoose ODM |
| **Authentication** | JWT & Bcrypt | Statistically secure JSON Web Tokens with salted password hashing |
| **Documentation**| OpenAPI 3.0 / Swagger | Automated interactive API documentation via `swagger-jsdoc` |
| **Styling** | Vanilla CSS / Dynamic HSL | Sleek glassmorphic dark/light UI tokens |

---

## 📁 Folder Structure

```
College_project_frontend/
├── app/                      # Expo Router File-based Navigation
│   ├── index.jsx             # Landing Page & Role Gateway
│   ├── login.jsx             # Authentication Screen
│   ├── student/              # Student Portal Screens
│   ├── faculty/              # Faculty Portal Screens
│   └── admin/                # Admin Management Portal Screens
├── backend/                  # Express.js REST API Backend
│   ├── src/
│   │   ├── config/           # Environment & Database Configuration
│   │   ├── controllers/      # Route Request Controllers
│   │   ├── middleware/       # JWT Auth, Validation & Error Handlers
│   │   ├── models/           # Mongoose ODM Schemas (15 Collections)
│   │   ├── routes/           # Express Route Handlers with Swagger JSDoc
│   │   ├── services/         # Business Logic & Database Layer
│   │   ├── utils/            # ApiError & Helper Utilities
│   │   ├── app.js            # Express App Setup & Middleware Stack
│   │   └── server.js         # HTTP Server Entry Point
│   └── .env.example          # Backend Environment Template
├── context/                  # Global React Context (AuthContext)
├── services/                 # Frontend Centralized API Client (`api.js`)
├── .env.example              # Frontend Environment Template
├── DEPLOYMENT.md             # Production Deployment Guide
├── PROJECT_ARCHITECTURE.md   # Deep-dive System Architecture
└── README.md                 # Main Project Documentation
```

---

## 🗄️ Database Design & Collections

The system utilizes **15 MongoDB Collections** linked via object references:
1. `Users`: Core credentials and role metadata.
2. `Students`: Student profile, registration number, year/semester, and parent details.
3. `Faculty`: Employee ID, designation, and assigned department.
4. `Admins`: Executive permissions and employee records.
5. `Departments`: Academic departments and department heads.
6. `Subjects`: Courses, codes, credits, and assigned faculty.
7. `Attendance`: Daily attendance records linked to student and subject.
8. `Marks`: Exam scores (Internal 1, Internal 2, Semester) per subject.
9. `Achievements`: Co-curricular awards and recognitions.
10. `DisciplineReports`: Conduct warnings and resolutions.
11. `Queries`: Student support tickets.
12. `Announcements`: Targeted campus notices.
13. `IllegalActivities`: Regulatory compliance incidents.
14. `Notifications`: User notifications.
15. `ActivityLogs`: System audit trail for administrative actions.

---

## 🔐 User Roles & Credentials (Demo Data)

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `student@kce.edu` | `Student@123` | Personal Dashboard, Academics, Queries, Attendance |
| **Faculty** | `sharma.cse@college.edu` | `Faculty@123` | Department Students, Attendance Upload, Marks Entry |
| **Admin** | `admin@kce.edu` | `Admin@123` | Full System Control, CRUD, Bulk Import/Export, Audit Logs |

---

## 📖 API Overview & Swagger Documentation

Interactive OpenAPI 3.0 documentation is automatically served by the backend:
- **Swagger UI URL**: `http://localhost:5000/api-docs`
- **Specification Features**:
  - Full authorization testing via JWT Bearer Token (`bearerAuth`).
  - Includes request body schemas, query parameters, and example responses for all **52 endpoints** across **15 API groups**.

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas Account**: Or a local MongoDB server instance.

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file inside the `backend/` directory using `backend/.env.example`:
```ini
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/kce_management?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend Configuration (`.env`)
Create a `.env` file in the root project directory using `.env.example`:
```ini
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
*The backend will connect to MongoDB Atlas and start on `http://localhost:5000`.*

### 2. Start the Frontend Application (In a separate terminal)
```bash
# From project root
npm install
npm start
```
- Press `w` to open in browser (`http://localhost:8081`).
- Press `a` or scan QR code for Android via Expo Go.

---

## 🧪 Testing & Verification
The codebase has undergone a complete 53-endpoint automated test suite verification.
To verify system health:
- Health Check: `GET http://localhost:5000/health`
- Root Server API info: `GET http://localhost:5000/`

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

**Author**: Kathir College of Engineering Development Team
