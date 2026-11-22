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

  test('saldo = subtotal tetapi kurang dari total (+ biaya aplikasi): tombol "Saldo Tidak Cukup" (F-04)', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 50000 })
    await seedCart(context, [{ product, quantity: 1 }])
    // BE memotong saldo sebesar totalAmount = subtotal + FEE_APP (default 1.000) - diskon
    mockCartPage(mockApi, [product], 50_500)

    await gotoHydrated(page, '/cart')
    await expect(checkoutButton(page)).toHaveText(/Saldo Tidak Cukup/)
    await expect(checkoutButton(page)).toBeDisabled()
  })

  test('saldo di store diperbarui: tombol ikut berubah dari "Saldo Tidak Cukup" ke "Checkout" (F-03)', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 50000 })
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product], 10_000)

    await gotoHydrated(page, '/cart')
    await expect(checkoutButton(page)).toHaveText(/Saldo Tidak Cukup/)

    // mis. saldo dimuat ulang setelah top up (loadBalance({ force: true }))
    mockApi.on('GET', '/balance', ok(makeBalance(1_000_000)))
    await page.evaluate(async () => {
      const pinia = (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$pinia
      await pinia._s.get('balance').loadBalance({ force: true })
    })
    await expect(checkoutButton(page)).toHaveText(/Checkout/)
  })

  test('transfer bank manual diarahkan ke halaman pembayaran', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    await seedCart(context, [{ product, quantity: 1 }], 'MANUAL_BANK')
    mockCartPage(mockApi, [product], 0)
    mockApi.on('POST', '/tx/create', ok({ paymentId: 'PAY-77', referenceId: 'REF-77', checkoutUrl: '', qrUrl: '' }))

    await gotoHydrated(page, '/cart')
    await expect(page.getByText('Setelah checkout, Anda akan diarahkan ke halaman pembayaran')).toBeVisible()
    // EP08-05: SLA konfirmasi transfer + ringkasan refund dengan tautan kebijakan
    await expect(page.getByTestId('sla-note')).toContainText('Diproses maks. 1×24 jam kerja (setiap hari 11.00–21.00 WIB)')
    const refund = page.getByTestId('refund-summary')
    await expect(refund).toContainText('refund otomatis ke Saldo Belanja')
    await expect(refund.getByRole('link', { name: 'Kebijakan Refund & Garansi' })).toHaveAttribute('href', '/kebijakan-refund-garansi')
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

test.describe('Voucher publik di keranjang', () => {
  const voucher = (code: string, over: Record<string, unknown> = {}) => ({
    id: code, code, name: null, discount_type: 'NOMINAL', discount_value: 5000, max_discount_amount: null,
    min_transaction_amount: null, status: 'ACTIVE', is_public: true, ...over,
  })

  test('daftar tampil dengan format diskon; pilih → dicek & dipakai, pilih lagi → dilepas; tolakan BE tampil', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { sell_price: 50000 })
    await seedCart(context, [{ product, quantity: 1 }])
    mockCartPage(mockApi, [product])
    mockApi.on('GET', '/voucher/public', ok([
      voucher('HEMAT5', { name: 'Hemat Lima Ribu', min_transaction_amount: 20000 }),
      voucher('PERSEN10', { discount_type: 'PERCENTAGE', discount_value: 10, max_discount_amount: 15000 }),
    ]))
    const checked: string[] = []
    mockApi.on('GET', '/voucher/check', (_r, url) => {
      const code = url.searchParams.get('code')!
      checked.push(`${code}@${url.searchParams.get('amount')}`)
      return code === 'PERSEN10' ? fail(400, 'Kuota voucher habis') : ok({ discount_amount: 5000, code })
    })
    let txBody: any = null
    mockApi.on('POST', '/tx/create', (route) => {
      txBody = route.request().postDataJSON()
      return ok({ paymentId: 'PAY-9', referenceId: 'REF-9', checkoutUrl: '', qrUrl: '' })
    })

    await gotoHydrated(page, '/cart')
    const m = page.getByRole('main')
    const hemat = m.getByRole('button', { name: /HEMAT5/ })
    await expect(hemat).toContainText('Hemat Lima Ribu')
    await expect(hemat).toContainText('Diskon Rp5.000')
    await expect(hemat).toContainText('Min. Rp20.000')
    await expect(m.getByRole('button', { name: /PERSEN10/ })).toContainText('Diskon 10% (maks. Rp15.000)')

    // format Rupiah Indonesia, tidak bergantung bahasa browser (F-68)
    await expect(m.getByText('Rp 50.000', { exact: true }).first()).toBeVisible()
    await expect(m.getByText(/Saldo: Rp1\.000\.000/)).toBeVisible()
    await expect(m.getByText(/Rp ?50,000|Rp1,000,000/)).toHaveCount(0)

    await hemat.click()
    await expect(m.getByText('Rp 46.000').first()).toBeVisible()
    expect(checked).toEqual(['HEMAT5@50000'])

    await hemat.click()
    await expect(m.getByText('Rp 46.000')).toHaveCount(0)

    await m.getByRole('button', { name: /PERSEN10/ }).click()
    await expect(page.getByText('Kuota voucher habis').first()).toBeVisible()

    await hemat.click()
    await expect(m.getByText('Rp 46.000').first()).toBeVisible()
    await confirmCheckout(page)
    await expect(page).toHaveURL(/\/transaction$/)
    expect(txBody.voucher_code).toBe('HEMAT5')
  })
})
