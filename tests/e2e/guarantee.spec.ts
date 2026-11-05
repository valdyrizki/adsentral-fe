import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makeProduct } from './support/cart'
import { makeTx } from './support/payment'
import type { Page } from '@playwright/test'

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const hoursLater = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()
const main = (page: Page) => page.getByRole('main')

/** Transaksi DONE 1 hari lalu dengan produk bergaransi 7 hari */
const doneTx = (overrides: Record<string, unknown> = {}) =>
  makeTx('TX-1', 'PAY-1', {
    status: 'DONE', paid_at: hoursAgo(30), delivered_at: hoursAgo(26), done_at: hoursAgo(24),
    product: makeProduct(1, { name: 'Produk Bergaransi', guarantee_days: 7 }),
    ...overrides,
  })

const makeGuarantee = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  transaction: doneTx(),
  product: makeProduct(1, { name: 'Produk Bergaransi', guarantee_days: 7 }),
  merchant_id: 1,
  merchant_name: 'Toko Tes',
  buyer_id: 1,
  buyer_name: 'Tes BUYER',
  status: 'IN_REVIEW',
  complain_description: 'Akun tidak bisa login sejak kemarin',
  seller_description: null,
  file_id: null,
  file_url: null,
  file_ori_name: null,
  discussions: [],
  created_at: hoursAgo(2),
  updated_at: null,
  reviewed_at: null,
  rejected_at: null,
  progress_at: null,
  done_at: null,
  review_deadline: hoursLater(22),
  progress_deadline: null,
  ...overrides,
})

type Guarantee = ReturnType<typeof makeGuarantee>

/** Mock detail transaksi buyer + garansinya (null = belum ada klaim) */
function mockBuyerTx(mockApi: MockApi, tx: ReturnType<typeof makeTx>, getGuarantee: () => Guarantee | null) {
  mockApi
    .asRole('BUYER')
    .on('GET', `/tx/get/${tx.id}`, ok(tx))
    .on('GET', `/order/discussion/transaction/${tx.id}`, ok(emptyPage()))
    .on('GET', `/order/file/transaction/${tx.id}`, ok(emptyPage()))
    .on('GET', `/review/transaction/${tx.id}`, ok([]))
    .on('GET', `/guarantee/transaction/${tx.id}`, () => {
      const g = getGuarantee()
      return g ? ok(g) : fail(404, 'Tidak ada garansi')
    })
}

/** Mock detail garansi seller; `getG` dipanggil tiap fetch supaya status bisa berubah */
function mockSellerGuarantee(mockApi: MockApi, getG: () => Guarantee) {
  mockApi.asRole('SELLER').on('GET', `/guarantee/${getG().id}`, () => ok(getG()))
}

/** Ambil field multipart dari body mentah */
const multipartFields = (raw: string) =>
  Object.fromEntries([...raw.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)].map((m) => [m[1]!, m[2]!]))

test.describe('Klaim garansi buyer (detail transaksi)', () => {
  test('ajukan klaim: validasi deskripsi, body request & status jadi "Sedang Ditinjau"', async ({ page, mockApi }) => {
    let guarantee: Guarantee | null = null
    mockBuyerTx(mockApi, doneTx(), () => guarantee)
    let body: unknown = null
    mockApi.on('POST', '/guarantee', (route) => {
      body = route.request().postDataJSON()
      guarantee = makeGuarantee('G-1', { complain_description: 'Akun tidak bisa login sejak kemarin' })
      return ok(guarantee)
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Garansi Produk')).toBeVisible()
    await expect(main(page).getByText('(7 hari)')).toBeVisible()
    // done_at 1 hari lalu + 7 hari → sisa 5h 23:xx:xx / 6h 00:00:00
    await expect(main(page).getByText(/^[56]h \d{2}:\d{2}:\d{2}$/)).toBeVisible()

    await main(page).getByRole('button', { name: 'Klaim Garansi' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ajukan Klaim Garansi' })
    const submit = dialog.getByRole('button', { name: 'Ajukan Klaim Garansi' })
    await dialog.getByRole('textbox').fill('rusak')
    await expect(dialog.getByText('Deskripsi keluhan minimal 10 karakter')).toBeVisible()
    await expect(submit).toBeDisabled()

    await dialog.getByRole('textbox').fill('  Akun tidak bisa login sejak kemarin  ')
    await submit.click()

    await expect(page.getByText('Klaim garansi berhasil diajukan').first()).toBeVisible()
    expect(body).toEqual({ transaction_id: 'TX-1', complain_description: 'Akun tidak bisa login sejak kemarin' })
    await expect(dialog).toHaveCount(0)
    await expect(main(page).getByText('Sedang Ditinjau')).toBeVisible()
    await expect(main(page).getByText('Menunggu Respon Penjual')).toBeVisible()
    // Klaim hanya 1x per transaksi
    await expect(main(page).getByRole('button', { name: 'Klaim Garansi' })).toHaveCount(0)
  })

  test('klaim ditolak BE: pesan BE tampil di toast', async ({ page, mockApi }) => {
    // Bug diketahui: composable garansi tidak memakai rethrowApiError, pesan BE hilang (docs/test-findings.md F-20).
    test.fail()
    mockBuyerTx(mockApi, doneTx(), () => null)
    mockApi.on('POST', '/guarantee', fail(400, 'Masa garansi produk sudah berakhir'))

    await gotoHydrated(page, '/transaction/TX-1')
    await main(page).getByRole('button', { name: 'Klaim Garansi' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ajukan Klaim Garansi' })
    await dialog.getByRole('textbox').fill('Akun tidak bisa login sejak kemarin')
    await dialog.getByRole('button', { name: 'Ajukan Klaim Garansi' }).click()

    await expect(page.getByText('Masa garansi produk sudah berakhir').first()).toBeVisible({ timeout: 5000 })
  })

  test('masa garansi habis: tombol klaim tidak tampil', async ({ page, mockApi }) => {
    mockBuyerTx(mockApi, doneTx({ status: 'COMPLETE', done_at: hoursAgo(8 * 24) }), () => null)

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Masa garansi telah berakhir')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Klaim Garansi' })).toHaveCount(0)
  })

  test('produk tanpa garansi: bagian garansi tidak tampil', async ({ page, mockApi }) => {
    mockBuyerTx(mockApi, doneTx({ product: makeProduct(1, { guarantee_days: null }) }), () => null)

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Berikan Penilaian Anda Mengenai Transaksi Ini!')).toBeVisible()
    await expect(main(page).getByText('Garansi Produk')).toHaveCount(0)
  })

  test('garansi DONE: balasan seller & file pengganti tampil', async ({ page, mockApi }) => {
    mockBuyerTx(mockApi, doneTx(), () => makeGuarantee('G-1', {
      status: 'DONE', seller_description: 'User: ganti1 / Pass: rahasia1', file_url: '/files/g1.txt', file_ori_name: 'akun-pengganti.txt',
      reviewed_at: hoursAgo(1.5), progress_at: hoursAgo(1.5), done_at: hoursAgo(1),
    }))

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Penjual telah mengirimkan akun garansi')).toBeVisible()
    await expect(main(page).getByText('User: ganti1 / Pass: rahasia1')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'akun-pengganti.txt' })).toBeVisible()
  })
})

test.describe('Halaman klaim garansi buyer', () => {
  test('daftar klaim → detail klaim', async ({ page, mockApi }) => {
    const g = makeGuarantee('G-1', {
      status: 'REJECTED', seller_description: 'Kerusakan karena ganti password sendiri',
      reviewed_at: hoursAgo(1), rejected_at: hoursAgo(1),
    })
    mockApi
      .asRole('BUYER')
      .on('GET', '/guarantee', ok(page1([g, makeGuarantee('G-2', { status: 'IN_PROGRESS' })])))
      .on('GET', '/guarantee/G-1', ok(g))

    await gotoHydrated(page, '/guarantee')
    await expect(page.getByText('(2 total)')).toBeVisible()
    const row = page.locator('div.cursor-pointer').filter({ hasText: '#G-1' })
    await expect(row.getByText('Ditolak')).toBeVisible()
    await expect(row.getByText('Toko: Toko Tes')).toBeVisible()
    await expect(page.locator('div.cursor-pointer').filter({ hasText: '#G-2' }).getByText('Sedang Diproses')).toBeVisible()

    await row.click()
    await expect(page).toHaveURL(/\/guarantee\/G-1$/)
    await expect(page.getByText('Klaim Garansi Ditolak')).toBeVisible()
    await expect(page.getByText('Akun tidak bisa login sejak kemarin')).toBeVisible()
    await expect(page.getByText('Kerusakan karena ganti password sendiri')).toBeVisible()
    await expect(page.getByText('Ditolak Seller', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '#TX-1' })).toHaveAttribute('href', '/transaction/TX-1')
  })

  test('pengunjung yang membuka /guarantee diarahkan ke login', async ({ page }) => {
    // Bug diketahui: /guarantee belum ada di authRequiredRoutes (docs/test-findings.md F-19).
    test.fail()
    await page.goto('/guarantee')
    await expect(page).toHaveURL((url) => url.pathname === '/login' && url.searchParams.get('redirect') === '/guarantee', { timeout: 5000 })
  })
})

test.describe('Klaim garansi seller', () => {
  test('daftar: countdown review & tanda terlewat', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/guarantee', ok(page1([
      makeGuarantee('G-1'),
      makeGuarantee('G-2', { review_deadline: hoursAgo(1) }),
      makeGuarantee('G-3', { status: 'IN_PROGRESS', review_deadline: null, progress_deadline: hoursLater(5) }),
    ])))

    await gotoHydrated(page, '/seller/guarantee')
    const row = (id: string) => page.locator('div.cursor-pointer').filter({ hasText: `#${id}` })

    await expect(row('G-1').getByText('Sisa waktu review')).toBeVisible()
    await expect(row('G-1').getByText(/^2[12]:\d{2}:\d{2}$/)).toBeVisible()
    await expect(row('G-2').getByText('TERLEWAT')).toBeVisible()
    await expect(row('G-2').getByText('Berisiko penalty!')).toBeVisible()
    await expect(row('G-3').getByText('Sisa waktu kirim')).toBeVisible()
    await expect(row('G-3').getByText('Perlu Kirim Garansi')).toBeVisible()
    await expect(row('G-1').getByText('Pembeli: Tes BUYER')).toBeVisible()
  })

  test('terima klaim → IN_PROGRESS', async ({ page, mockApi }) => {
    let g = makeGuarantee('G-1')
    mockSellerGuarantee(mockApi, () => g)
    let body: unknown = null
    mockApi.on('POST', '/seller/guarantee/G-1/review', (route) => {
      body = route.request().postDataJSON()
      g = { ...g, status: 'IN_PROGRESS', reviewed_at: hoursAgo(0), progress_at: hoursAgo(0), progress_deadline: hoursLater(24) }
      return ok(g)
    })

    await gotoHydrated(page, '/seller/guarantee/G-1')
    await expect(page.getByText('Harap Respon Klaim Ini')).toBeVisible()
    await page.getByRole('button', { name: 'Terima Klaim' }).click()

    await expect(page.getByText('Klaim garansi diterima').first()).toBeVisible()
    expect(body).toEqual({ accept: true })
    await expect(page.getByText('Segera Kirim Garansi')).toBeVisible()
    await expect(page.getByText('Kirim Garansi ke Pembeli')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Terima Klaim' })).toHaveCount(0)
  })

  test('tolak klaim: validasi alasan & body request', async ({ page, mockApi }) => {
    let g = makeGuarantee('G-1')
    mockSellerGuarantee(mockApi, () => g)
    let body: unknown = null
    mockApi.on('POST', '/seller/guarantee/G-1/review', (route) => {
      body = route.request().postDataJSON()
      g = { ...g, status: 'REJECTED', reviewed_at: hoursAgo(0), rejected_at: hoursAgo(0), seller_description: 'Garansi tidak berlaku' }
      return ok(g)
    })

    await gotoHydrated(page, '/seller/guarantee/G-1')
    await page.getByRole('button', { name: 'Tolak Klaim' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tolak Klaim Garansi' })
    const submit = dialog.getByRole('button', { name: 'Tolak Klaim' })
    await dialog.getByRole('textbox').fill('tidak')
    await expect(submit).toBeDisabled()
    await dialog.getByRole('textbox').fill('  Garansi tidak berlaku  ')
    await submit.click()

    await expect(page.getByText('Klaim garansi ditolak').first()).toBeVisible()
    expect(body).toEqual({ accept: false, seller_description: 'Garansi tidak berlaku' })
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Klaim Garansi Ditolak', { exact: true })).toBeVisible()
  })

  test('terima klaim basi (409): pesan BE tampil & data dimuat ulang', async ({ page, mockApi }) => {
    // Bug diketahui: pesan BE hilang & tidak memuat ulang saat 409 (docs/test-findings.md F-20).
    test.fail()
    let g = makeGuarantee('G-1')
    mockSellerGuarantee(mockApi, () => g)
    mockApi.on('POST', '/seller/guarantee/G-1/review', () => {
      g = { ...g, status: 'IN_PROGRESS', progress_deadline: hoursLater(20) }
      return fail(409, 'Klaim sudah diproses')
    })

    await gotoHydrated(page, '/seller/guarantee/G-1')
    await page.getByRole('button', { name: 'Terima Klaim' }).click()

    await expect(page.getByText('Klaim sudah diproses').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Segera Kirim Garansi')).toBeVisible({ timeout: 3000 })
  })

  test('kirim garansi manual (upload) → DONE', async ({ page, mockApi }) => {
    let g = makeGuarantee('G-1', { status: 'IN_PROGRESS', review_deadline: null, progress_deadline: hoursLater(20) })
    mockSellerGuarantee(mockApi, () => g)
    let fields: Record<string, string> | null = null
    mockApi.on('POST', '/seller/guarantee/G-1/send', (route) => {
      fields = multipartFields(route.request().postData() ?? '')
      g = { ...g, status: 'DONE', done_at: hoursAgo(0), seller_description: 'User: ganti1 / Pass: rahasia1' }
      return ok(g)
    })

    await gotoHydrated(page, '/seller/guarantee/G-1')
    const send = page.getByRole('button', { name: 'Kirim & Selesaikan Garansi' })
    await expect(send).toBeDisabled()
    // Produk MANUAL → tidak ada pilihan "Via Stok"
    await expect(page.getByText('Via Stok')).toHaveCount(0)

    await page.getByPlaceholder(/Username: abc123/).fill('User: ganti1 / Pass: rahasia1')
    await send.click()

    await expect(page.getByText('Akun garansi berhasil dikirim ke pembeli').first()).toBeVisible()
    expect(fields).toEqual({ sellerDescription: 'User: ganti1 / Pass: rahasia1' })
    await expect(page.getByText('Klaim Garansi Selesai')).toBeVisible()
  })

  test('kirim garansi via stok (STOCKING): batas qty & body request', async ({ page, mockApi }) => {
    const product = makeProduct(1, { name: 'Produk Stok', guarantee_days: 7, delivery_type: 'STOCKING', stock: 5 })
    let g = makeGuarantee('G-1', {
      status: 'IN_PROGRESS', review_deadline: null, progress_deadline: hoursLater(20), product,
      transaction: doneTx({ qty: 2, product }),
    })
    mockSellerGuarantee(mockApi, () => g)
    let body: unknown = null
    mockApi.on('POST', '/seller/guarantee/G-1/send-via-stock', (route) => {
      body = route.request().postDataJSON()
      g = { ...g, status: 'DONE', done_at: hoursAgo(0) }
      return ok(g)
    })

    await gotoHydrated(page, '/seller/guarantee/G-1')
    await page.getByText('Via Stok', { exact: true }).click()
    // Maks = min(qty pembelian 2, stok 5)
    await expect(page.getByText('(qty pembelian: 2, stok tersedia: 5)')).toBeVisible()
    await expect(page.getByText('Maks. 2')).toBeVisible()
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page.getByRole('spinbutton')).toHaveValue('2')
    await expect(page.getByRole('button', { name: 'Increment' })).toBeDisabled()
    await page.getByRole('button', { name: 'Kirim via Stok & Selesaikan' }).click()

    await expect(page.getByText('Garansi berhasil dikirim via stok').first()).toBeVisible()
    expect(body).toEqual({ qty: 2 })
    await expect(page.getByText('Klaim Garansi Selesai')).toBeVisible()
  })
})
