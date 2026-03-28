# Mezon Admin

Платформа для управления образовательным учреждением, объединяющая ERP-контур, школьный LMS, публичную платформу контрольных работ, базу знаний и набор прикладных интеграций: 1C, Excel, Google Sheets, Telegram и AI-сервисы.

> Статус на март 2026: репозиторий уже содержит рабочие backend и frontend приложения, локальный Docker-стек, подготовку к деплою на Render, контур школьного LMS, контур контрольных, AI-базу знаний и модуль интеграции с 1C.

## Навигация

- [Что внутри](#что-внутри)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Локальная разработка](#локальная-разработка)
- [Модули платформы](#модули-платформы)
- [Интеграции и автоматизация](#интеграции-и-автоматизация)
- [Контур LMS](#контур-lms)
- [Контур контрольных](#контур-контрольных)
- [Переменные окружения](#переменные-окружения)
- [Тесты](#тесты)
- [Деплой](#деплой)
- [Связанные документы](#связанные-документы)

## Что внутри

| Контур | Что уже реализовано |
| --- | --- |
| ERP | Дашборд, дети, родители, сотрудники, группы, кружки, посещаемость, документы, календарь, штатка |
| Операционный блок | Финансы, склад, рецепты, меню, закупки, заявки, безопасность |
| Администрирование | Аутентификация, роли, пользователи, permissions, настройки, журнал действий |
| Коммуникации | Уведомления, рассылки, Telegram-привязка, баг-репорты |
| LMS | Классы, дневник, журнал оценок, расписание, домашние задания, посещаемость, прогресс |
| Контрольные | Конструктор контрольных, публичные ссылки, таймер, автопроверка, AI-проверка открытых ответов |
| AI и знания | База знаний, семантический поиск, похожие статьи, RAG-ассистент, синхронизация Google Drive |
| Интеграции | Excel import/export, Google Sheets import, 1C sync, просмотр данных 1C |
| Инфраструктура | Docker Compose, Prisma, pgvector, Render deploy, Vitest, Cypress, smoke test |

## Архитектура

```mermaid
flowchart LR
    A[Frontend ERP] --> B[Backend API]
    A2[Frontend LMS] --> B
    A3[Public Exam Page] --> B
    B --> C[(PostgreSQL)]
    B --> D[(pgvector)]
    B --> E[1C OData]
    B --> F[Google Drive]
    B --> G[Telegram Bot]
    B --> H[AI Providers]
```

## Быстрый старт

### Точки входа

- ERP: http://localhost:5173/
- LMS: http://localhost:5173/lms
- Backend API: http://localhost:4000/api
- Health-check: http://localhost:4000/api/health

### Запуск через Docker Compose

1. Создайте корневой .env.
2. Поднимите стек.
3. При необходимости отдельно засидайте демо-данные.

Минимальный .env для локального старта:

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

Команды:

```bash
docker compose up --build
docker compose exec backend npx prisma db seed
./test-setup.sh
```

Что происходит автоматически:

- поднимается PostgreSQL с pgvector
- bootstrap-контейнер создаёт application role и БД при необходимости
- backend выполняет prisma migrate deploy перед стартом
- frontend стартует как Vite dev server на 5173 порту

> Важно: текущий Docker Compose не запускает prisma db seed автоматически. Если нужны демо-пользователи и учебные данные, запускайте seed вручную.

## Локальная разработка

### Требования

- Node.js 20+
- npm
- PostgreSQL с расширением pgvector
- Для macOS локальный запуск проще всего воспроизводится на PostgreSQL 17

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Минимально проверьте эти значения в backend/.env:

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

Рекомендуемый путь для чистой локальной БД:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Почему здесь лучше использовать prisma db push, а не полагаться на полную цепочку миграций:

- production и Docker используют prisma migrate deploy
- для brand new локальной БД текущая история миграций не всегда самый надёжный bootstrap-путь
- prisma db push + seed даёт более предсказуемый dev-старт

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Файл frontend/.env.development уже указывает на локальный backend:

```env
VITE_API_URL=http://localhost:4000/api
```

## Модули платформы

### Frontend-маршруты

| Контур | Основные маршруты |
| --- | --- |
| ERP | /dashboard, /children, /employees, /clubs, /attendance, /finance, /inventory, /menu, /recipes, /maintenance, /security, /documents, /calendar, /feedback, /procurement, /schedule |
| Администрирование | /users, /groups, /staffing, /notifications, /knowledge-base, /ai-assistant, /integration, /onec-data |
| Контрольные | /exams, /exams/new, /exams/:id/edit, /exams/:id/results |
| LMS | /lms/school, /lms/school/classes, /lms/school/gradebook, /lms/school/schedule, /lms/school/homework, /lms/school/attendance, /lms/diary |
| Публичный доступ | /exam/:token |

### Backend API

Публичные endpoints:

- /api/health
- /api/auth/*
- /api/public/exams/*

Основные защищённые namespaces:

| Блок | Prefix |
| --- | --- |
| ERP core | /api/dashboard, /api/children, /api/parents, /api/employees, /api/clubs, /api/attendance, /api/groups |
| Operations | /api/finance, /api/inventory, /api/menu, /api/maintenance, /api/security, /api/documents, /api/calendar, /api/procurement, /api/recipes, /api/staffing |
| Admin | /api/users, /api/settings, /api/permissions, /api/actionlog |
| Collaboration | /api/notifications, /api/feedback |
| AI and knowledge | /api/ai, /api/knowledge-base |
| LMS | /api/lms/school |
| Exams | /api/exams |
| Integrations | /api/integration, /api/integrations, /api/onec-data |

### Роли

Роли, присутствующие в кодовой базе:

- DEVELOPER
- DIRECTOR
- DEPUTY
- ADMIN
- TEACHER
- ACCOUNTANT
- ZAVHOZ

Краткая логика доступа:

| Роль | Основной профиль доступа |
| --- | --- |
| DEVELOPER | Полный доступ ко всем модулям |
| DIRECTOR | Полный бизнес-доступ |
| DEPUTY | Широкий административный и учебный доступ |
| ADMIN | Управление ERP-операциями, пользователями и справочниками |
| TEACHER | Учебные модули, посещаемость, кружки, контрольные, база знаний, AI-ассистент |
| ACCOUNTANT | Финансы, закупки, интеграции и 1C-данные |
| ZAVHOZ | Склад, меню, рецепты, безопасность, календарь, заявки, закупки |

> Дополнительно доступ может фильтроваться таблицей RolePermission в базе данных.

## Seed-данные и вспомогательные сценарии

Стандартный seed создаёт:

- пользователя director с логином izumi
- демо-преподавателей и завуча
- класс 4-Б
- учеников
- школьное расписание и связанные LMS-данные

Базовая команда:

```bash
cd backend
npx prisma db seed
```

Отдельные скрипты сидов:

```bash
cd backend
npx tsx prisma/seed_economics_exam.ts
npx tsx prisma/seed_inventory_items.ts
npx tsx prisma/seed_knowledge_base.ts
npx tsx prisma/seed_school.ts
```

## Интеграции и автоматизация

### AI и база знаний

- RAG-ассистент доступен через /api/ai/chat
- база знаний управляется через /api/ai/documents и /api/knowledge-base
- Gemini используется для embeddings и семантического поиска
- Groq используется для генерации ответов ассистента
- Google Drive можно синхронизировать вручную или в фоне
- при старте backend может запускать периодическую синхронизацию документов раз в 30 минут

### Telegram

- при наличии TELEGRAM_BOT_TOKEN backend инициализирует Telegram-бота
- пользователь может привязать Telegram-аккаунт к системному профилю
- поддержана отправка уведомлений пользователям с привязанным chat ID

### 1C

В репозитории есть отдельный модуль backend/src/modules/onec с такими возможностями:

- orchestrated sync по нескольким фазам
- sync финансовых документов
- sync накладных
- sync кадровых документов
- sync зарплатных документов
- sync регистров и универсальных справочников
- браузер данных 1C через /api/onec-data/*
- ручной trigger sync через /api/integrations/1c/sync

### Excel и Google Sheets

Модуль обмена данными поддерживает:

- Excel export шаблонов
- Excel import
- импорт из Google Sheets через shared CSV

На текущий момент реализованы потоки для сущностей:

- children
- employees
- inventory
- finance

## Контур LMS

Текущая LMS-реализация интегрирована в основное frontend-приложение под префиксом /lms и ориентирована на школьный сценарий.

Что уже есть:

- school dashboard
- страницы классов
- журнал оценок
- расписание
- домашние задания
- посещаемость и прогресс
- дневник ученика

Основной API namespace:

- /api/lms/school/*

Дополнительные детали вынесены в [LMS_DOCUMENTATION.md](./LMS_DOCUMENTATION.md).

## Контур контрольных

Платформа контрольных уже поддерживает:

- создание и редактирование контрольных
- target groups и привязку к классам
- разные типы вопросов
- перемешивание вопросов и вариантов ответов
- публикацию через токенизированные публичные ссылки
- ограничение по времени
- автоматическую проверку закрытых вопросов
- AI-проверку открытых ответов и задач
- страницу результатов по каждой контрольной
- публичное прохождение без авторизации в ERP

Ключевые маршруты:

- защищённые: /api/exams/*
- публичные: /api/public/exams/*
- frontend: /exams
- публичная страница ученика: /exam/:token

Отдельная памятка по этому контуру находится в [EXAM_PLATFORM_DEPLOYMENT.md](./EXAM_PLATFORM_DEPLOYMENT.md).

## Переменные окружения

### Для Docker Compose

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

### Для backend

- DATABASE_URL: подключение к PostgreSQL
- GEMINI_API_KEY: embeddings и semantic search
- GROQ_API_KEY: AI assistant chat
- GOOGLE_DRIVE_API_KEY: доступ к Google Drive API
- GOOGLE_DRIVE_FOLDER_ID: папка для синхронизации в базу знаний
- TELEGRAM_BOT_TOKEN: запуск Telegram-бота и уведомлений
- ONEC_BASE_URL: URL 1C OData
- ONEC_USER: логин 1C
- ONEC_PASSWORD: пароль 1C
- ONEC_TIMEOUT_MS: таймаут запросов к 1C
- ONEC_CRON_SCHEDULE: cron для периодической синхронизации 1C

### Для frontend

- VITE_API_URL: базовый URL backend API

Подробная настройка AI-ключей описана в [backend/AI_KEYS_SETUP.md](./backend/AI_KEYS_SETUP.md).

## Тесты

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

### End-to-end и smoke

```bash
cd frontend
npm run cypress:run

cd ..
./test-setup.sh
```

## Деплой

### Render

В репозитории уже есть [render.yaml](./render.yaml).

Текущая схема:

- backend деплоится как Node web service из backend/
- frontend деплоится как static site из frontend/
- health-check backend: /api/health
- старт backend на Render включает prisma migrate deploy, prisma db seed и npm start

### Docker images

- backend использует multi-stage Dockerfile для production runtime
- frontend содержит development и production stages, а production собирается в nginx image

## Tech stack

### Backend

- Node.js 20
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- pgvector
- JWT
- Zod
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
- Vitest
- Cypress

## Структура репозитория

```text
.
├── backend/                # Express + Prisma API
├── frontend/               # React + Vite ERP/LMS frontend
├── contract-tests/         # Контрактные и интеграционные проверки
├── docker-compose.yml      # Локальный стек
├── render.yaml             # Деплой на Render
├── DOCUMENTATION.md        # Исторические / объединённые техзаметки
├── LMS_DOCUMENTATION.md    # Заметки по LMS
├── EXAM_PLATFORM_DEPLOYMENT.md
└── test-setup.sh           # Smoke test локального контура
```

## Связанные документы

- [DOCUMENTATION.md](./DOCUMENTATION.md)
- [LMS_DOCUMENTATION.md](./LMS_DOCUMENTATION.md)
- [EXAM_PLATFORM_DEPLOYMENT.md](./EXAM_PLATFORM_DEPLOYMENT.md)
- [backend/AI_KEYS_SETUP.md](./backend/AI_KEYS_SETUP.md)

## License

ISC

## Author

Izumi Amano