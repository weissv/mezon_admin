# backend/Dockerfile
# Этап 1: Установка зависимостей
FROM node:20 AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Этап 2: Сборка приложения
FROM node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Этап 3: Запуск в продакшене
FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
# Копируем только то, что нужно для запуска
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4000
# Команда для запуска в продакшене
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]