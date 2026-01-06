# LMS (Learning Management System) - Документация

## Обзор

LMS система интегрирована в проект Mezon Admin как отдельное приложение, доступное по адресу `/lms/`. Система предоставляет полнофункциональную платформу онлайн-обучения для образовательных учреждений.

## Архитектура

### Структура файлов

```
frontend/
├── src/
│   ├── lms-main.tsx          # Точка входа LMS (отдельно от ERP)
│   ├── types/
│   │   └── lms.ts            # TypeScript типы для LMS
│   ├── lib/
│   │   └── lms-api.ts        # API клиент для LMS
│   ├── layouts/
│   │   └── LmsLayout.tsx     # Общий макет LMS
│   └── pages/lms/
│       ├── LmsDashboard.tsx           # Главная страница LMS
│       ├── LmsCoursesPage.tsx         # Каталог курсов
│       ├── LmsCourseDetailPage.tsx    # Детальная страница курса
│       ├── LmsLessonPage.tsx          # Просмотр урока
│       ├── LmsMyLearningPage.tsx      # Мое обучение
│       ├── LmsAssignmentsPage.tsx     # Задания
│       ├── LmsDiscussionsPage.tsx     # Обсуждения
│       ├── LmsCertificatesPage.tsx    # Сертификаты
│       ├── LmsProgressPage.tsx        # Прогресс обучения
│       └── LmsCourseEditorPage.tsx    # Редактор курсов

backend/
├── src/
│   └── routes/
│       └── lms.routes.ts     # Все API эндпоинты LMS
└── prisma/
    └── schema.prisma         # Модели базы данных (включая LMS)
```

### База данных (Prisma модели)

| Модель | Описание |
|--------|----------|
| `LmsCourse` | Курсы с информацией об авторе, уровне, описании |
| `LmsModule` | Модули внутри курса |
| `LmsLesson` | Уроки внутри модулей (видео, текст, квиз) |
| `LmsAttachment` | Файлы и материалы к урокам |
| `LmsEnrollment` | Записи на курсы с прогрессом |
| `LmsLessonProgress` | Прогресс по каждому уроку |
| `LmsAssignment` | Задания (квизы, эссе) |
| `LmsQuestion` | Вопросы для заданий |
| `LmsSubmission` | Ответы студентов |
| `LmsCertificate` | Выданные сертификаты |
| `LmsAnnouncement` | Объявления курса |
| `LmsDiscussionThread` | Темы обсуждений |
| `LmsDiscussionMessage` | Сообщения в обсуждениях |

## API Endpoints

### Курсы
```
GET    /api/lms/courses              # Список курсов (фильтрация по category, level)
GET    /api/lms/courses/:id          # Детали курса с модулями и уроками
POST   /api/lms/courses              # Создать курс (ADMIN, TEACHER)
PUT    /api/lms/courses/:id          # Обновить курс
DELETE /api/lms/courses/:id          # Удалить курс
```

### Записи на курсы
```
POST   /api/lms/courses/:id/enroll   # Записаться на курс
DELETE /api/lms/courses/:id/enroll   # Отписаться от курса
GET    /api/lms/my-learning          # Мои записи с прогрессом
```

### Уроки
```
GET    /api/lms/lessons/:id          # Детали урока с заданиями
POST   /api/lms/lessons/:id/progress # Обновить прогресс по уроку
GET    /api/lms/modules/:id          # Получить модуль курса
```

### Задания
```
GET    /api/lms/assignments          # Все доступные задания
GET    /api/lms/assignments/:id      # Детали задания
POST   /api/lms/assignments/:id/submit # Отправить ответ
```

### Обсуждения
```
GET    /api/lms/discussions          # Список тем (фильтр по courseId, lessonId)
POST   /api/lms/discussions          # Создать тему
GET    /api/lms/discussions/:id/messages # Сообщения темы
POST   /api/lms/discussions/:id/messages # Ответить в теме
```

### Сертификаты
```
GET    /api/lms/certificates         # Мои сертификаты
```

### Дашборд и Прогресс
```
GET    /api/lms/dashboard            # Статистика для дашборда
GET    /api/lms/progress             # Детальный прогресс по всем курсам
```

## Доступ по ролям

| Роль | Права |
|------|-------|
| `DIRECTOR`, `ADMIN` | Полный доступ: создание, редактирование, удаление курсов |
| `TEACHER` | Создание своих курсов, редактирование своих курсов |
| `ACCOUNTANT` | Только просмотр и обучение |

## Типы контента уроков

- **VIDEO** - Видеоурок (URL на YouTube/Vimeo или загруженный файл)
- **TEXT** - Текстовый урок с HTML контентом
- **QUIZ** - Интерактивный тест с вопросами

## Типы заданий

- **QUIZ** - Автоматически проверяемый тест
- **ESSAY** - Эссе с ручной проверкой
- **FILE_UPLOAD** - Загрузка файла
- **CODE** - Задание с кодом

## Уровни курсов

- `BEGINNER` - Начальный
- `INTERMEDIATE` - Средний  
- `ADVANCED` - Продвинутый

## Категории курсов

- `PROGRAMMING` - Программирование
- `DESIGN` - Дизайн
- `BUSINESS` - Бизнес
- `MARKETING` - Маркетинг
- `PERSONAL_DEVELOPMENT` - Личностное развитие
- `OTHER` - Другое

## Nginx конфигурация

Для работы LMS как отдельного приложения нужно настроить роутинг:

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

## Запуск

### Development
```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev
```

### Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

Фронтенд будет доступен:
- ERP: `http://localhost:5173/`
- LMS: `http://localhost:5173/lms/`

## Особенности реализации

1. **Отдельная точка входа** - LMS использует `lms-main.tsx` отдельно от основного ERP приложения
2. **Multi-page build** - Vite настроен на сборку двух HTML файлов (index.html и lms.html)
3. **Общая аутентификация** - LMS использует тот же JWT токен что и ERP
4. **Типизированный API клиент** - `lms-api.ts` предоставляет типобезопасные методы
5. **Прогресс обучения** - Автоматическое отслеживание прогресса по каждому уроку
6. **Сертификаты** - Автоматическая генерация номеров сертификатов

## TypeScript типы

Все типы LMS определены в `frontend/src/types/lms.ts`:

```typescript
interface LmsCourse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: string;
  isPublished: boolean;
  authorId: number;
  // ... и другие поля
}

interface LmsEnrollment {
  id: number;
  courseId: number;
  userId: number;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  // ...
}

// ... и другие интерфейсы
```

## Диаграмма связей моделей

```
LmsCourse
    ├── LmsModule[]
    │       └── LmsLesson[]
    │               ├── LmsAttachment[]
    │               └── LmsAssignment[]
    │                       ├── LmsQuestion[]
    │                       └── LmsSubmission[]
    ├── LmsEnrollment[]
    │       ├── LmsLessonProgress[]
    │       ├── LmsSubmission[]
    │       └── LmsCertificate[]
    ├── LmsAnnouncement[]
    └── LmsDiscussionThread[]
            └── LmsDiscussionMessage[]
```
