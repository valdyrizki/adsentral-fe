// Mock BE minimal untuk request dari sisi server (SSR).
// Request dari browser dicegat di fixture (page.route), bukan di sini.
// Semua endpoint membalas "tidak tersedia" supaya SSR jatuh ke state kosong/error,
// lalu data sebenarnya disuplai lewat mock di browser.
import http from 'node:http'

const port = Number(process.argv[2] || 3199)

http
  .createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200).end('ok')
      return
    }

    // Tidak ada sesi di SSR (refresh token tidak diteruskan ke mock)
    const status = req.url?.startsWith('/api/user/refresh') ? 401 : 503
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'error', message: status === 401 ? 'REFRESH_TOKEN_MISSING' : 'MOCK_SSR' }))
  })
  .listen(port, () => console.log(`[mock-backend] listening on ${port}`))
