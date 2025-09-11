# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
# If you have a lockfile, prefer "npm ci"
RUN npm install

# Copy source
COPY . .

# Generate Prisma client and build Nest
# (Make sure prisma/schema.prisma exists under /app/prisma)
RUN npx prisma generate
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

# Run migrations, then start the app
CMD sh -c "npx prisma migrate deploy && node dist/main.js"
