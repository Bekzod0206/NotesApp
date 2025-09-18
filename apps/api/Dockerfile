# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (cacheable)
COPY package*.json ./
RUN npm ci || npm install

# Copy source (schema, ts, etc.)
COPY . .

# Generate Prisma client into node_modules that BELONG TO THIS STAGE
RUN npx prisma generate

# Build TS -> dist
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy exactly the node_modules that already contain generated client
COPY --from=builder /app/node_modules ./node_modules
# Copy built app and schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000
CMD sh -lc "npx prisma migrate deploy && node dist/main.js"
