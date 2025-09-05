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
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001

# Copy built application
COPY --from=builder /app/www/ /usr/share/nginx/html/

# Create nginx configuration directly
RUN cat > /etc/nginx/nginx.conf << 'EOF'
# ============================================
# 🌐 NGINX CONFIGURATION OPTIMISÉE PRODUCTION
# ============================================

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;

    server {
        listen 8080;
        server_name faildaily.com www.faildaily.com;
        root /usr/share/nginx/html;
        index index.html;

        # Security
        server_tokens off;

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header X-Content-Type-Options "nosniff" always;
        }

        # API proxy to backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:3000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 5s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend:3000/api/auth/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Angular routing (SPA)
        location / {
            try_files $uri $uri/ /index.html;
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header X-Content-Type-Options "nosniff" always;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Block access to sensitive files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }

        location ~ ~$ {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
EOF

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
