import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({
  page: 0, size: 10, total_elements: content.length, total_pages: 1, last: true, content,
})

const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

/** Nilai field teks dari body multipart (FormData) */
const formField = (req: Request, name: string): string | null => {
  const body = req.postDataBuffer()?.toString('latin1') ?? ''
  const m = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`))
  return m ? m[1]! : null
}
const hasFile = (req: Request, name: string) =>
  (req.postDataBuffer()?.toString('latin1') ?? '').includes(`name="${name}"; filename=`)

const CATEGORIES = [{ id: 3, name: 'Game', slug: 'game', status: 'ACTIVE' }]

test.describe('Produk seller: daftar & aksi status', () => {
  test('daftar menampilkan status, keterangan, dan ringkasan; pencarian mengirim keyword', async ({ page, mockApi }) => {
    const keywords: string[] = []
    mockApi
      .asRole('SELLER')
      .on('GET', '/seller/products/summary', ok({ active: 1, in_review: 1, blocked: 2 }))
      .on('GET', '/products/my', (_r, url) => {
        keywords.push(url.searchParams.get('keyword') ?? '')
        return ok(pageOf([
          makeProduct(1, { name: 'Akun Aktif', status: 'ACTIVE' }),
          makeProduct(2, { name: 'Akun Review', status: 'REVIEW' }),
          makeProduct(3, { name: 'Akun Ditolak', status: 'NONACTIVE' }),
          makeProduct(4, { name: 'Akun Ditangguhkan', status: 'INACTIVE', delivery_type: 'STOCKING' }),
          makeProduct(5, { name: 'Akun Suspend', status: 'SUSPEND' }),
        ]))
      })

    await gotoHydrated(page, '/seller/product')
    const m = main(page)
    await expect(m.getByText('Akun Aktif')).toBeVisible()
    await expect(m.getByText('Menunggu persetujuan admin.')).toBeVisible()
    await expect(m.getByText('Produk ditolak / dinonaktifkan admin.', { exact: false })).toBeVisible()
    await expect(m.getByText('Produk ditangguhkan oleh Anda.')).toBeVisible()
    await expect(m.getByText('Produk disuspend karena melanggar ketentuan.')).toBeVisible()
    await expect(m.getByText('Produk diblokir')).toBeVisible()

    // aksi sesuai status: Tangguhkan hanya ACTIVE, Aktifkan hanya INACTIVE, Kelola Stok hanya STOCKING
    await expect(m.getByRole('button', { name: 'Tangguhkan' })).toHaveCount(1)
    await expect(m.getByRole('button', { name: 'Aktifkan' })).toHaveCount(1)
    await expect(m.getByRole('button', { name: 'Kelola Stok' })).toHaveCount(1)

    await m.getByPlaceholder('Cari produk...').fill('netflix')
    await m.getByPlaceholder('Cari produk...').press('Enter')
    await expect.poll(() => keywords.at(-1)).toBe('netflix')
  })

  test('tangguhkan produk aktif lalu daftar dan ringkasan dimuat ulang', async ({ page, mockApi }) => {
    let status = 'ACTIVE'
    let summaryCalls = 0
    mockApi
      .asRole('SELLER')
      .on('GET', '/seller/products/summary', () => { summaryCalls++; return ok({ active: 1, in_review: 0, blocked: 0 }) })
      .on('GET', '/products/my', () => ok(pageOf([makeProduct(1, { status })])))
      .on('PATCH', '/product/deactivate/1', () => { status = 'INACTIVE'; return ok(null) })

    await gotoHydrated(page, '/seller/product')
    await main(page).getByRole('button', { name: 'Tangguhkan' }).click()

    await expect(page.getByText('Produk telah ditangguhkan.').first()).toBeVisible()
    await expect(main(page).getByText('Produk ditangguhkan oleh Anda.')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toBeVisible()
    expect(summaryCalls).toBeGreaterThanOrEqual(2)
  })

  test('aktifkan produk yang ditangguhkan: BE mengembalikan ke antrean review', async ({ page, mockApi }) => {
    let status = 'INACTIVE'
    mockApi
      .asRole('SELLER')
      .on('GET', '/seller/products/summary', ok({ active: 0, in_review: 0, blocked: 0 }))
      .on('GET', '/products/my', () => ok(pageOf([makeProduct(1, { status })])))
      .on('PATCH', '/product/activate/1', () => { status = 'REVIEW'; return ok(null) })

    await gotoHydrated(page, '/seller/product')
    await main(page).getByRole('button', { name: 'Aktifkan' }).click()

    await expect(main(page).getByText('Menunggu persetujuan admin.')).toBeVisible()
    // F-37: toast tidak lagi berkata "diaktifkan"
    await expect(page.getByText('Produk diajukan ke admin', { exact: false }).first()).toBeVisible()
  })

  test('F-35: gagal tangguhkan menampilkan pesan BE', async ({ page, mockApi }) => {
    mockApi
      .asRole('SELLER')
      .on('GET', '/seller/products/summary', ok({ active: 1, in_review: 0, blocked: 0 }))
      .on('GET', '/products/my', () => ok(pageOf([makeProduct(1)])))
      .on('PATCH', '/product/deactivate/1', fail(409, 'Produk yg sudah di suspend/delete tidak bisa diedit'))

    await gotoHydrated(page, '/seller/product')
    await main(page).getByRole('button', { name: 'Tangguhkan' }).click()

    await expect(page.getByText('Produk yg sudah di suspend/delete tidak bisa diedit').first()).toBeVisible({ timeout: 3000 })
  })
})

async function openCreateForm(page: Page) {
  await gotoHydrated(page, '/seller/product/create')
  await expect(main(page).getByText('Form Create Product')).toBeVisible()
}

async function fillValidManual(page: Page) {
  const m = main(page)
  await m.locator('input[type="file"]').first().setInputFiles({ name: 'banner.png', mimeType: 'image/png', buffer: TINY_PNG })
  await m.locator('#product_name').fill('Akun Netflix Premium')
  await m.locator('#sell_price').fill('25000')
  await m.locator('.ProseMirror').click()
  await page.keyboard.type('Akun premium 1 bulan')
  await m.locator('#stock').fill('10')
  await m.locator('#delivery_days').fill('1')
  await m.getByRole('combobox').filter({ hasText: 'Category' }).click()
  await page.getByRole('option', { name: 'Game' }).click()
}

test.describe('Produk seller: buat produk', () => {
  test.beforeEach(({ mockApi }) => {
    mockApi
      .asRole('SELLER')
      .on('GET', '/categories', ok(CATEGORIES))
      .on('GET', '/system/settings/public', ok([{ key: 'TRX_FEE', value: '5' }]))
  })

  test('form kosong menampilkan pesan wajib dan tidak memanggil BE', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/product/create', () => { calls++; return ok(makeProduct(9)) })

    await openCreateForm(page)
    await main(page).getByRole('button', { name: 'Save Product' }).click()

    const m = main(page)
    await expect(m.getByText('Nama produk tidak boleh kosong')).toBeVisible()
    await expect(m.getByText('Deskripsi produk wajib diisi')).toBeVisible()
    await expect(m.getByText('Kategori wajib dipilih')).toBeVisible()
    await expect(m.getByText('Banner produk wajib diisi')).toBeVisible()
    await expect(m.getByText('Harga jual minimal Rp.1.000')).toBeVisible()
    await expect(m.getByText('Estimasi pengiriman wajib diisi')).toBeVisible()
    expect(calls).toBe(0)
  })

  test('estimasi pendapatan memakai TRX_FEE; slug dibuat dari nama', async ({ page }) => {
    await openCreateForm(page)
    const m = main(page)
    await m.locator('#product_name').fill('Akun Netflix Premium')
    await expect(m.locator('#slug')).toHaveValue('akun-netflix-premium')
    await m.locator('#sell_price').fill('20000')
    await expect(m.getByText('Biaya Admin (5%)')).toBeVisible()
    await expect(m.getByText('Rp 19.000')).toBeVisible()
  })

  test('produk MANUAL valid dikirim sebagai multipart lalu kembali ke daftar', async ({ page, mockApi }) => {
    let req: Request | null = null
    mockApi
      .on('POST', '/product/create', (route) => { req = route.request(); return ok(makeProduct(9)) })
      .on('GET', '/seller/products/summary', ok({ active: 0, in_review: 1, blocked: 0 }))
      .on('GET', '/products/my', ok(pageOf([makeProduct(9, { status: 'REVIEW' })])))

    await openCreateForm(page)
    await fillValidManual(page)
    await main(page).getByRole('button', { name: 'Save Product' }).click()

    await expect(page).toHaveURL(/\/seller\/product$/)
    expect(req).not.toBeNull()
    const r = req!
    expect(formField(r, 'name')).toBe('Akun Netflix Premium')
    expect(formField(r, 'slug')).toBe('akun-netflix-premium')
    expect(formField(r, 'sellPrice')).toBe('25000')
    expect(formField(r, 'stock')).toBe('10')
    expect(formField(r, 'minQty')).toBe('1')
    expect(formField(r, 'categoryId')).toBe('3')
    expect(formField(r, 'deliveryDays')).toBe('1')
    expect(formField(r, 'deliveryType')).toBe('MANUAL')
    expect(formField(r, 'description')).toContain('Akun premium 1 bulan')
    expect(hasFile(r, 'banner')).toBe(true)
  })

  test('tipe Stok Akun mengunci stok di 0 dan tidak mewajibkan estimasi pengiriman', async ({ page, mockApi }) => {
    let req: Request | null = null
    mockApi
      .on('POST', '/product/create', (route) => { req = route.request(); return ok(makeProduct(9)) })
      .on('GET', '/seller/products/summary', ok({ active: 0, in_review: 1, blocked: 0 }))
      .on('GET', '/products/my', ok(pageOf([])))

    await openCreateForm(page)
    await fillValidManual(page)
    await main(page).getByText('Stok Akun', { exact: true }).click()
    await expect(main(page).locator('#stock')).toBeDisabled()
    await expect(main(page).locator('#delivery_days')).toHaveCount(0)
    await main(page).getByRole('button', { name: 'Save Product' }).click()

    await expect(page).toHaveURL(/\/seller\/product$/)
    expect(formField(req!, 'deliveryType')).toBe('STOCKING')
    expect(formField(req!, 'stock')).toBe('0')
  })

  test('tipe Otomatis mewajibkan judul, deskripsi, dan file lampiran', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.on('POST', '/product/create', () => { calls++; return ok(makeProduct(9)) })

    await openCreateForm(page)
    await fillValidManual(page)
    await main(page).getByText('Otomatis', { exact: true }).click()
    await main(page).getByRole('button', { name: 'Save Product' }).click()

    const m = main(page)
    await expect(m.getByText('Judul pesan otomatis wajib diisi')).toBeVisible()
    await expect(m.getByText('Deskripsi pesan otomatis wajib diisi')).toBeVisible()
    await expect(m.getByText('File lampiran otomatis wajib diupload')).toBeVisible()
    expect(calls).toBe(0)
  })

  test('banner bukan gambar ditolak sebelum dikirim lewat toast, bukan alert() (F-37)', async ({ page }) => {
    const dialogs: string[] = []
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss() })

    await openCreateForm(page)
    await expect(main(page).getByText('JPG, PNG, atau WEBP (maks. 5MB)').first()).toBeVisible()
    await main(page).locator('input[type="file"]').first()
      .setInputFiles({ name: 'catatan.txt', mimeType: 'text/plain', buffer: Buffer.from('bukan gambar') })

    await expect(page.getByText('Format gambar harus JPG / JPEG / PNG / WEBP').first()).toBeVisible()
    expect(dialogs).toEqual([])
  })

  test('F-35: error BE saat simpan menampilkan pesan BE', async ({ page, mockApi }) => {
    mockApi.on('POST', '/product/create', fail(400, 'Category not found'))

    await openCreateForm(page)
    await fillValidManual(page)
    await main(page).getByRole('button', { name: 'Save Product' }).click()

    await expect(page.getByText('Category not found').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Produk seller: edit produk', () => {
  test.beforeEach(({ mockApi }) => {
    mockApi
      .asRole('SELLER')
      .on('GET', '/categories', ok(CATEGORIES))
      .on('GET', '/seller/products/summary', ok({ active: 1, in_review: 0, blocked: 0 }))
      .on('GET', '/products/my', ok(pageOf([])))
  })

  test('form terisi data produk; perubahan dikirim ke PATCH /product/update/{id}', async ({ page, mockApi }) => {
    let req: Request | null = null
    mockApi
      .on('GET', '/product/my/7', ok(makeProduct(7, {
        name: 'Akun Lama', description: '<p>Deskripsi lama</p>', category_id: 3, delivery_days: 2, stock: 5, sell_price: 15000,
      })))
      .on('PATCH', '/product/update/7', (route) => { req = route.request(); return ok(null) })

    await gotoHydrated(page, '/seller/product/edit/7')
    const m = main(page)
    await expect(m.locator('#product_name')).toHaveValue('Akun Lama')
    // F-37: produk aktif yang diedit kembali ke review
    await expect(m.getByText('Perubahan akan ditinjau admin')).toBeVisible()
    await expect(m.locator('#sell_price')).toHaveValue('15.000')
    await expect(m.locator('.ProseMirror')).toContainText('Deskripsi lama')

    await m.locator('#product_name').fill('Akun Baru')
    await m.getByRole('button', { name: 'Edit Product' }).click()

    await expect(page).toHaveURL(/\/seller\/product$/)
    await expect(page.getByText('Produk berhasil diperbarui').first()).toBeVisible()
    expect(formField(req!, 'name')).toBe('Akun Baru')
    expect(formField(req!, 'slug')).toBe('akun-baru')
    expect(formField(req!, 'sellPrice')).toBe('15000')
    expect(formField(req!, 'stock')).toBe('5')
    expect(hasFile(req!, 'banner')).toBe(false)
  })

  test('produk tidak ditemukan / bukan milik seller', async ({ page, mockApi }) => {
    mockApi.on('GET', '/product/my/99', fail(400, 'Product not found'))

    await gotoHydrated(page, '/seller/product/edit/99')
    await expect(main(page).getByText('Produk Tidak Ditemukan')).toBeVisible()
  })

  test('F-36: edit produk Otomatis yang sudah punya file tidak wajib unggah ulang', async ({ page, mockApi }) => {
    let calls = 0
    mockApi
      .on('GET', '/product/my/8', ok(makeProduct(8, {
        description: '<p>Deskripsi</p>', category_id: 3, delivery_type: 'AUTO', stock: 0,
        auto_config: {
          id: 1, product_id: 8, product_name: 'Produk Tes 8', title: 'Terima kasih', description: 'Ini file akunnya',
          file_id: 'f1', file_name: 'akun.txt', file_url: 'private/akun.txt', file_size: 10, file_type: 'text/plain',
          sent_count: 0, status: 'ACTIVE', created_at: '2026-01-01T00:00:00', updated_at: null,
        },
      })))
      .on('PATCH', '/product/update/8', () => { calls++; return ok(null) })

    await gotoHydrated(page, '/seller/product/edit/8')
    await expect(main(page).locator('#auto_config_title')).toHaveValue('Terima kasih')
    await main(page).getByRole('button', { name: 'Edit Product' }).click()

    await expect.poll(() => calls, { timeout: 3000 }).toBe(1)
  })
})
