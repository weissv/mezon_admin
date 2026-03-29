# backend/Dockerfile
# Этап 1: Установка зависимостей
FROM node:20 AS deps
ENV npm_config_fetch_retries=5 \
	npm_config_fetch_retry_mintimeout=20000 \
	npm_config_fetch_retry_maxtimeout=120000 \
	npm_config_fetch_timeout=600000 \
	npm_config_prefer_offline=true \
	npm_config_progress=false \
	npm_config_audit=false \
	npm_config_fund=false
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,target=/root/.npm \
	set -eux; \
	heartbeat() { while true; do echo "[docker] backend npm ci is still running..."; sleep 20; done; }; \
	for attempt in 1 2 3; do \
		heartbeat & heartbeat_pid=$!; \
		if npm ci --prefer-offline; then \
			status=0; \
		else \
			status=$?; \
		fi; \
		kill "$heartbeat_pid" || true; \
		wait "$heartbeat_pid" 2>/dev/null || true; \
		if [ "$status" -eq 0 ]; then \
			exit 0; \
		fi; \
		echo "npm ci failed on attempt ${attempt}; retrying after backoff..."; \
		rm -rf node_modules; \
		if [ "$attempt" -eq 3 ]; then \
			exit "$status"; \
		fi; \
		sleep $((attempt * 15)); \
	done

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
RUN apt-get update \
	&& apt-get install -y --no-install-recommends postgresql-client \
	&& rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
# Копируем только то, что нужно для запуска
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4000
# Run migrations, seed database, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]