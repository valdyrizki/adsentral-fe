import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makeTx } from './support/payment'
import type { Page } from '@playwright/test'

type Tx = ReturnType<typeof makeTx>

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

/** Pesanan yang sudah dibayar 1 jam lalu, menunggu respon seller */
const paidTx = (id: string, overrides: Record<string, unknown> = {}) =>
  makeTx(id, `PAY-${id}`, { status: 'PAID', paid_at: hoursAgo(1), ...overrides })

/** Mock halaman detail pesanan seller; `getTx` dipanggil tiap fetch supaya status bisa berubah */
function mockSellerDetail(mockApi: MockApi, getTx: () => Tx) {
  const id = getTx().id
  mockApi
    .asRole('SELLER')
    .on('GET', `/tx/get/${id}`, () => ok(getTx()))
    .on('GET', `/order/discussion/transaction/${id}`, ok(emptyPage()))
    .on('GET', `/order/file/transaction/${id}`, ok(emptyPage()))
    .on('GET', `/review/transaction/${id}`, ok([]))
    .on('GET', `/guarantee/transaction/${id}`, fail(404, 'Tidak ada garansi'))
}

/** Mock halaman daftar pesanan seller; mengembalikan query tiap request daftar */
function mockSellerList(mockApi: MockApi, getTxs: () => Tx[]) {
  const queries: URLSearchParams[] = []
  mockApi
    .asRole('SELLER')
    .on('GET', '/tx/seller', (_r, url) => {
      queries.push(url.searchParams)
      return ok(page1(getTxs()))
    })
  return queries
}

const main = (page: Page) => page.getByRole('main')

async function rejectWithReason(page: Page, reason: string) {
  const dialog = page.getByRole('dialog', { name: 'Tolak Pesanan' })
  await expect(dialog).toBeVisible()
  const submit = dialog.getByRole('button', { name: 'Tolak Pesanan' })

  // Alasan < 10 karakter → tombol nonaktif
  await dialog.getByRole('textbox').fill('stok')
  await expect(dialog.getByText('Alasan minimal 10 karakter')).toBeVisible()
  await expect(submit).toBeDisabled()

  await dialog.getByRole('textbox').fill(reason)
  await expect(submit).toBeEnabled()
  await submit.click()
}

test.describe('Daftar pesanan seller', () => {
  test('pesanan PAID: tombol terima/tolak & countdown konfirmasi', async ({ page, mockApi }) => {
    mockSellerList(mockApi, () => [paidTx('TX-1'), makeTx('TX-2', 'PAY-2', { status: 'IN_PROGRESS' })])

    await gotoHydrated(page, '/seller/order')
    const row = (id: string) => main(page).locator('div.border-b').filter({ hasText: `#${id}` })

    await expect(row('TX-1').getByRole('button', { name: 'Terima Pesanan' })).toBeVisible()
    await expect(row('TX-1').getByRole('button', { name: 'Tolak Pesanan' })).toBeVisible()
    // paid_at 1 jam lalu → sisa ±23 jam
    await expect(row('TX-1').getByText(/Konfirmasi sebelum 2[23]:\d{2}:\d{2}/)).toBeVisible()

    await expect(row('TX-2').getByRole('button', { name: 'Terima Pesanan' })).toHaveCount(0)
  })

  test('terima pesanan dari daftar memanggil API & memuat ulang daftar', async ({ page, mockApi }) => {
    let txs = [paidTx('TX-1')]
    const queries = mockSellerList(mockApi, () => txs)
    let confirmCalls = 0
    mockApi.on('PATCH', '/tx/confirm/TX-1', () => {
      confirmCalls++
      txs = [{ ...txs[0]!, status: 'IN_PROGRESS' }]
      return ok(txs[0])
    })

    await gotoHydrated(page, '/seller/order')
    const before = queries.length
    await main(page).getByRole('button', { name: 'Terima Pesanan' }).click()

    await expect(page.getByText('Pesanan berhasil diterima').first()).toBeVisible()
    expect(confirmCalls).toBe(1)
    await expect(main(page).getByRole('button', { name: 'Terima Pesanan' })).toHaveCount(0)
    expect(queries.length).toBeGreaterThan(before)
  })

  test('tolak pesanan dari daftar: validasi alasan & body request', async ({ page, mockApi }) => {
    let txs = [paidTx('TX-1')]
    mockSellerList(mockApi, () => txs)
    let body: any = null
    mockApi.on('PATCH', '/tx/reject/TX-1', (route) => {
      body = route.request().postDataJSON()
      txs = [{ ...txs[0]!, status: 'REJECTED' }]
      return ok(txs[0])
    })

    await gotoHydrated(page, '/seller/order')
    await main(page).getByRole('button', { name: 'Tolak Pesanan' }).click()
    await rejectWithReason(page, '  Stok sedang kosong  ')

    await expect(page.getByText('Pesanan berhasil ditolak').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Stok sedang kosong' }) // di-trim
    await expect(page.getByRole('dialog', { name: 'Tolak Pesanan' })).toHaveCount(0)
  })

  test('tolak basi (409): pesan BE tampil, modal tertutup & daftar dimuat ulang', async ({ page, mockApi }) => {
    let txs = [paidTx('TX-1')]
    mockSellerList(mockApi, () => txs)
    mockApi.on('PATCH', '/tx/reject/TX-1', () => {
      txs = [{ ...txs[0]!, status: 'CANCELLED' }] // dibatalkan otomatis lebih dulu
      return fail(409, 'Pesanan sudah dibatalkan otomatis')
    })

    await gotoHydrated(page, '/seller/order')
    await main(page).getByRole('button', { name: 'Tolak Pesanan' }).click()
    await rejectWithReason(page, 'Stok sedang kosong')

    await expect(page.getByText('Pesanan sudah dibatalkan otomatis').first()).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Tolak Pesanan' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Terima Pesanan' })).toHaveCount(0)
  })

  test('filter status dari query string dikirim ke BE, "Semua" tanpa parameter', async ({ page, mockApi }) => {
    const queries = mockSellerList(mockApi, () => [])

    await gotoHydrated(page, '/seller/order?status=PAID')
    await expect.poll(() => queries.at(-1)?.get('status')).toBe('PAID')

    await gotoHydrated(page, '/seller/order')
    await expect.poll(() => queries.length).toBeGreaterThan(1)
    expect(queries.at(-1)!.get('status')).toBeNull()
  })
})

test.describe('Detail pesanan seller', () => {
  test('terima pesanan PAID → status berubah ke diproses', async ({ page, mockApi }) => {
    let tx = paidTx('TX-1', { product: { ...makeTx('x', 'y').product, delivery_days: 2 } })
    mockSellerDetail(mockApi, () => tx)
    mockApi.on('PATCH', '/tx/confirm/TX-1', () => {
      tx = { ...tx, status: 'IN_PROGRESS', confirmed_at: new Date().toISOString() }
      return ok(tx)
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await expect(main(page).getByText('Respon Pesanan!')).toBeVisible()
    await expect(main(page).getByText('Sisa waktu konfirmasi')).toBeVisible()

    await main(page).getByRole('button', { name: 'Terima Pesanan' }).click()

    await expect(page.getByText('Pesanan berhasil diterima').first()).toBeVisible()
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
    // IN_PROGRESS: countdown estimasi pengiriman (confirmed_at + delivery_days)
    await expect(main(page).getByText('Batas Waktu Pengiriman')).toBeVisible()
    await expect(main(page).getByText(/estimasi 2 hari/)).toBeVisible()
  })

  test('terima basi (409): pesan BE tampil & data dimuat ulang', async ({ page, mockApi }) => {
    let tx = paidTx('TX-1')
    mockSellerDetail(mockApi, () => tx)
    mockApi.on('PATCH', '/tx/confirm/TX-1', () => {
      tx = { ...tx, status: 'CANCELLED' }
      return fail(409, 'Pesanan sudah dibatalkan otomatis')
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await main(page).getByRole('button', { name: 'Terima Pesanan' }).click()

    await expect(page.getByText('Pesanan sudah dibatalkan otomatis').first()).toBeVisible()
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
  })

  test('tolak pesanan dari detail', async ({ page, mockApi }) => {
    let tx = paidTx('TX-1')
    mockSellerDetail(mockApi, () => tx)
    let body: any = null
    mockApi.on('PATCH', '/tx/reject/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'REJECTED', rejected_at: new Date().toISOString() }
      return ok(tx)
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await main(page).getByRole('button', { name: 'Tolak Pesanan' }).click()
    await rejectWithReason(page, 'Produk sudah tidak tersedia')

    await expect(page.getByText('Pesanan berhasil ditolak').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Produk sudah tidak tersedia' })
    await expect(main(page).getByText('Respon Pesanan!')).toHaveCount(0)
  })

  test('kirim orderan (IN_PROGRESS) → konfirmasi → DELIVERED', async ({ page, mockApi }) => {
    let tx = makeTx('TX-1', 'PAY-1', { status: 'IN_PROGRESS', paid_at: hoursAgo(3), confirmed_at: hoursAgo(2) })
    mockSellerDetail(mockApi, () => tx)

    let form: Record<string, string> | null = null
    mockApi.on('POST', '/order/discussion/create', (route) => {
      // Ambil field multipart dari body mentah
      const raw = route.request().postData() ?? ''
      form = Object.fromEntries(
        [...raw.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)].map((m) => [m[1]!, m[2]!]),
      )
      tx = { ...tx, status: 'DELIVERED', delivered_at: new Date().toISOString() }
      return ok({ id: 'D-1' })
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await main(page).getByPlaceholder('Tulis pesan disini...').fill('Akun: user1 / pass1')
    await main(page).getByRole('button', { name: 'Kirim Orderan' }).click()

    const dialog = page.getByRole('dialog', { name: 'Konfirmasi Kirim Orderan' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Ya, Kirim Orderan' }).click()

    await expect(page.getByText('Pesanan terkirim ke pembeli').first()).toBeVisible()
    expect(form).toEqual({ transactionId: 'TX-1', message: 'Akun: user1 / pass1', discussionType: 'ORDER_DELIVERY' })
    await expect(main(page).getByText('Menunggu Konfirmasi Pembeli')).toBeVisible()
  })

  test('kirim pesan biasa tidak mengubah status', async ({ page, mockApi }) => {
    const tx = makeTx('TX-1', 'PAY-1', { status: 'IN_PROGRESS', confirmed_at: hoursAgo(1) })
    mockSellerDetail(mockApi, () => tx)
    let txFetches = 0
    mockApi.on('GET', '/tx/get/TX-1', () => (txFetches++, ok(tx)))
    let raw = ''
    mockApi.on('POST', '/order/discussion/create', (route) => {
      raw = route.request().postData() ?? ''
      return ok({ id: 'D-2' })
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await expect(main(page).getByText('Batas Waktu Pengiriman')).toBeVisible()
    const fetchesBefore = txFetches

    await main(page).getByPlaceholder('Tulis pesan disini...').fill('Halo, sedang diproses ya')
    await main(page).getByRole('button', { name: 'Kirim Pesan' }).click()

    await expect(page.getByText('Pesan terkirim').first()).toBeVisible()
    expect(raw).toContain('MESSAGE')
    await expect(main(page).getByPlaceholder('Tulis pesan disini...')).toHaveValue('')
    expect(txFetches).toBe(fetchesBefore) // transaksi tidak perlu dimuat ulang
  })

  test('kirim pesan kosong ditolak lewat toast, bukan alert browser', async ({ page, mockApi }) => {
    // Bug diketahui: saat ini memakai window.alert() (docs/test-findings.md F-10). Hapus setelah diperbaiki.
    test.fail()
    mockSellerDetail(mockApi, () => makeTx('TX-1', 'PAY-1', { status: 'IN_PROGRESS', confirmed_at: hoursAgo(1) }))
    let nativeDialog = false
    page.on('dialog', (d) => {
      nativeDialog = true
      void d.dismiss()
    })

    await gotoHydrated(page, '/seller/order/TX-1')
    await main(page).getByRole('button', { name: 'Kirim Pesan' }).click()

    await expect(page.getByText('Pesan tidak boleh kosong').first()).toBeVisible({ timeout: 3000 })
    expect(nativeDialog).toBe(false)
  })

  for (const action of ['accept', 'reject'] as const) {
    test(`pengajuan batal: seller ${action === 'accept' ? 'menerima' : 'menolak'}`, async ({ page, mockApi }) => {
      let tx = makeTx('TX-1', 'PAY-1', {
        status: 'CANCEL_REQUEST',
        tx_description: 'Salah beli varian',
        updated_at: hoursAgo(2),
      })
      mockSellerDetail(mockApi, () => tx)
      const called: string[] = []
      mockApi.on('PATCH', `/tx/cancel/${action}/TX-1`, () => {
        called.push(action)
        tx = { ...tx, status: action === 'accept' ? 'CANCELLED' : 'IN_PROGRESS' }
        return ok(tx)
      })

      await gotoHydrated(page, '/seller/order/TX-1')
      await expect(main(page).getByText('Pembeli Mengajukan Pembatalan!')).toBeVisible()
      await expect(main(page).getByText('Salah beli varian')).toBeVisible()
      await expect(main(page).getByText('Batas Waktu Pembatalan Otomatis')).toBeVisible()

      const button = action === 'accept' ? 'Terima Permintaan Pembatalan' : 'Batalkan Permintaan Pembatalan'
      await main(page).getByRole('button', { name: button }).click()

      await expect(page.getByText(action === 'accept' ? 'transaksi akan dibatalkan' : 'transaksi akan dilanjutkan').first()).toBeVisible()
      expect(called).toEqual([action])
      await expect(main(page).getByText('Pembeli Mengajukan Pembatalan!')).toHaveCount(0)
    })
  }

  test('tombol "Batalkan" pada pesanan PAID tidak menampilkan pesan keranjang', async ({ page, mockApi }) => {
    // Bug diketahui: tombol memanggil placeholder addToCart (docs/test-findings.md F-09). Hapus setelah diperbaiki.
    test.fail()
    mockSellerDetail(mockApi, () => paidTx('TX-1'))

    await gotoHydrated(page, '/seller/order/TX-1')
    await main(page).getByRole('button', { name: 'Batalkan', exact: true }).click()

    // toHaveCount(0) langsung lolos sebelum toast sempat muncul → tunggu dulu, baru hitung
    await page.waitForTimeout(2000)
    expect(await page.getByText('Produk berhasil ditambahkan ke keranjang').count()).toBe(0)
  })

  test('UNPAID tanpa expired_at: countdown memakai created_at + 24 jam', async ({ page, mockApi }) => {
    // Bug diketahui: langsung "Waktu Pembayaran Habis!" (docs/test-findings.md F-11). Hapus setelah diperbaiki.
    test.fail()
    mockSellerDetail(mockApi, () => makeTx('TX-1', 'PAY-1', { status: 'UNPAID', created_at: hoursAgo(1), expired_at: null }))

    await gotoHydrated(page, '/seller/order/TX-1')
    await expect(main(page).getByText('Batas Waktu Pembayaran')).toBeVisible({ timeout: 5000 })
    await expect(main(page).getByText(/2[23]:\d{2}:\d{2}/)).toBeVisible({ timeout: 3000 })
  })
})
