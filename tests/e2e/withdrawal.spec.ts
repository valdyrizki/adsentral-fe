import { test, expect, ok, fail, emptyPage, gotoHydrated, makeUser, type MockApi } from './support/fixtures'
import type { Page } from '@playwright/test'

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

const setting = (key: string, value: string) => ({
  id: key, key, value, description: key, group: 'FEE', is_public: true,
  created_at: '2026-01-01T00:00:00', updated_at: '2026-01-01T00:00:00',
})
const WD_FEE_5000 = [setting('WD_FEE', '5000')]

const BANK_ACCOUNT = {
  id: 'BA-1', bank_name: 'BCA', account_number: '9876543210', account_holder_name: 'Tes SELLER',
  created_at: '2026-01-01T00:00:00', updated_at: null, name_check_status: 'MATCHED',
}

const makeWd = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  user: makeUser('SELLER'),
  amount: 100000,
  admin_fee: 0,
  amount_received: 0,
  bank_name: 'BCA',
  account_number: '9876543210',
  account_holder_name: 'Tes SELLER',
  status: 'PENDING',
  notes: null,
  admin_notes: null,
  processed_by: null,
  processed_at: null,
  created_at: hoursAgo(2),
  name_check_status: 'MATCHED',
  ...overrides,
})
type Wd = ReturnType<typeof makeWd>

const balance = (sales: number, overrides: Record<string, number> = {}) =>
  ({ deposit_balance: 20000, sales_balance: sales, deposit_held: 0, sales_held: 0, ...overrides })

/** Mock halaman saldo seller; `getHistory` dipanggil tiap fetch riwayat penarikan */
function mockSellerBalance(mockApi: MockApi, opts: {
  getBalance?: () => ReturnType<typeof balance>
  getHistory?: () => Wd[]
  bankAccount?: typeof BANK_ACCOUNT | null
} = {}) {
  const { getBalance = () => balance(500000), getHistory = () => [], bankAccount = BANK_ACCOUNT } = opts
  let balanceFetches = 0
  mockApi
    .asRole('SELLER')
    .on('GET', '/balance', () => (balanceFetches++, ok(getBalance())))
    .on('GET', '/seller/withdrawal', () => ok(page1(getHistory())))
    .on('GET', '/balance/log', ok(emptyPage()))
    .on('GET', '/system/settings/public', ok(WD_FEE_5000))
    .on('GET', '/seller/bank-account', bankAccount ? ok(bankAccount) : fail(404, 'Rekening belum diatur'))
  return { balanceFetches: () => balanceFetches }
}

const main = (page: Page) => page.getByRole('main')

async function openWithdrawalForm(page: Page) {
  await main(page).getByRole('button', { name: 'Tarik Dana' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tarik Dana' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('Penarikan dana seller', () => {
  test('kartu saldo & riwayat penarikan per status', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, {
      getBalance: () => balance(750000, { sales_held: 100000 }),
      getHistory: () => [
        makeWd('WD-1', { notes: 'Untuk modal' }),
        makeWd('WD-2', { status: 'COMPLETED', admin_fee: 5000, amount_received: 95000, processed_at: hoursAgo(20), processed_by: 'admin' }),
        makeWd('WD-3', { status: 'REJECTED', admin_notes: 'Nama rekening tidak sesuai', processed_at: hoursAgo(30) }),
      ],
    })

    await gotoHydrated(page, '/seller/balance')
    await expect(main(page).getByText('Rp 750.000')).toBeVisible()
    await expect(main(page).getByText('Rp 20.000')).toBeVisible()
    await expect(main(page).getByText('Rp 100.000').first()).toBeVisible()

    const items = main(page).locator('div.py-4.px-2')
    await expect(items).toHaveCount(3)
    await expect(items.nth(0).getByText('Menunggu')).toBeVisible()
    await expect(items.nth(0).getByText('Catatan: Untuk modal')).toBeVisible()
    await expect(items.nth(0).getByRole('button', { name: 'Batalkan' })).toBeVisible()

    await expect(items.nth(1).getByText('Selesai')).toBeVisible()
    await expect(items.nth(1).getByText('-Rp 5.000')).toBeVisible()
    await expect(items.nth(1).getByText('Rp 95.000')).toBeVisible()
    await expect(items.nth(1).getByRole('button', { name: 'Batalkan' })).toHaveCount(0)

    await expect(items.nth(2).getByText('Ditolak')).toBeVisible()
    await expect(items.nth(2).getByText('Nama rekening tidak sesuai')).toBeVisible()
  })

  test('dana tertahan dirinci: escrow pesanan & penarikan diproses (EP04-07)', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, {
      getBalance: () => balance(750000, { sales_held: 150000, sales_held_escrow: 90000, sales_held_withdrawal: 60000 }),
    })

    await gotoHydrated(page, '/seller/balance')
    await expect(main(page).getByText('Rp 150.000').first()).toBeVisible()
    await expect(main(page).getByText(/Escrow pesanan Rp\s?90\.000 · Penarikan diproses Rp\s?60\.000/)).toBeVisible()
  })

  test('BE lama tanpa rincian: dana tertahan tetap tampil dengan keterangan umum', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, { getBalance: () => balance(750000, { sales_held: 100000 }) })

    await gotoHydrated(page, '/seller/balance')
    await expect(main(page).getByText('Escrow belum cair / penarikan diproses')).toBeVisible()
  })

  test('ajukan penarikan: validasi, biaya admin & body request', async ({ page, mockApi }) => {
    let history: Wd[] = []
    let sales = 500000
    const { balanceFetches } = mockSellerBalance(mockApi, { getBalance: () => balance(sales), getHistory: () => history })
    let body: unknown = null
    mockApi.on('POST', '/seller/withdrawal', (route) => {
      body = route.request().postDataJSON()
      history = [makeWd('WD-9', { amount: 100000, notes: 'Tarik mingguan', created_at: new Date().toISOString() })]
      sales = 400000
      return ok(null)
    })

    await gotoHydrated(page, '/seller/balance')
    await expect(main(page).getByText('Rp 500.000')).toBeVisible()
    const dialog = await openWithdrawalForm(page)
    await expect(dialog.getByText('BCA — 9876543210')).toBeVisible()
    await expect(dialog.getByText('Rp 5.000')).toBeVisible() // WD_FEE dari system setting

    const amount = dialog.getByPlaceholder('Masukkan jumlah penarikan')
    const submit = dialog.getByRole('button', { name: 'Tarik Dana' })

    await amount.fill('40000')
    await submit.click()
    await expect(dialog.getByText('Jumlah penarikan minimal Rp 50.000.')).toBeVisible()

    await amount.fill('600000')
    await submit.click()
    await expect(dialog.getByText('Jumlah penarikan melebihi saldo tersedia.')).toBeVisible()
    expect(body).toBeNull()

    await amount.fill('100000')
    await expect(amount).toHaveValue('100.000')
    await expect(dialog.getByText('Perkiraan Diterima')).toBeVisible()
    await expect(dialog.getByText('Rp 95.000')).toBeVisible()
    await dialog.getByPlaceholder('Catatan untuk admin...').fill('Tarik mingguan')
    const before = balanceFetches()
    await submit.click()

    await expect(page.getByText('Permintaan penarikan Rp 100.000 sedang diproses.').first()).toBeVisible()
    expect(body).toEqual({ amount: 100000, notes: 'Tarik mingguan' })
    await expect(dialog).toHaveCount(0)
    await expect(main(page).getByText('Rp 400.000')).toBeVisible()
    expect(balanceFetches()).toBeGreaterThan(before)
    await expect(main(page).getByText('Catatan: Tarik mingguan')).toBeVisible()

    // Buka form lagi → sudah ada penarikan PENDING
    const again = await openWithdrawalForm(page)
    await expect(again.getByText('Ada Penarikan yang Sedang Diproses')).toBeVisible()
    await expect(again.getByRole('button', { name: 'Tarik Dana' })).toBeDisabled()
  })

  test('penarikan ditolak BE (400): pesan BE tampil di form', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi)
    mockApi.on('POST', '/seller/withdrawal', fail(400, 'Maksimal penarikan Rp 200.000 untuk akun yang belum verifikasi KTP'))

    await gotoHydrated(page, '/seller/balance')
    const dialog = await openWithdrawalForm(page)
    await dialog.getByPlaceholder('Masukkan jumlah penarikan').fill('300000')
    await dialog.getByRole('button', { name: 'Tarik Dana' }).click()

    await expect(dialog.getByText('Maksimal penarikan Rp 200.000 untuk akun yang belum verifikasi KTP')).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('belum ada rekening: form nonaktif & tautan atur rekening', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, { bankAccount: null })

    await gotoHydrated(page, '/seller/balance')
    const dialog = await openWithdrawalForm(page)
    await expect(dialog.getByText('Rekening bank belum diatur')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Atur Rekening' })).toHaveAttribute('href', '/seller/bank-account')
    await expect(dialog.getByRole('button', { name: 'Tarik Dana' })).toBeDisabled()
    await expect(dialog.getByPlaceholder('Masukkan jumlah penarikan')).toBeDisabled()
  })

  test('batalkan penarikan PENDING lewat dialog konfirmasi', async ({ page, mockApi }) => {
    let history = [makeWd('WD-1')]
    mockSellerBalance(mockApi, { getHistory: () => history })
    let cancelled = 0
    mockApi.on('PATCH', '/seller/withdrawal/WD-1/cancel', () => {
      cancelled++
      history = [{ ...history[0]!, status: 'CANCELLED' }]
      return ok(null)
    })

    await gotoHydrated(page, '/seller/balance')
    await main(page).getByRole('button', { name: 'Batalkan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Batalkan Penarikan' })
    await dialog.getByRole('button', { name: 'Tidak' }).click()
    await expect(dialog).toHaveCount(0)
    expect(cancelled).toBe(0)

    await main(page).getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog', { name: 'Batalkan Penarikan' }).getByRole('button', { name: 'Ya, Batalkan' }).click()

    await expect(page.getByText('Permintaan penarikan berhasil dibatalkan.').first()).toBeVisible()
    expect(cancelled).toBe(1)
    await expect(main(page).getByText('Dibatalkan')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Batalkan' })).toHaveCount(0)
  })

  test('batalkan penarikan basi (409): pesan BE tampil & riwayat dimuat ulang', async ({ page, mockApi }) => {
    // Bug diketahui: cancelWithdrawal tanpa rethrowApiError → toast "Conflict" (docs/test-findings.md F-20).
    test.fail()
    let history = [makeWd('WD-1')]
    mockSellerBalance(mockApi, { getHistory: () => history })
    mockApi.on('PATCH', '/seller/withdrawal/WD-1/cancel', () => {
      history = [{ ...history[0]!, status: 'COMPLETED', admin_fee: 5000, amount_received: 95000, processed_at: hoursAgo(0) }]
      return fail(409, 'Penarikan sudah diproses admin')
    })

    await gotoHydrated(page, '/seller/balance')
    await main(page).getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog', { name: 'Batalkan Penarikan' }).getByRole('button', { name: 'Ya, Batalkan' }).click()

    await expect(page.getByText('Penarikan sudah diproses admin').first()).toBeVisible({ timeout: 5000 })
    await expect(main(page).getByRole('button', { name: 'Batalkan' })).toHaveCount(0, { timeout: 3000 })
  })
})

/** Mock halaman penarikan admin; mengembalikan query tiap request daftar */
function mockAdminList(mockApi: MockApi, getWds: () => Wd[]) {
  const queries: URLSearchParams[] = []
  mockApi
    .asRole('ADMIN')
    .on('GET', '/system/settings/all', ok(WD_FEE_5000))
    .on('GET', '/admin/withdrawal', (_r, url) => {
      queries.push(url.searchParams)
      return ok(page1(getWds()))
    })
  return queries
}

const adminRow = (page: Page, sellerName: string) =>
  page.locator('div.divide-y > div.py-4').filter({ hasText: sellerName })

test.describe('Penarikan dana admin', () => {
  test('daftar: estimasi diterima pakai WD_FEE & filter status dari URL', async ({ page, mockApi }) => {
    const queries = mockAdminList(mockApi, () => [makeWd('WD-1', { notes: 'Untuk modal' })])

    await gotoHydrated(page, '/admin/withdrawal?status=PENDING')
    const row = adminRow(page, 'Tes SELLER')
    await expect(row.getByText('Biaya admin (WD_FEE): Rp 5.000')).toBeVisible()
    await expect(row.getByText('Estimasi diterima: Rp 95.000')).toBeVisible()
    await expect(row.getByRole('button', { name: 'Tandai Selesai' })).toBeVisible()
    expect(queries.at(-1)?.get('status')).toBe('PENDING')
  })

  test('tandai transfer selesai: body admin_fee, daftar & badge dimuat ulang', async ({ page, mockApi }) => {
    let wds = [makeWd('WD-1')]
    mockAdminList(mockApi, () => wds)
    let alertFetches = 0
    mockApi.on('GET', '/admin/alerts', () => (alertFetches++, ok({ pending_withdrawals: wds.filter((w) => w.status === 'PENDING').length })))
    let body: unknown = null
    mockApi.on('PATCH', '/admin/withdrawal/WD-1/complete', (route) => {
      body = route.request().postDataJSON()
      wds = [{ ...wds[0]!, status: 'COMPLETED', admin_fee: 5000, amount_received: 95000, processed_at: hoursAgo(0), processed_by: 'admin_test' }]
      return ok(null)
    })

    await gotoHydrated(page, '/admin/withdrawal')
    await adminRow(page, 'Tes SELLER').getByRole('button', { name: 'Tandai Selesai' }).click()
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi Transfer Selesai' })
    await expect(dialog.getByText('BCA — 9876543210')).toBeVisible()
    await expect(dialog.getByText('Rp 95.000')).toBeVisible()
    const alertsBefore = alertFetches
    await dialog.getByRole('button', { name: 'Tandai Transfer Selesai' }).click()

    await expect(page.getByText('Seller menerima Rp 95.000.').first()).toBeVisible()
    expect(body).toEqual({ admin_fee: 5000 })
    await expect(dialog).toHaveCount(0)
    const row = adminRow(page, 'Tes SELLER')
    await expect(row.getByText('Diterima: Rp 95.000')).toBeVisible()
    await expect(row.getByText('Oleh: admin_test')).toBeVisible()
    await expect(row.getByRole('button', { name: 'Tandai Selesai' })).toHaveCount(0)
    await expect.poll(() => alertFetches).toBeGreaterThan(alertsBefore)
  })

  test('tolak penarikan: alasan wajib & body request', async ({ page, mockApi }) => {
    let wds = [makeWd('WD-1')]
    mockAdminList(mockApi, () => wds)
    let body: unknown = null
    mockApi.on('PATCH', '/admin/withdrawal/WD-1/reject', (route) => {
      body = route.request().postDataJSON()
      wds = [{ ...wds[0]!, status: 'REJECTED', admin_notes: 'Rekening tidak valid', processed_at: hoursAgo(0) }]
      return ok(null)
    })

    await gotoHydrated(page, '/admin/withdrawal')
    await adminRow(page, 'Tes SELLER').getByRole('button', { name: 'Tolak' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tolak Penarikan' })
    await dialog.getByRole('button', { name: 'Tolak Penarikan' }).click()
    await expect(dialog.getByText('Alasan penolakan harus diisi.')).toBeVisible()
    expect(body).toBeNull()

    await dialog.getByPlaceholder('Masukkan alasan penolakan...').fill('  Rekening tidak valid  ')
    await dialog.getByRole('button', { name: 'Tolak Penarikan' }).click()

    await expect(page.getByText('Permintaan penarikan telah ditolak.').first()).toBeVisible()
    expect(body).toEqual({ admin_notes: 'Rekening tidak valid' })
    await expect(adminRow(page, 'Tes SELLER').getByText('Rekening tidak valid')).toBeVisible()
  })

  test('tandai selesai basi (409): pesan BE tampil', async ({ page, mockApi }) => {
    // Bug diketahui: approveWithdrawal tanpa rethrowApiError → pesan "Conflict" (docs/test-findings.md F-20).
    test.fail()
    mockAdminList(mockApi, () => [makeWd('WD-1')])
    mockApi.on('PATCH', '/admin/withdrawal/WD-1/complete', fail(409, 'Penarikan sudah dibatalkan seller'))

    await gotoHydrated(page, '/admin/withdrawal')
    await adminRow(page, 'Tes SELLER').getByRole('button', { name: 'Tandai Selesai' }).click()
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi Transfer Selesai' })
    await dialog.getByRole('button', { name: 'Tandai Transfer Selesai' }).click()

    await expect(dialog.getByText('Penarikan sudah dibatalkan seller')).toBeVisible({ timeout: 5000 })
  })

  test('detail: peringatan anomali bila penarikan melebihi estimasi saldo', async ({ page, mockApi }) => {
    const seller = makeUser('SELLER')
    mockApi
      .asRole('ADMIN')
      .on('GET', '/system/settings/all', ok(WD_FEE_5000))
      .on('GET', '/admin/withdrawal/WD-1', ok(makeWd('WD-1', { amount: 300000 })))
      .on('GET', `/tx/admin/seller/${seller.id}/sum`, ok({ seller_id: seller.id, seller_username: 'seller_test', seller_email: '', total_transactions: 3, total_amount: 250000 }))
      .on('GET', `/balance/admin/deposit/${seller.id}/sum`, ok({ user_id: seller.id, username: '', email: '', total_deposits: 0, total_amount: 0 }))
      .on('GET', `/admin/withdrawal/${seller.id}/sum`, ok({ user_id: seller.id, username: '', email: '', total_withdrawals: 1, total_amount: 50000, total_amount_received: 45000 }))

    await gotoHydrated(page, '/admin/withdrawal/WD-1')
    await expect(page.getByText('Peringatan: Potensi Anomali')).toBeVisible()
    await expect(page.getByText('Estimasi Diterima Seller')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tandai Transfer Selesai' })).toBeVisible()
  })

  test('detail COMPLETED: biaya admin dari data penarikan, bukan WD_FEE saat ini', async ({ page, mockApi }) => {
    const seller = makeUser('SELLER')
    mockApi
      .asRole('ADMIN')
      .on('GET', '/system/settings/all', ok([setting('WD_FEE', '7500')]))
      .on('GET', '/admin/withdrawal/WD-1', ok(makeWd('WD-1', {
        status: 'COMPLETED', admin_fee: 5000, amount_received: 95000, processed_at: hoursAgo(1), processed_by: 'admin_test',
      })))
      .on('GET', `/tx/admin/seller/${seller.id}/sum`, ok({ seller_id: seller.id, seller_username: '', seller_email: '', total_transactions: 0, total_amount: 500000 }))
      .on('GET', `/balance/admin/deposit/${seller.id}/sum`, ok({ user_id: seller.id, username: '', email: '', total_deposits: 0, total_amount: 0 }))
      .on('GET', `/admin/withdrawal/${seller.id}/sum`, ok({ user_id: seller.id, username: '', email: '', total_withdrawals: 0, total_amount: 0, total_amount_received: 0 }))

    await gotoHydrated(page, '/admin/withdrawal/WD-1')
    await expect(page.getByText('- Rp 5.000')).toBeVisible()
    await expect(page.getByText('Rp 95.000')).toBeVisible()
    await expect(page.getByText('Rp 7.500')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tandai Transfer Selesai' })).toHaveCount(0)
  })
})
