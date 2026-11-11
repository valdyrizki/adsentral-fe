import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makeTx } from './support/payment'
import type { Page } from '@playwright/test'

type Tx = ReturnType<typeof makeTx>

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const main = (page: Page) => page.getByRole('main')

/** Pesanan yang sudah dikirim seller 1 jam lalu, menunggu respon buyer */
const deliveredTx = (id: string, overrides: Record<string, unknown> = {}) =>
  makeTx(id, `PAY-${id}`, {
    status: 'DELIVERED', paid_at: hoursAgo(5), confirmed_at: hoursAgo(4), delivered_at: hoursAgo(1), ...overrides,
  })

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  id: 1, transaction_id: 'TX-1', product_id: 1, reviewed_user_id: 2, reviewed_username: 'seller',
  reviewer_id: 1, reviewer_username: 'buyer_test', user_type: 'BUYER', rating: 3, comment: 'Lumayan',
  created_at: hoursAgo(1), updated_at: hoursAgo(1), ...overrides,
})

/** Mock halaman detail transaksi buyer; `getTx` dipanggil tiap fetch supaya status bisa berubah */
function mockBuyerDetail(mockApi: MockApi, getTx: () => Tx, reviews: () => unknown[] = () => []) {
  const id = getTx().id
  mockApi
    .asRole('BUYER')
    .on('GET', `/tx/get/${id}`, () => ok(getTx()))
    .on('GET', `/order/discussion/transaction/${id}`, ok(emptyPage()))
    .on('GET', `/order/file/transaction/${id}`, ok(emptyPage()))
    .on('GET', `/review/transaction/${id}`, () => ok(reviews()))
    .on('GET', `/guarantee/transaction/${id}`, fail(404, 'Tidak ada garansi'))
}

/** Mock halaman daftar transaksi buyer; mengembalikan query tiap request daftar */
function mockBuyerList(mockApi: MockApi, getTxs: () => Tx[]) {
  const queries: URLSearchParams[] = []
  mockApi.asRole('BUYER').on('GET', '/tx/buyer', (_r, url) => {
    queries.push(url.searchParams)
    return ok(page1(getTxs()))
  })
  return queries
}

/** Isi alasan di modal (validasi minimal 10 karakter) lalu kirim */
async function submitReason(page: Page, dialogName: string, submitName: string, reason: string) {
  const dialog = page.getByRole('dialog', { name: dialogName })
  await expect(dialog).toBeVisible()
  const submit = dialog.getByRole('button', { name: submitName })

  await dialog.getByRole('textbox').fill('rusak')
  await expect(dialog.getByText('Alasan minimal 10 karakter')).toBeVisible()
  await expect(submit).toBeDisabled()

  await dialog.getByRole('textbox').fill(`  ${reason}  `)
  await expect(submit).toBeEnabled()
  await submit.click()
}

test.describe('Daftar transaksi buyer', () => {
  test('menampilkan transaksi & tombol bayar untuk UNPAID', async ({ page, mockApi }) => {
    mockBuyerList(mockApi, () => [
      makeTx('TX-1', 'PAY-1', { status: 'UNPAID' }),
      deliveredTx('TX-2'),
    ])

    await gotoHydrated(page, '/transaction')
    const row = (id: string) => main(page).locator('div.border-b').filter({ hasText: `#${id}` })

    await expect(row('TX-1').getByText('25.000 x 2 = Rp. 50.000')).toBeVisible()
    await expect(row('TX-1').getByRole('link', { name: 'Lakukan Pembayaran' })).toHaveAttribute('href', '/payment/PAY-1')
    await expect(row('TX-2').getByRole('link', { name: 'Lakukan Pembayaran' })).toHaveCount(0)
    await expect(row('TX-2').getByRole('link', { name: '#TX-2' })).toHaveAttribute('href', '/transaction/TX-2')
  })

  test('filter status dari URL & pencarian ID dikirim ke BE', async ({ page, mockApi }) => {
    const queries = mockBuyerList(mockApi, () => [])

    await gotoHydrated(page, '/transaction?status=DELIVERED')
    await expect(main(page).getByText('Tidak ada transaksi dengan status Dikirim')).toBeVisible()
    expect(queries.at(-1)?.get('status')).toBe('DELIVERED')

    await main(page).getByPlaceholder('Cari ID transaksi').fill(' TX-9 ')
    await main(page).getByPlaceholder('Cari ID transaksi').press('Enter')

    await expect(main(page).getByText("Tidak ada transaksi dengan status Dikirim dan ID 'TX-9'")).toBeVisible()
    expect(queries.at(-1)?.get('keyword')).toBe('TX-9')
    expect(queries.at(-1)?.get('status')).toBe('DELIVERED')
    await expect(page).toHaveURL(/status=DELIVERED/)
    await expect(page).toHaveURL(/keyword=TX-9/)
  })

  test('status ditolak BE (400): toast & filter kembali ke "Semua"', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('BUYER').on('GET', '/tx/buyer', (_r, url) => {
      queries.push(url.searchParams)
      return url.searchParams.get('status') ? fail(400, 'Status tidak valid') : ok(page1([]))
    })

    await gotoHydrated(page, '/transaction?status=PAID')

    await expect(page.getByText('Filter status tidak valid').first()).toBeVisible()
    await expect(main(page).getByText('Belum ada transaksi')).toBeVisible()
    expect(queries.at(-1)?.has('status')).toBe(false)
    await expect(page).not.toHaveURL(/status=/)
  })

  test('tombol "Batalkan" & "Tangguhkan" di daftar tidak memunculkan alert placeholder', async ({ page, mockApi }) => {
    // Bug diketahui: tombol memanggil placeholder alert('Add to cart clicked!') (docs/test-findings.md F-16).
    test.fail()
    mockBuyerList(mockApi, () => [makeTx('TX-1', 'PAY-1', { status: 'UNPAID' }), deliveredTx('TX-2')])
    const dialogs: string[] = []
    page.on('dialog', (d) => {
      dialogs.push(d.message())
      void d.dismiss()
    })

    await gotoHydrated(page, '/transaction')
    await main(page).getByRole('button', { name: 'Batalkan', exact: true }).click()
    await main(page).getByRole('button', { name: 'Tangguhkan', exact: true }).click()
    await page.waitForTimeout(500)

    expect(dialogs).toEqual([])
  })
})

test.describe('Detail transaksi buyer', () => {
  test('tombol aksi sesuai status', async ({ page, mockApi }) => {
    let tx = makeTx('TX-1', 'PAY-1', { status: 'PAID', paid_at: hoursAgo(1) })
    mockBuyerDetail(mockApi, () => tx)

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('#TX-1').first()).toBeVisible()
    for (const name of ['Selesaikan Pesanan', 'Tolak Pesanan', 'Tangguhkan', 'Ajukan Pembatalan']) {
      await expect(main(page).getByRole('button', { name, exact: true })).toHaveCount(0)
    }
    await expect(main(page).getByRole('button', { name: 'Kirim Pesan' })).toBeVisible()

    // Status final → form diskusi disembunyikan
    tx = { ...tx, status: 'REJECTED', rejected_at: hoursAgo(0) }
    await main(page).getByRole('button', { name: 'Refresh' }).click()
    await expect(main(page).getByRole('button', { name: 'Kirim Pesan' })).toHaveCount(0)
  })

  test('DELIVERED: selesaikan pesanan lewat dialog konfirmasi → DONE', async ({ page, mockApi }) => {
    let tx = deliveredTx('TX-1')
    mockBuyerDetail(mockApi, () => tx)
    let accepted = 0
    mockApi.on('PATCH', '/tx/order/accept/TX-1', () => {
      accepted++
      tx = { ...tx, status: 'DONE', done_at: new Date().toISOString() }
      return ok(tx)
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Batas Waktu Konfirmasi Pesanan')).toBeVisible()
    // delivered_at 1 jam lalu → sisa ±23 jam
    await expect(main(page).getByText(/^2[23]:\d{2}:\d{2}$/)).toBeVisible()

    await main(page).getByRole('button', { name: 'Selesaikan Pesanan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Selesaikan Pesanan' })
    await dialog.getByRole('button', { name: 'Kembali' }).click()
    await expect(dialog).toHaveCount(0)
    expect(accepted).toBe(0)

    await main(page).getByRole('button', { name: 'Selesaikan Pesanan' }).click()
    await page.getByRole('dialog', { name: 'Selesaikan Pesanan' }).getByRole('button', { name: 'Ya, Selesaikan' }).click()

    await expect(page.getByText('Pesanan berhasil diselesaikan').first()).toBeVisible()
    expect(accepted).toBe(1)
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
    await expect(main(page).getByText('Transaksi Sedang Diproses')).toBeVisible()
    await expect(main(page).getByText('Berikan Penilaian Anda Mengenai Transaksi Ini!')).toBeVisible()
  })

  test('DELIVERED: selesaikan basi (409) → pesan BE & data dimuat ulang', async ({ page, mockApi }) => {
    let tx = deliveredTx('TX-1')
    mockBuyerDetail(mockApi, () => tx)
    mockApi.on('PATCH', '/tx/order/accept/TX-1', () => {
      tx = { ...tx, status: 'DONE', done_at: new Date().toISOString() }
      return fail(409, 'Pesanan sudah diselesaikan otomatis')
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await main(page).getByRole('button', { name: 'Selesaikan Pesanan' }).click()
    await page.getByRole('dialog', { name: 'Selesaikan Pesanan' }).getByRole('button', { name: 'Ya, Selesaikan' }).click()

    await expect(page.getByText('Pesanan sudah diselesaikan otomatis').first()).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Selesaikan Pesanan' })).toHaveCount(0)
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
  })

  test('DELIVERED: tolak hasil kiriman → REJECT', async ({ page, mockApi }) => {
    let tx = deliveredTx('TX-1')
    mockBuyerDetail(mockApi, () => tx)
    let body: unknown = null
    mockApi.on('PATCH', '/tx/order/reject/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'REJECT', rejected_at: new Date().toISOString(), tx_description: 'Akun tidak bisa login' }
      return ok(tx)
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await main(page).getByRole('button', { name: 'Tolak Pesanan' }).click()
    await submitReason(page, 'Tolak Pesanan', 'Tolak Pesanan', 'Akun tidak bisa login')

    await expect(page.getByText('Pesanan berhasil ditolak').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Akun tidak bisa login' })
    await expect(page.getByRole('dialog', { name: 'Tolak Pesanan' })).toHaveCount(0)
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
  })

  test('DELIVERED: ajukan penangguhan (arbitrase) → ARBITRAGE', async ({ page, mockApi }) => {
    let tx = deliveredTx('TX-1')
    mockBuyerDetail(mockApi, () => tx)
    let body: unknown = null
    mockApi.on('PATCH', '/tx/arbitrage/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'ARBITRAGE', tx_description: 'Penjual tidak merespon' }
      return ok(tx)
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await main(page).getByRole('button', { name: 'Tangguhkan', exact: true }).click()
    await submitReason(page, 'Ajukan Penangguhan Pesanan', 'Ajukan Penangguhan Pesanan', 'Penjual tidak merespon')

    await expect(page.getByText('Penangguhan berhasil diajukan').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Penjual tidak merespon' })
    await expect(main(page).getByText('Pembeli Mengajukan Penangguhan!')).toBeVisible()
    await expect(main(page).getByText('Penjual tidak merespon')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Tangguhkan', exact: true })).toHaveCount(0)
  })

  test('IN_PROGRESS: ajukan pembatalan → CANCEL_REQUEST, lalu tarik kembali', async ({ page, mockApi }) => {
    let tx = makeTx('TX-1', 'PAY-1', { status: 'IN_PROGRESS', paid_at: hoursAgo(3), confirmed_at: hoursAgo(2) })
    mockBuyerDetail(mockApi, () => tx)
    let body: unknown = null
    mockApi.on('PATCH', '/tx/cancel/request/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'CANCEL_REQUEST', tx_description: 'Salah beli varian', updated_at: new Date().toISOString() }
      return ok(tx)
    })
    let withdrawn = 0
    mockApi.on('PATCH', '/tx/cancel/withdraw/TX-1', () => {
      withdrawn++
      tx = { ...tx, status: 'IN_PROGRESS' }
      return ok(tx)
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await main(page).getByRole('button', { name: 'Ajukan Pembatalan' }).click()
    await submitReason(page, 'Ajukan Pembatalan Pesanan', 'Ajukan Pembatalan Pesanan', 'Salah beli varian')

    await expect(page.getByText('Pembatalan berhasil diajukan').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Salah beli varian' })
    await expect(main(page).getByText('Salah beli varian')).toBeVisible()
    await expect(main(page).getByText('Batas Waktu Pembatalan Otomatis')).toBeVisible()

    await main(page).getByRole('button', { name: 'Batalkan Permintaan Pembatalan' }).click()

    await expect(page.getByText('transaksi akan dilanjutkan seperti semula').first()).toBeVisible()
    expect(withdrawn).toBe(1)
    await expect(main(page).getByRole('button', { name: 'Ajukan Pembatalan' })).toBeVisible()
  })

  test('DONE: kirim penilaian baru', async ({ page, mockApi }) => {
    const tx = makeTx('TX-1', 'PAY-1', { status: 'DONE', done_at: hoursAgo(1) })
    let reviews: unknown[] = []
    mockBuyerDetail(mockApi, () => tx, () => reviews)
    let body: unknown = null
    mockApi.on('POST', '/review/create', (route) => {
      body = route.request().postDataJSON()
      reviews = [makeReview({ rating: 5, comment: 'Akun aman, mantap' })]
      return ok(reviews[0])
    })

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Pilih Rating Kamu:')).toBeVisible()
    await main(page).getByText('Penilaian Kamu:').locator('..').getByRole('textbox').fill('Akun aman, mantap')
    await main(page).getByRole('button', { name: 'Kirim Penilaian' }).click()

    await expect(page.getByText('Penilaian terkirim').first()).toBeVisible()
    expect(body).toEqual({ transaction_id: 'TX-1', rating: 5, comment: 'Akun aman, mantap' })
    await expect(main(page).getByText('Penilaian Pembeli')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Edit Penilaian' })).toBeVisible()
  })

  test('edit penilaian: form terisi penilaian sebelumnya', async ({ page, mockApi }) => {
    // Bug diketahui: form edit memakai default (rating 5, komentar kosong) (docs/test-findings.md F-17).
    test.fail()
    const tx = makeTx('TX-1', 'PAY-1', { status: 'COMPLETE', done_at: hoursAgo(30) })
    mockBuyerDetail(mockApi, () => tx, () => [makeReview({ rating: 3, comment: 'Lumayan' })])

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByRole('button', { name: 'Edit Penilaian' })).toBeVisible()
    await expect(main(page).getByText('Penilaian Kamu:').locator('..').getByRole('textbox')).toHaveValue('Lumayan', { timeout: 3000 })
  })

  test('UNPAID tanpa expired_at: countdown created_at + 24 jam & tombol bayar tampil', async ({ page, mockApi }) => {
    // Bug diketahui: langsung "Waktu Pembayaran Habis!" & tombol bayar hilang (docs/test-findings.md F-11).
    test.fail()
    mockBuyerDetail(mockApi, () => makeTx('TX-1', 'PAY-1', { status: 'UNPAID', created_at: hoursAgo(1), expired_at: null }))

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Batas Waktu Pembayaran')).toBeVisible({ timeout: 5000 })
    await expect(main(page).getByRole('link', { name: 'Lakukan Pembayaran' }).last()).toBeVisible({ timeout: 3000 })
  })

  test('UNPAID dengan expired_at: countdown & tombol bayar ke halaman payment', async ({ page, mockApi }) => {
    mockBuyerDetail(mockApi, () => makeTx('TX-1', 'PAY-1', {
      status: 'UNPAID', created_at: hoursAgo(1), expired_at: new Date(Date.now() + 2 * 3600_000).toISOString(),
    }))

    await gotoHydrated(page, '/transaction/TX-1')
    await expect(main(page).getByText('Batas Waktu Pembayaran')).toBeVisible()
    await expect(main(page).getByText(/^0[12]:\d{2}:\d{2}$/)).toBeVisible()
    await expect(main(page).getByRole('link', { name: 'Lakukan Pembayaran' })).toHaveAttribute('href', '/payment/PAY-1')
  })
})
