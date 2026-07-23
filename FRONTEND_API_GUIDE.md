# 📘 FRONTEND API GUIDE — Mezon Admin REST API

Техническое руководство и официальная документация по интеграции с Backend REST API системы **Mezon Admin**.  
Документ предназначен для frontend-разработчиков и содержит подробное описание авторизации, форматов ответов, всех доступных API-эндпоинтов, правил Zod-валидации и готовых TypeScript-интерфейсов.

---

## 📑 Оглавление

1. [🚀 Раздел 1. Быстрый старт для Frontend (Quickstart)](#-раздел-1-быстрый-старт-для-frontend-quickstart)
2. [🔐 Раздел 2. Авторизация и Безопасность](#-раздел-2-авторизация-и-безопасность)
3. [📦 Раздел 3. Единый формат ответов и ошибок](#-раздел-3-единый-формат-ответов-и-ошибок)
4. [🛠 Раздел 4. Модули API (Основной справочник)](#-раздел-4-модули-api-основной-справочник)
   - [4.1. Аутентификация, Пользователи и Права](#41-аутентификация-пользователи-и-права)
   - [4.2. Контингент Учеников, Родители и Группы](#42-контингент-учеников-родители-и-группы)
   - [4.3. Кадры и Штатное Расписание](#43-кадры-и-штатное-расписание)
   - [4.4. Посещаемость и Кружки](#44-посещаемость-и-кружки)
   - [4.5. Финансы и Интеграция 1С](#45-финансы-и-интеграция-1с)
   - [4.6. Склад и ТМЦ (Inventory)](#46-склад-и-тмц-inventory)
   - [4.7. Закупки (Procurement)](#47-закупки-procurement)
   - [4.8. Заявки на Ремонт и Обслуживание (Maintenance)](#48-заявки-на-ремонт-и-обслуживание-maintenance)
   - [4.9. Питание, Рецепты и Ингредиенты (Menu & Recipes)](#49-питание-рецепты-и-ингредиенты-menu--recipes)
   - [4.10. Учебная Платформа (LMS School)](#410-учебная-платформа-lms-school)
   - [4.11. Контрольные Работы (Exams & Public Exams)](#411-контрольные-работы-exams--public-exams)
   - [4.12. AI-Сервисы и Векторная База Знаний (RAG)](#412-ai-сервисы-и-векторная-база-знаний-rag)
   - [4.13. Расписание и Календарь (Schedule & Calendar)](#413-расписание-и-календарь-schedule--calendar)
   - [4.14. Дашборды, Аналитика и Системные Службы](#414-дашборды-аналитика-и-системные-службы)
5. [💻 Раздел 5. Готовые TypeScript-интерфейсы](#-раздел-5-готовые-typescript-интерфейсы)

---

## 🚀 Раздел 1. Быстрый старт для Frontend (Quickstart)

### 1.1. Запуск локального сервера разработки (Vite SPA)

```bash
# Клонирование и переход в папку фронтенда
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера Vite
npm run dev
```
По умолчанию SPA будет доступно по адресу `http://localhost:5173`.

### 1.2. Конфигурация переменных окружения (`.env.local`)

Создайте файл `frontend/.env.local` в папке `frontend/`:

```env
# URL REST API бэкенда
VITE_API_URL=http://localhost:4000/api

# Опционально: интеграция захвата верстки Figma
VITE_ENABLE_FIGMA_CAPTURE=true
```

### 1.3. Сценарии работы с Backend

#### Вариант A: Локальный запуск бэкенда с PostgreSQL и Prisma
```bash
# В отдельном окне терминала из корня проекта:
cd backend

# Установка зависимостей бэкенда
npm install

# Генерация Prisma-клиента и применение схемы БД
npx prisma generate
npx prisma db push

# Первичное заполнение тестовыми данными (директор, завуч, учителя, классы)
npm run seed

# Запуск сервера разработки Express
npm run dev
```
Бэкенд станет доступен на `http://localhost:4000/api`.

#### Вариант B: Подключение к внешнему dev-серверу
Укажите сетевой адрес удаленного dev-сервера в `frontend/.env.local`:
```env
VITE_API_URL=https://dev-api.mezon.uz/api
```

---

## 🔐 Раздел 2. Авторизация и Безопасность

### 2.1. Схема аутентификации (JWT)
Система использует двухуровневую аутентификацию на основе JSON Web Tokens (JWT):

1. **HttpOnly Cookie (`auth_token`):** Устанавливается автоматически сервером при вызове `POST /api/auth/login` с флагами `httpOnly: true`, `sameSite: 'none'`.
2. **Bearer Token (Authorization Header):** Для клиенских HTTP-клиентов (Axios, Fetch, Mobile) поддерживается отправка токена в заголовке:
   ```http
   Authorization: Bearer <your_jwt_token>
   ```

> **Важно для Frontend-клиента:** Настройте Axios / Fetch на передачу учетных данных (`withCredentials: true` или `credentials: 'include'`), чтобы кука автоматически передавалась при каждом запросе.

### 2.2. Ролевая модель (RBAC)

В системе определены 7 основных ролей пользователей (`enum Role`):

| Роль | Ключ (`Role`) | Описание и область доступа |
| :--- | :--- | :--- |
| **Разработчик** | `DEVELOPER` | Полный неограниченный доступ ко всем эндпоинтам и отладке. |
| **Директор** | `DIRECTOR` | Полный административный и финансовый контроль системы. |
| **Завуч** | `DEPUTY` | Управление учебным процессом, сотрудниками, детьми, расписанием. |
| **Администратор** | `ADMIN` | Системный админ: управление пользователями, правами и удалениями. |
| **Преподаватель** | `TEACHER` | Управление LMS-курсами, журналами, контрольными и посещаемостью. |
| **Бухгалтер** | `ACCOUNTANT` | Доступ к финансовым транзакциям, 1С-данным, зарплатам и отчетам. |
| **Завхоз** | `ZAVHOZ` | Управление складом ТМЦ, закупками и ремонтно-хозяйственными заявками. |

#### Правило проверок ролей (`checkRole` middleware):
- Пользователи с ролями `DEVELOPER` и `DIRECTOR` имеют **автоматический доступ (`FULL_ACCESS_ROLES`)** ко всем защищенным эндпоинтам.
- Если у пользователя недостаточно прав для вызова эндпоинта, бэкенд возвращает статус `403 Forbidden`.

---

## 📦 Раздел 3. Единый формат ответов и ошибок

### 3.1. Успешный ответ (HTTP 200 / 201)

#### Стандартный объект данных:
```json
{
  "id": 12,
  "firstName": "Иван",
  "lastName": "Иванов",
  "status": "ACTIVE"
}
```

#### Ответ с пагинацией (списки сущностей):
```json
{
  "items": [ /* массив элементов */ ],
  "total": 142,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

### 3.2. HTTP Статус-коды ошибок

| Код | Название | Причина |
| :---: | :--- | :--- |
| **400** | `Bad Request` | Ошибка валидации параметров запроса или тела (Zod validation error). |
| **401** | `Unauthorized` | Отсутствует или недействителен JWT-токен в куке/заголовке. |
| **403** | `Forbidden` | У текущей роли пользователя нет прав для данного действия. |
| **404** | `Not Found` | Запрашиваемый ресурс (запись по ID или URL-маршрут) не найден. |
| **409** | `Conflict` | Конфликт уникальности данных (например, дубликат email в Prisma `P2002`). |
| **422** | `Unprocessable` | Ошибка бизнес-логики приложения. |
| **500** | `Internal Error` | Внутренняя ошибка сервера. |

### 3.3. Структура JSON ответа при ошибке

#### Операционная ошибка сервера (`AppError`):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ресурс не найден",
    "details": null
  }
}
```

#### Ошибка валидации Zod (`validate` middleware):
```json
{
  "message": "Validation error",
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["body", "firstName"],
      "message": "Имя обязательно"
    }
  ]
}
```

---

## 🛠 Раздел 4. Модули API (Основной справочник)

---

### 4.1. Аутентификация, Пользователи и Права

#### `POST /api/auth/login`
- **Роли:** Публичный доступ
- **Request Body:**
  ```json
  {
    "login": "director@mezon.uz",
    "password": "admin123"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "director@mezon.uz",
      "role": "DIRECTOR",
      "employeeId": 1,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "employee": {
        "id": 1,
        "firstName": "Алишер",
        "lastName": "Навои",
        "position": "Директор"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

#### `GET /api/auth/me`
- **Роли:** Любой аутентифицированный пользователь (возвращает `{ user: null }` если не авторизован)
- **Response Body (200 OK):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "director@mezon.uz",
      "role": "DIRECTOR",
      "employeeId": 1,
      "employee": { "id": 1, "firstName": "Алишер", "lastName": "Навои" }
    }
  }
  ```

#### `POST /api/auth/logout`
- **Роли:** Любой
- **Response Body (200 OK):**
  ```json
  { "message": "Logged out successfully" }
  ```

#### `GET /api/users`
- **Роли:** `ADMIN`
- **Query Params:** `page` (number), `pageSize` (number), `role` (`Role`), `search` (string), `status` (`ACTIVE` \| `INACTIVE` \| `ALL`)
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 2,
        "email": "teacher@mezon.uz",
        "role": "TEACHER",
        "employeeId": 5,
        "deletedAt": null,
        "employee": { "id": 5, "firstName": "Мария", "lastName": "Иванова" }
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
  ```

#### `GET /api/users/employees/available`
- **Роли:** `ADMIN`
- **Response Body (200 OK):** Массив сотрудников без привязанных учетных записей `User`.

#### `POST /api/users`
- **Роли:** `ADMIN`
- **Request Body:**
  | Поле | Тип | Обязательное | Валидация Zod |
  | :--- | :--- | :---: | :--- |
  | `email` | `string` | Да | `z.string().email()` |
  | `password` | `string` | Да | `z.string().min(6)` |
  | `role` | `Role` | Да | `enum Role` |
  | `employeeId` | `number` | Да | `z.number().positive()` |
- **Response Body (201 Created):** Объект созданного `User`.

#### `GET /api/permissions`
- **Роли:** `DEVELOPER`, `DIRECTOR`, `DEPUTY`, `ADMIN`
- **Response Body (200 OK):** Массив настроек прав `RolePermission`.

---

### 4.2. Контингент Учеников, Родители и Группы

#### `GET /api/children`
- **Роли:** `DEPUTY`, `ADMIN`, `TEACHER`, `ACCOUNTANT`
- **Query Params:** `page`, `pageSize`, `sortBy`, `sortOrder` (`asc`\|`desc`), `status` (`ACTIVE`\|`LEFT`\|`ARCHIVED`), `groupId` (number), `gender` (`MALE`\|`FEMALE`), `search` (string)
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 10,
        "firstName": "Тимур",
        "lastName": "Каримов",
        "middleName": "Ахматович",
        "birthDate": "2017-05-14T00:00:00.000Z",
        "gender": "MALE",
        "status": "ACTIVE",
        "groupId": 2,
        "balance": -3500000,
        "hasDebt": true,
        "group": { "id": 2, "name": "1-А класс" },
        "parents": [
          { "id": 1, "fullName": "Каримов Ахмат", "relation": "отец", "phone": "+998901234567" }
        ]
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
  ```
> **Примечание по биллингу:** Поля `balance` (расчетный баланс: сумма оплат за вычетом выставленных счетов) и `hasDebt` (`true`, если баланс отрицательный или есть просроченные счета `OVERDUE`) вычисляются автоматически и используются на фронтенде для индикаторов должников.

---

### 4.2.1. Договоры учеников и Школьный Биллинг (Contracts & Invoices)

#### `GET /api/children/:childId/contracts`
- **Роли:** `DEPUTY`, `ADMIN`, `TEACHER`, `ACCOUNTANT`
- **Описание:** Получение всех договоров конкретного ученика.
- **Response Body (200 OK):**
  ```json
  [
    {
      "id": 1,
      "childId": 10,
      "contractNumber": "DOG-2025-10",
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": null,
      "monthlyFee": 3500000,
      "status": "ACTIVE",
      "fileUrl": "https://mezon.uz/files/contract_10.pdf",
      "createdAt": "2025-09-01T10:00:00.000Z",
      "updatedAt": "2025-09-01T10:00:00.000Z"
    }
  ]
  ```

#### `POST /api/children/:childId/contracts`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Описание:** Привязка нового договора к ученику.
- **Request Body:**
  | Поле | Тип | Обяз. | Описание / Валидация Zod |
  | :--- | :--- | :---: | :--- |
  | `contractNumber` | `string` | Да | Уникальный номер договора (`min(1)`) |
  | `startDate` | `string` | Да | Дата начала (ISO дата) |
  | `endDate` | `string` | Нет | Дата окончания (ISO дата, опционально) |
  | `monthlyFee` | `number` | Да | Ежемесячная плата (`positive()`) |
  | `status` | `enum` | Нет | `ACTIVE` \| `TERMINATED` \| `EXPIRED` (по умолч. `ACTIVE`) |
  | `fileUrl` | `string` | Нет | Ссылка на документ/скан |
- **Response Body (201 Created):** Объект нового договора `StudentContract`.

#### `PUT /api/contracts/:id`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Описание:** Изменение параметров или статуса договора.
- **Request Body:** Опциональные поля `contractNumber`, `startDate`, `endDate`, `monthlyFee`, `status`, `fileUrl`.
- **Response Body (200 OK):** Обновленный объект `StudentContract`.

#### `DELETE /api/contracts/:id`
- **Роли:** `ADMIN`, `ACCOUNTANT`
- **Описание:** Расторжение/удаление договора.
- **Response Body (204 No Content)**

---

#### `GET /api/finance/invoices`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`, `DIRECTOR`
- **Описание:** Получение списка всех счетов и инвойсов биллинга с фильтрами и пагинацией.
- **Query Params:**
  | Параметр | Тип | Описание |
  | :--- | :--- | :--- |
  | `page` | `number` | Номер страницы (по умолчанию 1) |
  | `pageSize` | `number` | Элементов на страницу (по умолчанию 20) |
  | `status` | `enum` | `PENDING` \| `PAID` \| `OVERDUE` \| `CANCELLED` |
  | `groupId` | `number` | Фильтр по классу/группе учеников |
  | `childId` | `number` | Фильтр по конкретному ученику |
  | `period` | `string` | Фильтр по периоду (например `"2026-07"`) |
  | `search` | `string` | Поиск по номеру счета или ФИО ученика |
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 5,
        "childId": 10,
        "contractId": 1,
        "number": "INV-202607-10",
        "amount": 3500000,
        "issueDate": "2026-07-01T00:00:00.000Z",
        "dueDate": "2026-07-10T00:00:00.000Z",
        "status": "OVERDUE",
        "period": "2026-07",
        "description": "Оплата за обучение (2026-07) по договору №DOG-2025-10",
        "child": {
          "id": 10,
          "firstName": "Тимур",
          "lastName": "Каримов",
          "groupId": 2,
          "group": { "id": 2, "name": "1-А класс" }
        },
        "contract": {
          "id": 1,
          "contractNumber": "DOG-2025-10",
          "monthlyFee": 3500000
        }
      }
    ],
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "totalPages": 6
  }
  ```

#### `POST /api/finance/invoices/generate`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Описание:** Массовая автоматическая генерация счетов за указанный/текущий период для всех активных учеников (`status = ACTIVE`), у которых есть действующий договор (`status = ACTIVE`).
- **Request Body:**
  | Поле | Тип | Обяз. | Описание |
  | :--- | :--- | :---: | :--- |
  | `period` | `string` | Нет | Период в формате `YYYY-MM` (по умолч. текущий месяц, напр. `"2026-07"`) |
  | `issueDate` | `string` | Нет | Дата выставления |
  | `dueDate` | `string` | Нет | Срок оплаты (по умолч. 10 число) |
  | `groupId` | `number` | Нет | Ограничить генерацию конкретной группой |
- **Response Body (201 Created):**
  ```json
  {
    "count": 42,
    "invoices": [ /* массив созданных счетов */ ]
  }
  ```

#### `POST /api/finance/invoices`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Описание:** Ручное выставление индивидуального счета ученику.
- **Request Body:**
  | Поле | Тип | Обяз. | Описание |
  | :--- | :--- | :---: | :--- |
  | `childId` | `number` | Да | ID ученика |
  | `contractId` | `number` | Нет | ID договора (опционально) |
  | `amount` | `number` | Да | Сумма счета (`positive()`) |
  | `issueDate` | `string` | Да | Дата выставления (ISO) |
  | `dueDate` | `string` | Да | Срок оплаты (ISO) |
  | `period` | `string` | Да | Период (`YYYY-MM`) |
  | `description` | `string` | Нет | Комментарий/назначение |
  | `status` | `enum` | Нет | `PENDING` \| `PAID` \| `OVERDUE` \| `CANCELLED` |
- **Response Body (201 Created):** Объект созданного счета `Invoice`.

#### `PUT /api/finance/invoices/:id/status`
- **Роли:** `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Описание:** Изменение статуса счета (например, проведения оплаты или отмены).
- **Request Body:**
  ```json
  {
    "status": "PAID"
  }
  ```
- **Response Body (200 OK):** Обновленный объект счета `Invoice`.

#### `POST /api/children`
- **Роли:** `DEPUTY`, `ADMIN`
- **Request Body:**
  | Поле | Тип | Обяз. | Описание / Валидация |
  | :--- | :--- | :---: | :--- |
  | `firstName` | `string` | Да | Имя ребенка (`min(1)`) |
  | `lastName` | `string` | Да | Фамилия (`min(1)`) |
  | `middleName` | `string` | Нет | Отчество |
  | `birthDate` | `string` | Да | ISO дата рождения (`YYYY-MM-DD`) |
  | `groupId` | `number` | Да | ID группы/класса |
  | `gender` | `enum` | Нет | `MALE` \| `FEMALE` |
  | `healthInfo` | `object` | Нет | `{ allergies: [], specialConditions: [], medications: [], notes: "" }` |
  | `parents` | `array` | Нет | Массив объектов `parentInputSchema` |
- **Response Body (201 Created):** Полный объект созданной карточки ребенка.

#### `PUT /api/children/:id/archive`
- **Роли:** `DEPUTY`, `ADMIN`
- **Response Body (204 No Content)**

#### `GET /api/children/:id/absences`
- **Роли:** `DEPUTY`, `ADMIN`, `TEACHER`
- **Response Body (200 OK):** Массив записей о временном отсутствии ребенка.

#### `POST /api/children/:id/absences`
- **Request Body:** `{ "startDate": "2026-08-01", "endDate": "2026-08-10", "reason": "Болезнь" }`
- **Response Body (201 Created)**

#### `GET /api/groups`
- **Роли:** `DEPUTY`, `ADMIN`, `TEACHER`, `ACCOUNTANT`
- **Response Body (200 OK):** Список всех классов и групп с количеством детей.

---

### 4.3. Кадры и Штатное Расписание

#### `GET /api/employees`
- **Роли:** `DEPUTY`, `ADMIN`
- **Query Params:** `page`, `pageSize`, `position`, `search`, `category`
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 5,
        "firstName": "Ольга",
        "lastName": "Петрова",
        "position": "Учитель математики",
        "rate": 1.0,
        "hireDate": "2023-09-01T00:00:00.000Z",
        "medicalCheckupDate": "2026-10-15T00:00:00.000Z",
        "status": "ACTIVE"
      }
    ],
    "total": 28,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
  ```

#### `GET /api/employees/reminders`
- **Роли:** `DEPUTY`, `ADMIN`
- **Query Params:** `days` (по умолчанию 30)
- **Response Body (200 OK):** Список сотрудников, у которых истекает срок медосмотра или аттестации.

#### `POST /api/employees`
- **Request Body:**
  | Поле | Тип | Обяз. | Валидация Zod |
  | :--- | :--- | :---: | :--- |
  | `firstName` | `string` | Да | `z.string().min(2)` |
  | `lastName` | `string` | Да | `z.string().min(2)` |
  | `position` | `string` | Да | `z.string().min(2)` |
  | `rate` | `number` | Да | `z.number().positive()` |
  | `hireDate` | `string` | Да | `z.string().datetime()` |
  | `user` | `object` | Нет | Автоматическое создание `User` аккаунта |

---

### 4.4. Посещаемость и Кружки

#### `POST /api/attendance`
- **Роли:** `DEPUTY`, `ADMIN`, `TEACHER`
- **Request Body:**
  ```json
  {
    "date": "2026-07-22",
    "groupId": 2,
    "records": [
      { "childId": 10, "status": "PRESENT" },
      { "childId": 11, "status": "ABSENT", "reason": "Болезнь" }
    ]
  }
  ```
- **Response Body (200 OK):** `{ "success": true, "count": 2 }`

#### `GET /api/clubs`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `ACCOUNTANT`, `TEACHER`
- **Response Body (200 OK):** Список дополнительных кружков и секций.

#### `POST /api/clubs/:id/enroll`
- **Request Body:** `{ "childId": 10 }`
- **Response Body (200 OK):** Информация о записи ребенка в кружок.

---

### 4.5. Финансы и Интеграция 1С

#### `GET /api/finance/transactions`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `ACCOUNTANT`
- **Query Params:** `page`, `pageSize`, `type` (`INCOME`\|`EXPENSE`), `category` (`NUTRITION`\|`CLUBS`\|`MAINTENANCE`\|`SALARY`\|`OTHER`), `channel` (`CASH`\|`BANK`), `startDate`, `endDate`
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 101,
        "type": "INCOME",
        "category": "CLUBS",
        "amount": 450000.00,
        "channel": "CASH",
        "description": "Оплата за кружок робототехники",
        "date": "2026-07-20T14:30:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
  ```

#### `GET /api/finance/summary`
- **Response Body (200 OK):** Агрегированная сводка доходов, расходов и чистого сальдо.

#### `GET /api/onec-data/balances`
- **Response Body (200 OK):** Остатки на кассах и расчетных счетах, синхронизированные из 1С:Предприятие.

#### `POST /api/integrations/onec/sync`
- **Роли:** `ADMIN`, `ACCOUNTANT`
- **Response Body (200 OK):** Результат синхронизации транзакций с 1С.

---

### 4.6. Склад и ТМЦ (Inventory)

#### `GET /api/inventory`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `ZAVHOZ`, `ACCOUNTANT`
- **Query Params:** `type` (`FOOD`\|`HOUSEHOLD`\|`STATIONERY`), `search`, `lowStock` (`true`\|`false`)
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 14,
        "name": "Бумага А4 SvetoCopy",
        "type": "STATIONERY",
        "quantity": 45,
        "unit": "пачка",
        "minQuantity": 10,
        "price": 38000.00
      }
    ],
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "totalPages": 6
  }
  ```

#### `POST /api/inventory/transactions`
- **Request Body:** Приход / Списание товара со склада.
  ```json
  {
    "inventoryItemId": 14,
    "type": "IN",
    "quantity": 20,
    "reason": "Закупка по накладной №45"
  }
  ```

---

### 4.7. Закупки (Procurement)

#### `GET /api/procurement`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `ZAVHOZ`, `ACCOUNTANT`
- **Query Params:** `status` (`DRAFT`\|`PENDING`\|`APPROVED`\|`DELIVERED`\|`CANCELLED`), `type` (`PLANNED`\|`OPERATIONAL`)
- **Response Body (200 OK):** Список заказов на закупку товаров.

#### `PUT /api/procurement/:id/status`
- **Request Body:** `{ "status": "APPROVED", "comment": "Согласовано директором" }`

---

### 4.8. Заявки на Ремонт и Обслуживание (Maintenance)

#### `GET /api/maintenance`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `ZAVHOZ`, `TEACHER`
- **Query Params:** `status` (`PENDING`\|`APPROVED`\|`IN_PROGRESS`\|`DONE`), `type` (`REPAIR`\|`ISSUE`)
- **Response Body (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 8,
        "title": "Ремонт проектора в кабинете 204",
        "type": "REPAIR",
        "status": "PENDING",
        "priority": "HIGH",
        "requester": { "firstName": "Иван", "lastName": "Сидоров" },
        "createdAt": "2026-07-22T09:00:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
  ```

#### `PUT /api/maintenance/:id/approve`
- **Роли:** `DIRECTOR`, `DEPUTY`
- **Response Body (200 OK):** Переводит заявку в статус `APPROVED` для исполнения Завхозом.

---

### 4.9. Питание, Рецепты и Ингредиенты (Menu & Recipes)

#### `GET /api/menu`
- **Query Params:** `date`, `ageGroup` (`INFANT`\|`PRESCHOOL`\|`ELEMENTARY`)
- **Response Body (200 OK):** Дневное меню питания с калорийностью и КБЖУ.

#### `GET /api/recipes`
- **Response Body (200 OK):** Технологические карты блюд.

---

### 4.10. Учебная Платформа (LMS School)

#### `GET /api/lms/school/courses`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `TEACHER`
- **Response Body (200 OK):** Каталог онлайн-курсов платформы.

#### `GET /api/lms/school/courses/:id`
- **Response Body (200 OK):** Полный курс с модулями, уроками, заданиями и материалами.

#### `POST /api/lms/school/lessons/:id/progress`
- **Request Body:** `{ "completed": true, "timeSpentSeconds": 1200 }`
- **Response Body (200 OK):** Обновленный прогресс прохождения урока.

---

### 4.11. Контрольные Работы (Exams & Public Exams)

#### `GET /api/exams`
- **Роли:** `DIRECTOR`, `DEPUTY`, `ADMIN`, `TEACHER`
- **Response Body (200 OK):** Список контрольных работ.

#### `POST /api/exams/:id/publish`
- **Response Body (200 OK):**
  ```json
  {
    "examId": 4,
    "publicToken": "exam_sec_89f3a1b2c4e5",
    "publicUrl": "https://erp.mezon.uz/exam/exam_sec_89f3a1b2c4e5"
  }
  ```

#### `GET /api/public/exams/:token` (Без авторизации!)
- **Response Body (200 OK):** Вопросы контрольной работы для ученика без ответов.

#### `POST /api/public/exams/:token/submit` (Без авторизации!)
- **Request Body:**
  ```json
  {
    "studentName": "Алексей Смирнов",
    "answers": [
      { "questionId": 101, "selectedOptionId": 3 },
      { "questionId": 102, "textAnswer": "Решение уравнения x = 5" }
    ]
  }
  ```
- **Response Body (200 OK):** Результаты отправки и статус AI-проверки.

---

### 4.12. AI-Сервисы и Векторная База Знаний (RAG)

#### `POST /api/ai/chat`
- **Request Body:** `{ "message": "Каков порядок списания хозтоваров?" }`
- **Response Body (200 OK):** Ответ ИИ-ассистента на основе документов регламента Google Drive.

#### `POST /api/ai/sync-drive`
- **Роли:** `ADMIN`
- **Response Body (200 OK):** Синхронизация вектора документов из Google Drive.

#### `GET /api/knowledge-base`
- **Response Body (200 OK):** Статьи базы знаний компании.

---

### 4.13. Расписание и Календарь (Schedule & Calendar)

#### `GET /api/schedule`
- **Query Params:** `groupId`, `teacherId`, `dayOfWeek`
- **Response Body (200 OK):** Сетка расписания занятий.

#### `POST /api/schedule/generate`
- **Роли:** `DEPUTY`, `ADMIN`
- **Response Body (200 OK):** Автоматическая генерация расписания без конфликтов кабинетов.

#### `GET /api/calendar`
- **Response Body (200 OK):** Календарь школьных событий и каникул.

---

### 4.14. Дашборды, Аналитика и Системные Службы

#### `GET /api/dashboard`
- **Response Body (200 OK):** Сводные виджеты для главного экрана (финансы, дети, кадры).

#### `GET /api/analytics/expenses`
- **Response Body (200 OK):** Аналитика расходов на 1 ученика по категориям.

#### `POST /api/upload`
- **Content-Type:** `multipart/form-data`
- **Response Body (200 OK):** `{ "url": "/uploads/filename.pdf" }`

---

## 💻 Раздел 5. Готовые TypeScript-интерфейсы

Скопируйте данный блок в ваш файл типов `frontend/src/types/api.ts`:

```typescript
// frontend/src/types/api.ts

// ============================================================================
// СИСТЕМНЫЕ И АВТОРИЗАЦИОННЫЕ ТИПЫ
// ============================================================================

export type Role =
  | 'DEVELOPER'
  | 'DIRECTOR'
  | 'DEPUTY'
  | 'ADMIN'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'ZAVHOZ';

export interface User {
  id: number;
  email: string;
  role: Role;
  employeeId: number;
  telegramChatId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// КОНТИНГЕНТ И УЧЕНИКИ
// ============================================================================

export type ChildStatus = 'ACTIVE' | 'LEFT' | 'ARCHIVED';
export type Gender = 'MALE' | 'FEMALE';

export interface HealthInfo {
  allergies?: string[];
  specialConditions?: string[];
  medications?: string[];
  notes?: string;
}

export interface Parent {
  id: number;
  fullName: string;
  relation: string;
  phone?: string;
  email?: string;
  workplace?: string;
}

export interface Child {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  gender?: Gender;
  status: ChildStatus;
  groupId: number;
  healthInfo?: HealthInfo;
  parents?: Parent[];
  group?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// СОТРУДНИКИ И КАДРЫ
// ============================================================================

export type EmployeeStatus = 'ACTIVE' | 'ARCHIVED';
export type ContractType = 'MAIN' | 'PART_TIME' | 'CONTRACTOR';

export interface EmployeeContract {
  id?: number;
  type: ContractType;
  number: string;
  date: string;
  isActive: boolean;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string | null;
  position: string;
  rate: number;
  hireDate: string;
  fireDate?: string | null;
  medicalCheckupDate?: string | null;
  attestationDate?: string | null;
  status: EmployeeStatus;
  contracts?: EmployeeContract[];
  user?: User;
}

// ============================================================================
// ФИНАНСЫ И СКЛАД
// ============================================================================

export type FinanceType = 'INCOME' | 'EXPENSE';
export type FinanceCategory = 'NUTRITION' | 'CLUBS' | 'MAINTENANCE' | 'SALARY' | 'OTHER';
export type TransactionChannel = 'CASH' | 'BANK';

export interface FinanceTransaction {
  id: number;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  channel: TransactionChannel;
  description?: string;
  date: string;
  posted: boolean;
  createdAt: string;
}

export type InventoryType = 'FOOD' | 'HOUSEHOLD' | 'STATIONERY';

export interface InventoryItem {
  id: number;
  name: string;
  type: InventoryType;
  quantity: number;
  unit: string;
  minQuantity: number;
  price: number;
  updatedAt: string;
}

// ============================================================================
// ХОЗЯЙСТВЕННЫЕ ЗАЯВКИ (MAINTENANCE)
// ============================================================================

export type MaintenanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'DONE';
export type MaintenanceType = 'REPAIR' | 'ISSUE';

export interface MaintenanceRequest {
  id: number;
  title: string;
  description?: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requesterId: number;
  requester?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  approvedAt?: string | null;
}

// ============================================================================
// LMS ОНЛАЙН-ОБУЧЕНИЕ
// ============================================================================

export interface LmsLesson {
  id: number;
  title: string;
  content?: string;
  videoUrl?: string;
  durationMinutes?: number;
  order: number;
}

export interface LmsModule {
  id: number;
  title: string;
  order: number;
  lessons: LmsLesson[];
}

export interface LmsCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPublished: boolean;
  modules?: LmsModule[];
}

// ============================================================================
// ШКОЛЬНЫЙ БИЛЛИНГ И ДОГОВОРЫ (BILLING & CONTRACTS)
// ============================================================================

export type ContractStatus = 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

export interface StudentContract {
  id: number;
  childId: number;
  contractNumber: string;
  startDate: string;
  endDate?: string | null;
  monthlyFee: number;
  status: ContractStatus;
  fileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: number;
  childId: number;
  contractId?: number | null;
  number: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  period: string; // "2026-07"
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  child?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    groupId: number;
    group?: { id: number; name: string };
  };
  contract?: {
    id: number;
    contractNumber: string;
    monthlyFee: number;
  } | null;
}
```

---
*Документация актуальна для текущей версии сервера REST API (Mezon Admin v2026).*
