# Mezon Admin - Deployment & Setup Guide

## 🚀 Quick Start (Local Development with Docker)

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

### Start the Application

```bash
# Clone the repository
git clone https://github.com/weissv/mezon_admin.git
cd mezon_admin

# Start all services with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:4000
# Database: localhost:5432
```

### Stop the Application

```bash
docker-compose down

# To remove volumes (delete all data)
docker-compose down -v
```

## 🌐 Render Deployment

### Automatic Deployment from GitHub

1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `weissv/mezon_admin`
   - Render will automatically detect `render.yaml`

2. **Services Created**
   - `mezon-admin-postgres` - PostgreSQL database (Free tier)
   - `mezon-admin-backend` - Node.js API service (Free tier)
   - `mezon-admin-frontend` - Static site (Free tier)

3. **Environment Variables**
   The following are automatically configured via `render.yaml`:
   - `DATABASE_URL` - Connected from postgres service
   - `JWT_SECRET` - Auto-generated secure secret
   - `NODE_ENV` - Set to production
   - `VITE_API_URL` - Set to backend service URL

4. **Access Your Application**
   - Frontend: `https://mezon-admin-frontend.onrender.com`
   - Backend API: `https://mezon-admin-backend.onrender.com/api`

### Manual Deployment Steps

If you prefer manual setup:

#### 1. Create PostgreSQL Database
```bash
# On Render Dashboard
New → PostgreSQL
Name: mezon-admin-postgres
Database: mezon_admin_db
User: mezon_admin_user
Plan: Free
```

#### 2. Create Backend Service
```bash
# On Render Dashboard
New → Web Service
Name: mezon-admin-backend
Runtime: Node
Root Directory: backend
Build Command: npm ci && npx prisma generate && npm run build
Start Command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"
Plan: Free

# Environment Variables:
DATABASE_URL=<from postgres service>
JWT_SECRET=<generate secure random string>
NODE_ENV=production
PORT=4000
```

#### 3. Create Frontend Service
```bash
# On Render Dashboard
New → Static Site
Name: mezon-admin-frontend
Root Directory: frontend
Build Command: npm ci && npm run build
Publish Directory: dist
Plan: Free

# Environment Variables:
VITE_API_URL=https://mezon-admin-backend.onrender.com/api
```

## 🛠️ Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.development (if not exists)
echo "VITE_API_URL=http://localhost:4000/api" > .env.development

# Start development server
npm run dev
```

## 📋 Environment Variables

### Root `.env` (for Docker Compose)
```env
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=erp_password_123
POSTGRES_DB=erp_db
DATABASE_URL=postgresql://erp_user:erp_password_123@postgres:5432/erp_db?schema=public
PORT=4000
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_secure
NODE_ENV=development
VITE_API_URL=http://localhost:4000/api
```

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/erp_db?schema=public
PORT=4000
JWT_SECRET=dev_secret_change_me
NODE_ENV=development
```

### Frontend `.env.development`
```env
VITE_API_URL=http://localhost:4000/api
```

### Frontend `.env.production`
```env
VITE_API_URL=https://mezon-admin-backend.onrender.com/api
```

## 🔐 Default Login Credentials

After seeding the database, use these credentials:

- **Admin**: admin@mezon.uz / admin123
- **Director**: director@mezon.uz / director123
- **Teacher**: teacher@mezon.uz / teacher123

## 🏗️ Architecture

```
mezon_admin/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   ├── schemas/        # Zod validation schemas
│   │   └── utils/          # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Initial data
│   └── Dockerfile
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # API client
│   ├── nginx.conf         # Production server config
│   └── Dockerfile
│
├── docker-compose.yml     # Local development
└── render.yaml           # Render deployment config
```

## 🔄 API Endpoints

Base URL: `http://localhost:4000/api` (development) or `https://mezon-admin-backend.onrender.com/api` (production)

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Resources (Protected)
- `/children` - Child management
- `/employees` - Employee management
- `/groups` - Group management
- `/attendance` - Attendance tracking
- `/finance` - Financial records
- `/inventory` - Inventory management
- `/menu` - Menu planning
- `/maintenance` - Maintenance requests
- `/security` - Security logs
- `/dashboard` - Dashboard statistics

## 🧪 Testing

```bash
cd frontend

# Open Cypress test runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run
```

## 📊 Database Management

```bash
# Access Prisma Studio (GUI for database)
cd backend
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
docker-compose down -v
docker-compose up --build
```

**Database connection errors:**
- Check `.env` file has correct credentials
- Ensure postgres container is healthy: `docker-compose ps`

### Render Issues

**Build fails:**
- Check build logs in Render dashboard
- Verify `render.yaml` paths are correct
- Ensure all dependencies are in `package.json`

**Database connection fails:**
- Verify `DATABASE_URL` is connected from postgres service
- Check postgres service is running

**Frontend can't connect to backend:**
- Verify `VITE_API_URL` points to correct backend URL
- Check CORS settings in `backend/src/app.ts`

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- Use strong database passwords
- Enable HTTPS in production (Render does this automatically)
- Review CORS settings before deploying

## 📝 Making Changes

### Adding New Features

1. **Database changes:**
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name feature_name
   ```

2. **Backend changes:**
   - Add route in `src/routes/`
   - Add schema in `src/schemas/`
   - Register route in `src/app.ts`

3. **Frontend changes:**
   - Add page in `src/pages/`
   - Add component in `src/components/`
   - Update router in `src/router/`

### Deploying Changes

**With Render Blueprint:**
- Push to GitHub main branch
- Render auto-deploys both services

**Manual deployment:**
- Trigger manual deploy in Render dashboard

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/weissv/mezon_admin/issues
- Check logs: `docker-compose logs -f` (local) or Render dashboard (production)

---

**Last Updated:** November 15, 2025
