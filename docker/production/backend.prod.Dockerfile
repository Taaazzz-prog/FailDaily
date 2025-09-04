# ============================================
# 🚀 FAILDAILY PRODUCTION - DOCKERFILE BACKEND
# ============================================
# Image optimisée Node.js 22 Alpine pour production

# Stage 1: Dependencies
FROM node:22-alpine AS dependencies
LABEL maintainer="FailDaily Team"
LABEL description="FailDaily Backend API - Production Build"

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (optimized for production)
RUN npm install --omit=dev && \
    npm cache clean --force

# Stage 2: Application
FROM node:22-alpine AS application

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init ca-certificates && \
    rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads tmp && \
    chown -R nodejs:nodejs logs uploads tmp

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start with dumb-init (proper signal handling)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
