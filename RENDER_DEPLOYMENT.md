# Render Deployment Guide

## Overview
This application consists of two services:
- **Backend (mezon_admin)**: Node.js/Express API running on Docker
- **Frontend (mezon_front)**: React/Vite static site

## Environment Variables

### Backend (mezon_admin)
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Render)
- `JWT_SECRET`: Secret key for JWT tokens (auto-generated)
- `NODE_ENV`: `production`

### Frontend (mezon_front)
Required build-time environment variables:
- `VITE_API_URL`: Backend API URL (e.g., `https://mezon-admin.onrender.com`)

**Important**: For static sites on Render, environment variables must be set in the Render dashboard under "Environment" settings. They are used during the build process to embed the API URL into the compiled JavaScript.

## Deployment Steps

### First-Time Setup

1. **Backend Service**:
   - Type: Web Service (Docker)
   - Root Directory: `backend`
   - Build Command: Docker build (automatic)
   - Start Command: `npm start` (from Dockerfile)
   - Health Check Path: `/api/health`

2. **Frontend Service**:
   - Type: Static Site
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - **Environment Variables**: Add `VITE_API_URL` with backend URL

### Updating Environment Variables

After changing environment variables in Render dashboard:
1. A new deployment will be triggered automatically
2. Wait for build to complete (~2-5 minutes)
3. Verify the app works at the frontend URL

## Common Issues

### 401/404 Errors on Login
**Cause**: Frontend doesn't know the backend URL
**Solution**: 
1. Go to Render dashboard → Frontend service → Environment
2. Add/update `VITE_API_URL` to `https://mezon-admin.onrender.com`
3. Wait for automatic redeploy

### CORS Errors
**Cause**: Backend doesn't allow frontend domain
**Solution**: Backend currently allows all origins. If restricting:
```typescript
app.use(cors({
  origin: ['https://mezon-front.onrender.com', 'http://localhost:5173']
}));
```

## Local Development

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with local DATABASE_URL
npm run dev

# Frontend
cd frontend
npm install
# .env.local should have VITE_API_URL=http://localhost:4000
npm run dev
```

## Build Process

The Dockerfile for frontend now:
1. Installs dependencies
2. Builds production bundle with `VITE_API_URL` from build arg
3. Serves static files with nginx
4. Handles SPA routing (redirects to index.html)

This ensures the API URL is baked into the JavaScript at build time.
