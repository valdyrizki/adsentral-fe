# ============================================
# STAGE 1: Build Nuxt SSR
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dulu (untuk caching dependency)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy semua source code
COPY . .

# Build Nuxt untuk production (output ke .output/)
RUN npm run build

# ============================================
# STAGE 2: Runtime image (lebih ringan)
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy hasil build dari stage 1
COPY --from=builder /app/.output ./.output

# Port Nuxt SSR default
EXPOSE 3000

# Set environment ke production
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Jalankan Nuxt SSR server
CMD ["node", ".output/server/index.mjs"]