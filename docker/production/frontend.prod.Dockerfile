# =============================================
# 🚀 FAILDAILY PRODUCTION - DOCKERFILE FRONTEND
# =============================================
# Build Angular/Ionic optimisé pour production

# Stage 1: Build Angular/Ionic
FROM node:22-alpine AS builder
LABEL maintainer="FailDaily Team"
LABEL description="FailDaily Frontend - Production Build"

# Install build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    ca-certificates && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package*.json ./
COPY ionic.config.json ./
COPY angular.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --include=dev && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY .browserslistrc ./
COPY .editorconfig ./
COPY .eslintrc.json ./

# Build for production
RUN npm run build --prod && \
    ls -la www/

# Stage 2: Nginx Alpine
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

# Create nginx user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001

# Copy built application
COPY --from=builder /app/www/ /usr/share/nginx/html/

# Copy optimized nginx configuration
COPY docker/production/nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
