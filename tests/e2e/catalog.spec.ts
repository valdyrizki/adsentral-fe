import { test, expect, ok, fail, gotoHydrated, type MockApi } from './support/fixtures'
import { makeProduct, type MockProduct } from './support/cart'
import type { BrowserContext, Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[], over: Record<string, unknown> = {}) => ({
  page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content, ...over,
})

const CATEGORIES = [
  { id: 3, name: 'Game', slug: 'game', description: '', image_url: '', status: 'ACTIVE', ceated_at: '2026-01-01T00:00:00', updated_at: null },
  { id: 4, name: 'Streaming', slug: 'streaming', description: '', image_url: '', status: 'ACTIVE', ceated_at: '2026-01-01T00:00:00', updated_at: null },
]

const MERCHANT = {
  id: 10, name: 'Toko Tes', slug: 'toko-tes', description: 'Toko akun terpercaya', logo_url: '', banner_url: '',
  average_rating: 4.5, review_count: 12, status: 'ACTIVE', created_at: '2026-01-01T00:00:00', verified_seller: true,
}

const review = (id: number, over: Record<string, unknown> = {}) => ({
  id, transaction_id: `TX-${id}`, product_id: 1, reviewed_user_id: 2, reviewed_username: 'seller',
  reviewer_id: 100 + id, reviewer_username: `pembeli${id}`, user_type: 'BUYER', rating: 5, comment: `Mantap ${id}`,
  created_at: '2026-11-01T10:00:00', updated_at: null, ...over,
})

async function cartItems(context: BrowserContext) {
  const c = (await context.cookies()).find((x) => x.name === 'cart')
  return c ? JSON.parse(decodeURIComponent(c.value)).items as { product_id: number; quantity: number }[] : []
}

/** Mock halaman detail produk; `reviewQueries` mencatat parameter tiap request ulasan */
function mockProductPage(mockApi: MockApi, product: MockProduct, reviews: unknown[] = []) {
  const reviewQueries: URLSearchParams[] = []
  mockApi
    .on('GET', `/product/${product.id}`, ok(product))
    .on('GET', `/merchant/get/${product.merchant_id}`, ok(MERCHANT))
    .on('GET', `/review/product/${product.id}`, (_r, url) => {
      reviewQueries.push(url.searchParams)
      return ok(pageOf(reviews))
    })
  return reviewQueries
}

test.describe('Beranda', () => {
  test('kategori & produk terbaru tampil dengan tautan ke detail', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi
      .on('GET', '/categories', ok(CATEGORIES))
      .on('GET', '/products', (_r, url) => {
        queries.push(url.searchParams)
        return ok(pageOf([
          makeProduct(1, { name: 'Akun Netflix', sell_price: 25000 }),
          makeProduct(2, { name: 'Akun Spotify', delivery_type: 'STOCKING', stock: 0 }),
        ]))
      })

    await gotoHydrated(page, '/')
    const m = main(page)
    await expect(m.getByRole('link', { name: /Game/ }).first()).toHaveAttribute('href', '/category/3')
    await expect(m.locator('a', { hasText: 'Akun Netflix' })).toHaveAttribute('href', '/product/1')
    await expect(m.getByText('25.000').first()).toBeVisible()
    // stok STOCKING habis diberi tanda
    await expect(m.getByText('Stok Habis')).toBeVisible()
    expect(queries[0]?.get('sort')).toBe('terbaru')
  })

  test('BE gagal: pesan error tampil, bukan daftar kosong', async ({ page, mockApi }) => {
    mockApi
      .on('GET', '/categories', ok(CATEGORIES))
      .on('GET', '/products', fail(500, 'Internal Server Error'))

    await gotoHydrated(page, '/')
    await expect(main(page).getByText('Belum ada produk tersedia saat ini')).toHaveCount(0)
    await expect(main(page).getByText('Terjadi Kesalahan').first()).toBeVisible()
  })
})

test.describe('Detail produk', () => {
  test('info produk & toko; tambah ke keranjang tersimpan; melebihi stok ditolak', async ({ page, context, mockApi }) => {
    const product = makeProduct(1, { name: 'Akun Netflix', sell_price: 25000, stock: 3, min_qty: 1, max_qty: 5 })
    mockProductPage(mockApi, product)

    await gotoHydrated(page, '/product/1')
    const m = main(page)
    await expect(m.getByRole('heading', { name: 'Akun Netflix' }).or(m.getByText('Akun Netflix').first())).toBeVisible()
    await expect(m.getByText('Toko Tes').first()).toBeVisible()
    await expect(m.getByText('5 pcs')).toBeVisible() // batas maksimal

    await m.getByRole('button', { name: 'Masukan Keranjang' }).click()
    await expect(page.getByText('Berhasil masukan produk ke keranjang').first()).toBeVisible()
    await expect.poll(() => cartItems(context)).toEqual([expect.objectContaining({ product_id: 1, quantity: 1 })])

    // stok 3: total di keranjang tidak boleh melebihi stok
    await m.getByRole('spinbutton').fill('3')
    await m.getByRole('button', { name: 'Masukan Keranjang' }).click()
    await expect(page.getByText(/Stock tidak cukup/).first()).toBeVisible()
    await expect.poll(() => cartItems(context)).toEqual([expect.objectContaining({ product_id: 1, quantity: 1 })])
  })

  test('"Beli Sekarang" memasukkan ke keranjang lalu membuka /cart', async ({ page, context, mockApi }) => {
    const product = makeProduct(1)
    mockProductPage(mockApi, product)
    mockApi.on('GET', '/payment/methods', ok([])).on('GET', '/voucher/public', ok([])).on('POST', '/products/ids', ok([product]))

    await gotoHydrated(page, '/product/1')
    await main(page).getByRole('button', { name: 'Beli Sekarang' }).click()

    await expect(page).toHaveURL(/\/cart$/)
    expect(await cartItems(context)).toEqual([expect.objectContaining({ product_id: 1, quantity: 1 })])
  })

  test('stok habis (STOCKING): keterangan tampil, tombol beli tidak ada', async ({ page, mockApi }) => {
    mockProductPage(mockApi, makeProduct(1, { delivery_type: 'STOCKING', stock: 0 }))

    await gotoHydrated(page, '/product/1')
    await expect(main(page).getByText('Produk ini sedang tidak tersedia', { exact: false })).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Masukan Keranjang' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Beli Sekarang' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Chat Penjual' })).toBeVisible()
  })

  test('produk AUTO stok 0 tetap bisa dibeli (dikirim otomatis)', async ({ page, mockApi }) => {
    mockProductPage(mockApi, makeProduct(1, { delivery_type: 'AUTO', stock: 0 }))

    await gotoHydrated(page, '/product/1')
    await expect(main(page).getByRole('button', { name: 'Masukan Keranjang' })).toBeVisible()
  })

  for (const [status, title] of [['REVIEW', 'Produk Sedang Direview'], ['SUSPEND', 'Produk Disuspend'], ['INACTIVE', 'Produk Tidak Tersedia']] as const) {
    test(`produk ${status}: keterangan status tampil, tidak bisa dibeli`, async ({ page, mockApi }) => {
      mockProductPage(mockApi, makeProduct(1, { status }))

      await gotoHydrated(page, '/product/1')
      await expect(main(page).getByText(title).first()).toBeVisible()
      await expect(main(page).getByRole('button', { name: 'Masukan Keranjang' })).toHaveCount(0)
      await expect(main(page).getByRole('button', { name: 'Beli Sekarang' })).toHaveCount(0)
    })
  }

  test('ulasan pembeli tampil; filter rating dikirim ke BE', async ({ page, mockApi }) => {
    const queries = mockProductPage(mockApi, makeProduct(1), [review(1), review(2, { rating: 4, comment: 'Oke 2' })])

    await gotoHydrated(page, '/product/1')
    // F-44: ulasan dimuat saat halaman dibuka, tanpa harus mengubah filter dulu
    await expect(main(page).getByText('( 2 ulasan )')).toBeVisible()
    await main(page).getByRole('tab', { name: 'Review Pembeli' }).click()
    await expect(main(page).getByText('Mantap 1')).toBeVisible()
    await expect(main(page).getByText('pembeli2')).toBeVisible()

    await main(page).getByRole('button', { name: /^4/ }).first().click()
    await expect.poll(() => queries.at(-1)?.get('rating')).toBe('4')
  })
})

test.describe('Kategori, toko & pencarian', () => {
  test('/category/[id]: produk kategori dari BE', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi
      .on('GET', '/categories', ok(CATEGORIES))
      .on('GET', '/product/category/3', (_r, url) => {
        queries.push(url.searchParams)
        return ok(pageOf([makeProduct(7, { name: 'Akun Mobile Legends', category_id: 3 })]))
      })

    await gotoHydrated(page, '/category/3')
    await expect(main(page).locator('a', { hasText: 'Akun Mobile Legends' })).toHaveAttribute('href', '/product/7')
    expect(queries.length).toBeGreaterThan(0)
  })

  test('/category/[id] kosong: keterangan "Tidak ada produk"', async ({ page, mockApi }) => {
    mockApi.on('GET', '/categories', ok(CATEGORIES)).on('GET', '/product/category/4', ok(pageOf([])))

    await gotoHydrated(page, '/category/4')
    await expect(main(page).getByText('Tidak ada produk').first()).toBeVisible()
  })

  test('/merchant/[id]: profil toko & produknya', async ({ page, mockApi }) => {
    mockApi
      .on('GET', '/merchant/get/10', ok(MERCHANT))
      .on('GET', '/products/merchant/10', ok(pageOf([makeProduct(8, { name: 'Akun Canva' })])))

    await gotoHydrated(page, '/merchant/10')
    await expect(main(page).getByText('Toko Tes').first()).toBeVisible()
    await expect(main(page).locator('a', { hasText: 'Akun Canva' })).toHaveAttribute('href', '/product/8')
  })

  test('/search?q=: kata kunci dikirim ke BE; tanpa hasil tampil keterangan', async ({ page, mockApi }) => {
    const keywords: string[] = []
    mockApi.on('GET', '/products', (_r, url) => {
      keywords.push(url.searchParams.get('keyword') ?? '')
      return ok(pageOf(url.searchParams.get('keyword') === 'netflix' ? [makeProduct(1, { name: 'Akun Netflix' })] : []))
    })

    await gotoHydrated(page, '/search?q=netflix')
    await expect(main(page).locator('a', { hasText: 'Akun Netflix' })).toBeVisible()
    expect(keywords).toContain('netflix')

    await gotoHydrated(page, '/search?q=tidakada')
    await expect(main(page).getByText('Tidak ada produk yang cocok dengan', { exact: false })).toBeVisible()
  })
})

test.describe('Chat penjual dari halaman produk & toko', () => {
  const field = (raw: string, name: string) => raw.match(new RegExp(`name="${name}"\r\n\r\n([^\r]*)`))?.[1] ?? null

  test('produk: pesan < 5 karakter ditolak; kirim membawa productId & merchantId lalu ke /chat', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    mockProductPage(mockApi, makeProduct(1))
    let raw = ''
    mockApi
      .on('POST', '/chat/send', (route) => { raw = route.request().postDataBuffer()?.toString('latin1') ?? ''; return ok({ id: 1 }) })
      .on('GET', '/chat/buyer/conversation', ok(pageOf([])))

    await gotoHydrated(page, '/product/1')
    await main(page).getByRole('button', { name: 'Chat Penjual' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Kirim pesan ke penjual' })
    const send = dialog.getByRole('button', { name: /Kirim/ }).last()
    await dialog.getByPlaceholder('Tulis pesanmu untuk penjual disini...').fill('halo')
    await expect(send).toBeDisabled()
    await dialog.getByPlaceholder('Tulis pesanmu untuk penjual disini...').fill('Masih ada stok kak?')
    await send.click()

    await expect(page.getByText('Pesan terkirim').first()).toBeVisible()
    await expect(page).toHaveURL(/\/chat$/)
    expect(field(raw, 'productId')).toBe('1')
    expect(field(raw, 'merchantId')).toBe('10')
    expect(field(raw, 'senderType')).toBe('BUYER')
    expect(field(raw, 'message')).toBe('Masih ada stok kak?')
  })

  test('tamu: diarahkan ke login dengan redirect, tidak mengirim', async ({ page, mockApi }) => {
    mockProductPage(mockApi, makeProduct(1))
    let calls = 0
    mockApi.on('POST', '/chat/send', () => { calls++; return ok({ id: 1 }) })

    await gotoHydrated(page, '/product/1')
    await main(page).getByRole('button', { name: 'Chat Penjual' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Kirim pesan ke penjual' })
    await dialog.getByPlaceholder('Tulis pesanmu untuk penjual disini...').fill('Masih ada stok kak?')
    await dialog.getByRole('button', { name: /Kirim/ }).last().click()

    await expect(page).toHaveURL(/\/login\?redirect=(\/|%2F)product(\/|%2F)1$/)
    expect(calls).toBe(0)
  })

  test('toko: kirim tanpa productId; tolakan BE tampil', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
      .on('GET', '/merchant/get/10', ok(MERCHANT))
      .on('GET', '/products/merchant/10', ok(pageOf([makeProduct(8, { name: 'Akun Canva' })])))
    let raw = ''
    mockApi.on('POST', '/chat/send', (route) => { raw = route.request().postDataBuffer()?.toString('latin1') ?? ''; return fail(400, 'Tidak bisa chat ke toko sendiri') })

    await gotoHydrated(page, '/merchant/10')
    await main(page).getByRole('button', { name: 'Chat Penjual' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Kirim pesan ke penjual' })
    await dialog.getByPlaceholder('Tulis pesanmu untuk penjual disini...').fill('Halo, buka sampai jam berapa?')
    await dialog.getByRole('button', { name: /Kirim/ }).last().click()

    await expect(page.getByText('Tidak bisa chat ke toko sendiri').first()).toBeVisible()
    expect(field(raw, 'productId')).toBeNull()
    expect(field(raw, 'merchantId')).toBe('10')
    await expect(page).toHaveURL(/\/merchant\/10$/)
  })
})
