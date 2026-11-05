import { test, expect, ok, fail, makeUser, gotoHydrated } from './support/fixtures'

test.describe('Login', () => {
  test('menampilkan form login untuk pengunjung', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: 'Masuk' })).toBeVisible()
  })

  test('validasi email tidak valid tanpa memanggil API', async ({ page, mockApi }) => {
    let loginCalled = false
    mockApi.on('POST', '/user/login', () => {
      loginCalled = true
      return fail(400, 'tidak boleh terpanggil')
    })

    await gotoHydrated(page, '/login')
    await page.locator('#email').fill('bukan-email')
    await page.locator('#password').fill('password123')
    await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()

    await expect(page.getByText('Invalid Email').first()).toBeVisible()
    expect(loginCalled).toBe(false)
  })

  test('submit sebelum hidrasi tidak membocorkan kredensial ke URL', async ({ page }) => {
    // Blokir bundle JS → halaman tetap HTML SSR, mensimulasikan klik sebelum Vue siap
    await page.route('**/_nuxt/**', (route) => route.abort())
    await page.goto('/login')
    await page.locator('#email').fill('rahasia@test.local')
    await page.locator('#password').fill('passwordRahasia')
    await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()
    await page.waitForLoadState()

    expect(page.url()).not.toContain('password')
    expect(page.url()).not.toContain('rahasia')
  })

  test('kredensial salah menampilkan toast gagal', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/login', fail(401, 'INVALID_CREDENTIALS'))

    await gotoHydrated(page, '/login')
    await page.locator('#email').fill('salah@test.local')
    await page.locator('#password').fill('password123')
    await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()

    await expect(page.getByText('Login Gagal').first()).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  const redirectCases = [
    { role: 'SELLER', target: /\/seller\/dashboard/ },
    { role: 'ADMIN', target: /\/admin\/dashboard/ },
    { role: 'SUPER_ADMIN', target: /\/admin\/dashboard/ },
  ] as const

  for (const { role, target } of redirectCases) {
    test(`login sukses sebagai ${role} diarahkan ke dashboard`, async ({ page, mockApi }) => {
      // Sebelum login: tidak ada sesi. Profil & saldo baru dipakai setelah login.
      mockApi
        .on('POST', '/user/login', ok({ access_token: `token-${role}` }))
        .on('GET', '/user/profile', ok(makeUser(role)))
        .on('GET', '/balance', ok({ deposit_balance: 0, sales_balance: 0, deposit_held: 0, sales_held: 0 }))

      await gotoHydrated(page, '/login')
      await page.locator('#email').fill(`${role.toLowerCase()}@test.local`)
      await page.locator('#password').fill('password123')
      await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()

      await expect(page).toHaveURL(target)
    })
  }
})

test.describe('Guard rute', () => {
  for (const path of ['/transaction', '/balance', '/profile']) {
    test(`pengunjung ke ${path} diarahkan ke login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL((url) => url.pathname === '/login' && url.searchParams.get('redirect') === path)
    })
  }

  for (const path of ['/seller/dashboard', '/admin/dashboard']) {
    test(`pengunjung ke ${path} diarahkan ke login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('user yang sudah login tidak bisa membuka /login', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
  })

  test('buyer ditolak masuk area admin', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    await page.goto('/admin/dashboard')
    await expect(page.getByText('Halaman khusus admin')).toBeVisible()
  })

  test('buyer ditolak masuk area seller', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    await page.goto('/seller/dashboard')
    await expect(page.getByText('Halaman ini hanya untuk penjual')).toBeVisible()
  })
})
