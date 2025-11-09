# Этап 1: Установка зависимостей
FROM node:20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Этап 2: Сборка и запуск приложения
FROM node:20 AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite требует, чтобы сервер был доступен извне контейнера
# Флаг --host 0.0.0.0 делает именно это.
CMD ["npm", "run", "dev", "--", "--host"]
