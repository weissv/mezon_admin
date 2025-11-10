# API Documentation - Mezon Admin ERP System

## Обзор

Документация описывает все доступные API эндпоинты системы управления детским садом/школой.

**Base URL**: `http://localhost:4000/api`

**Аутентификация**: Bearer Token (JWT)

---

## 🆕 Новые модули

### 📄 Documents API (`/api/documents`)

Управление документами и шаблонами.

#### GET /api/documents
Список всех документов с фильтрацией.

**Query Parameters**:
- `employeeId` (optional) - фильтр по сотруднику
- `childId` (optional) - фильтр по ребенку

**Response**:
```json
[
  {
    "id": 1,
    "name": "Договор №123",
    "fileUrl": "/uploads/contract123.pdf",
    "templateId": 1,
    "employeeId": null,
    "childId": 5,
    "createdAt": "2025-11-09T10:00:00Z",
    "employee": null,
    "child": { "id": 5, "firstName": "Иван", "lastName": "Петров" },
    "template": { "id": 1, "name": "Договор стандартный" }
  }
]
```

#### POST /api/documents
Создать новый документ.

**Body**:
```json
{
  "name": "Справка о посещении",
  "fileUrl": "/uploads/certificate.pdf",
  "templateId": 2,
  "employeeId": null,
  "childId": 10
}
```

#### PUT /api/documents/:id
Обновить документ.

#### DELETE /api/documents/:id
Удалить документ (только ADMIN).

#### GET /api/documents/templates
Список всех шаблонов документов.

#### POST /api/documents/templates
Создать шаблон (только ADMIN).

---

### 📅 Calendar API (`/api/calendar`)

Управление событиями и календарем.

#### GET /api/calendar
Список событий с фильтрацией по датам.

**Query Parameters**:
- `startDate` (optional) - начало периода (ISO 8601)
- `endDate` (optional) - конец периода (ISO 8601)

**Response**:
```json
[
  {
    "id": 1,
    "title": "Новогодний утренник",
    "description": "Праздничное мероприятие для всех групп",
    "date": "2025-12-31T10:00:00Z",
    "createdAt": "2025-11-09T17:52:27Z"
  }
]
```

#### POST /api/calendar
Создать событие.

**Body**:
```json
{
  "title": "День здоровья",
  "description": "Спортивные мероприятия на свежем воздухе",
  "date": "2025-11-15T09:00:00Z"
}
```

---

### 💬 Feedback API (`/api/feedback`)

Обратная связь (жалобы, предложения, обращения).

#### GET /api/feedback
Список обращений с фильтрацией.

**Query Parameters**:
- `status` (optional) - NEW | IN_PROGRESS | RESOLVED
- `type` (optional) - Жалоба | Предложение | Обращение

#### POST /api/feedback
Создать обращение (требует аутентификацию).

**Body**:
```json
{
  "parentName": "Сидорова Мария",
  "contactInfo": "maria@example.com",
  "type": "Предложение",
  "message": "Хотелось бы больше занятий на свежем воздухе"
}
```

#### PUT /api/feedback/:id
Обновить статус обращения.

**Body**:
```json
{
  "status": "RESOLVED",
  "response": "Спасибо за предложение! Увеличим время прогулок."
}
```

---

### 🛒 Procurement API (`/api/procurement`)

Закупки и поставщики.

#### GET /api/procurement/suppliers
Список поставщиков.

#### POST /api/procurement/suppliers
Создать поставщика (только ADMIN).

**Body**:
```json
{
  "name": "ООО Продукты",
  "contactInfo": "тел: +7(999)123-45-67",
  "pricelist": { "1": 50.5, "2": 60.0 }
}
```

#### GET /api/procurement/orders
Список заказов с фильтрацией.

**Query Parameters**:
- `status` (optional) - PENDING | APPROVED | DELIVERED
- `supplierId` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "supplierId": 1,
    "orderDate": "2025-11-09T00:00:00Z",
    "deliveryDate": "2025-11-12T00:00:00Z",
    "totalAmount": 5000.50,
    "status": "PENDING",
    "supplier": { "id": 1, "name": "ООО Продукты" },
    "items": [
      {
        "id": 1,
        "ingredientId": 1,
        "quantity": 50,
        "price": 45.00,
        "ingredient": { "id": 1, "name": "Картофель", "unit": "кг" }
      }
    ]
  }
]
```

#### POST /api/procurement/orders
Создать заказ.

**Body**:
```json
{
  "supplierId": 1,
  "orderDate": "2025-11-09",
  "deliveryDate": "2025-11-12",
  "items": [
    { "ingredientId": 1, "quantity": 50, "price": 45.00 },
    { "ingredientId": 2, "quantity": 30, "price": 65.00 }
  ]
}
```

---

### 🍳 Recipes API (`/api/recipes`)

Ингредиенты, блюда и рецепты.

#### GET /api/recipes/ingredients
Список всех ингредиентов.

**Response**:
```json
[
  {
    "id": 1,
    "name": "Картофель",
    "unit": "кг",
    "calories": 77,
    "protein": 2,
    "fat": 0.1,
    "carbs": 17
  }
]
```

#### POST /api/recipes/ingredients
Создать ингредиент (только ADMIN).

**Body**:
```json
{
  "name": "Морковь",
  "unit": "кг",
  "calories": 41,
  "protein": 0.9,
  "fat": 0.2,
  "carbs": 9.6
}
```

#### GET /api/recipes/dishes
Список всех блюд с ингредиентами.

**Response**:
```json
[
  {
    "id": 1,
    "name": "Молочная каша",
    "category": "Завтрак",
    "preparationTime": 20,
    "ingredients": [
      {
        "dishId": 1,
        "ingredientId": 2,
        "quantity": 0.2,
        "ingredient": { "id": 2, "name": "Молоко", "unit": "л" }
      }
    ]
  }
]
```

#### POST /api/recipes/dishes
Создать блюдо с рецептом (только ADMIN).

**Body**:
```json
{
  "name": "Овощное рагу",
  "category": "Обед",
  "preparationTime": 45,
  "ingredients": [
    { "ingredientId": 1, "quantity": 0.3 },
    { "ingredientId": 3, "quantity": 0.2 }
  ]
}
```

#### GET /api/recipes/dishes/:id/nutrition
Рассчитать КБЖУ блюда.

**Response**:
```json
{
  "dishId": 1,
  "dishName": "Молочная каша",
  "calories": 128,
  "protein": 6.4,
  "fat": 7.2,
  "carbs": 9.6
}
```

---

### 👥 Staffing API (`/api/staffing`)

Штатное расписание и посещаемость сотрудников.

#### GET /api/staffing/tables
Список штатных расписаний.

**Query Parameters**:
- `branchId` (optional)

#### POST /api/staffing/tables
Создать запись в штатное расписание (только ADMIN).

**Body**:
```json
{
  "branchId": 1,
  "position": "Воспитатель",
  "requiredRate": 2.5
}
```

#### GET /api/staffing/attendance
Посещаемость сотрудников.

**Query Parameters**:
- `employeeId` (optional)
- `startDate` (optional)
- `endDate` (optional)

#### POST /api/staffing/attendance
Отметить посещаемость.

**Body**:
```json
{
  "employeeId": 1,
  "date": "2025-11-09",
  "status": "PRESENT",
  "hoursWorked": 8.0,
  "notes": ""
}
```

#### GET /api/staffing/report
Отчет об укомплектованности штата.

**Query Parameters**:
- `branchId` (optional)

**Response**:
```json
[
  {
    "branchId": 1,
    "branchName": "Главный корпус",
    "position": "Воспитатель",
    "requiredRate": 2.5,
    "currentRate": 2.0,
    "deficit": 0.5
  }
]
```

---

## 🔄 Расширенные существующие модули

### 📊 Dashboard API (`/api/dashboard`)

#### ✨ NEW: GET /api/dashboard/metrics
Расширенная статистика для главной страницы.

**Response**:
```json
{
  "childrenCount": 150,
  "employeesCount": 45,
  "activeClubs": 8,
  "lowInventory": [
    { "id": 5, "name": "Молоко", "quantity": 8, "unit": "л" }
  ],
  "attendance": {
    "today": 142,
    "date": "2025-11-09"
  },
  "maintenance": {
    "activeRequests": 3
  },
  "employees": {
    "needingMedicalCheckup": 5
  }
}
```

---

### 🍽️ Menu API (`/api/menu`)

#### ✨ NEW: POST /api/menu/:id/calculate-kbju
Рассчитать КБЖУ для всего меню.

**Response**:
```json
{
  "menuId": 1,
  "date": "2025-11-10T00:00:00Z",
  "ageGroup": "МЛАДШАЯ",
  "kbju": {
    "calories": 1850,
    "protein": 65.5,
    "fat": 58.2,
    "carbs": 245.8
  }
}
```

#### ✨ NEW: GET /api/menu/:id/shopping-list
Список покупок для меню.

**Query Parameters**:
- `portions` (optional, default: 1) - количество порций

**Response**:
```json
{
  "menuId": 1,
  "date": "2025-11-10T00:00:00Z",
  "ageGroup": "МЛАДШАЯ",
  "portions": 25,
  "items": [
    {
      "ingredientName": "Картофель",
      "unit": "кг",
      "requiredQty": 7.5,
      "inStock": 50.0,
      "toBuy": 0
    },
    {
      "ingredientName": "Молоко",
      "unit": "л",
      "requiredQty": 5.0,
      "inStock": 2.0,
      "toBuy": 3.0
    }
  ]
}
```

---

### 💰 Finance API (`/api/finance`)

#### ✨ NEW: GET /api/finance/reports/summary
Сводный финансовый отчет с группировкой.

**Query Parameters**:
- `startDate` (optional)
- `endDate` (optional)
- `groupBy` (optional, default: "month")

**Response**:
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "totals": {
    "totalAmount": 450000,
    "totalTransactions": 125
  },
  "byCategory": [
    { "category": "FOOD", "_sum": { "amount": 120000 }, "_count": { "id": 45 } }
  ],
  "byType": [
    { "type": "INCOME", "_sum": { "amount": 500000 }, "_count": { "id": 80 } },
    { "type": "EXPENSE", "_sum": { "amount": 50000 }, "_count": { "id": 45 } }
  ],
  "bySource": [
    { "source": "BUDGET", "_sum": { "amount": 400000 }, "_count": { "id": 100 } }
  ]
}
```

#### ✨ NEW: GET /api/finance/export
Экспорт транзакций в CSV.

**Query Parameters**:
- `startDate` (optional)
- `endDate` (optional)

**Response**: CSV file
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=finance_export_2025-11-09.csv
```

---

### 🔧 Maintenance API (`/api/maintenance`)

#### ✨ NEW: GET /api/maintenance/cleaning
Список графиков уборки.

**Query Parameters**:
- `branchId` (optional)

#### ✨ NEW: POST /api/maintenance/cleaning
Создать график уборки.

**Body**:
```json
{
  "branchId": 1,
  "area": "Группа 1",
  "frequency": "Ежедневно",
  "assignedToId": 5
}
```

#### ✨ NEW: POST /api/maintenance/cleaning/:id/log
Отметить выполнение уборки.

#### ✨ NEW: GET /api/maintenance/equipment
Список оборудования.

#### ✨ NEW: POST /api/maintenance/equipment
Добавить оборудование.

**Body**:
```json
{
  "branchId": 1,
  "name": "Огнетушитель #1",
  "location": "Коридор 1 этаж",
  "lastCheckup": "2025-01-01",
  "nextCheckup": "2026-01-01"
}
```

#### ✨ NEW: GET /api/maintenance/equipment/reminders
Напоминания о проверках оборудования.

**Query Parameters**:
- `days` (optional, default: 30) - период в днях

**Response**:
```json
[
  {
    "id": 1,
    "name": "Огнетушитель #1",
    "location": "Коридор 1 этаж",
    "nextCheckup": "2025-12-01T00:00:00Z",
    "branch": { "id": 1, "name": "Главный корпус" }
  }
]
```

---

### 👶 Children API (`/api/children`)

#### ✨ NEW: GET /api/children/:id/absences
Список временных отсутствий ребенка.

#### ✨ NEW: POST /api/children/:id/absences
Добавить отсутствие.

**Body**:
```json
{
  "startDate": "2025-11-10",
  "endDate": "2025-11-15",
  "reason": "Семейный отпуск"
}
```

#### ✨ NEW: PUT /api/children/absences/:absenceId
Обновить отсутствие.

#### ✨ NEW: DELETE /api/children/absences/:absenceId
Удалить отсутствие (только ADMIN).

---

### 👨‍🏫 Employees API (`/api/employees`)

#### ✨ NEW: GET /api/employees/reminders
Напоминания о медосмотрах и аттестации.

**Query Parameters**:
- `days` (optional, default: 30) - период в днях

**Response**:
```json
{
  "medicalCheckups": [
    {
      "id": 5,
      "firstName": "Иван",
      "lastName": "Петров",
      "position": "Воспитатель",
      "medicalCheckupDate": "2025-11-25T00:00:00Z",
      "daysUntil": 16
    }
  ],
  "attestations": [
    {
      "id": 3,
      "firstName": "Мария",
      "lastName": "Сидорова",
      "position": "Педагог",
      "attestationDate": "2025-12-01T00:00:00Z",
      "daysUntil": 22
    }
  ]
}
```

---

### 🎨 Clubs API (`/api/clubs`)

#### ✨ NEW: GET /api/clubs/:id/ratings
Получить оценки кружка.

**Response**:
```json
{
  "ratings": [
    {
      "id": 1,
      "clubId": 1,
      "childId": 5,
      "rating": 5,
      "comment": "Очень нравится!",
      "child": { "id": 5, "firstName": "Иван", "lastName": "Петров" }
    }
  ],
  "average": 4.8,
  "count": 15
}
```

#### ✨ NEW: POST /api/clubs/:id/ratings
Добавить оценку кружку.

**Body**:
```json
{
  "childId": 5,
  "rating": 5,
  "comment": "Отличный кружок!"
}
```

#### ✨ NEW: GET /api/clubs/:id/reports
Отчет по кружку (посещаемость + финансы).

**Query Parameters**:
- `startDate` (optional)
- `endDate` (optional)

**Response**:
```json
{
  "club": {
    "id": 1,
    "name": "Художественная студия",
    "teacher": "Иванова Мария",
    "maxStudents": 15
  },
  "enrollments": {
    "active": 14,
    "waiting": 3,
    "total": 17
  },
  "attendance": {
    "totalPresent": 280
  },
  "finances": {
    "income": 28000,
    "expense": 15000,
    "balance": 13000
  }
}
```

---

## 🔐 Роли и права доступа

| Роль | Права |
|------|-------|
| **DIRECTOR** | Полный доступ ко всем эндпоинтам |
| **DEPUTY** | Доступ ко всем эндпоинтам кроме удаления критичных данных |
| **ADMIN** | Технический администратор, управление системой |
| **ACCOUNTANT** | Финансы (finance, procurement), отчеты |
| **TEACHER** | Просмотр своих кружков, создание заявок на обслуживание |

---

## 📝 Примеры использования

### Авторизация
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@school.erp","password":"password123"}'

# Response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### Создание события
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:4000/api/calendar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "День открытых дверей",
    "description": "Приглашаем родителей",
    "date": "2025-11-20T10:00:00Z"
  }'
```

### Получение метрик dashboard
```bash
curl -X GET http://localhost:4000/api/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Статус реализации

### ✅ Полностью реализовано:
- Documents API (CRUD)
- Calendar API (CRUD)
- Feedback API (CRUD)
- Procurement API (Suppliers + Orders)
- Recipes API (Ingredients + Dishes + Nutrition calculation)
- Staffing API (Tables + Attendance + Reports)
- Dashboard metrics
- Menu KBJU calculation + Shopping list
- Finance summary reports + CSV export
- Maintenance CleaningSchedule + Equipment + Reminders
- Children TemporaryAbsence
- Employees reminders
- Clubs ratings + reports

### 🔜 Планируется:
- Frontend страницы для новых модулей
- Расширение существующих frontend страниц
- WebSocket для real-time уведомлений
- Файловое хранилище для документов

---

Документация обновлена: 9 ноября 2025 г.
