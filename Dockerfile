# Production-ready Dockerfile for VAPI CaseBoost Voice Assistant
# Uses multi-stage build for smallest possible image

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
# This layer is cached unless package.json/package-lock.json change
COPY package*.json ./

# Install production dependencies only
# --omit=dev excludes devDependencies
# --ignore-scripts prevents unnecessary post-install scripts
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Stage 2: Production
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling in containers
# This ensures graceful shutdown when ECS stops the container
RUN apk add --no-cache dumb-init

# Create non-root user for security
# Running as non-root is a Docker/ECS best practice
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

# Set environment variables
# NODE_ENV=production optimizes Express.js performance
ENV NODE_ENV=production \
    PORT=3000

# Expose the application port
# ECS Fargate will map this to the load balancer
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check for container orchestration
# ECS uses this to determine if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.blueprint.js"]

