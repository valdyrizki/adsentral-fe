import { test, expect, ok, fail, emptyPage, makeUser, gotoHydrated, MockApi } from './support/fixtures'
import { makeTx } from './support/payment'
import type { Page, Route } from '@playwright/test'

// Penanganan sesi login (EP02-07/10/15): refresh token dirotasi tiap dipakai,
// jadi refresh harus satu kali per gelombang 401 dan request asli harus diulang.

const main = (page: Page) => page.getByRole('main')
const tokenOf = (route: Route) => route.request().headers()['x-api-token']

/** Refresh pertama (saat aplikasi dibuka) → token-1, berikutnya token-2, token-3, ... */
function countRefresh(mockApi: MockApi, failAfterFirst?: { status: number; message: string }) {
  const counter = { calls: 0 }
  mockApi.on('POST', '/user/refresh', () => {
    counter.calls++
    if (counter.calls > 1 && failAfterFirst) return fail(failAfterFirst.status, failAfterFirst.message)
    return ok({ access_token: `token-${counter.calls}` })
  })
  return counter
}

/** Jawab 401 TOKEN_EXPIRED untuk token-1 (access token lama), sukses untuk token lain */
const expiredForFirstToken = (data: () => unknown) => (route: Route) =>
  tokenOf(route) === 'token-1' ? fail(401, 'TOKEN_EXPIRED') : ok(data())

async function submitProfile(page: Page, passwords?: { next: string; old: string }) {
  if (passwords) {
    const inputs = main(page).locator('input[type="password"]')
    await inputs.nth(0).fill(passwords.next)
    await inputs.nth(1).fill(passwords.next)
    await inputs.nth(2).fill(passwords.old)
  }
  await main(page).getByRole('button', { name: 'Save' }).click()
}

test.describe('Access token kedaluwarsa', () => {
  test('aksi saat token habis: satu refresh, request diulang dengan token baru, hasil sukses tampil', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    const refresh = countRefresh(mockApi)
    const patchTokens: string[] = []
    mockApi.on('PATCH', '/user/profile', (route) => {
      patchTokens.push(tokenOf(route))
      return expiredForFirstToken(() => makeUser('BUYER'))(route)
    })

    await gotoHydrated(page, '/profile')
    await submitProfile(page)

    await expect(page.getByText('Berhasil Simpan User').first()).toBeVisible()
    await expect(page.getByText('Gagal Simpan User')).toHaveCount(0)
    expect(patchTokens).toEqual(['token-1', 'token-2'])
    expect(refresh.calls).toBe(2) // 1 saat aplikasi dibuka + 1 karena token habis
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('beberapa request 401 bersamaan: hanya satu refresh, semua data tetap tampil', async ({ page, mockApi }) => {
    const tx = makeTx('TX-1', 'PAY-1', { status: 'DONE' })
    mockApi.asRole('BUYER')
    const refresh = countRefresh(mockApi)
    // Profil & saldo saat aplikasi dibuka memakai token-1 → ikut 401 bersamaan dengan data halaman
    mockApi
      .on('GET', '/user/profile', expiredForFirstToken(() => makeUser('BUYER')))
      .on('GET', '/balance', expiredForFirstToken(() => ({ deposit_balance: 0, sales_balance: 0, deposit_held: 0, sales_held: 0 })))
      .on('GET', '/tx/get/TX-1', expiredForFirstToken(() => tx))
      .on('GET', '/order/discussion/transaction/TX-1', expiredForFirstToken(() => emptyPage()))
      .on('GET', '/order/file/transaction/TX-1', expiredForFirstToken(() => emptyPage()))
      .on('GET', '/review/transaction/TX-1', expiredForFirstToken(() => []))
      .on('GET', '/guarantee/transaction/TX-1', expiredForFirstToken(() => null))

    await gotoHydrated(page, '/transaction/TX-1')

    await expect(main(page).getByText('#TX-1').first()).toBeVisible()
    await page.waitForTimeout(1000)
    expect(refresh.calls).toBe(2)
    await expect(page).toHaveURL(/\/transaction\/TX-1$/)
  })
})

test.describe('Banyak tab', () => {
  test('dua tab dibuka bersamaan: refresh diantrekan, tidak paralel (refresh token dirotasi)', async ({ page, context }) => {
    const stats = { inFlight: 0, maxInFlight: 0, calls: 0 }
    const slowRefresh = async () => {
      stats.calls++
      stats.inFlight++
      stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight)
      await new Promise((r) => setTimeout(r, 800))
      stats.inFlight--
      return ok({ access_token: `token-${stats.calls}` })
    }
    const pages = [page, await context.newPage()]
    for (const p of pages) {
      const mock = new MockApi(p)
      mock.asRole('BUYER').on('POST', '/user/refresh', slowRefresh)
      await mock.install()
    }

    await Promise.all(pages.map((p) => p.goto('/profile')))

    // Tombol Save sudah ada di HTML SSR; tunggu refresh kedua tab selesai baru cek
    await expect.poll(() => stats.calls).toBe(2)
    await expect.poll(() => stats.inFlight).toBe(0)
    expect(stats.maxInFlight).toBe(1)
    for (const p of pages) await expect(p).toHaveURL(/\/profile$/)
  })
})

test.describe('Refresh gagal', () => {
  const failures = [
    { status: 400, message: 'Sesi tidak ditemukan atau sudah tidak aktif. Silakan login kembali.' },
    { status: 401, message: 'REFRESH_TOKEN_EXPIRED' },
    { status: 403, message: 'Akun Anda disuspend' },
  ]

  for (const failure of failures) {
    test(`refresh ${failure.status}: sesi dibersihkan, ke /login dengan pesan, tanpa loop refresh`, async ({ page, mockApi }) => {
      mockApi.asRole('BUYER')
      const refresh = countRefresh(mockApi, failure)
      mockApi.on('PATCH', '/user/profile', fail(401, 'TOKEN_EXPIRED'))

      await gotoHydrated(page, '/profile')
      await submitProfile(page)

      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByText('Sesi berakhir, silakan login kembali').first()).toBeVisible()
      await page.waitForTimeout(1500)
      expect(refresh.calls).toBe(2)
      // State login dibersihkan: tombol Masuk tampil, bukan menu akun
      await expect(main(page).getByRole('button', { name: 'Masuk' })).toBeVisible()
    })
  }
})

test.describe('Ganti password', () => {
  test('sukses: tetap login, pesan perangkat lain dikeluarkan, isian password dikosongkan', async ({ page, mockApi }) => {
    let body = ''
    mockApi.asRole('BUYER').on('PATCH', '/user/profile', (route) => {
      body = route.request().postData() ?? ''
      return ok(makeUser('BUYER'))
    })

    await gotoHydrated(page, '/profile')
    await submitProfile(page, { next: 'passwordBaru1', old: 'passwordLama1' })

    await expect(page.getByText('Password diubah. Perangkat lain telah dikeluarkan.').first()).toBeVisible()
    expect(body).toContain('name="newPassword"')
    expect(body).toContain('name="oldPassword"')
    await expect(main(page).locator('input[type="password"]').first()).toHaveValue('')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/profile$/)
  })
})
