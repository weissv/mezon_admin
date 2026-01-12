# Ручное развертывание обновления системы заявок

Если автоматический скрипт не работает, следуйте этим инструкциям.

## Параметры подключения
- **Хост**: 185.217.131.26
- **Пользователь**: root
- **Пароль**: Z@pu2laGYwsSF?N$

## Шаг 1: Подключитесь к серверу

```bash
ssh root@185.217.131.26
# Пароль: Z@pu2laGYwsSF?N$
```

## Шаг 2: Создайте бэкап базы данных

```bash
cd /root/mezon_admin
mkdir -p backups
docker-compose exec -T postgres pg_dump -U erp_user erp_db > backups/backup-before-maintenance-workflow-$(date +%Y%m%d-%H%M%S).sql
```

Проверьте, что бэкап создан:
```bash
ls -lh backups/
```

## Шаг 3: Скопируйте файлы на сервер

**На вашем локальном компьютере** откройте новый терминал и выполните:

```bash
cd /Users/jasureshonov/Documents/GitHub/mezon_admin

# Копируем миграцию
scp -r backend/prisma/migrations/20250112000000_update_maintenance_requests_workflow \
    root@185.217.131.26:/root/mezon_admin/backend/prisma/migrations/

# Копируем schema.prisma
scp backend/prisma/schema.prisma \
    root@185.217.131.26:/root/mezon_admin/backend/prisma/

# Копируем обновленные routes
scp backend/src/routes/maintenance.routes.ts \
    root@185.217.131.26:/root/mezon_admin/backend/src/routes/

# Копируем обновленные schemas
scp backend/src/schemas/maintenance.schema.ts \
    root@185.217.131.26:/root/mezon_admin/backend/src/schemas/

# Копируем обновленный frontend
scp frontend/src/pages/MaintenancePage.tsx \
    root@185.217.131.26:/root/mezon_admin/frontend/src/pages/
```

## Шаг 4: Примените миграцию

**На сервере**:

```bash
cd /root/mezon_admin
docker-compose exec backend npx prisma migrate deploy
```

Если команда выполнена успешно, вы увидите:
```
✔ Applying migration `20250112000000_update_maintenance_requests_workflow`
```

## Шаг 5: Перезапустите сервисы

```bash
docker-compose restart backend
sleep 10
docker-compose restart frontend
```

## Шаг 6: Проверьте статус

```bash
docker-compose ps
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50
```

## Проверка работы

1. Откройте приложение в браузере
2. Войдите как **учитель** и создайте заявку на выдачу
3. Проверьте, что заявка имеет статус "Ожидает одобрения"
4. Войдите как **завуч** и одобрите заявку учителя
5. Войдите как **завхоз** и убедитесь, что одобренная заявка видна

## Откат в случае проблем

Если что-то пошло не так:

```bash
cd /root/mezon_admin

# Найдите последний бэкап
ls -lh backups/

# Восстановите базу данных
docker-compose exec -T postgres psql -U erp_user -d erp_db < backups/backup-before-maintenance-workflow-XXXXXX.sql

# Перезапустите сервисы
docker-compose restart
```

## Устранение неполадок

### Ошибка "Can't reach database server"
```bash
docker-compose ps
docker-compose up -d postgres
```

### Ошибка миграции
```bash
# Проверьте логи
docker-compose logs postgres
docker-compose logs backend

# Проверьте подключение к БД
docker-compose exec backend npx prisma migrate status
```

### Prisma Client не синхронизирован
```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```
