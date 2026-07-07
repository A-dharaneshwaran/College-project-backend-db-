# PRODUCTION DEPLOYMENT CHECKLIST
**Date:** 2026-07-06  
**DevOps Engineer:** Principal Software Architect & DevOps Lead

This checklist outlines all requirements, configurations, environment variables, build scripts, and cloud steps needed to deploy the College Management System into production.

---

## 1. BACKEND DEPLOYMENT (Node.js/Express)

### 📋 Environment Variables
Ensure the following variables are configured in the cloud hosting provider's panel (e.g. Render, Railway, DigitalOcean):

| Key | Value Description | Example / Recommended |
|---|---|---|
| `NODE_ENV` | Run mode | `production` |
| `PORT` | Listening port | `5000` |
| `SERVER_URL` | Production URL of backend | `https://api.kce.edu` |
| `MONGODB_URI` | Production Atlas Connection String | `mongodb+srv://<user>:<password>@cluster.mongodb.net/kce` |
| `JWT_SECRET` | 256-bit cryptographic signing key | *Generate using `openssl rand -hex 32`* |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `CORS_ORIGIN` | Allowed Frontend URL (or comma-separated) | `https://kce-app.vercel.app` |
| `RATE_LIMIT_WINDOW_MS`| Rate limiting window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX` | Request limit per IP per window | `100` |

### 🛠️ Build & Run Commands
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start` (or `node src/server.js`)

### 🗄️ Database Step (MongoDB Atlas Whitelisting)
> [!IMPORTANT]
> Because Atlas enforces IP access control, you must log in to your MongoDB Atlas account and whitelist the production backend's IP address.
> 1. Go to **Network Access** -> **Add IP Address**.
> 2. For standard dynamic IP server hosts (like Render/Heroku), add `0.0.0.0/0` (Access from anywhere) or bind it to your host's static outbound IP ranges.

---

## 2. FRONTEND DEPLOYMENT (React Native / Expo Web / Vercel)

### 📋 Environment Variables
Configure the following variable in the frontend build panel (e.g. Vercel, Netlify):

| Key | Description | Example / Recommended |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Live backend API URL base | `https://api.kce.edu/api` |

### 🛠️ Export Build Steps (Expo Web Static Bundle)
1. **Build Command:** `npx expo export --platform web`
2. **Output Directory:** `dist`
3. **Framework Preset:** `Other` (or configure routing fallback to `index.html` for client-side routing support).

---

## 3. POST-DEPLOYMENT SMOKE CHECKS

Execute these checks immediately after deployment to confirm environment health:

1. **Verify Backend Health:**
   `GET https://your-backend-domain.com/health`
   - Expected: `200 OK`
   - Payload: `{"success":true,"status":"healthy","database":"connected"}`.
2. **Verify API Docs:**
   `GET https://your-backend-domain.com/api-docs`
   - Expected: Swagger documentation UI loads correctly.
3. **End-to-End Auth Smoke Check:**
   - Attempt logging in via frontend using student and faculty accounts. Confirm tokens are set in storage and requests are correctly authenticated.
