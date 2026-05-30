# Mezon Admin - Educational ERP & LMS Platform

**Mezon Admin** is a large-scale, monorepo platform for comprehensive management of educational institutions (kindergartens, schools, learning centers).
The system completely covers all administrative, operational, educational, financial, and HR needs.

> **Project Status (Updated):** The project comprises over 68,000 lines of code and 300+ components. The ERP, LMS, testing platform with AI grading, Google Drive-based knowledge base (RAG), bidirectional 1C synchronization (OData), and full mobile adaptation have been fully implemented.

---

## 📑 Table of Contents

1. [Architecture & Tech Stack](#-architecture--tech-stack)
2. [Functional Modules Overview (ERP)](#-functional-modules-overview-erp)
3. [Educational System (LMS)](#-educational-system-lms)
4. [Innovations: AI & Automation](#-innovations-ai--automation)
5. [Integrations (1C, Telegram)](#-integrations-1c-telegram)
6. [Mobile Adaptation](#-mobile-adaptation)
7. [Database & Structure (Prisma)](#-database--structure-prisma)
8. [Setup & Local Development](#-setup--local-development)
9. [Scripts & Deployment](#-scripts--deployment)

---

## 🏗 Architecture & Tech Stack

The project is built as a scalable monorepo, strictly separating the Backend (API gateway) and the Frontend (SPA).

### Backend (Node.js API)
- **Core:** Node.js 20+, Express.js, TypeScript.
- **Database:** PostgreSQL 17 with the `pgvector` extension for working with embeddings.
- **ORM:** Prisma ORM (v5). Complex data schema consisting of 30+ interconnected tables.
- **Validation & Security:** Zod, JWT (authorization with RBAC role model), bcryptjs, CORS policies.
- **AI Ecosystem:** `@google/generative-ai` (Gemini), `openai` (via Groq API for lightning-fast LLM inference).
- **Tools:** `node-cron` for background tasks, `mammoth` (parsing `.docx`), `xlsx` for exports.

### Frontend (React SPA)
- **Framework:** React 18, Vite, TypeScript.
- **Routing:** React Router DOM v6 (split into main ERP router and `/lms` router).
- **UI/UX & Styling:** Tailwind CSS, custom UI components based on CSS variables (Glassmorphism), Lucide React.
- **State & Form Management:** React Hook Form, Zod Resolvers, custom React Contexts (`AuthContext`, `PermissionsContext`).
- **Mobile Experience:** Support for all iOS/Android browsers (Touch targets, Swipe-menus, Responsive tables).

---

## 🧩 Functional Modules Overview (ERP)

The administrative and operational department includes 15+ sections.

1. **Dashboard:** Widgetized analytics with customizable layout (`PersonalizationPanel`). Statistics on finances, attendance, security incidents, and HR.
2. **Contingent (Children/Parents):** Personal files, transfer histories (Child Status: ACTIVE, LEFT, ARCHIVED), tracking absences with medical certificates, health records.
3. **Groups & Classes:** Distributing the contingent across educational streams (Grades 1-11, Preschool, Infant), homeroom teachers.
4. **HR & Staffing:** Employee management, staffing tables, tracking expiration dates for medical books and contracts.
5. **Finances:** Cash flow (Incomes/Expenses), accounting for cash (PKO/RKO) and bank operations, monitoring accounts receivable.
6. **Warehouse & Inventory:** Multi-warehouse batch tracking (Food, Household, Stationery), tracking critical stock levels and expirations. Supports inventory transactions (Inflow, Outflow, Adjustment, Write-off).
7. **Kitchen (Recipes & Menus):** Creating technical dish cards with macronutrient (CFC) calculations, generating daily menus by age groups, automatic deduction of ingredients.
8. **Maintenance (Requests):** Electronic log of requests for inventory issuance or repairs. Built-in workflow: *Creation → Approval (Director) → In Progress (Supply Manager) → Issued/Completed*.
9. **Procurement:** Creating orders (Planned, Operational), managing suppliers, tracking logistics statuses.
10. **Document Management & Calendar:** Generating orders and contracts based on templates. Event planning.
11. **Security:** Incident log, visitor log, fire safety checks.

---

## 🎓 Educational System (LMS)

A specialized section (accessible via the `/lms` route) for the educational block:

- **LMS Dashboard:** Summary statistics of the educational process.
- **Gradebook:** Electronic journal with the ability to set various types of grades and comment on student work.
- **Schedule:** Calendar grid of lessons, linking teachers to classrooms.
- **Diary & Progress:** Tracking academic performance, displaying homework assignments (with deadlines and attached files).
- **Clubs & Extracurriculars:** Enrollment in clubs (Waitlist/Active), fee calculation, tracking attendance.
- **Exams Platform:** 
  - Test builder (Text, Multiple Choice, Open Response).
  - Generating secure one-time links (`/api/public/exams`).
  - **AI Grading:** Automatic evaluation of open-ended answers using Artificial Intelligence based on the teacher's grading rubrics/keys.

---

## 🤖 Innovations: AI & Automation

1. **AI Knowledge Base (RAG):**
   - Full integration with corporate **Google Drive**.
   - `AiService` runs a background Cron-job (every 30 mins) that scans the specified folder for new regulations (Word, TXT).
   - Texts are automatically chunked, passed through Gemini Embeddings, and stored in `pgvector`.
   - The interface features a built-in "AI Assistant" that answers employee questions strictly based on internal school documentation.
2. **AI Assignment Grading:** Integration with Groq (Llama-3/Gemma) for instant parsing and grading of students' creative assignments in the LMS.

---

## 🔄 Integrations (1C, Telegram)

### 1C:Enterprise (OData)
The platform acts as a convenient frontend for 1C:
- Synchronization of cash receipts/disbursements and bank statements (`FinanceTransaction`).
- Import of nomenclature and counterparties.
- Special interface `/onec-data` for directly viewing 1C information registers and documents (HR, Payroll).

### Telegram Bot
Every employee can link their Telegram account via their personal profile:
- Instant Push notifications about new maintenance requests.
- Purchase approval requests sent to the director.
- Critical alerts (fire safety checks, security incidents).

---

## 📱 Mobile Adaptation

The system follows a **Mobile-First** philosophy:
- Completely rewritten navigation (`SideNav.tsx`) with a side Slide-Out menu and Backdrop effects.
- Adaptive grids (Mezon Grid) and responsive data tables (horizontal scroll).
- Optimized Touch targets (minimum height of inputs and buttons is 44px, disabling interface zooming on iOS).
- Intelligent collapsing of side panels when switching to mobile resolutions.

---

## 🗄 Database & Structure (Prisma)

The role model is built on RBAC (`RolePermission`): `DEVELOPER, DIRECTOR, DEPUTY, ADMIN, TEACHER, ACCOUNTANT, ZAVHOZ`.
The `ActionLog` model is used to log all operations, allowing you to track who changed what data in the system and when (with JSON payload capturing).

The `backend/prisma/schema.prisma` file contains over 1600 lines and describes:
- Users, Roles, Employees (`User`, `Employee`).
- Students, Parents, Clubs (`Child`, `Parent`, `Group`, `Club`).
- Inventory operations and Nomenclature (`InventoryItem`, `MaintenanceRequest`).
- Cash registers and Finances (`FinanceTransaction`, `CashFlowArticle`).

---

## 🚀 Setup & Local Development

### Prerequisites
- Node.js v20.x
- PostgreSQL v17+ (REQUIRED with `pgvector` installed)
- Docker & Docker Compose (for quick start)

### Quick Start via Docker
```bash
# 1. Clone the repository
git clone https://github.com/weissv/mezon_admin.git
cd mezon_admin

# 2. Setup environment
cp backend/.env.example backend/.env

# 3. Spin up the stack
docker compose up --build

# 4. Seed the database (in another terminal window)
docker compose exec backend npx prisma db seed
```
**Access:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Default login: `director@mezon.uz` / Password is generated in the seed file.

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Scripts & Deployment

- The project is configured for deployment on **Render** (`render.yaml`).
- E2E Testing is configured via `./test-setup.sh`.
- Built-in scripts for generating test environments (Vite Tests, Prisma Studio).

---
*Documentation generated based on deep static analysis of the codebase.*
*License: ISC | Author: Izumi Amano*