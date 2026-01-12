#!/bin/bash
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Обновление системы заявок на выдачу (Coolify)    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Параметры подключения
REMOTE_HOST="185.217.131.26"
REMOTE_USER="root"
REMOTE_PASSWORD="Z@pu2laGYwsSF?N$"

# Имена контейнеров Coolify
BACKEND_CONTAINER="tgc0ss4gs8g4k0gk484owksg-030147593411"
FRONTEND_CONTAINER="wg4sckc884oosskoogwkgwso-153351250707"
DB_CONTAINER="mgc0ooksw8w0s4sksk4kwcsw"

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Это продакшн сервер с Coolify!${NC}"
echo "Будет создан бэкап базы данных перед миграцией"
echo ""
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено пользователем"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 1: Создание бэкапа базы данных${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Создаем бэкап через SSH
BACKUP_FILE="backup-maintenance-workflow-$(date +%Y%m%d-%H%M%S).sql"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << ENDSSH
    mkdir -p /root/backups
    
    echo "Создание бэкапа: /root/backups/$BACKUP_FILE"
    docker exec $DB_CONTAINER pg_dump -U postgres postgres > /root/backups/$BACKUP_FILE
    
    if [ \$? -eq 0 ]; then
        echo "✓ Бэкап создан успешно!"
        ls -lh /root/backups/$BACKUP_FILE
    else
        echo "✗ Ошибка создания бэкапа!"
        exit 1
    fi
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при создании бэкапа!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 2: Копирование файлов на сервер${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Создаем временную директорию на сервере
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "mkdir -p /tmp/maintenance-update"

# Копируем миграцию
echo "→ Копирование миграции..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no -r \
    backend/prisma/migrations/20250112000000_update_maintenance_requests_workflow \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/maintenance-update/"

# Копируем schema.prisma
echo "→ Копирование schema.prisma..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/prisma/schema.prisma \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/maintenance-update/"

# Копируем обновленные routes
echo "→ Копирование maintenance.routes.ts..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/src/routes/maintenance.routes.ts \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/maintenance-update/"

# Копируем обновленные schemas
echo "→ Копирование maintenance.schema.ts..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/src/schemas/maintenance.schema.ts \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/maintenance-update/"

echo -e "${GREEN}✓ Файлы скопированы${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 3: Применение изменений к backend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    BACKEND_CONTAINER="tgc0ss4gs8g4k0gk484owksg-030147593411"
    
    # Копируем файлы в контейнер
    echo "→ Копирование миграции в контейнер..."
    docker cp /tmp/maintenance-update/20250112000000_update_maintenance_requests_workflow \
        $BACKEND_CONTAINER:/app/prisma/migrations/
    
    echo "→ Копирование schema.prisma в контейнер..."
    docker cp /tmp/maintenance-update/schema.prisma \
        $BACKEND_CONTAINER:/app/prisma/
    
    echo "→ Копирование routes в контейнер..."
    docker exec $BACKEND_CONTAINER mkdir -p /app/dist/routes
    docker cp /tmp/maintenance-update/maintenance.routes.ts \
        $BACKEND_CONTAINER:/app/dist/routes/
    
    echo "→ Копирование schemas в контейнер..."
    docker exec $BACKEND_CONTAINER mkdir -p /app/dist/schemas
    docker cp /tmp/maintenance-update/maintenance.schema.ts \
        $BACKEND_CONTAINER:/app/dist/schemas/
    
    echo ""
    echo "→ Генерация Prisma Client..."
    docker exec $BACKEND_CONTAINER npx prisma generate
    
    if [ $? -ne 0 ]; then
        echo "✗ Ошибка при генерации Prisma Client!"
        exit 1
    fi
    
    echo ""
    echo "→ Применение миграции базы данных..."
    docker exec $BACKEND_CONTAINER npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        echo "✗ Ошибка при применении миграции!"
        echo "Восстановите базу данных из бэкапа:"
        echo "docker exec mgc0ooksw8w0s4sksk4kwcsw psql -U erp_user -d erp_db < /root/backups/backup-maintenance-workflow-*.sql"
        exit 1
    fi
    
    echo "✓ Миграция применена успешно!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при применении изменений к backend!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 4: Обновление frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

echo "→ Копирование MaintenancePage.tsx..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    frontend/src/pages/MaintenancePage.tsx \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/maintenance-update/"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    FRONTEND_CONTAINER="wg4sckc884oosskoogwkgwso-153351250707"
    
    echo "→ Копирование MaintenancePage.tsx в контейнер..."
    docker cp /tmp/maintenance-update/MaintenancePage.tsx \
        $FRONTEND_CONTAINER:/usr/share/nginx/html/assets/ 2>/dev/null || \
    docker cp /tmp/maintenance-update/MaintenancePage.tsx \
        $FRONTEND_CONTAINER:/app/src/pages/ 2>/dev/null || \
    echo "⚠️  Frontend обновится при следующем деплое через Coolify"
ENDSSH

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 5: Перезапуск сервисов${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    BACKEND_CONTAINER="tgc0ss4gs8g4k0gk484owksg-030147593411"
    
    echo "→ Перезапуск backend контейнера..."
    docker restart $BACKEND_CONTAINER
    
    echo "Ожидание запуска backend (15 сек)..."
    sleep 15
    
    echo "→ Проверка статуса backend..."
    docker ps --filter "name=$BACKEND_CONTAINER" --format "{{.Status}}"
    
    echo ""
    echo "→ Проверка логов backend (последние 10 строк)..."
    docker logs $BACKEND_CONTAINER --tail 10
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при перезапуске сервисов!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Шаг 6: Очистка временных файлов${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "rm -rf /tmp/maintenance-update"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Развертывание завершено успешно!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Важная информация:${NC}"
echo ""
echo "1. Бэкап базы данных сохранен на сервере:"
echo -e "   ${BLUE}/root/backups/$BACKUP_FILE${NC}"
echo ""
echo "2. Frontend обновится автоматически при следующем деплое через Coolify"
echo ""
echo "3. Проверьте работу системы:"
echo "   • Откройте приложение в браузере"
echo "   • Войдите как учитель и создайте заявку"
echo "   • Войдите как завуч/директор и одобрите заявку"
echo "   • Войдите как завхоз и убедитесь, что заявка видна"
echo ""
echo -e "${YELLOW}⚠️  Для полного обновления frontend выполните редеплой через Coolify${NC}"
