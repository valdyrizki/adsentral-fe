import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

async function fillRegister(page: Page, over: Partial<Record<'fullname' | 'email' | 'username' | 'phone' | 'password' | 'confirm', string>> = {}) {
  await page.locator('#fullname').fill(over.fullname ?? 'Tes Daftar')
  await page.locator('#email').fill(over.email ?? 'Daftar@Test.local')
  await page.locator('#username').fill(over.username ?? 'tesdaftar')
  if (over.phone) await page.locator('#phone_number').fill(over.phone)
  await page.locator('#password').fill(over.password ?? 'password123')
  await page.locator('#confirmPassword').fill(over.confirm ?? over.password ?? 'password123')
}

test.describe('Register', () => {
  test('tombol Daftar nonaktif sampai S&K disetujui; body memuat accepted_terms lalu diarahkan ke login', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.on('POST', '/user/register', (route) => { body = route.request().postDataJSON(); return ok(null) })

    await gotoHydrated(page, '/register')
    await fillRegister(page, { phone: '081234567890' })
    const submit = main(page).getByRole('button', { name: 'Daftar' })
    await expect(submit).toBeDisabled()
    await page.getByTestId('register-terms-checkbox').check()
    await submit.click()

    await expect(page).toHaveURL(/\/login$/)
    expect(body).toMatchObject({
      full_name: 'Tes Daftar', email: 'Daftar@Test.local', username: 'tesdaftar',
      phone_number: '081234567890', password: 'password123', accepted_terms: true,
    })
  })

  test('password dan konfirmasi berbeda / email tidak valid: ditolak tanpa memanggil BE', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/user/register', () => { calls++; return ok(null) })

    await gotoHydrated(page, '/register')
    await fillRegister(page, { email: 'bukan-email', confirm: 'password456' })
    await page.getByTestId('register-terms-checkbox').check()
    await main(page).getByRole('button', { name: 'Daftar' }).click()

    await expect(page.getByText('Email is not valid').first()).toBeVisible()
    await expect(page.getByText('Password and Confirm Password do not match', { exact: false }).first()).toBeVisible()
    expect(calls).toBe(0)
  })

  test('email sudah terdaftar: pesan BE tampil dan tetap di halaman register', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/register', fail(400, 'Email sudah terdaftar'))

    await gotoHydrated(page, '/register')
    await fillRegister(page)
    await page.getByTestId('register-terms-checkbox').check()
    await main(page).getByRole('button', { name: 'Daftar' }).click()

    await expect(page.getByText('Email sudah terdaftar').first()).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)
  })
})

test.describe('Logout', () => {
  test('seller logout: POST /user/logout, sesi dibersihkan, rute seller tidak bisa dibuka lagi', async ({ page, mockApi }) => {
    let logoutCalls = 0
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', fail(404, 'Rekening bank belum disimpan.'))
      .on('POST', '/user/logout', () => { logoutCalls++; return ok(null) })

    await gotoHydrated(page, '/seller/bank-account')
    // setelah logout, refresh token sudah tidak berlaku
    mockApi.on('POST', '/user/refresh', fail(401, 'REFRESH_TOKEN_MISSING'))
    await page.getByRole('button', { name: 'Logout' }).first().click()

    await expect(page).toHaveURL(/\/login/)
    expect(logoutCalls).toBe(1)

    await gotoHydrated(page, '/seller/bank-account')
    await expect(page).toHaveURL(/\/login/)
  })

  test('BE logout gagal: state lokal tetap dibersihkan dan diarahkan ke login', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', fail(404, 'Rekening bank belum disimpan.'))
      .on('POST', '/user/logout', fail(500, 'Internal Server Error'))

    await gotoHydrated(page, '/seller/bank-account')
    mockApi.on('POST', '/user/refresh', fail(401, 'REFRESH_TOKEN_MISSING'))
    await page.getByRole('button', { name: 'Logout' }).first().click()

    await expect(page).toHaveURL(/\/login/)
    await expect(main(page).getByRole('button', { name: 'Masuk' })).toBeVisible()
  })
})
