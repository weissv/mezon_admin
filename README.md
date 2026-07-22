# 🏫 Mezon Admin — Educational ERP & LMS Platform

[![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_TypeScript-61DAFB?logo=react)](file:///c:/Users/ruzie/Documents/GitHub/mezon_admin/frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_20_%7C_Express_%7C_Prisma-339933?logo=nodedotjs)](file:///c:/Users/ruzie/Documents/GitHub/mezon_admin/backend)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_17_%2B_pgvector-4169E1?logo=postgresql)](file:///c:/Users/ruzie/Documents/GitHub/mezon_admin/backend/prisma)
[![Tailwind CSS](https://img.shields.io/badge/Styling-TailwindCSS_3.4-38B2AC?logo=tailwindcss)](file:///c:/Users/ruzie/Documents/GitHub/mezon_admin/frontend)

**Mezon Admin** — полнофункциональная экосистема для автоматизации всех операционных, финансовых, кадровых и учебных процессов образовательных учреждений (школы, детские сады, учебные центры).

Проект состоит из более чем 300+ UI компонентов и 68,000+ строк кода TypeScript. Объединяет полноценную **ERP-систему**, **LMS-платформу онлайн-обучения**, **модуль проверочных/контрольных работ с AI-оценкой**, **базу знаний с RAG по Google Drive**, а также двустороннюю интеграцию с **1С:Предприятие** и **Telegram Bot**.

---

## 📑 Оглавление

1. [🚀 Быстрый старт для Frontend-разработчика](#-быстрый-старт-для-frontend-разработчика)
2. [🏗 Архитектура и стек технологий](#-архитектура-и-стек-технологий)
3. [📁 Структура проекта](#-структура-проекта)
4. [🧩 Функциональные модули (ERP)](#-функциональные-модули-erp)
5. [🎓 Учебная платформа (LMS)](#-учебная-платформа-lms)
6. [📝 Платформа контрольных работ (Exams)](#-платформа-контрольных-работ-exams)
7. [🤖 AI-экосистема и настройка API ключей](#-ai-экосистема-и-настройка-api-ключей)
8. [🗄 База данных и ролевая модель (RBAC)](#-база-данных-и-ролевая-модель-rbac)
9. [📱 Адаптивный дизайн и Mobile-First](#-адаптивный-дизайн-и-mobile-first)
10. [🔧 Деплой и скрипты](#-деплой-и-скрипты)

---

## 🚀 Быстрый старт для Frontend-разработчика

### Требования к окружению
- **Node.js**: `v20.x` или новее
- **npm**: `v10.x` или новее

### 1️⃣ Клонирование и установка зависимостей

```bash
git clone https://github.com/weissv/mezon_admin.git
cd mezon_admin

# Установка зависимостей фронтенда
cd frontend
npm install

# Установка зависимостей бэкенда (в отдельном окне)
cd ../backend
npm install
```

### 2️⃣ Настройка файлов окружения (`.env`)

Скопируйте примеры конфигураций:
```bash
# В папке frontend
cp frontend/.env.example frontend/.env.local

# В папке backend
cp backend/.env.example backend/.env
```

**`frontend/.env.local`**:
```env
VITE_API_URL=http://localhost:4000/api
VITE_ENABLE_FIGMA_CAPTURE=true
```

### 3️⃣ Запуск локальных серверов

1. **Запуск Бэкенда (API):**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run dev
   ```
   *Бэкенд будет доступен по адресу:* `http://localhost:4000/api`

2. **Запуск Фронтенда (Vite SPA):**
   ```bash
   cd frontend
   npm run dev
   ```
   *Фронтенд будет доступен по адресу:* `http://localhost:5173/`

### 🔐 Данные для входа в систему (Test Accounts)
- **Директор:** `director@mezon.uz` / `admin123`
- **Завуч:** `deputy@mezon.uz` / `admin123`
- **Учитель:** `teacher@mezon.uz` / `admin123`
- **Бухгалтер:** `accountant@mezon.uz` / `admin123`
- **Завхоз:** `zavhoz@mezon.uz` / `admin123`

---

## 🏗 Архитектура и стек технологий

Проект организован как монорепозиторий со строгим разделением SPA-фронтенда и REST API бэкенда.

### Frontend (SPA & Multi-App Build)
- **Фреймворк:** React 18, Vite, TypeScript
- **Маршрутизация:** React Router DOM v6 (раздельный роутинг ERP и `/lms`)
- **Стилизация:** Tailwind CSS 3.4, Vanilla CSS variables, Glassmorphic UI Tokens
- **Иконки:** Lucide React
- **Формы и валидация:** React Hook Form, Zod Resolvers (`zod`), `@hookform/resolvers`
- **Аналитика и графики:** Recharts
- **Печать и экспорт:** `jspdf`, `html2canvas`, `papaparse`
- **Локализация:** `i18next`, `react-i18next`

### Backend (REST API & RAG Gateway)
- **Core:** Node.js 20+, Express.js, TypeScript
- **База данных:** PostgreSQL 17 с расширением `pgvector`
- **ORM:** Prisma ORM (v6) с 30+ связанными таблицами
- **Безопасность & Авторизация:** JWT (RBAC ролевая модель), `bcryptjs`, CORS, Zod validation
- **ИИ Службы:** Google Gemini Embeddings (`@google/generative-ai`), Groq LLM Inference (`openai` SDK for Groq)
- **Интеграции:** Telegraf (Telegram Bot), node-cron, mammoth (DOCX parsing), xlsx

---

## 📁 Структура проекта

```
mezon_admin/
├── frontend/                     # Frontend SPA (React + Vite)
│   ├── public/                   # Статические ресурсы
│   ├── src/
│   │   ├── main.tsx              # Точка входа для основного ERP приложения
│   │   ├── lms-main.tsx          # Точка входа для LMS суб-приложения
│   │   ├── components/           # Переиспользуемые UI компоненты (Button, Input, Modal...)
│   │   │   ├── forms/            # Формы создания/редактирования объектов
│   │   │   └── ui/               # Базовые UI-атомы
│   │   ├── layouts/              # Макеты страниц (MainLayout, LmsLayout)
│   │   ├── pages/                # Страницы ERP системы (Dashboard, Contingent, Finances...)
│   │   │   └── lms/              # Страницы LMS (Courses, Lessons, Assignments...)
│   │   ├── features/             # Модульные фичи (onec integration, knowledge base...)
│   │   ├── context/              # React Contexts (AuthContext, PermissionsContext)
│   │   ├── lib/                  # Клиентские утилиты, API-клиенты (api.ts, lms-api.ts)
│   │   └── types/                # TypeScript типы и интерфейсы (lms.ts, erp.ts...)
│   ├── index.html                # HTML шаблон ERP
│   ├── lms.html                  # HTML шаблон LMS
│   ├── tailwind.config.js        # Конфигурация Tailwind CSS
│   └── vite.config.js            # Конфигурация сборки Vite (Multi-page build)
│
├── backend/                      # Backend REST API (Node.js + Express)
│   ├── prisma/
│   │   ├── schema.prisma         # Главная Prisma схема БД
│   │   ├── migrations/           # SQL миграции базы данных
│   │   └── seed.ts               # Базовый сидер (пользователи, роли, структуры)
│   ├── src/
│   │   ├── controllers/          # Контроллеры запросов
│   │   ├── routes/               # API Маршруты (/api/lms, /api/exams, /api/1c...)
│   │   ├── services/             # Бизнес-логика (AiService, OneCService...)
│   │   ├── middleware/           # Auth, RBAC, Error handling middleware
│   │   └── index.ts              # Точка входа сервера Express
│   └── .env.example
│
└── README.md                     # Единая документация проекта
```

---

## 🧩 Функциональные модули (ERP)

1. **Дашборд аналитики (`/`):** Виджеты финансов, посещаемости, инцидентов безопасности, кадрового состава. Настройка расположения виджетов (`PersonalizationPanel`).
2. **Контингент учеников и воспитанников (`/children`):** Личные дела, история переводов (`ACTIVE`, `LEFT`, `ARCHIVED`), справки, медицинские карты.
3. **Группы и классы (`/groups`):** Распределение детей по классам (1-11 классы, ясли, дошкольные группы), закрепление классных руководителей.
4. **Кадры и сотрудники (`/employees`):** Учёт персонала, штатное расписание, отслеживание медицинских книжек и трудовых договоров.
5. **Финансы (`/finance`):** Движение денежных средств (ПКО/РКО), безналичные расчёты, ведение статей расходов/доходов, отчётность по задолженностям.
6. **Склад и ТМЦ (`/inventory`):** Партионный учёт складов (Продукты, Хозтовары, Канцелярия), контроль сроков годности, приход/расход/списание.
7. **Кухня и меню (`/menu`, `/recipes`):** Технологические карты блюд с расчётом КБЖУ, автоматическая генерация меню по возрастным категориям, списание ингредиентов.
8. **Заявки на ремонт и обслуживание (`/maintenance`):** Электронный журнал заявок на ремонт/выдачу инвентаря. Состояния: *Создана → Утверждена (Директор) → В работе (Завхоз) → Выполнена*.
9. **Закупки (`/procurement`):** Плановые и оперативные заказы, база поставщиков, отслеживание статусов поставок.
10. **Документооборот и Календарь (`/documents`, `/calendar`):** Шаблоны приказов, договоров, планирование мероприятий.
11. **Безопасность (`/security`):** Журнал посещений, инциденты, проверки пожарной безопасности.

---

## 🎓 Учебная платформа (LMS)

LMS встроен в единый репозиторий, но выделен в изоляцию с точкой входа `/lms/` (`lms.html` & `lms-main.tsx`).

### Фронтенд-структура LMS:
- `frontend/src/lms-main.tsx` — отдельная точка входа LMS.
- `frontend/src/layouts/LmsLayout.tsx` — сайдбар и макет LMS.
- `frontend/src/pages/lms/` — страницы: `LmsDashboard`, `LmsCoursesPage`, `LmsCourseDetailPage`, `LmsLessonPage`, `LmsMyLearningPage`, `LmsAssignmentsPage`, `LmsDiscussionsPage`, `LmsProgressPage`, `LmsCourseEditorPage`.
- `frontend/src/lib/lms-api.ts` — API-клиент LMS.

### Основные эндпоинты LMS API:
- `GET /api/lms/courses` — каталог курсов (фильтры: категория, уровень)
- `GET /api/lms/courses/:id` — детали курса с модулями и уроками
- `POST /api/lms/courses/:id/enroll` — запись на курс
- `GET /api/lms/my-learning` — мои активные и пройденные курсы
- `POST /api/lms/lessons/:id/progress` — сохранение прогресса по уроку
- `POST /api/lms/assignments/:id/submit` — сдача задания

### Конфигурация Nginx для Production:
```nginx
location /lms {
    alias /app/dist;
    try_files $uri /lms.html;
}

location /lms/ {
    alias /app/dist/;
    try_files $uri /lms.html;
}
```

---

## 📝 Платформа контрольных работ (Exams)

Позволяет учителям и администрации создавать контрольные работы с поддержкой автоматической и AI-проверки.

### Типы вопросов:
- `SINGLE_CHOICE` / `MULTIPLE_CHOICE` — автопроверка
- `TRUE_FALSE` / `TEXT_SHORT` — автопроверка
- `TEXT_LONG` — развёрнутый ответ (проверяется AI на основе рубрик)
- `PROBLEM` — математическая/экономическая задача (проверяется AI)

### Публичные ссылки для учеников (без авторизации):
1. Преподаватель публикует контрольную (`POST /api/exams/:id/publish`).
2. Генерируется токен: `https://erp.mezon.uz/exam/:token`.
3. Ученик открывает ссылку, выполняет работу с таймером и отправляет результат.
4. AI в фоновом режиме оценивает развёрнутые ответы, выставляет `aiScore` и формирует текстовый отзыв `aiFeedback`.

---

## 🤖 AI-экосистема и настройка API ключей

В систему встроены два ИИ-механизма:
1. **RAG База знаний (Google Drive + Gemini Embeddings):** Крон-задача сканирует папку Google Drive, векторные представления (768d) сохраняются в PostgreSQL (`pgvector`). ИИ-ассистент отвечает на вопросы сотрудников строго по внутренней документации.
2. **AI Проверка контрольных (Groq API / Qwen3-32B):** Мгновенная проверка открытых вопросов.

### Переменные окружения в `backend/.env`:
```env
# Обязательный ключ для векторного поиска
GEMINI_API_KEY="AIzaSy..."

# Обязательный ключ для ИИ-ассистента и проверки работ
GROQ_API_KEY="gsk_..."

# Опционально: Google Drive RAG
GOOGLE_DRIVE_API_KEY=""
GOOGLE_DRIVE_FOLDER_ID=""
```

*Примечание: При отсутствии ключей система корректно переключается на обычный LIKE-поиск по тексту.*

---

## 🗄 База данных и ролевая модель (RBAC)

Схема описана в `backend/prisma/schema.prisma` (более 1600+ строк, 30+ таблиц).

### Роли пользователей (`Role`):
- `DEVELOPER` — полный доступ к отладке и настройкам
- `DIRECTOR` — административный и финансовый контроль
- `DEPUTY` — завуч, доступ к упреждению учебного процесса
- `ADMIN` — системный администратор
- `TEACHER` — преподаватель (журнал, курсы LMS, контрольные)
- `ACCOUNTANT` — бухгалтер (финансы, ПКО/РКО, зарплата)
- `ZAVHOZ` — завхоз (склад, заявки на ремонт)

### Аудит действий (`ActionLog`):
Все значимые изменения данных логгируются в модели `ActionLog` с сохранением JSON-дампа изменённых полей (`payload`).

---

## 📱 Адаптивный дизайн и Mobile-First

Фронтенд спроектирован с поддержкой всех мобильных устройств и планшетов:

- **Touch targets:** Минимальный размер интерактивных элементов — 44px (предотвращает зум на iOS).
- **Сайдбар:** Адаптивное Slide-Out меню с эффектами Backdrop Blur (`SideNav.tsx`).
- **Сетка:** Используется утилита `.mezon-grid` для отзывчивой раскладки карточек (1 колонка на моб., 2-4 на десктопе).
- **Таблицы:** Компонент `DataTable` с встроенной горизонтальной прокруткой и липкими заголовками.

---

## 🔧 Деплой и скрипты

### Скрипты фронтенда (`frontend/package.json`):
```bash
npm run dev        # Локальный сервер Vite (Development)
npm run build      # Оптимизированная сборка (TypeScript + Vite)
npm run lint       # Проверка ESLint
npm run test       # Витест юнит-тесты
```

### Скрипты бэкенда (`backend/package.json`):
```bash
npm run dev        # Сервер разработки (ts-node-dev)
npm run build      # Компиляция TypeScript в dist/
npm start          # Запуск закомпилированного сервера
npm run test       # Тестирование Vitest
```

---

*Авторы: Mezon Development Team | Лицензия: ISC*