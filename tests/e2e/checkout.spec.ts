import { test, expect, ok, fail, gotoHydrated, type MockApi } from './support/fixtures'
import { makeProduct, makeBalance, seedCart, PAYMENT_METHODS, type MockProduct } from './support/cart'
import type { Page } from '@playwright/test'

/** Mock standar halaman keranjang: produk di BE sama dengan isi keranjang */
function mockCartPage(mockApi: MockApi, products: MockProduct[], deposit = 1_000_000) {
  mockApi
    .asRole('BUYER')
    .on('GET', '/balance', ok(makeBalance(deposit)))
    .on('GET', '/payment/methods', ok(PAYMENT_METHODS))
    .on('GET', '/voucher/public', ok([]))
    .on('POST', '/products/ids', ok(products))
}

const checkoutButton = (page: Page) => page.getByRole('main').getByRole('button', { name: /Checkout|Saldo Tidak Cukup|Ada Produk Tidak Tersedia|Pilih Metode/ })

async function confirmCheckout(page: Page) {
  await expect(checkoutButton(page)).toHaveText(/Checkout/)
  await checkoutButton(page).click()
  await expect(page.getByText('Konfirmasi Pembelian?')).toBeVisible()
  await page.getByRole('button', { name: 'Ya, Lanjutkan' }).click()
}

test.describe('Checkout keranjang', () => {
  test('checkout pakai saldo mengirim request benar lalu ke daftar transaksi', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 15000 })
    await seedCart(context, [{ product, quantity: 2, note: 'tolong cepat' }])
    mockCartPage(mockApi, [product])

    let txBody: any = null
    mockApi.on('POST', '/tx/create', (route) => {
      txBody = route.request().postDataJSON()
      return ok({ paymentId: 'PAY-1', referenceId: 'REF-1', checkoutUrl: '', qrUrl: '' })
    })

    await gotoHydrated(page, '/cart')
    await expect(page.getByText('Produk Tes 1')).toBeVisible()
    await expect(page.getByText('Rp 30.000').first()).toBeVisible()

    await confirmCheckout(page)

    await expect(page).toHaveURL(/\/transaction$/)
    expect(txBody).toEqual({
      payment_method: 'SALDO',
      channel_code: null,
      voucher_code: null,
      transaction_details: [{ product_id: 1, qty: 2, order_request: 'tolong cepat' }],
    })

    // Keranjang dikosongkan setelah checkout sukses
    const cartCookie = (await context.cookies()).find((c) => c.name === 'cart')
    expect(JSON.parse(decodeURIComponent(cartCookie!.value)).items).toEqual([])
  })

  test('akun admin tidak bisa checkout & tidak melihat ikon keranjang (EP04-09)', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 15000 })
    await seedCart(context, [{ product, quantity: 1, note: '' }])
    mockApi
      .asRole('ADMIN')
      .on('GET', '/payment/methods', ok(PAYMENT_METHODS))
      .on('GET', '/voucher/public', ok([]))
      .on('POST', '/products/ids', ok([product]))

    await gotoHydrated(page, '/cart')
    await expect(page.getByText('Produk Tes 1')).toBeVisible()
    await expect(page.getByText('Akun admin tidak bisa checkout. Gunakan akun pembeli untuk berbelanja.')).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: 'Akun Admin Tidak Bisa Checkout' })).toBeDisabled()
    await expect(page.locator('header a[href="/cart"]')).toHaveCount(0)
  })

  test('saldo tidak cukup menonaktifkan tombol checkout', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 50000 })
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product], 10_000)

    await gotoHydrated(page, '/cart')
    await expect(checkoutButton(page)).toHaveText(/Saldo Tidak Cukup/)
    await expect(checkoutButton(page)).toBeDisabled()
  })

  test('transfer bank manual diarahkan ke halaman pembayaran', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    await seedCart(context, [{ product, quantity: 1 }], 'MANUAL_BANK')
    mockCartPage(mockApi, [product], 0)
    mockApi.on('POST', '/tx/create', ok({ paymentId: 'PAY-77', referenceId: 'REF-77', checkoutUrl: '', qrUrl: '' }))

    await gotoHydrated(page, '/cart')
    await expect(page.getByText('Setelah checkout, Anda akan diarahkan ke halaman pembayaran')).toBeVisible()
    await confirmCheckout(page)

    await expect(page).toHaveURL(/\/payment\/PAY-77$/)
  })

  test('payment gateway mengirim channel & menghitung biaya', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 100000 })
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product])

    let txBody: any = null
    mockApi.on('POST', '/tx/create', (route) => {
      txBody = route.request().postDataJSON()
      return ok({ paymentId: 'PAY-2', referenceId: 'REF-2', checkoutUrl: '', qrUrl: '' })
    })

    await gotoHydrated(page, '/cart')
    await page.getByText('Payment Gateway').click()

    // Fee = 750 + 0.7% × (100.000 + biaya aplikasi default 1.000) = 750 + 707 = 1.457
    const summary = page.locator('section[aria-labelledby="summary-heading"]')
    await expect(summary.getByText('Rp 1.457')).toBeVisible()
    await expect(summary.getByText('Rp 102.457')).toBeVisible()

    await confirmCheckout(page)
    await expect(page).toHaveURL(/\/transaction$/)
    expect(txBody).toMatchObject({ payment_method: 'TRIPAY', channel_code: 'QRIS' })
  })

  test('voucher dipakai: diskon tampil & kode ikut dikirim', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 20000 })
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product])

    let checkQuery: URLSearchParams | null = null
    mockApi.on('GET', '/voucher/check', (_route, url) => {
      checkQuery = url.searchParams
      return ok({ discount_amount: 5000, code: 'HEMAT5' })
    })
    let txBody: any = null
    mockApi.on('POST', '/tx/create', (route) => {
      txBody = route.request().postDataJSON()
      return ok({ paymentId: 'PAY-3', referenceId: 'REF-3', checkoutUrl: '', qrUrl: '' })
    })

    await gotoHydrated(page, '/cart')
    await page.getByPlaceholder('Kode voucher...').fill('hemat5')
    await page.getByRole('button', { name: 'Pakai' }).click()

    await expect(page.getByText('- Rp 5.000')).toBeVisible()
    expect(checkQuery!.get('code')).toBe('HEMAT5')
    expect(checkQuery!.get('amount')).toBe('20000')

    await confirmCheckout(page)
    await expect(page).toHaveURL(/\/transaction$/)
    expect(txBody.voucher_code).toBe('HEMAT5')
  })

  test('voucher tidak valid menampilkan pesan dari BE', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product])
    mockApi.on('GET', '/voucher/check', fail(400, 'Voucher sudah kedaluwarsa'))

    await gotoHydrated(page, '/cart')
    await page.getByPlaceholder('Kode voucher...').fill('LAMA')
    await page.getByRole('button', { name: 'Pakai' }).click()

    await expect(page.getByText('Voucher sudah kedaluwarsa')).toBeVisible()
  })

  test('sinkron keranjang: produk nonaktif dihapus & perubahan harga diberitahukan', async ({ page, context, mockApi }) => {
    const p1 = makeProduct(1, { sell_price: 10000 })
    const p2 = makeProduct(2)
    await seedCart(context, [{ product: p1, quantity: 1 }, { product: p2, quantity: 1 }])
    // Di BE: harga produk 1 naik, produk 2 sudah nonaktif
    mockCartPage(mockApi, [{ ...p1, sell_price: 12000 }, { ...p2, status: 'NONACTIVE' }])

    await gotoHydrated(page, '/cart')

    await expect(page.getByText('Produk dihapus dari keranjang').first()).toBeVisible()
    await expect(page.getByText('Harga produk berubah').first()).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Produk Tes 2' })).toHaveCount(0)
    await expect(page.getByText('Rp 12.000').first()).toBeVisible()
  })

  test('sinkron keranjang: qty disesuaikan bila stok berkurang', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { stock: 10 })
    await seedCart(context, [{ product, quantity: 5 }])
    mockCartPage(mockApi, [{ ...product, stock: 3 }])

    await gotoHydrated(page, '/cart')

    await expect(page.getByText('Jumlah pesanan disesuaikan').first()).toBeVisible()
    await expect(page.getByRole('main').getByRole('spinbutton')).toHaveValue('3')
  })

  test('checkout gagal di BE menampilkan pesan & keranjang tetap', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product])
    mockApi.on('POST', '/tx/create', fail(409, 'Stok produk tidak mencukupi'))

    await gotoHydrated(page, '/cart')
    await confirmCheckout(page)

    await expect(page.getByText('Terjadi kesalahan').first()).toBeVisible()
    await expect(page.getByText('Stok produk tidak mencukupi').first()).toBeVisible()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByText('Produk Tes 1')).toBeVisible()
  })

  test('pengunjung belum login tidak bisa checkout', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    await seedCart(context, [{ product, quantity: 1 }], 'MANUAL_BANK')
    mockApi
      .on('GET', '/payment/methods', ok(PAYMENT_METHODS))
      .on('GET', '/voucher/public', ok([]))
      .on('POST', '/products/ids', ok([product]))
    let txCalled = false
    mockApi.on('POST', '/tx/create', () => {
      txCalled = true
      return fail(401, 'TOKEN_MISSING')
    })

    await gotoHydrated(page, '/cart')
    await confirmCheckout(page)

    await expect(page.getByText('Silahkan login untuk melanjutkan checkout').first()).toBeVisible()
    expect(txCalled).toBe(false)
  })
})
