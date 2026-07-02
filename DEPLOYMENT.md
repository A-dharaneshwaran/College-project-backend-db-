# 🚀 Production Deployment Guide

## Kathir College of Engineering Management System

This guide outlines the production deployment procedure for both the Express.js Backend API and the React Native Expo Frontend application.

---

## 📋 Pre-Deployment Checklist

- [x] All environment variables defined in `.env` files.
- [x] MongoDB Atlas network access configured to allow production server IP addresses.
- [x] `JWT_SECRET` set to a strong, cryptographically random string.
- [x] Production CORS origins defined.
- [x] Rate limiting enabled for public API endpoints.
- [x] Automated test suite passing (53/53 endpoints).

---

## 🌐 1. Backend Deployment (Render / Heroku / Railway / DigitalOcean)

### Environment Variables for Production Host
Configure the following environment variables in your hosting dashboard:

```ini
NODE_ENV=production
PORT=5000
SERVER_URL=https://your-backend-domain.onrender.com
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/kce_management?retryWrites=true&w=majority
JWT_SECRET=c8f92a10e7b441169c20a6e54f3b890123456789abcdef0123456789abcdef
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Deploying to Render.com (Web Service)
1. Connect your GitHub repository to Render.
2. Select **Web Service**.
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all production environment variables listed above.
7. Deploy. Your API will be live at `https://your-backend-domain.onrender.com`.

---

## 💻 2. Frontend Deployment (Vercel / Netlify)

### Building the Expo Web Production Bundle
To compile the React Native Expo application into a static production web bundle:

```bash
# From project root
npm run build:web # or npx expo export --platform web
```
This generates an optimized static bundle in the `dist/` or `web-build/` directory.

### Deploying to Vercel
1. Connect your GitHub repository to Vercel.
2. Set **Framework Preset**: `Other` or `Expo`.
3. Set **Build Command**: `npx expo export -p web`
4. Set **Output Directory**: `dist`
5. Configure Environment Variable:
   ```ini
   EXPO_PUBLIC_API_URL=https://your-backend-domain.onrender.com/api
   ```
6. Deploy.

---

## 🍃 3. MongoDB Atlas Configuration

1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Network Access** → Click **Add IP Address**.
3. For production cloud hosting (e.g., Render/Vercel), add `0.0.0.0/0` (Allow access from anywhere) or specify your host's dedicated IP ranges.
4. Database Seeding (Initial setup only):
   ```bash
   cd backend
   npm run seed
   ```

---

## 🔍 Post-Deployment Verification Checklist

Once deployed, execute the following smoke tests to confirm deployment health:
1. **API Health Check**: `GET https://your-backend-domain.onrender.com/health`
   - Expected: `200 OK` with `{"success": true, "status": "healthy", "database": "connected"}`.
2. **Swagger UI**: Navigate to `https://your-backend-domain.onrender.com/api-docs`. Confirm all endpoints match production URL.
3. **Authentication Smoke Test**: Attempt logging into the deployed web application with student and admin credentials.
