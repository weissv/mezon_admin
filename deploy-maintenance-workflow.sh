#!/bin/bash
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Развертывание обновления системы заявок ===${NC}"
echo ""

# Параметры подключения
REMOTE_HOST="185.217.131.26"
REMOTE_USER="root"
REMOTE_PASSWORD="Z@pu2laGYwsSF?N$"

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Это продакшн сервер!${NC}"
echo "Будет создан бэкап базы данных перед миграцией"
echo ""
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено пользователем"
    exit 1
fi

echo ""
echo -e "${GREEN}Шаг 1: Создание бэкапа базы данных${NC}"

# Создаем бэкап через SSH
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    cd /root/mezon_admin || exit 1
    
    # Создаем директорию для бэкапов если её нет
    mkdir -p backups
    
    # Создаем бэкап
    BACKUP_FILE="backups/backup-before-maintenance-workflow-$(date +%Y%m%d-%H%M%S).sql"
    echo "Создание бэкапа: $BACKUP_FILE"
    
    docker-compose exec -T postgres pg_dump -U erp_user erp_db > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✓ Бэкап создан: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
    else
        echo "✗ Ошибка создания бэкапа!"
        exit 1
    fi
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при создании бэкапа!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Шаг 2: Копирование миграции на сервер${NC}"

# Копируем миграцию на сервер
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no -r \
    backend/prisma/migrations/20250112000000_update_maintenance_requests_workflow \
    "$REMOTE_USER@$REMOTE_HOST:/root/mezon_admin/backend/prisma/migrations/"

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при копировании миграции!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Шаг 3: Обновление schema.prisma${NC}"

# Копируем обновленную схему
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/prisma/schema.prisma \
    "$REMOTE_USER@$REMOTE_HOST:/root/mezon_admin/backend/prisma/"

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при копировании schema.prisma!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Шаг 4: Применение миграции${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    cd /root/mezon_admin || exit 1
    
    echo "Применение миграции базы данных..."
    docker-compose exec -T backend npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✓ Миграция применена успешно!"
    else
        echo "✗ Ошибка при применении миграции!"
        echo ""
        echo "Для отката выполните:"
        echo "docker-compose exec postgres psql -U erp_user -d erp_db -f /path/to/backup.sql"
        exit 1
    fi
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при применении миграции!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Шаг 5: Копирование обновленных файлов backend${NC}"

# Копируем обновленные routes
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/src/routes/maintenance.routes.ts \
    "$REMOTE_USER@$REMOTE_HOST:/root/mezon_admin/backend/src/routes/"

# Копируем обновленные schemas
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    backend/src/schemas/maintenance.schema.ts \
    "$REMOTE_USER@$REMOTE_HOST:/root/mezon_admin/backend/src/schemas/"

echo ""
echo -e "${GREEN}Шаг 6: Копирование обновленных файлов frontend${NC}"

# Копируем обновленную страницу
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    frontend/src/pages/MaintenancePage.tsx \
    "$REMOTE_USER@$REMOTE_HOST:/root/mezon_admin/frontend/src/pages/"

echo ""
echo -e "${GREEN}Шаг 7: Перезапуск сервисов${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    cd /root/mezon_admin || exit 1
    
    echo "Перезапуск backend..."
    docker-compose restart backend
    
    echo "Ожидание запуска backend (10 сек)..."
    sleep 10
    
    echo "Перезапуск frontend..."
    docker-compose restart frontend
    
    echo ""
    echo "Проверка статуса контейнеров..."
    docker-compose ps
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при перезапуске сервисов!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Развертывание завершено успешно!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Проверьте работу системы:"
echo "  1. Откройте приложение"
echo "  2. Войдите как учитель и создайте заявку"
echo "  3. Войдите как завуч/директор и одобрите заявку"
echo "  4. Войдите как завхоз и проверьте, что заявка видна"
echo ""
echo -e "${YELLOW}Бэкап базы данных находится на сервере в:${NC}"
echo "  /root/mezon_admin/backups/"
