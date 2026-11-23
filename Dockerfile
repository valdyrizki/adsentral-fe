FROM node:20-alpine AS builder

WORKDIR /app

# attempt-timeout: build mengunduh font (Google/Fontshare). Default Node 20 hanya menunggu 250 ms per alamat; dari VPS
# tanpa IPv6 koneksi IPv4 ke CDN font sering lebih lambat dari itu, semua percobaan ETIMEDOUT, dan build gagal.
ENV NODE_OPTIONS="--max-old-space-size=4096 --network-family-autoselection-attempt-timeout=2000"

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]