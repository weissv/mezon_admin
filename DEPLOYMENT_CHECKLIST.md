# Deployment Checklist

## ✅ Pre-Deployment Checklist

### Local Development
- [ ] `.env` file exists in root directory
- [ ] Docker and Docker Compose are installed
- [ ] All containers start successfully: `docker-compose up --build`
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend API accessible at http://localhost:4000/api
- [ ] Database connection working
- [ ] Can login with default credentials
- [ ] Test script passes: `./test-setup.sh`

### Code Review
- [ ] All TypeScript builds without errors
- [ ] No console errors in browser
- [ ] CORS configuration includes all necessary origins
- [ ] Environment variables properly configured
- [ ] API endpoints return expected data
- [ ] Authentication flow works correctly

### Git Repository
- [ ] All changes committed
- [ ] `.env` is in `.gitignore` (should not be committed)
- [ ] Documentation is up to date
- [ ] README.md has correct URLs
- [ ] render.yaml is configured correctly

## 🚀 Render Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Setup frontend-backend connection and Render deployment"
git push origin main
```

### 2. Create Render Account
- [ ] Sign up at https://render.com
- [ ] Connect GitHub account
- [ ] Grant access to repository

### 3. Deploy via Blueprint
- [ ] Go to Render Dashboard
- [ ] Click "New" → "Blueprint"
- [ ] Select repository: `weissv/mezon_admin`
- [ ] Render detects `render.yaml`
- [ ] Click "Apply"

### 4. Monitor Deployment
Services that will be created:
- [ ] `mezon-admin-postgres` - Database (Free)
- [ ] `mezon-admin-backend` - API Server (Free)
- [ ] `mezon-admin-frontend` - Static Site (Free)

### 5. Verify Deployment
- [ ] All services show "Live" status
- [ ] Database migrations completed
- [ ] Backend health check passes
- [ ] Frontend loads without errors

### 6. Test Production
- [ ] Access frontend URL: `https://mezon-admin-frontend.onrender.com`
- [ ] Test API: `https://mezon-admin-backend.onrender.com/api/health`
- [ ] Login with default credentials
- [ ] Create a test record
- [ ] Verify data persistence

## 🔧 Post-Deployment Configuration

### Security
- [ ] Change default user passwords
- [ ] Review CORS settings
- [ ] Verify JWT_SECRET is auto-generated
- [ ] Check database connection is secure
- [ ] Enable 2FA for Render account

### Custom Domain (Optional)
- [ ] Add custom domain in Render
- [ ] Update DNS records
- [ ] Update CORS origins in backend
- [ ] Update VITE_API_URL in frontend

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Enable Render email notifications

## 🐛 Troubleshooting

### Build Fails
```bash
# Check Render build logs
# Common issues:
# - Missing dependencies in package.json
# - TypeScript compilation errors
# - Prisma schema issues
```

### Database Connection Fails
```bash
# Verify in Render dashboard:
# - DATABASE_URL is connected from postgres service
# - PostgreSQL service is running
# - Connection string is correct
```

### Frontend Can't Connect to Backend
```bash
# Check:
# - VITE_API_URL is correct
# - CORS origins include frontend URL
# - Backend service is running
# - No SSL/certificate errors
```

### Services Keep Restarting
```bash
# Common causes:
# - Health check failing
# - Port binding issues
# - Memory limit exceeded (upgrade plan)
# - Database not ready
```

## 📊 Performance Optimization

### Frontend
- [ ] Enable Gzip compression (done in nginx.conf)
- [ ] Optimize images
- [ ] Lazy load routes
- [ ] Use CDN for static assets

### Backend
- [ ] Enable database connection pooling
- [ ] Add Redis for caching (requires paid plan)
- [ ] Optimize database queries
- [ ] Add rate limiting

### Database
- [ ] Add indexes on frequently queried fields
- [ ] Optimize slow queries
- [ ] Set up read replicas (requires paid plan)
- [ ] Configure auto-vacuum

## 📈 Monitoring & Maintenance

### Weekly
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Verify backups (upgrade to paid for auto-backups)
- [ ] Update dependencies

### Monthly
- [ ] Review and rotate logs
- [ ] Audit user access
- [ ] Check for security updates
- [ ] Review database size

### Quarterly
- [ ] Update Node.js version
- [ ] Update dependencies
- [ ] Review and optimize database
- [ ] Conduct security audit

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ All three services are live on Render
- ✅ Frontend loads and displays correctly
- ✅ API health check returns `{"status": "ok"}`
- ✅ Users can login and perform CRUD operations
- ✅ Data persists across service restarts
- ✅ No errors in logs
- ✅ Response times < 2 seconds

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Project Issues**: https://github.com/weissv/mezon_admin/issues

---

**Last Updated**: November 15, 2025
**Status**: Ready for deployment
