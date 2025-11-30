# Mezon Admin - School/Kindergarten ERP System

A comprehensive ERP system for managing school and kindergarten operations including children, employees, clubs, attendance, finance, inventory, and more.

## 🚀 Features

- **User Management**: Role-based access control (Director, Deputy, Admin, Teacher, Accountant)
- **Children Management**: Track children information, groups, and health records
- **Employee Management**: Manage staff information, contracts, medical checkups
- **Club Management**: Organize extracurricular activities with enrollment tracking
- **Attendance Tracking**: Record and monitor attendance for both regular classes and clubs
- **Finance Module**: Track income and expenses with detailed reporting
- **Inventory Management**: Monitor supplies and food items with expiry tracking
- **Menu Planning**: Create and manage daily meal plans with nutritional information
- **Maintenance Requests**: Track repair and purchase requests
- **Security Logs**: Record security events and incidents
- **Action Logging**: Audit trail of all system actions
- **Staffing Management**: Track staffing requirements vs actual staff with deficit reporting
- **Groups & Branches**: Manage school classes and branch locations
- **Notifications**: Automated alerts plus targeted broadcasts for roles/groups
- **AI Assistant**: RAG-powered methodologist assistant with knowledge base
- **Data Exchange**: Excel/Google Sheets import & export for core registries

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **PostgreSQL** as the database
- **JWT** for authentication
- **Zod** for validation
- **bcryptjs** for password hashing

### Frontend
- **React** with **TypeScript**
- **Vite** for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Lucide React** for icons

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **Docker** and **Docker Compose** (for containerized deployment)
- **PostgreSQL** (if running locally without Docker)

## 🚀 Getting Started

### Quick Start with Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/weissv/mezon_admin.git
cd mezon_admin
```

2. Run the setup script:
```bash
./setup.sh
```

Or manually start with Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:4000/api
   - **Health Check**: http://localhost:4000/api/health

4. **Default credentials**:
   - Admin: `admin@mezon.uz` / `admin123`
   - Director: `director@mezon.uz` / `director123`
   - Teacher: `teacher@mezon.uz` / `teacher123`

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Local Development (Without Docker)

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_db?schema=public"
PORT=4000
JWT_SECRET="dev_secret_change_me"
NODE_ENV="development"
```

4. Run database migrations:
```bash
npx prisma migrate deploy
```

5. Seed the database:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:4000
```

4. Start the development server:
```bash
npm run dev
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Resources (All Protected)
- `/api/children` - Children management
- `/api/employees` - Employee management
- `/api/clubs` - Club management
- `/api/attendance` - Attendance tracking
- `/api/finance/transactions` - Financial transactions
- `/api/finance/reports` - Financial reports
- `/api/inventory` - Inventory management
- `/api/menu` - Menu planning
- `/api/maintenance` - Maintenance requests
- `/api/security` - Security logs
- `/api/branches` - Branch management
- `/api/groups` - Group management
- `/api/actionlog` - Action logs (Admin only)
- `/api/notifications` - System notifications and alerts
- `/api/notifications/broadcasts` - Mass announcements for roles/groups
- `/api/integration` - Excel / Google Sheets import-export tools

## 🗂️ Data Exchange

### Excel / Google Sheets Import & Export
- `GET /api/integration/export/excel/:entity` – download XLSX for `children`, `employees`, `inventory`, or `finance`
- `POST /api/integration/import/excel/:entity` – send `{ "fileBase64": "..." }` payloads to bulk upsert rows from an Excel template
- `POST /api/integration/import/google-sheets` – provide `{ entity, sheetUrl }` where the sheet is shared as CSV to ingest directly from Google Sheets

Templates generated via the export endpoint include the required headers. The importer uses the ID column (when provided) to update existing entries; otherwise new records are inserted.


## 🔐 User Roles & Permissions

- **DIRECTOR**: Full system access
- **DEPUTY**: Most administrative functions
- **ADMIN**: Administrative tasks and user management
- **TEACHER**: Attendance, clubs (own), maintenance requests
- **ACCOUNTANT**: Financial management and reports

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run build
npm test
```

### Frontend Tests
```bash
cd frontend
npm run build
npm run lint
```

## 📦 Production Deployment

### Using Render.com

The project includes a `render.yaml` configuration for deployment on Render.com.

1. Push to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect the configuration and deploy

### Using Docker in Production

```bash
docker-compose -f docker-compose.yml up -d --build
```

## 🗄️ Database Schema

The system uses PostgreSQL with Prisma ORM. Key models include:
- User, Employee, Child, Group
- Club, ClubEnrollment, Attendance
- FinanceTransaction, InventoryItem
- Menu, MaintenanceRequest, SecurityLog
- Branch, ActionLog

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

- Izumi Amano

## 🐛 Known Issues

- None currently reported

## 📞 Support

For support, please open an issue in the GitHub repository.
