import { test, expect, ok, fail, failCode, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

// Lupa password (EP02-17): BE menjawab seragam supaya tidak membocorkan email mana yang terdaftar.
// Kode reset saat ini disampaikan admin (pengiriman email belum ada).

const main = (page: Page) => page.getByRole('main')
const WA_SETTING = ok([{ id: 1, key: 'WA_NUMBER', value: '6281234567890', group: 'CONTACT', is_public: true }])
const INVALID_CODE_MSG = 'Kode reset salah atau sudah tidak berlaku'
const RATE_LIMITED_MSG = 'Terlalu banyak percobaan. Coba lagi dalam 3 menit.'

async function requestCode(page: Page, email: string) {
  await main(page).locator('#reset-email').fill(email)
  await main(page).getByRole('button', { name: 'Minta Kode Reset' }).click()
}

async function submitCode(page: Page, code: string) {
  await main(page).locator('#reset-code').fill(code)
  await main(page).getByRole('button', { name: 'Reset Password' }).click()
}

async function openCodeStep(page: Page, email: string) {
  await gotoHydrated(page, '/forgot-password')
  await main(page).getByRole('button', { name: 'Sudah punya kode?' }).click()
  await main(page).locator('#reset-email').fill(email)
}

test.describe('Minta kode reset', () => {
  test('200: pesan netral + link WhatsApp admin, tanpa klaim "kode sudah dikirim"', async ({ page, mockApi }) => {
    let body: unknown
    mockApi
      .on('GET', '/system/settings/public', WA_SETTING)
      .on('POST', '/user/password/reset', (route) => { body = route.request().postDataJSON(); return ok(null) })

    await gotoHydrated(page, '/forgot-password')
    await requestCode(page, 'tidak-terdaftar@test.local')

    const alert = main(page).getByTestId('reset-requested-alert')
    await expect(alert).toContainText('Bila email terdaftar, kode reset akan dikirim.')
    await expect(alert.getByRole('link', { name: 'Hubungi admin lewat WhatsApp' })).toHaveAttribute('href', /wa\.me\/6281234567890/)
    await expect(main(page)).not.toContainText(/sudah dikirim/i)
    await expect(main(page).locator('#reset-code')).toBeVisible()
    expect(body).toEqual({ email: 'tidak-terdaftar@test.local' })
  })

  test('429 RATE_LIMITED: pesan BE & tombol dikunci dengan hitung mundur', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/password/reset', failCode(429, RATE_LIMITED_MSG, { code: 'RATE_LIMITED', retryAfterSeconds: 180 }))

    await gotoHydrated(page, '/forgot-password')
    await requestCode(page, 'buyer@test.local')

    await expect(main(page).getByTestId('reset-block-alert')).toContainText(RATE_LIMITED_MSG)
    await expect(main(page).getByRole('button', { name: /Coba lagi dalam 0[23]:\d\d/ })).toBeDisabled()
  })

  test('email tidak valid: ditolak di klien', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/user/password/reset', () => { calls++; return ok(null) })

    await gotoHydrated(page, '/forgot-password')
    await requestCode(page, 'bukan-email')

    await expect(main(page).getByText('Masukkan email yang valid')).toBeVisible()
    expect(calls).toBe(0)
  })
})

test.describe('Konfirmasi kode reset', () => {
  test('kode benar: password baru tampil sekali dengan tombol salin & link login', async ({ page, mockApi }) => {
    let body: unknown
    mockApi
      .on('POST', '/user/password/reset', ok(null))
      .on('POST', '/user/password/confirm', (route) => { body = route.request().postDataJSON(); return ok({ password: 'Baru-7xQ2' }) })

    await gotoHydrated(page, '/forgot-password')
    await requestCode(page, 'buyer@test.local')
    await submitCode(page, '123456')

    await expect(main(page).getByTestId('reset-new-password')).toHaveText('Baru-7xQ2')
    await expect(main(page).getByRole('button', { name: 'Salin password' })).toBeVisible()
    await expect(main(page).getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/login')
    expect(body).toEqual({ email: 'buyer@test.local', code: '123456' })
  })

  test('400 kode salah: pesan BE apa adanya di bawah input kode, bisa dicoba lagi', async ({ page, mockApi }) => {
    mockApi
      .on('POST', '/user/password/reset', ok(null))
      .on('POST', '/user/password/confirm', fail(400, INVALID_CODE_MSG))

    await gotoHydrated(page, '/forgot-password')
    await requestCode(page, 'buyer@test.local')
    await submitCode(page, '000000')

    await expect(main(page).getByTestId('reset-code-error')).toHaveText(INVALID_CODE_MSG)
    await expect(main(page).getByRole('button', { name: 'Reset Password' })).toBeEnabled()
  })

  test('429 tanpa data.code (5 kali salah): arahkan ke admin, tombol dikunci', async ({ page, mockApi }) => {
    mockApi
      .on('GET', '/system/settings/public', WA_SETTING)
      .on('POST', '/user/password/confirm', fail(429, 'Too many wrong, call admin'))

    await openCodeStep(page, 'buyer@test.local')
    await submitCode(page, '000000')

    const alert = main(page).getByTestId('reset-block-alert')
    await expect(alert).toContainText('Terlalu banyak kode salah.')
    await expect(alert.getByRole('link', { name: 'Hubungi admin lewat WhatsApp' })).toHaveAttribute('href', /wa\.me\/6281234567890/)
    await expect(main(page).getByRole('button', { name: 'Reset Password' })).toBeDisabled()
  })

  test('429 RATE_LIMITED: hitung mundur, bukan pesan hubungi admin', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/password/confirm', failCode(429, RATE_LIMITED_MSG, { code: 'RATE_LIMITED', retryAfterSeconds: 180 }))

    await openCodeStep(page, 'buyer@test.local')
    await submitCode(page, '000000')

    const alert = main(page).getByTestId('reset-block-alert')
    await expect(alert).toContainText(RATE_LIMITED_MSG)
    await expect(alert).not.toContainText('Terlalu banyak kode salah')
    await expect(main(page).getByRole('button', { name: /Coba lagi dalam 0[23]:\d\d/ })).toBeDisabled()
  })
})

test('link "Lupa kata sandi?" di login membuka halaman lupa password', async ({ page }) => {
  await gotoHydrated(page, '/login')
  await main(page).getByRole('link', { name: 'Lupa kata sandi?' }).click()
  await expect(page).toHaveURL(/\/forgot-password$/)
  await expect(main(page).getByRole('button', { name: 'Minta Kode Reset' })).toBeVisible()
})
