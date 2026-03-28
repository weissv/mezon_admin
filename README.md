# Mezon Admin

Mezon Admin is a monorepo for an educational platform that combines an ERP system for school and kindergarten operations, a school LMS, a public exam platform, a knowledge base, and operational integrations with 1C, Excel, Google Sheets, Telegram, and AI services.

## Status as of March 2026

- The repository contains a working monorepo with separate backend and frontend applications.
- The ERP contour, school LMS contour, public exam contour, knowledge base, and 1C integration are already implemented in code.
- Local stack startup is supported via Docker Compose.
- Production deployment is prepared for Render via [render.yaml](./render.yaml).
- AI capabilities, Google Drive sync, Telegram bot, and some external integrations are optional and activated through environment variables.
- The old README was outdated: the current repository does not have a root setup.sh, Docker Compose does not seed demo data automatically, and the project scope is wider than a basic school ERP.

## What the project currently includes

| Area | Implemented capabilities |
| --- | --- |
| Access and administration | Authentication, users, roles, route-based access restrictions, module permissions, settings, audit trail, action log |
| Core ERP | Dashboard, children, parents, groups/classes, employees, staffing, schedules, clubs, attendance |
| Finance and operations | Finance, procurement, inventory, recipes, menus, maintenance requests, security records, documents, calendar |
| Communications | Notifications, broadcasts, Telegram linking and delivery for users with attached Telegram accounts, bug-report / feedback module |
| Learning contour | School LMS pages for classes, gradebook, timetable, homework, attendance/progress, diary |
| Exams | Exam editor, question bank inside exam forms, public student links, timed attempts, auto-checking, AI grading for open answers, results pages |
| Knowledge and AI | Knowledge base CRUD, related articles, semantic search with embeddings, RAG-based AI assistant, Google Drive document sync |
| Integrations | Excel export, Excel import, Google Sheets import, 1C sync orchestration, 1C data browser |
| Infrastructure | Docker images, Docker Compose stack, Render deployment, Prisma schema and migrations, seeds, Vitest, Cypress, smoke test script |

## Main modules and routes

### Frontend

The frontend is a React + Vite multi-entry application:

- ERP UI: /
- School LMS UI: /lms
- Public exam page for students: /exam/:token

Main ERP pages currently wired in the router:

- Dashboard
- Children and child details
- Employees
- Clubs
- Attendance
- Finance
- Inventory
- Menu
- Recipes
- Maintenance
- Security
- Documents
- Calendar
- Feedback
- Procurement
- Schedule
- Users
- Groups
- Staffing
- Notifications
- AI assistant
- Knowledge base
- 1C data page
- Integration page
- Exams and exam results

School LMS pages currently wired in the router:

- School dashboard
- Classes
- Gradebook
- Schedule
- Homework
- Attendance / progress
- Student diary

### Backend API

Public endpoints:

- /api/health
- /api/auth/*
- /api/public/exams/*

Protected API namespaces currently mounted in the app:

- /api/dashboard
- /api/children
- /api/parents
- /api/employees
- /api/clubs
- /api/attendance
- /api/finance
- /api/inventory
- /api/menu
- /api/maintenance
- /api/security
- /api/actionlog
- /api/groups
- /api/notifications
- /api/documents
- /api/calendar
- /api/feedback
- /api/procurement
- /api/recipes
- /api/staffing
- /api/integration
- /api/integrations
- /api/onec-data
- /api/users
- /api/ai
- /api/schedule
- /api/settings
- /api/lms/school
- /api/permissions
- /api/exams
- /api/knowledge-base

## Roles in the current codebase

The Prisma schema and frontend types contain the following roles:

- DEVELOPER
- DIRECTOR
- DEPUTY
- ADMIN
- TEACHER
- ACCOUNTANT
- ZAVHOZ

Important access notes from the current implementation:

- Full access roles in the frontend are DEVELOPER and DIRECTOR.
- DEPUTY and ADMIN have broad administrative access but not the same blanket access as DEVELOPER and DIRECTOR.
- TEACHER has access to teaching-related modules, exams, attendance, schedule, clubs, knowledge base, and AI assistant.
- ACCOUNTANT has finance, procurement, 1C data, and integration-related access.
- ZAVHOZ has warehouse, menu, recipes, calendar, maintenance, security, and procurement-related access.
- Additional module filtering is also driven by RolePermission data in the database.

## Tech stack

### Backend

- Node.js 20
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- pgvector
- JWT authentication
- Zod validation
- Axios
- node-cron
- Telegraf
- xlsx
- mammoth

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- React Hook Form
- Recharts
- i18next
- React Markdown
- Cypress
- Vitest

## Repository structure

```text
.
├── backend/                # Express + Prisma API
├── frontend/               # React + Vite ERP/LMS frontend
├── contract-tests/         # Contract/integration testing area
├── docker-compose.yml      # Local stack with Postgres, backend, frontend
├── render.yaml             # Render deployment config
├── DOCUMENTATION.md        # Historical / merged technical notes
├── LMS_DOCUMENTATION.md    # LMS-specific notes
├── EXAM_PLATFORM_DEPLOYMENT.md
└── test-setup.sh           # Smoke test for Docker stack
```

## Quick start with Docker Compose

### 1. Create a root .env file

Docker Compose reads environment variables from the repository root.

Example minimum configuration:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=erp_db
POSTGRES_APP_USER=erp_app
POSTGRES_APP_PASSWORD=change_me_too

JWT_SECRET=change_me_jwt_secret
NODE_ENV=development
PORT=4000
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173

GEMINI_API_KEY=
GROQ_API_KEY=
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=
TELEGRAM_BOT_TOKEN=

ONEC_BASE_URL=
ONEC_USER=
ONEC_PASSWORD=
ONEC_TIMEOUT_MS=10000
ONEC_CRON_SCHEDULE=*/15 * * * *
```

### 2. Start the stack

```bash
docker compose up --build
```

What happens automatically:

- PostgreSQL starts in a container with pgvector
- bootstrap creates the application role and database if needed
- backend runs prisma migrate deploy before start
- frontend starts the Vite development server on port 5173

### 3. Seed demo data manually

Important: the current Docker Compose stack does not run prisma db seed automatically.

If you want demo users and school data, run:

```bash
docker compose exec backend npx prisma db seed
```

### 4. Optional smoke test

```bash
./test-setup.sh
```

### 5. Open the application

- ERP: http://localhost:5173/
- LMS: http://localhost:5173/lms
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

## Local development without Docker

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL with pgvector
- On macOS with Homebrew, PostgreSQL 17 is the safest native choice for this repository because pgvector is typically available there out of the box

### Backend

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create backend env file from the example:

```bash
cp .env.example .env
```

3. Adjust at least these values in backend/.env:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/erp_db?schema=public
PORT=4000
JWT_SECRET=change_me
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
GROQ_API_KEY=
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=
TELEGRAM_BOT_TOKEN=
ONEC_BASE_URL=
ONEC_USER=
ONEC_PASSWORD=
```

4. Prepare the database.

For a clean local development database, the reliable path is:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

Why db push is recommended for a clean local DB:

- the production and Docker flow uses prisma migrate deploy
- the current migration chain is not the most reliable bootstrap path for a brand-new local database
- db push plus seed is the safest developer setup for starting from scratch locally

5. Start the backend:

```bash
npm run dev
```

### Frontend

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Ensure frontend API URL is pointed at the local backend.

The repository already contains [frontend/.env.development](./frontend/.env.development) with:

```env
VITE_API_URL=http://localhost:4000/api
```

3. Start the frontend:

```bash
npm run dev
```

Then open:

- http://localhost:5173/
- http://localhost:5173/lms

## Demo data and seed scripts

The default Prisma seed currently creates:

- director user izumi
- teacher and deputy demo users
- class 4-Б
- demo students
- LMS school schedule and subject data

Standard seed command:

```bash
cd backend
npx prisma db seed
```

Additional focused seed scripts that already exist in the repository:

```bash
cd backend
npx tsx prisma/seed_economics_exam.ts
npx tsx prisma/seed_inventory_items.ts
npx tsx prisma/seed_knowledge_base.ts
npx tsx prisma/seed_school.ts
```

Use these only for development or test environments.

## Integrations and automations

### AI and knowledge base

- /api/ai/chat provides the RAG-based AI assistant
- /api/ai/documents and /api/knowledge-base manage knowledge content
- Gemini is used for embeddings / semantic search
- Groq is used for assistant responses
- Google Drive sync can run manually or in the background
- backend startup also schedules periodic Google Drive sync every 30 minutes when configured

### Telegram

- the backend initializes a Telegram bot when TELEGRAM_BOT_TOKEN is present
- users can link Telegram accounts via the bot
- notification sending is supported for role-based recipients with linked chat IDs

### 1C

The repository contains a dedicated 1C module under backend/src/modules/onec.

It includes:

- sync orchestration
- financial document sync
- invoice sync
- HR document sync
- payroll-related sync
- register and universal catalog sync
- 1C data browsing endpoints under /api/onec-data/*
- sync trigger endpoint under /api/integrations/1c/sync

### Data exchange

The import/export module supports:

- Excel export templates
- Excel import
- Google Sheets import via shared CSV

Currently implemented entity flows include children, employees, inventory, and finance.

## Exams platform

The exam subsystem supports:

- teacher-side CRUD for exams
- target groups/classes
- different question types
- question shuffling and option shuffling
- publication via public tokenized links
- time limits
- auto-checking for closed questions
- AI grading for open text answers and problems
- per-exam results view
- public student flow without ERP authentication

Useful routes:

- Protected: /api/exams/*
- Public: /api/public/exams/*
- Frontend editor and results: /exams
- Public student page: /exam/:token

Detailed operational notes are available in [EXAM_PLATFORM_DEPLOYMENT.md](./EXAM_PLATFORM_DEPLOYMENT.md).

## LMS school contour

The current LMS implementation in this repository is school-oriented and integrated into the main frontend under /lms.

Implemented pages and APIs cover:

- school dashboard
- classes and class detail view
- gradebook
- timetable
- homework
- attendance / progress tracking
- student diary

Primary API namespace:

- /api/lms/school/*

Additional LMS notes are available in [LMS_DOCUMENTATION.md](./LMS_DOCUMENTATION.md).

## Environment variables overview

### Root variables for Docker Compose

- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- POSTGRES_APP_USER
- POSTGRES_APP_PASSWORD
- JWT_SECRET
- NODE_ENV
- PORT
- CORS_ORIGINS
- FRONTEND_URL

### Backend feature flags and integrations

- DATABASE_URL: database connection string
- GEMINI_API_KEY: embeddings and semantic search
- GROQ_API_KEY: AI assistant chat
- GOOGLE_DRIVE_API_KEY: Google Drive API access
- GOOGLE_DRIVE_FOLDER_ID: folder to sync into the knowledge base
- TELEGRAM_BOT_TOKEN: Telegram bot startup and notifications
- ONEC_BASE_URL: 1C OData endpoint
- ONEC_USER: 1C login
- ONEC_PASSWORD: 1C password
- ONEC_TIMEOUT_MS: 1C request timeout
- ONEC_CRON_SCHEDULE: periodic 1C sync schedule

### Frontend

- VITE_API_URL: backend API base URL

For AI-specific setup details see [backend/AI_KEYS_SETUP.md](./backend/AI_KEYS_SETUP.md).

## Testing and quality checks

### Backend

```bash
cd backend
npm test
npm run test:coverage
```

### Frontend

```bash
cd frontend
npm test
npm run lint
npm run build
```

### End-to-end and smoke tests

```bash
cd frontend
npm run cypress:run

cd ..
./test-setup.sh
```

## Deployment

### Render

The repository already contains [render.yaml](./render.yaml).

Current Render setup:

- backend is deployed as a Node web service from backend/
- frontend is deployed as a static site from frontend/
- backend health check path is /api/health
- Render backend start command runs prisma migrate deploy, prisma db seed, and npm start

### Docker images

- backend has a multi-stage Dockerfile for production runtime
- frontend has development and production stages, with nginx in the production image

## Additional repository documents

- [DOCUMENTATION.md](./DOCUMENTATION.md) for historical and merged technical notes
- [LMS_DOCUMENTATION.md](./LMS_DOCUMENTATION.md) for LMS-specific details
- [EXAM_PLATFORM_DEPLOYMENT.md](./EXAM_PLATFORM_DEPLOYMENT.md) for exam deployment notes
- [backend/AI_KEYS_SETUP.md](./backend/AI_KEYS_SETUP.md) for AI key configuration

## License

ISC

## Author

Izumi Amano