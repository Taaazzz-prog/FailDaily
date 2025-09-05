# =============================================
# 🚀 FAILDAILY PRODUCTION - DOCKERFILE FRONTEND
# =============================================
# Build Angular/Ionic optimisé pour production avec Node.js 24.4.1 (identique au local)

# Stage 1: Build Angular/Ionic
FROM node:24.4.1-alpine AS builder
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
RUN npm install && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY .browserslistrc ./
COPY .editorconfig ./
COPY .eslintrc.json ./

# Build for production
RUN npm run build --prod && \
    ls -la www/

# Stage 2: Lightweight HTTP server for production
FROM node:20-alpine AS production

# Install security updates and serve
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates wget && \
    rm -rf /var/cache/apk/* && \
    npm install -g serve

# Create app user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Copy built application from builder stage
COPY --from=builder /app/www/ /app/
WORKDIR /app

# Set ownership and permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start the server with SPA fallback for Angular routes
CMD ["serve", "-s", ".", "-l", "80"]
