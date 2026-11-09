import { test as base, expect, type Page, type Route } from '@playwright/test'

export type Role = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface MockResponse {
  status?: number
  body: unknown
}

type Handler = MockResponse | ((route: Route, url: URL) => MockResponse | Promise<MockResponse>)

/** Bungkus data dengan format WebResponse standar BE */
export const ok = <T>(data: T, message = 'OK'): MockResponse => ({
  body: { status: 'success', message, data },
})

export const fail = (status: number, message: string): MockResponse => ({
  status,
  body: { status: 'error', message },
})

/** Error berkode BE (RATE_LIMITED, ACCOUNT_LOCKED, ...): key di `data` camelCase */
export const failCode = (status: number, message: string, data: Record<string, unknown>): MockResponse => ({
  status,
  body: { status: 'error', message, errors: message, data },
})

export const emptyPage = (size = 20) => ({
  page: 0,
  size,
  total_elements: 0,
  total_pages: 0,
  last: true,
  content: [],
})

export const makeUser = (role: Role, overrides: Record<string, unknown> = {}) => ({
  id: 1,
  email: `${role.toLowerCase()}@test.local`,
  username: `${role.toLowerCase()}_test`,
  full_name: `Tes ${role}`,
  phone_number: null,
  birth_date: null,
  avatar_url: null,
  address: null,
  role,
  ...overrides,
})

/**
 * Mock API di sisi browser. Semua request ke `/backend/*` dicegat.
 * Handler yang didaftarkan belakangan menimpa yang lebih dulu (per method + path).
 * Request tanpa handler dicatat di `unhandled` dan dibalas 404.
 */
export class MockApi {
  private handlers = new Map<string, Handler>()
  readonly unhandled: string[] = []

  constructor(private page: Page) {}

  async install() {
    await this.page.route('**/backend/**', async (route) => {
      const url = new URL(route.request().url())
      const path = url.pathname.replace(/^\/backend/, '')
      const method = route.request().method()
      const handler = this.handlers.get(`${method} ${path}`)

      if (!handler) {
        this.unhandled.push(`${method} ${path}`)
        await route.fulfill({ status: 404, json: { status: 'error', message: 'MOCK_NOT_FOUND' } })
        return
      }

      const res = typeof handler === 'function' ? await handler(route, url) : handler
      await route.fulfill({ status: res.status ?? 200, json: res.body })
    })
  }

  on(method: Method, path: string, handler: Handler) {
    this.handlers.set(`${method} ${path}`, handler)
    return this
  }

  /** Default untuk pengunjung yang belum login */
  asGuest() {
    this.on('POST', '/user/refresh', fail(401, 'REFRESH_TOKEN_MISSING'))
    this.on('GET', '/system/settings/public', ok([]))
    return this
  }

  /** Simulasikan sesi aktif (refresh token valid) untuk peran tertentu */
  asRole(role: Role, userOverrides: Record<string, unknown> = {}) {
    this.asGuest()
    this.on('POST', '/user/refresh', ok({ access_token: `token-${role}` }))
    this.on('GET', '/user/profile', ok(makeUser(role, userOverrides)))
    this.on('GET', '/balance', ok({ deposit_balance: 0, sales_balance: 0, deposit_held: 0, sales_held: 0 }))
    this.on('GET', '/alerts', ok({}))
    this.on('GET', '/seller/alerts', ok({}))
    this.on('GET', '/admin/alerts', ok({}))
    return this
  }
}

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: async ({ page }, use) => {
    const mock = new MockApi(page)
    mock.asGuest()
    await mock.install()
    await use(mock)
  },
})

export { expect }

/**
 * Buka halaman lalu tunggu Vue selesai hidrasi.
 * Tanpa ini, klik/isi form sebelum hidrasi akan diabaikan (HTML SSR belum interaktif).
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  // `__vue_app__` sudah ada sebelum halaman async selesai hidrasi,
  // jadi tunggu flag isHydrating dari nuxtApp ($nuxt di globalProperties)
  await page.waitForFunction(() => {
    const el = document.querySelector('#__nuxt, [data-v-app]') as any
    const nuxtApp = el?.__vue_app__?.config?.globalProperties?.$nuxt
    return !!nuxtApp && nuxtApp.isHydrating === false
  })
}
