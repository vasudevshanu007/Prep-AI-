# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files first — layer is cached unless deps change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S prepai && adduser -S prepai -G prepai

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create writable uploads and logs directories
RUN mkdir -p uploads logs && chown -R prepai:prepai /app

USER prepai

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
