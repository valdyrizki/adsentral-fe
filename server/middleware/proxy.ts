// server/middleware/proxy.ts
import { defineEventHandler, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''

  // Hanya handle request ke /backend
  if (!url.startsWith('/backend')) {
    return
  }

  // Ambil config dari runtime (dibaca saat server start, bukan build time)
  const config = useRuntimeConfig()
  const backendUrl = config.backendInternalUrl || 'http://adsentral-be-dev:8080'

  // Ganti /backend dengan /api
  const targetPath = url.replace('/backend', '/api')
  const targetUrl = `${backendUrl}${targetPath}`

  // BE membatasi endpoint auth per IP klien. Semua request browser lewat proxy ini, jadi tanpa
  // X-Forwarded-For BE melihat IP server FE dan semua user berbagi satu kuota. Tambahkan IP peer
  // (reverse proxy / browser) ke rantai X-Forwarded-For yang sudah ada.
  const peerIp = event.node.req.socket.remoteAddress
  const incomingXff = event.node.req.headers['x-forwarded-for']
  const forwardedFor = [incomingXff, peerIp].flat().filter(Boolean).join(', ')

  // Forward request ke BE
  return proxyRequest(event, targetUrl, {
    fetchOptions: {
      headers: {
        // Forward cookies
        cookie: event.node.req.headers.cookie || '',
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      }
    }
  })
})