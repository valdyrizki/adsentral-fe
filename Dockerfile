# ============================================
# STAGE 1: Build Nuxt SSR
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Ganti npm ci ke npm install (lebih toleran)
RUN npm install

COPY . .

RUN npm run build

# ============================================
# STAGE 2: Runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]