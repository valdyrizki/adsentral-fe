import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makePayment, makeTx, REKENING_SETTINGS, type MockPayment } from './support/payment'
import type { Page } from '@playwright/test'

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })

/** Mock halaman detail pembayaran buyer */
function mockBuyerPayment(mockApi: MockApi, payment: MockPayment, txs: unknown[] = []) {
  mockApi
    .asRole('BUYER')
    .on('GET', '/system/settings/public', ok([{ ...REKENING_SETTINGS[0], key: 'WA_NUMBER', value: '0812-3456-789' }]))
    .on('GET', `/payment/${payment.id}`, ok(payment))
    .on('GET', `/tx/payment/${payment.id}`, ok(page1(txs)))
    .on('GET', '/system/settings/public/group', ok(REKENING_SETTINGS))
}

async function confirmDialog(page: Page, title: string, button: string) {
  await expect(page.getByText(title)).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: button }).click()
}

test.describe('Detail pembayaran (buyer)', () => {
  test('transfer manual: rincian, rekening, countdown & link WhatsApp', async ({ page, mockApi }) => {
    const payment = makePayment('PAY-1')
    mockBuyerPayment(mockApi, payment, [makeTx('TX-1', 'PAY-1')])

    await gotoHydrated(page, '/payment/PAY-1')
    const main = page.getByRole('main')

    await expect(main.getByText('Menunggu Pembayaran').first()).toBeVisible()
    await expect(main.getByText('Rp 51.123')).toBeVisible() // total tagihan
    await expect(main.getByText('+123')).toBeVisible() // kode unik

    // Rekening dari system setting grup REKENING
    await expect(main.getByText('Informasi Rekening Pembayaran')).toBeVisible()
    await expect(main.getByText('BCA a.n. Adsentral')).toBeVisible()
    await expect(main.getByText('1234567890')).toBeVisible()

    // Countdown batas bayar (±2 jam lagi)
    await expect(main.getByText(/sisa 0[12]:\d{2}:\d{2}/)).toBeVisible()

    // Link WhatsApp memakai nomor dari WA_NUMBER (non-digit dibuang) & menyebut ID pembayaran
    const wa = main.getByRole('link', { name: 'Kirim Bukti Transfer via WhatsApp' })
    const href = await wa.getAttribute('href')
    expect(href).toContain('https://wa.me/08123456789')
    expect(decodeURIComponent(href!)).toContain('#PAY-1')

    // Transaksi terkait
    await expect(main.getByText('Produk Pesanan')).toBeVisible()
    await expect(main.getByRole('link', { name: /Produk Pesanan/ })).toHaveAttribute('href', '/transaction/TX-1')
  })

  test('batas bayar lewat menampilkan "Segera expired"', async ({ page, mockApi }) => {
    const payment = makePayment('PAY-2', { expired_at: new Date(Date.now() - 60_000).toISOString() })
    mockBuyerPayment(mockApi, payment)

    await gotoHydrated(page, '/payment/PAY-2')
    await expect(page.getByRole('main').getByText('(Segera expired)')).toBeVisible()
  })

  test('expired_at null memakai created_at + 24 jam', async ({ page, mockApi }) => {
    const created = new Date(Date.now() - 23 * 60 * 60 * 1000) // 23 jam lalu → sisa ±1 jam
    const payment = makePayment('PAY-3', { expired_at: null, created_at: created.toISOString() })
    mockBuyerPayment(mockApi, payment)

    await gotoHydrated(page, '/payment/PAY-3')
    await expect(page.getByRole('main').getByText(/sisa 00:59:\d{2}|sisa 01:00:00/)).toBeVisible()
  })

  test('payment gateway: kode bayar, QR & tombol bayar', async ({ page, mockApi }) => {
    const payment = makePayment('PAY-4', {
      method: 'TRIPAY',
      unique_code: null,
      pay_code: '8800123456',
      qr_url: 'https://example.test/qr.png',
      pay_url: 'https://example.test/pay',
    })
    mockBuyerPayment(mockApi, payment)
    await page.route('https://example.test/**', (r) => r.fulfill({ status: 200, body: '' }))

    await gotoHydrated(page, '/payment/PAY-4')
    const main = page.getByRole('main')

    await expect(main.getByText('Instruksi Pembayaran')).toBeVisible()
    await expect(main.getByText('8800123456')).toBeVisible()
    await expect(main.getByAltText('QR Code')).toHaveAttribute('src', 'https://example.test/qr.png')
    await expect(main.getByRole('link', { name: 'Bayar Sekarang' })).toHaveAttribute('href', 'https://example.test/pay')
    // Info rekening manual tidak tampil untuk gateway
    await expect(main.getByText('Informasi Rekening Pembayaran')).toHaveCount(0)
  })

  test('payment yang sudah dibayar tidak menampilkan instruksi & batas bayar', async ({ page, mockApi }) => {
    const payment = makePayment('PAY-5', { status: 'PAID', paid_at: new Date().toISOString(), pay_code: '8800' })
    mockBuyerPayment(mockApi, payment)

    await gotoHydrated(page, '/payment/PAY-5')
    const main = page.getByRole('main')

    await expect(main.getByText('Berhasil').first()).toBeVisible()
    await expect(main.getByText('Tanggal Dibayar')).toBeVisible()
    await expect(main.getByText('Bayar sebelum')).toHaveCount(0)
    await expect(main.getByText('Instruksi Pembayaran')).toHaveCount(0)
    await expect(main.getByText('Informasi Rekening Pembayaran')).toHaveCount(0)
  })

  test('buyer membatalkan deposit yang belum dibayar', async ({ page, mockApi }) => {
    let payment = makePayment('DEP-1', { payment_type: 'DEPOSIT' })
    mockBuyerPayment(mockApi, payment)
    mockApi.on('GET', '/payment/DEP-1', () => ok(payment))

    let cancelCalled = false
    mockApi.on('POST', '/balance/deposit/cancel/DEP-1', () => {
      cancelCalled = true
      payment = { ...payment, status: 'CANCELLED' }
      return ok(null)
    })

    await gotoHydrated(page, '/payment/DEP-1')
    // Deposit transfer manual: saldo masuk = nominal + kode unik
    await expect(page.getByRole('main').getByText('Rp 50.123')).toBeVisible()

    await page.getByRole('main').getByRole('button', { name: 'Batalkan Pembayaran' }).click()
    await confirmDialog(page, 'Batalkan Pembayaran?', 'Ya, Batalkan')

    await expect(page.getByText('Pembayaran berhasil dibatalkan').first()).toBeVisible()
    expect(cancelCalled).toBe(true)
    await expect(page.getByRole('main').getByText('Pembayaran ini telah dibatalkan.')).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: 'Batalkan Pembayaran' })).toHaveCount(0)
  })

  test('batal deposit ditolak 409: pesan BE tampil & data dimuat ulang', async ({ page, mockApi }) => {
    let payment = makePayment('DEP-2', { payment_type: 'DEPOSIT' })
    mockBuyerPayment(mockApi, payment)
    mockApi.on('GET', '/payment/DEP-2', () => ok(payment))
    mockApi.on('POST', '/balance/deposit/cancel/DEP-2', () => {
      // Admin sudah mengonfirmasi lebih dulu
      payment = { ...payment, status: 'COMPLETE' }
      return fail(409, 'Deposit sudah dikonfirmasi admin')
    })

    await gotoHydrated(page, '/payment/DEP-2')
    await page.getByRole('main').getByRole('button', { name: 'Batalkan Pembayaran' }).click()
    await confirmDialog(page, 'Batalkan Pembayaran?', 'Ya, Batalkan')

    await expect(page.getByText('Gagal membatalkan').first()).toBeVisible()
    await expect(page.getByText('Deposit sudah dikonfirmasi admin').first()).toBeVisible()
    await expect(page.getByRole('main').getByText('Pembayaran berhasil dikonfirmasi')).toBeVisible()
  })

  test('payment tidak ditemukan menampilkan pesan gagal', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER').on('GET', '/payment/NOPE', fail(404, 'Payment tidak ditemukan'))

    await gotoHydrated(page, '/payment/NOPE')
    await expect(page.getByRole('main').getByText('Gagal memuat data')).toBeVisible()
  })
})

test.describe('Konfirmasi pembayaran (admin)', () => {
  function mockAdminList(mockApi: MockApi, getPayments: () => MockPayment[]) {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/payment/all', (_r, url) => {
      queries.push(url.searchParams)
      return ok(page1(getPayments()))
    })
    return queries
  }

  test('tombol konfirmasi hanya untuk UNPAID transfer manual / deposit', async ({ page, mockApi }) => {
    mockAdminList(mockApi, () => [
      makePayment('P-MANUAL'),
      makePayment('P-DEPOSIT', { method: 'TRIPAY', payment_type: 'DEPOSIT' }),
      makePayment('P-GATEWAY', { method: 'TRIPAY' }),
      makePayment('P-PAID', { status: 'PAID' }),
    ])

    await gotoHydrated(page, '/admin/payment')

    const row = (id: string) => page.locator('div.divide-y > div.py-4').filter({ hasText: `#${id}` })
    await expect(row('P-MANUAL').getByRole('button', { name: 'Konfirmasi', exact: true })).toBeVisible()
    await expect(row('P-DEPOSIT').getByRole('button', { name: 'Konfirmasi', exact: true })).toBeVisible()
    await expect(row('P-GATEWAY').getByRole('button', { name: 'Konfirmasi', exact: true })).toHaveCount(0)
    await expect(row('P-PAID').getByRole('button', { name: 'Konfirmasi', exact: true })).toHaveCount(0)
  })

  test('konfirmasi dari daftar: panggil API, refresh badge & daftar', async ({ page, mockApi }) => {
    let payments = [makePayment('P-1')]
    const queries = mockAdminList(mockApi, () => payments)

    let alertsCalls = 0
    mockApi.on('GET', '/admin/alerts', () => {
      alertsCalls++
      return ok({ pending_payment_confirmation: payments.filter((p) => p.status === 'UNPAID').length })
    })
    mockApi.on('POST', '/payment/confirm/P-1', () => {
      payments = [{ ...payments[0]!, status: 'PAID' }]
      return ok(null)
    })

    await gotoHydrated(page, '/admin/payment')
    await expect(page.getByText('#P-1')).toBeVisible()
    const alertsBefore = alertsCalls
    const listCallsBefore = queries.length

    await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await confirmDialog(page, 'Konfirmasi Pembayaran?', 'Ya, Konfirmasi')

    await expect(page.getByText('Pembayaran dikonfirmasi').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Konfirmasi', exact: true })).toHaveCount(0)
    expect(alertsCalls).toBeGreaterThan(alertsBefore)
    expect(queries.length).toBeGreaterThan(listCallsBefore)
  })

  test('konfirmasi basi (409): pesan BE tampil & daftar dimuat ulang', async ({ page, mockApi }) => {
    let payments = [makePayment('P-2')]
    mockAdminList(mockApi, () => payments)
    mockApi.on('POST', '/payment/confirm/P-2', () => {
      payments = [{ ...payments[0]!, status: 'EXPIRED' }]
      return fail(409, 'Transaksi sudah expired')
    })

    await gotoHydrated(page, '/admin/payment')
    await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await confirmDialog(page, 'Konfirmasi Pembayaran?', 'Ya, Konfirmasi')

    await expect(page.getByText('Gagal konfirmasi').first()).toBeVisible()
    await expect(page.getByText('Transaksi sudah expired').first()).toBeVisible()
    await expect(page.getByText('Transaksi Expired').first()).toBeVisible()
  })

  test('tolak pembayaran transaksi dari halaman detail', async ({ page, mockApi }) => {
    let payment = makePayment('P-3')
    mockApi
      .asRole('ADMIN')
      .on('GET', '/payment/P-3', () => ok(payment))
      .on('GET', '/tx/payment/P-3', ok(page1([makeTx('TX-9', 'P-3')])))

    const calls: string[] = []
    const reject = () => {
      payment = { ...payment, status: 'REJECTED' }
      return ok(null)
    }
    mockApi.on('POST', '/payment/cancel/P-3', () => (calls.push('cancel'), reject()))
    mockApi.on('POST', '/payment/reject/P-3', () => (calls.push('reject'), reject()))

    await gotoHydrated(page, '/admin/payment/P-3')
    await expect(page.getByText('Produk Pesanan')).toBeVisible()

    await page.getByRole('button', { name: 'Tolak Pembayaran' }).click()
    await confirmDialog(page, 'Tolak Pembayaran?', 'Ya, Tolak')

    await expect(page.getByText('Pembayaran ditolak').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Konfirmasi Pembayaran' })).toHaveCount(0)
    // Catatan: saat ini FE memanggil /payment/cancel, bukan /payment/reject (lihat docs/test-findings.md F-06)
    expect(calls).toEqual(['cancel'])
  })

  test('batal di dialog konfirmasi tidak memanggil API', async ({ page, mockApi }) => {
    mockAdminList(mockApi, () => [makePayment('P-4')])
    let called = false
    mockApi.on('POST', '/payment/confirm/P-4', () => ((called = true), ok(null)))

    await gotoHydrated(page, '/admin/payment')
    await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await confirmDialog(page, 'Konfirmasi Pembayaran?', 'Tidak')

    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(called).toBe(false)
  })

  test('filter "Semua Status" tidak mengirim parameter status', async ({ page, mockApi }) => {
    // Bug diketahui: saat ini `status=ALL` ikut terkirim (docs/test-findings.md F-07).
    // Hapus baris di bawah setelah diperbaiki.
    test.fail()
    const queries = mockAdminList(mockApi, () => [])

    await gotoHydrated(page, '/admin/payment')
    await expect(page.getByText('Tidak ada data pembayaran.')).toBeVisible()

    expect(queries.at(-1)!.get('status')).toBeNull()
  })
})
