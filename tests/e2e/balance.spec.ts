import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makeBalance, PAYMENT_METHODS } from './support/cart'
import type { Page } from '@playwright/test'

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()

/** Riwayat deposit; `amount` sudah termasuk kode unik */
const makeDeposit = (paymentId: string, overrides: Record<string, unknown> = {}) => ({
  id: Number(paymentId.replace(/\D/g, '')) || 1,
  amount: 100123,
  status: 'UNPAID',
  payment_id: paymentId,
  balance_id: 'B-1',
  payment_method: 'MANUAL_BANK',
  unique_code: 123,
  created_at: new Date(Date.now() - 3600_000).toISOString(),
  expired_at: hoursFromNow(23),
  ...overrides,
})
type Deposit = ReturnType<typeof makeDeposit>

const makeLog = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  amount: 100123,
  type: 'CREDIT',
  source: 'DEPOSIT',
  description: 'Top up via transfer bank',
  deposit_balance_old: 0,
  deposit_balance_new: 100123,
  sales_balance_old: 0,
  sales_balance_new: 0,
  deposit_held_old: 0,
  deposit_held_new: 0,
  sales_held_old: 0,
  sales_held_new: 0,
  created_at: '2026-11-01T10:00:00',
  ...overrides,
})

const main = (page: Page) => page.getByRole('main')
/** Intl.NumberFormat id-ID memakai spasi tak-putus setelah "Rp" */
const rp = (s: string) => new RegExp(`Rp\\s?${s.replace(/\./g, '\\.')}$`)

/** Mock halaman /balance buyer; mengembalikan penghitung fetch riwayat */
function mockBuyerBalance(mockApi: MockApi, opts: { getDeposits?: () => Deposit[]; logs?: unknown[]; deposit?: number } = {}) {
  const { getDeposits = () => [], logs = [], deposit = 50000 } = opts
  let historyFetches = 0
  mockApi
    .asRole('BUYER')
    .on('GET', '/balance', ok(makeBalance(deposit)))
    .on('GET', '/balance/deposit/history', () => (historyFetches++, ok(page1(getDeposits()))))
    .on('GET', '/balance/log', ok(page1(logs)))
    .on('GET', '/payment/methods', ok(PAYMENT_METHODS))
  return { historyFetches: () => historyFetches }
}

const depositRow = (page: Page, paymentId: string) =>
  main(page).locator('div.border-b').filter({ hasText: `#${paymentId}` })

async function openDepositForm(page: Page) {
  await main(page).getByRole('button', { name: 'Deposit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Deposit' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('Deposit (top up) buyer', () => {
  test('saldo belanja, riwayat deposit per status & mutasi saldo', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi, {
      deposit: 150000,
      getDeposits: () => [makeDeposit('PAY-1'), makeDeposit('PAY-2', { status: 'PAID', unique_code: null, amount: 50000, payment_method: 'TRIPAY' })],
      logs: [makeLog(1)],
    })

    await gotoHydrated(page, '/balance')
    await expect(main(page).getByText(rp('150.000')).first()).toBeVisible()

    const unpaid = depositRow(page, 'PAY-1')
    await expect(unpaid.getByText('Menunggu Pembayaran')).toBeVisible()
    await expect(unpaid.getByText('+ 100.123')).toBeVisible()
    await expect(unpaid.getByText('(Rp 100.000 + kode unik 123)')).toBeVisible()
    await expect(unpaid.getByText(/Bayar sebelum/)).toBeVisible()
    await expect(unpaid.getByRole('link', { name: 'Lanjut Bayar' })).toHaveAttribute('href', '/payment/PAY-1')
    await expect(unpaid.getByRole('button', { name: 'Batalkan' })).toBeVisible()

    const paid = depositRow(page, 'PAY-2')
    await expect(paid.getByText('Berhasil')).toBeVisible()
    await expect(paid.getByText(/kode unik/)).toHaveCount(0)
    await expect(paid.getByRole('button', { name: 'Batalkan' })).toHaveCount(0)

    // Mutasi saldo
    const log = main(page).locator('div.border-b').filter({ hasText: 'Top up via transfer bank' })
    await expect(log.getByText('Top Up', { exact: true })).toBeVisible()
    await expect(log.getByText('+100.123')).toBeVisible()
    await expect(log.getByText(/Saldo Belanja: Rp\s0 → Rp\s100\.123/)).toBeVisible()
  })

  test('deposit via payment gateway: SALDO disembunyikan, biaya channel & body request', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi)
    let body: unknown = null
    mockApi.on('POST', '/balance/deposit', (route) => {
      body = route.request().postDataJSON()
      return ok({ payment_id: 'PAY-9', reference_id: 'REF-9', checkout_url: '', qr_url: '', unique_code: null })
    })

    await gotoHydrated(page, '/balance')
    const dialog = await openDepositForm(page)
    await expect(dialog.getByText('Transfer Bank Manual')).toBeVisible()
    await expect(dialog.getByText('Bayar pakai saldo')).toHaveCount(0)
    await expect(dialog.getByPlaceholder('Minimal Rp 10.000')).toHaveValue('200.000')

    await dialog.getByText('Payment Gateway').click()
    await expect(dialog.getByText('Fee: Rp750 + 0.7%')).toBeVisible()
    // 750 + 0,7% × 200.000 = 2.150
    await expect(dialog.getByText('Rp2.150')).toBeVisible()
    await expect(dialog.getByText('Rp202.150')).toBeVisible()
    await dialog.getByRole('button', { name: 'Deposit' }).click()

    await expect(page).toHaveURL(/\/payment\/PAY-9$/)
    expect(body).toEqual({ amount: 200000, payment_method: 'TRIPAY', channel_code: 'QRIS' })
  })

  test('deposit transfer manual: validasi minimal, biaya gratis & channel null', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi)
    let body: unknown = null
    mockApi.on('POST', '/balance/deposit', (route) => {
      body = route.request().postDataJSON()
      return ok({ payment_id: 'PAY-8', reference_id: 'REF-8', checkout_url: '', qr_url: '', unique_code: 321 })
    })

    await gotoHydrated(page, '/balance')
    const dialog = await openDepositForm(page)
    await dialog.getByText('Transfer Bank Manual').click()
    const amount = dialog.getByPlaceholder('Minimal Rp 10.000')
    const submit = dialog.getByRole('button', { name: 'Deposit' })

    await amount.fill('5000')
    await submit.click()
    await expect(dialog.getByText('Minimal Rp 10.000', { exact: true })).toBeVisible()
    expect(body).toBeNull()

    await amount.fill('75000')
    await expect(dialog.getByText('Gratis')).toBeVisible()
    await expect(dialog.getByText('Rp75.000').last()).toBeVisible()
    await submit.click()

    await expect(page).toHaveURL(/\/payment\/PAY-8$/)
    expect(body).toEqual({ amount: 75000, payment_method: 'MANUAL_BANK', channel_code: null })
  })

  test.fail('deposit tanpa metode terpilih: ada metode default atau petunjuk memilih (F-33)', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi)

    await gotoHydrated(page, '/balance')
    const dialog = await openDepositForm(page)
    // Default `selectedPayment = 'QRIS'` bukan id metode mana pun → tombol nonaktif tanpa penjelasan
    await expect(dialog.getByRole('button', { name: 'Deposit' })).toBeEnabled({ timeout: 2000 })
  })

  test.fail('deposit ditolak BE (400) menampilkan pesan BE (F-20)', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi)
    mockApi.on('POST', '/balance/deposit', fail(400, 'Masih ada deposit yang belum dibayar'))

    await gotoHydrated(page, '/balance')
    const dialog = await openDepositForm(page)
    await dialog.getByText('Transfer Bank Manual').click()
    await dialog.getByRole('button', { name: 'Deposit' }).click()

    await expect(page.getByText('Deposit Gagal').first()).toBeVisible()
    await expect(page.getByText('Masih ada deposit yang belum dibayar').first()).toBeVisible({ timeout: 2000 })
  })

  test('batalkan deposit: "Tidak" tanpa API, "Ya" membatalkan & riwayat dimuat ulang', async ({ page, mockApi }) => {
    let deposits = [makeDeposit('PAY-1')]
    mockBuyerBalance(mockApi, { getDeposits: () => deposits })
    let calls = 0
    mockApi.on('POST', '/balance/deposit/cancel/PAY-1', () => {
      calls++
      deposits = [{ ...deposits[0]!, status: 'CANCELLED' }]
      return ok(null)
    })

    await gotoHydrated(page, '/balance')
    const row = depositRow(page, 'PAY-1')
    await row.getByRole('button', { name: 'Batalkan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Batalkan Deposit?' })
    await dialog.getByRole('button', { name: 'Tidak' }).click()
    await expect(dialog).toHaveCount(0)
    expect(calls).toBe(0)

    await row.getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, Batalkan' }).click()

    await expect(page.getByText('Deposit Anda telah berhasil dibatalkan.').first()).toBeVisible()
    expect(calls).toBe(1)
    await expect(row.getByText('Deposit Dibatalkan')).toBeVisible()
    await expect(row.getByRole('button', { name: 'Batalkan' })).toHaveCount(0)
    await expect(row.getByRole('link', { name: 'Lanjut Bayar' })).toHaveCount(0)
  })

  test.fail('batalkan deposit yang sudah dibayar (409): pesan BE tampil & riwayat dimuat ulang (F-20)', async ({ page, mockApi }) => {
    let deposits = [makeDeposit('PAY-1')]
    mockBuyerBalance(mockApi, { getDeposits: () => deposits })
    mockApi.on('POST', '/balance/deposit/cancel/PAY-1', () => {
      deposits = [{ ...deposits[0]!, status: 'PAID' }]
      return fail(409, 'Deposit sudah dibayar')
    })

    await gotoHydrated(page, '/balance')
    const row = depositRow(page, 'PAY-1')
    await row.getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, Batalkan' }).click()

    await expect(page.getByText('Deposit Gagal dibatalkan').first()).toBeVisible()
    await expect(page.getByText('Deposit sudah dibayar').first()).toBeVisible({ timeout: 2000 })
    await expect(row.getByText('Berhasil')).toBeVisible({ timeout: 2000 })
  })

  test.fail('riwayat deposit gagal dimuat: tampil error, bukan "Belum ada riwayat" (F-34)', async ({ page, mockApi }) => {
    mockBuyerBalance(mockApi)
    mockApi.on('GET', '/balance/deposit/history', fail(500, 'Server error'))

    await gotoHydrated(page, '/balance')
    await expect(main(page).getByText('Terjadi Kesalahan')).toBeVisible({ timeout: 3000 })
    await expect(main(page).getByText('Belum ada riwayat deposit')).toHaveCount(0)
  })

  test('pengunjung yang membuka /balance diarahkan ke login', async ({ page }) => {
    await gotoHydrated(page, '/balance')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ───────────────────────── Transfer saldo jualan → belanja ─────────────────────────

const sellerBalance = (sales: number, deposit = 20000) =>
  ({ deposit_balance: deposit, sales_balance: sales, deposit_held: 0, sales_held: 0 })

function mockSellerBalance(mockApi: MockApi, getBalance: () => ReturnType<typeof sellerBalance>) {
  let logFetches = 0
  mockApi
    .asRole('SELLER')
    .on('GET', '/balance', () => ok(getBalance()))
    .on('GET', '/seller/withdrawal', ok(emptyPage()))
    .on('GET', '/balance/log', () => (logFetches++, ok(emptyPage())))
    .on('GET', '/seller/bank-account', fail(404, 'Rekening belum diatur'))
  return { logFetches: () => logFetches }
}

async function openTransferForm(page: Page) {
  await main(page).getByRole('button', { name: 'Transfer dari Saldo Jualan' }).click()
  const dialog = page.getByRole('dialog', { name: 'Transfer ke Saldo Belanja' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('Transfer saldo jualan ke saldo belanja', () => {
  test('validasi, body request, kartu saldo dari respons & mutasi dimuat ulang', async ({ page, mockApi }) => {
    const { logFetches } = mockSellerBalance(mockApi, () => sellerBalance(300000))
    let body: unknown = null
    mockApi.on('POST', '/balance/transfer', (route) => {
      body = route.request().postDataJSON()
      return ok(sellerBalance(200000, 120000))
    })

    await gotoHydrated(page, '/seller/balance')
    const dialog = await openTransferForm(page)
    await expect(dialog.getByText('Rp 300.000')).toBeVisible()
    const amount = dialog.getByPlaceholder('Masukkan jumlah transfer')
    const submit = dialog.getByRole('button', { name: 'Transfer' })

    await submit.click()
    await expect(dialog.getByText('Jumlah transfer harus lebih dari 0.')).toBeVisible()
    await amount.fill('400000')
    await submit.click()
    await expect(dialog.getByText('Jumlah transfer melebihi saldo jualan tersedia.')).toBeVisible()
    expect(body).toBeNull()

    await amount.fill('100000')
    await dialog.getByPlaceholder('Catatan...').fill('Buat belanja stok')
    const before = logFetches()
    await submit.click()

    await expect(page.getByText('Rp 100.000 berhasil dipindahkan ke saldo belanja.').first()).toBeVisible()
    expect(body).toEqual({ amount: 100000, notes: 'Buat belanja stok' })
    await expect(dialog).toHaveCount(0)
    // Kartu saldo memakai saldo dari respons transfer, tanpa fetch ulang /balance
    await expect(main(page).getByText('Rp 200.000')).toBeVisible()
    await expect(main(page).getByText('Rp 120.000')).toBeVisible()
    await expect.poll(logFetches).toBeGreaterThan(before)
  })

  test('catatan kosong tidak dikirim', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, () => sellerBalance(300000))
    let body: unknown = null
    mockApi.on('POST', '/balance/transfer', (route) => ((body = route.request().postDataJSON()), ok(sellerBalance(250000, 70000))))

    await gotoHydrated(page, '/seller/balance')
    const dialog = await openTransferForm(page)
    await dialog.getByPlaceholder('Masukkan jumlah transfer').fill('50000')
    await dialog.getByRole('button', { name: 'Transfer' }).click()
    await expect(dialog).toHaveCount(0)
    expect(body).toEqual({ amount: 50000 })
  })

  test('saldo jualan 0: tombol transfer nonaktif', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, () => sellerBalance(0))

    await gotoHydrated(page, '/seller/balance')
    await expect(main(page).getByRole('button', { name: 'Transfer dari Saldo Jualan' })).toBeDisabled()
  })

  test.fail('transfer ditolak BE (400) menampilkan pesan BE di form (F-20)', async ({ page, mockApi }) => {
    mockSellerBalance(mockApi, () => sellerBalance(300000))
    mockApi.on('POST', '/balance/transfer', fail(400, 'Saldo jualan sedang ditahan untuk penarikan'))

    await gotoHydrated(page, '/seller/balance')
    const dialog = await openTransferForm(page)
    await dialog.getByPlaceholder('Masukkan jumlah transfer').fill('100000')
    await dialog.getByRole('button', { name: 'Transfer' }).click()

    await expect(dialog.getByText('Saldo jualan sedang ditahan untuk penarikan')).toBeVisible({ timeout: 2000 })
  })
})
