# Multi-stage build for production

FROM node:20 AS deps
ENV npm_config_fetch_retries=5 \
	npm_config_fetch_retry_mintimeout=20000 \
	npm_config_fetch_retry_maxtimeout=120000 \
	npm_config_fetch_timeout=600000 \
	npm_config_progress=false \
	npm_config_audit=false \
	npm_config_fund=false
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only build/runtime dependencies to avoid pulling heavy test tooling in CI
RUN npm ci --omit=dev

# Stage 1: Development (for docker-compose)
FROM deps AS development

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Build the application
FROM deps AS builder

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production image with Nginx
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
