import { test, expect, ok, fail, failCode, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import { makeTx } from './support/payment'

// Penyesuaian FE untuk perubahan keamanan BE (EP-02):
// rate limit auth, kunci akun sementara, dan URL file presigned 1 jam.

const RATE_LIMITED_MSG = 'Terlalu banyak percobaan. Coba lagi dalam 3 menit.'
const LOCKED_MSG = 'Terlalu banyak percobaan password salah. Coba lagi dalam 15 menit atau gunakan lupa password.'

const rateLimited = (retryAfterSeconds = 180) =>
  failCode(429, RATE_LIMITED_MSG, { code: 'RATE_LIMITED', retryAfterSeconds })
const accountLocked = (retryAfterSeconds = 900) =>
  failCode(403, LOCKED_MSG, { code: 'ACCOUNT_LOCKED', lockedUntil: '2026-11-10T14:30', retryAfterSeconds })

async function submitLogin(page: import('@playwright/test').Page) {
  await page.locator('#email').fill('buyer@test.local')
  await page.locator('#password').fill('password123')
  await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()
}

test.describe('Login: rate limit & kunci akun', () => {
  test('429 RATE_LIMITED: pesan BE tampil & tombol dikunci dengan hitung mundur', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/user/login', () => { calls++; return rateLimited(180) })

    await gotoHydrated(page, '/login')
    await submitLogin(page)

    const main = page.getByRole('main')
    await expect(main.getByTestId('login-block-alert')).toContainText(RATE_LIMITED_MSG)
    const button = main.getByRole('button', { name: /Coba lagi dalam 0[23]:\d\d/ })
    await expect(button).toBeDisabled()
    // Tidak ada auto-retry
    await page.waitForTimeout(1500)
    expect(calls).toBe(1)
  })

  test('403 ACCOUNT_LOCKED: pesan, hitung mundur, dan link lupa kata sandi', async ({ page, mockApi }) => {
    mockApi
      .on('GET', '/system/settings/public', ok([{ id: 1, key: 'WA_NUMBER', value: '6281234567890', group: 'CONTACT', is_public: true }]))
      .on('POST', '/user/login', accountLocked(900))

    await gotoHydrated(page, '/login')
    await submitLogin(page)

    const alert = page.getByRole('main').getByTestId('login-block-alert')
    await expect(alert).toContainText(LOCKED_MSG)
    await expect(alert.getByRole('link', { name: 'reset lewat Lupa kata sandi' })).toHaveAttribute('href', /wa\.me\/6281234567890/)
    await expect(page.getByRole('main').getByRole('button', { name: /Coba lagi dalam 1[45]:\d\d/ })).toBeDisabled()
    // Bukan toast "Login Gagal" generik
    await expect(page.getByText('Login Gagal')).toHaveCount(0)
  })

  test('tombol aktif lagi setelah hitung mundur habis', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/login', rateLimited(2))

    await gotoHydrated(page, '/login')
    await submitLogin(page)

    const main = page.getByRole('main')
    await expect(main.getByRole('button', { name: /Coba lagi dalam/ })).toBeDisabled()
    await expect(main.getByRole('button', { name: 'Masuk' })).toBeEnabled({ timeout: 5000 })
    await expect(main.getByTestId('login-block-alert')).toHaveCount(0)
  })
})

test.describe('Register: rate limit', () => {
  test('429 RATE_LIMITED: pesan BE tampil & tombol daftar dikunci', async ({ page, mockApi }) => {
    mockApi.on('POST', '/user/register', rateLimited(3600))

    await gotoHydrated(page, '/register')
    await page.locator('#fullname').fill('Tes Daftar')
    await page.locator('#email').fill('daftar@test.local')
    await page.locator('#username').fill('tesdaftar')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')
    await page.getByRole('main').getByRole('button', { name: 'Daftar' }).click()

    const main = page.getByRole('main')
    await expect(main.getByTestId('register-block-alert')).toContainText(RATE_LIMITED_MSG)
    await expect(main.getByRole('button', { name: /Coba lagi dalam/ })).toBeDisabled()
    await expect(page.getByText('Gagal Register')).toHaveCount(0)
  })
})

test.describe('Profil: ganti password terkunci', () => {
  test('403 ACCOUNT_LOCKED: pesan tampil dan user tidak di-logout', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER').on('PATCH', '/user/profile', accountLocked(900))

    await gotoHydrated(page, '/profile')
    const passwords = page.getByRole('main').locator('input[type="password"]')
    await passwords.nth(0).fill('passwordBaru1')
    await passwords.nth(1).fill('passwordBaru1')
    await passwords.nth(2).fill('passwordLamaSalah')
    await page.getByRole('main').getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Ganti Password Dikunci Sementara').first()).toBeVisible()
    await expect(page.getByText(LOCKED_MSG).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/profile$/)
  })
})

// ===== Password baru maks 72 byte UTF-8 (EP02-16) =====

const PASSWORD_BYTES_MSG = 'Password maksimal 72 karakter (huruf non-Latin dan emoji dihitung lebih dari satu)'
const BE_PASSWORD_BYTES_MSG = 'Password maksimal 72 byte (huruf non-Latin dan emoji dihitung lebih dari satu)'

async function submitRegister(page: import('@playwright/test').Page, password: string) {
  await page.locator('#fullname').fill('Tes Daftar')
  await page.locator('#email').fill('daftar@test.local')
  await page.locator('#username').fill('tesdaftar')
  await page.locator('#password').fill(password)
  await page.locator('#confirmPassword').fill(password)
  await page.getByRole('main').getByRole('button', { name: 'Daftar' }).click()
}

async function submitPasswordChange(page: import('@playwright/test').Page, next: string) {
  const passwords = page.getByRole('main').locator('input[type="password"]')
  await passwords.nth(0).fill(next)
  await passwords.nth(1).fill(next)
  await passwords.nth(2).fill('passwordLama1')
  await page.getByRole('main').getByRole('button', { name: 'Save' }).click()
}

test.describe('Password baru maks 72 byte', () => {
  test('register 73 karakter ASCII: ditolak di klien, tidak dikirim ke BE', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/user/register', () => { calls++; return ok(null) })

    await gotoHydrated(page, '/register')
    await submitRegister(page, 'a'.repeat(73))

    await expect(page.getByText(PASSWORD_BYTES_MSG).first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(calls).toBe(0)
  })

  test('register 36 huruf é (tepat 72 byte): dikirim utuh dan berhasil', async ({ page, mockApi }) => {
    const password = 'é'.repeat(36)
    let sent: unknown
    mockApi.on('POST', '/user/register', (route) => {
      sent = route.request().postDataJSON().password
      return ok(null)
    })

    await gotoHydrated(page, '/register')
    await submitRegister(page, password)

    await expect(page.getByText('Register Berhasil').first()).toBeVisible()
    expect(sent).toBe(password)
  })

  test('ganti password ke 40 huruf é (80 byte): ditolak di klien, profil tidak dikirim', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('BUYER').on('PATCH', '/user/profile', () => { calls++; return ok(null) })

    await gotoHydrated(page, '/profile')
    await submitPasswordChange(page, 'é'.repeat(40))

    await expect(page.getByText(PASSWORD_BYTES_MSG).first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(calls).toBe(0)
  })

  test('validasi klien terlewat: pesan 400 dari BE tetap tampil', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER').on('PATCH', '/user/profile', fail(400, BE_PASSWORD_BYTES_MSG))

    await gotoHydrated(page, '/profile')
    await submitPasswordChange(page, 'passwordBaru1')

    await expect(page.getByText(BE_PASSWORD_BYTES_MSG).first()).toBeVisible()
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('login tidak dibatasi: password 100 karakter tetap dikirim', async ({ page, mockApi }) => {
    let sent = ''
    mockApi.on('POST', '/user/login', (route) => {
      sent = route.request().postDataJSON().password
      return fail(401, 'Email atau password salah')
    })

    await gotoHydrated(page, '/login')
    await page.locator('#email').fill('buyer@test.local')
    await page.locator('#password').fill('a'.repeat(100))
    await page.getByRole('main').getByRole('button', { name: 'Masuk' }).click()

    await expect.poll(() => sent.length).toBe(100)
  })
})

// ===== URL file presigned (1 jam) =====

const amzDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const signedUrl = (key: string, signedAtMs: number, signature: string) =>
  `https://files.r2.test/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=${amzDate(signedAtMs)}&X-Amz-Expires=3600&X-Amz-Signature=${signature}`

const doneGuarantee = (fileUrl: string) => ({
  id: 'G-1',
  transaction: makeTx('TX-1', 'PAY-1', { status: 'DONE' }),
  product: makeProduct(1, { guarantee_days: 7 }),
  merchant_id: 1,
  merchant_name: 'Toko Tes',
  buyer_id: 1,
  buyer_name: 'Tes BUYER',
  status: 'DONE',
  complain_description: 'Akun tidak bisa login',
  seller_description: 'Akun pengganti terlampir',
  file_id: 'F-1',
  file_url: fileUrl,
  file_ori_name: 'akun-pengganti.txt',
  discussions: [],
  created_at: new Date().toISOString(),
  updated_at: null,
  reviewed_at: null,
  rejected_at: null,
  progress_at: null,
  done_at: new Date().toISOString(),
  review_deadline: null,
  progress_deadline: null,
})

test.describe('File presigned: garansi', () => {
  // Tangkap pembukaan file ke R2 (dijawab sebagai unduhan supaya halaman tidak berpindah)
  async function captureFileOpens(page: import('@playwright/test').Page) {
    const opened: string[] = []
    await page.route('https://files.r2.test/**', (route) => {
      opened.push(route.request().url())
      return route.fulfill({
        status: 200,
        headers: { 'content-disposition': 'attachment; filename="akun-pengganti.txt"' },
        body: 'isi akun',
      })
    })
    return opened
  }

  test('URL masih berlaku: file langsung dibuka tanpa memuat ulang data', async ({ page, mockApi }) => {
    const fresh = signedUrl('guarantee/g1.txt', Date.now() - 5 * 60_000, 'baru')
    let calls = 0
    mockApi.asRole('BUYER').on('GET', '/guarantee/G-1', () => { calls++; return ok(doneGuarantee(fresh)) })
    const opened = await captureFileOpens(page)

    await gotoHydrated(page, '/guarantee/G-1')
    await page.getByRole('main').getByRole('button', { name: 'akun-pengganti.txt' }).click()

    await expect.poll(() => opened.length).toBe(1)
    expect(opened[0]).toContain('X-Amz-Signature=baru')
    expect(calls).toBe(1)
  })

  test('URL kedaluwarsa: tampil "memuat ulang", data dimuat ulang, file dibuka dengan URL baru', async ({ page, mockApi }) => {
    const stale = signedUrl('guarantee/g1.txt', Date.now() - 70 * 60_000, 'lama')
    const fresh = signedUrl('guarantee/g1.txt', Date.now(), 'baru')
    let calls = 0
    mockApi.asRole('BUYER').on('GET', '/guarantee/G-1', () => {
      calls++
      return ok(doneGuarantee(calls === 1 ? stale : fresh))
    })
    const opened = await captureFileOpens(page)

    await gotoHydrated(page, '/guarantee/G-1')
    await page.getByRole('main').getByRole('button', { name: 'akun-pengganti.txt' }).click()

    await expect(page.getByText('Link file kedaluwarsa, memuat ulang…').first()).toBeVisible()
    await expect.poll(() => opened.length).toBe(1)
    expect(opened[0]).toContain('X-Amz-Signature=baru')
    expect(calls).toBe(2)
  })

  test('BE tetap mengirim URL kedaluwarsa: tidak membuka halaman error R2', async ({ page, mockApi }) => {
    const stale = signedUrl('guarantee/g1.txt', Date.now() - 70 * 60_000, 'lama')
    mockApi.asRole('BUYER').on('GET', '/guarantee/G-1', ok(doneGuarantee(stale)))
    const opened = await captureFileOpens(page)

    await gotoHydrated(page, '/guarantee/G-1')
    await page.getByRole('main').getByRole('button', { name: 'akun-pengganti.txt' }).click()

    await expect(page.getByText('Gagal memuat ulang link file').first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(opened).toHaveLength(0)
  })
})
