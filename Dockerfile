# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend and backend
RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@10.4.1

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Copy drizzle config and schema for migrations
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/
COPY shared/ ./shared/
COPY server/ ./server/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/trpc/system.health 2>/dev/null || exit 1

# Start server
CMD ["node", "dist/index.js"]
