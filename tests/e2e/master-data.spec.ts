import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({ page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content })

// ===== VOUCHER =====
const voucher = (code: string, over: Record<string, unknown> = {}) => ({
  code, name: `Voucher ${code}`, discount_type: 'NOMINAL', discount_value: 10000, max_discount_amount: null,
  min_transaction_amount: null, quota: null, used_count: 0, start_date: null, end_date: null, is_public: true,
  status: 'ACTIVE', created_at: '2026-11-01T10:00:00', updated_at: '2026-11-01T10:00:00', ...over,
})

test.describe('Master data admin: voucher', () => {
  test('filter Suspended mengirim status SUSPEND sesuai enum BE (F-50)', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/voucher', (_r, url) => {
        queries.push(url.searchParams)
        const status = url.searchParams.get('status')
        // BE menolak nilai di luar enum Status
        if (status && status !== 'ACTIVE' && status !== 'SUSPEND') return fail(400, `Status tidak valid: ${status}`)
        return ok(pageOf(status === 'SUSPEND' ? [voucher('LAMA', { status: 'SUSPEND' })] : [voucher('PROMO10')]))
      })

    await gotoHydrated(page, '/admin/voucher')
    await expect(main(page).getByText('PROMO10', { exact: true })).toBeVisible()
    expect(queries.at(-1)?.has('status')).toBe(false)

    await main(page).getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Suspended' }).click()

    await expect.poll(() => queries.at(-1)?.get('status')).toBe('SUSPEND')
    await expect(main(page).getByText('LAMA', { exact: true })).toBeVisible()
  })

  test('tambah voucher persen: body request; pesan BE tampil saat ditolak', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/voucher', ok(pageOf([])))
      .on('POST', '/admin/voucher', (route) => { body = route.request().postDataJSON(); return fail(409, 'Kode voucher sudah digunakan') })

    await gotoHydrated(page, '/admin/voucher')
    await main(page).getByRole('button', { name: 'Tambah Voucher' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah Voucher' })
    await dialog.getByPlaceholder('cth: PROMO10').fill('hemat10')
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Persentase (%)' }).click()
    await dialog.getByLabel('Nilai Diskon (%)').fill('10')
    await dialog.getByLabel('Maks. Diskon (Rp)').fill('50000')
    await dialog.getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByText('Kode voucher sudah digunakan').first()).toBeVisible()
    expect(body).toMatchObject({ code: 'HEMAT10', discount_type: 'PERCENT', discount_value: 10, max_discount_amount: 50000, quota: null })
  })

  test('suspend & aktifkan memanggil endpoint masing-masing', async ({ page, mockApi }) => {
    const calls: string[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/voucher', ok(pageOf([voucher('PROMO10'), voucher('LAMA', { status: 'SUSPEND' })])))
      .on('PATCH', '/admin/voucher/PROMO10/suspend', () => (calls.push('suspend'), ok(voucher('PROMO10', { status: 'SUSPEND' }))))
      .on('PATCH', '/admin/voucher/LAMA/activate', () => (calls.push('activate'), ok(voucher('LAMA'))))

    await gotoHydrated(page, '/admin/voucher')
    await main(page).getByRole('button', { name: 'Suspend' }).click()
    await expect.poll(() => calls).toEqual(['suspend'])
    await main(page).getByRole('button', { name: 'Aktifkan' }).click()
    await expect.poll(() => calls).toEqual(['suspend', 'activate'])
  })
})

// ===== METODE PEMBAYARAN =====
const method = (id: string, name: string, status = 'ACTIVE') => ({ id, name, description: '', icon_url: null, status, channels: [] })

test.describe('Master data admin: metode pembayaran', () => {
  const METHODS = [method('TRIPAY', 'Tripay'), method('MANUAL', 'Transfer Manual', 'SUSPEND')]

  test('metode berstatus SUSPEND dari BE ikut filter & kartu Suspended (F-51)', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/payment/method/all', ok(METHODS))

    await gotoHydrated(page, '/admin/payment-method')
    const m = main(page)
    await expect(m.getByText('Transfer Manual')).toBeVisible()
    await m.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Suspended' }).click()

    await expect(m.getByText('Transfer Manual')).toBeVisible()
    await expect(m.getByText('(TRIPAY)')).toHaveCount(0)
  })

  test('edit status ke Suspended mengirim SUSPEND (F-51)', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/payment/method/all', ok(METHODS))
      .on('PATCH', '/payment/method/update/TRIPAY', (route) => { body = route.request().postDataJSON(); return ok(method('TRIPAY', 'Tripay', 'SUSPEND')) })

    await gotoHydrated(page, '/admin/payment-method')
    const row = main(page).locator('div.divide-gray-100 > div').filter({ hasText: '(TRIPAY)' })
    await row.getByRole('button').first().click()
    const dialog = page.getByRole('dialog', { name: 'Edit Metode Pembayaran' })
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Suspended' }).click()
    await dialog.getByRole('button', { name: 'Simpan' }).click()

    await expect.poll(() => body).not.toBeNull()
    expect(body).toMatchObject({ id: 'TRIPAY', name: 'Tripay', status: 'SUSPEND' })
  })
})

// ===== TIPE AKUN =====
test.describe('Master data admin: tipe akun', () => {
  test('tipe default tanpa tombol ubah; nama duplikat menampilkan pesan BE', async ({ page, mockApi }) => {
    const type = (id: number, name: string, over: Record<string, unknown> = {}) => ({
      id, name, slug: name.toLowerCase(), status: 'ACTIVE', is_default: false, created_at: '2026-11-01T10:00:00', ...over,
    })
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/account-types', ok([type(1, 'Lainnya', { is_default: true }), type(2, 'Mobile Legends')]))
      .on('POST', '/admin/account-types', (route) => { body = route.request().postDataJSON(); return fail(409, 'Tipe akun "Mobile Legends" sudah ada') })

    await gotoHydrated(page, '/admin/account-type')
    const rowOf = (name: string) => main(page).locator('div.divide-gray-100 > div').filter({ hasText: name })
    await expect(rowOf('Mobile Legends').getByTitle('Edit tipe akun')).toBeVisible()
    await expect(rowOf('Lainnya').getByTitle('Edit tipe akun')).toHaveCount(0)

    await main(page).getByRole('button', { name: 'Tambah Tipe Akun' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah Tipe Akun' })
    await dialog.getByPlaceholder('Contoh: Mobile Legends').fill('  Mobile Legends ')
    await dialog.getByRole('button', { name: 'Simpan' }).click()

    await expect(dialog.getByText('Tipe akun "Mobile Legends" sudah ada')).toBeVisible()
    expect(body).toEqual({ name: 'Mobile Legends', status: 'ACTIVE' })
  })
})

// ===== CHANNEL PEMBAYARAN =====
test.describe('Master data admin: channel pembayaran', () => {
  const channel = (code: string, over: Record<string, unknown> = {}) => ({
    code, payment_method_id: 'TRIPAY', name: `Channel ${code}`, type: 'DIRECT', group: 'Virtual Account', icon_url: null,
    minimum_amount: 10000, maximum_amount: 5000000, fee_flat: 4000, fee_percent: 0, status: 'ACTIVE', ...over,
  })

  test('sync Tripay & edit fee mengirim nilai ke BE', async ({ page, mockApi }) => {
    let body: any = null
    let synced = false
    mockApi.asRole('ADMIN')
      .on('GET', '/payment/method/all', ok([method('TRIPAY', 'Tripay')]))
      .on('GET', '/payment/channel/all', ok(pageOf([channel('BRIVA')])))
      .on('POST', '/payment/channel/sync-tripay', () => (synced = true, ok([channel('BRIVA'), channel('QRIS')])))
      .on('PATCH', '/payment/channel/update/BRIVA', (route) => { body = route.request().postDataJSON(); return ok(channel('BRIVA')) })

    await gotoHydrated(page, '/admin/payment-channel')
    await main(page).getByRole('button', { name: 'Sync dari Tripay' }).click()
    await expect(page.getByText('2 channel berhasil disinkronkan dari Tripay').first()).toBeVisible()
    expect(synced).toBe(true)

    const row = main(page).locator('div.divide-gray-100 > div').filter({ hasText: 'Channel BRIVA' })
    await row.getByRole('button').first().click()
    const dialog = page.getByRole('dialog', { name: 'Edit Payment Channel' })
    await dialog.getByPlaceholder('0').first().fill('4500')
    await dialog.getByRole('button', { name: 'Simpan' }).click()

    await expect.poll(() => body).not.toBeNull()
    expect(body).toMatchObject({ name: 'Channel BRIVA', fee_flat: 4500, fee_percent: 0, status: 'ACTIVE' })
  })
})

// ===== KATEGORI PRODUK =====
test.describe('Master data admin: kategori produk', () => {
  const cat = (id: number, name: string, status = 'ACTIVE') => ({
    id, name, slug: name.toLowerCase().replace(/ /g, '-'), description: '', image_url: '', status, ceated_at: '2026-11-01T10:00:00', updated_at: null,
  })
  const CATS = [cat(1, 'Top Up Game'), cat(2, 'Akun Lama', 'SUSPEND')]
  const suspendButton = (page: Page, name: string) =>
    main(page).locator('div.divide-gray-100 > div').filter({ hasText: name }).locator('button[title*="menonaktifkan"], button[title="Nonaktifkan kategori"]')

  test('admin biasa: tombol nonaktifkan terkunci', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/categories/all', ok(CATS))
    await gotoHydrated(page, '/admin/category')
    await expect(suspendButton(page, 'Top Up Game')).toBeDisabled()
    // kategori yang sudah SUSPEND tidak punya tombol nonaktifkan
    await expect(suspendButton(page, 'Akun Lama')).toHaveCount(0)
  })

  test('super admin: nonaktifkan setelah konfirmasi memanggil endpoint suspend', async ({ page, mockApi }) => {
    let suspended = false
    mockApi.asRole('SUPER_ADMIN')
      .on('GET', '/categories/all', ok(CATS))
      .on('PATCH', '/category/suspend/1', () => (suspended = true, ok(null)))
    page.on('dialog', d => d.accept())

    await gotoHydrated(page, '/admin/category')
    await suspendButton(page, 'Top Up Game').click()
    await expect(page.getByText('Kategori dinonaktifkan').first()).toBeVisible()
    expect(suspended).toBe(true)
  })
})
