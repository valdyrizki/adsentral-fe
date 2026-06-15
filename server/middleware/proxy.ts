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

  // Forward request ke BE
  return proxyRequest(event, targetUrl, {
    fetchOptions: {
      // Forward cookies
      headers: {
        cookie: event.node.req.headers.cookie || '',
      }
    }
  })
})