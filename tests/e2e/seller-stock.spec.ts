import { test, expect, ok, fail, failCode, gotoHydrated, type MockApi } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const dialog = (page: Page) => page.getByRole('dialog')

const pageOf = (content: unknown[], size = 20) => ({
  page: 0, size, total_elements: content.length, total_pages: 1, last: true, content,
})

const makeStockItem = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  product_id: 5,
  product_name: 'Akun ML',
  product_banner_url: null,
  description: null,
  file_name: null,
  file_url: null,
  file_size: null,
  file_type: null,
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00',
  transaction_id: null,
  account_type_id: null,
  account_type_name: null,
  account_uid: `uid-${id}`,
  account_username: null,
  account_password: null,
  account_email: null,
  account_email_password: null,
  account_two_fa_secret: null,
  account_cookie: null,
  ...overrides,
})

/** Nilai semua field teks bernama `name` dari body multipart (FormData) */
const formFields = (req: Request, name: string): string[] => {
  const body = req.postDataBuffer()?.toString('latin1') ?? ''
  return [...body.matchAll(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`, 'g'))].map(m => m[1]!)
}
const formField = (req: Request, name: string) => formFields(req, name)[0] ?? null
const fileNames = (req: Request, name: string): string[] => {
  const body = req.postDataBuffer()?.toString('latin1') ?? ''
  return [...body.matchAll(new RegExp(`name="${name}"; filename="([^"]*)"`, 'g'))].map(m => m[1]!)
}

const ACCOUNT_TYPES = [
  { id: 1, name: 'Lainnya', slug: 'lainnya', status: 'ACTIVE', is_default: true },
  { id: 2, name: 'Mobile Legends', slug: 'mobile-legends', status: 'ACTIVE', is_default: false },
]

const sellerWithStockProduct = (mockApi: MockApi) =>
  mockApi
    .asRole('SELLER')
    .on('GET', '/account-types', ok(ACCOUNT_TYPES))
    .on('GET', '/product/my/5', ok(makeProduct(5, { name: 'Akun ML', delivery_type: 'STOCKING', stock: 3 })))

test.describe('Stok seller: daftar, filter, hapus', () => {
  test('daftar menampilkan status & hitungan seluruh stok (F-38); filter status dan akun dikirim ke BE', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      // hitungan dari BE untuk seluruh stok, bukan dari 3 baris di halaman ini
      .on('GET', '/stock/my/summary', ok({ active: 12, sent: 30, returned: 2, restocked: 0 }))
      .on('GET', '/stock/my', (_r, url) => {
        queries.push(url.searchParams)
        return ok(pageOf([
          makeStockItem(1),
          makeStockItem(2, { status: 'SENT', transaction_id: 'TX123' }),
          makeStockItem(3, { status: 'RETURNED' }),
        ]))
      })

    await gotoHydrated(page, '/seller/stock')
    const m = main(page)
    await expect(m.getByText('Aktif: 12')).toBeVisible()
    await expect(m.getByText('Terkirim: 30')).toBeVisible()
    await expect(m.getByText('Dikembalikan: 2')).toBeVisible()
    await expect(m.getByText('Ditambah Ulang:')).toHaveCount(0)
    await expect(m.getByRole('link', { name: 'TX123' })).toHaveAttribute('href', '/seller/order/TX123')
    // hanya item ACTIVE yang bisa diedit/dihapus/dipilih
    await expect(m.getByRole('button', { name: 'Edit' })).toHaveCount(1)
    await expect(m.getByRole('checkbox', { name: 'Pilih item #2' })).toBeDisabled()

    await m.getByPlaceholder('Cari akun (UID / username / email)...').fill('  uid-1  ')
    await expect.poll(() => queries.at(-1)?.get('account')).toBe('uid-1')

    await m.getByRole('combobox').filter({ hasText: 'Semua Status' }).click()
    await page.getByRole('option', { name: 'Terkirim' }).click()
    await expect.poll(() => queries.at(-1)?.get('status')).toBe('SENT')
    expect(queries.at(-1)?.get('account')).toBe('uid-1')

    await m.getByRole('button', { name: 'Reset' }).click()
    await expect.poll(() => queries.at(-1)?.get('status')).toBeNull()
  })

  test('hapus satu item lewat konfirmasi lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    let deleted = false
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      .on('GET', '/stock/my', () => ok(pageOf(deleted ? [] : [makeStockItem(1)])))
      .on('DELETE', '/stock/1', () => { deleted = true; return ok(null) })

    await gotoHydrated(page, '/seller/stock')
    await main(page).locator('button:has(.iconify[class*="delete-outline"])').last().click()
    await expect(dialog(page)).toContainText('Item "uid-1" akan dihapus secara permanen.')
    await dialog(page).getByRole('button', { name: 'Ya, Hapus' }).click()

    await expect(page.getByText('Item berhasil dihapus dari stok.').first()).toBeVisible()
    await expect(main(page).getByText('Tidak ada stok akun ditemukan.')).toBeVisible()
  })

  test('hapus massal mengirim id terpilih dan menampilkan item yang dilewati', async ({ page, mockApi }) => {
    let body: unknown = null
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      .on('GET', '/stock/my', () => ok(pageOf([makeStockItem(1), makeStockItem(2), makeStockItem(3, { status: 'SENT' })])))
      .on('POST', '/stock/bulk-delete', (route) => {
        body = route.request().postDataJSON()
        return ok({ deleted: 1, skipped: [{ id: 2, reason: 'Item sudah terkirim' }] }, '1 stock item berhasil dihapus, 1 dilewati')
      })

    await gotoHydrated(page, '/seller/stock')
    const m = main(page)
    await m.getByRole('checkbox', { name: 'Pilih semua di halaman ini' }).click()
    await expect(m.getByText('2 item dipilih')).toBeVisible()
    await m.getByRole('button', { name: 'Hapus terpilih (2)' }).click()
    await dialog(page).getByRole('button', { name: 'Ya, Hapus' }).click()

    await expect(page.getByText('1 stock item berhasil dihapus, 1 dilewati').first()).toBeVisible()
    expect(body).toEqual({ item_ids: [1, 2] })
    await expect(m.getByText('1 item dilewati (tidak dihapus)')).toBeVisible()
    await expect(m.getByText('2 item dipilih')).toHaveCount(0)
  })

  test('hapus massal ditolak 403 (ada item milik toko lain): pesan BE tampil, pilihan dipertahankan', async ({ page, mockApi }) => {
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      .on('GET', '/stock/my', () => ok(pageOf([makeStockItem(1)])))
      .on('POST', '/stock/bulk-delete', fail(403, 'Ada item stok yang bukan milik toko Anda'))

    await gotoHydrated(page, '/seller/stock')
    await main(page).getByRole('checkbox', { name: 'Pilih item #1' }).click()
    await main(page).getByRole('button', { name: 'Hapus terpilih (1)' }).click()
    await dialog(page).getByRole('button', { name: 'Ya, Hapus' }).click()

    await expect(page.getByText('Ada item stok yang bukan milik toko Anda').first()).toBeVisible()
    await expect(main(page).getByText('1 item dipilih')).toBeVisible()
  })
})

test.describe('Stok seller: tambah satu item', () => {
  test('pilih produk hanya menampilkan produk Stok Akun', async ({ page, mockApi }) => {
    let deliveryType: string | null = null
    mockApi
      .asRole('SELLER')
      .on('GET', '/products/my', (_r, url) => {
        deliveryType = url.searchParams.get('deliveryType')
        return ok(pageOf([makeProduct(5, { name: 'Akun ML', delivery_type: 'STOCKING' })]))
      })

    await gotoHydrated(page, '/seller/stock/add')
    await expect(main(page).getByRole('link', { name: /Akun ML/ })).toHaveAttribute('href', '/seller/stock/add/5')
    expect(deliveryType).toBe('STOCKING')
  })

  test('produk bukan Stok Akun tidak bisa ditambah stoknya', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/product/my/6', ok(makeProduct(6, { delivery_type: 'MANUAL' })))

    await gotoHydrated(page, '/seller/stock/add/6')
    await expect(main(page).getByText('Produk ini bukan bertipe pengiriman Stok Akun')).toBeVisible()
  })

  test('tombol nonaktif bila semua kosong; data akun + catatan dikirim multipart; tipe akun dipertahankan', async ({ page, mockApi }) => {
    let req: Request | null = null
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock', (route) => { req = route.request(); return ok(makeStockItem(10)) })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    const add = m.getByRole('button', { name: 'Tambah Stok' })
    await expect(add).toBeDisabled()

    await m.getByRole('combobox').filter({ hasText: "Tidak dipilih (otomatis 'Lainnya')" }).click()
    await page.getByRole('option', { name: 'Mobile Legends' }).click()
    await m.getByPlaceholder('Contoh: 123456789').fill(' 778899 ')
    await m.getByPlaceholder('Username akun').fill('mlplayer')
    await m.getByPlaceholder('Contoh: Rank Mythic, Serial key batch 001, dll.').fill('Rank Mythic')
    await add.click()

    await expect(page.getByText('Stock item berhasil ditambahkan').first()).toBeVisible()
    expect(formField(req!, 'accountUid')).toBe('778899')
    expect(formField(req!, 'accountUsername')).toBe('mlplayer')
    expect(formField(req!, 'description')).toBe('Rank Mythic')
    expect(formField(req!, 'accountTypeId')).toBe('2')
    expect(formField(req!, 'accountPassword')).toBeNull()
    expect(formField(req!, 'allowDuplicate')).toBeNull()
    // form kosong lagi, tipe akun tetap
    await expect(m.getByPlaceholder('Contoh: 123456789')).toHaveValue('')
    await expect(m.getByRole('combobox').filter({ hasText: 'Mobile Legends' })).toBeVisible()
  })

  test('file dipilih mengisi UID dari nama file', async ({ page, mockApi }) => {
    let req: Request | null = null
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock', (route) => { req = route.request(); return ok(makeStockItem(10)) })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.locator('input[type="file"]').first().setInputFiles({ name: '556677.txt', mimeType: 'text/plain', buffer: Buffer.from('akun') })
    await expect(m.getByPlaceholder('Contoh: 123456789')).toHaveValue('556677')
    await m.getByRole('button', { name: 'Tambah Stok' }).click()

    await expect(page.getByText('Stock item berhasil ditambahkan').first()).toBeVisible()
    expect(fileNames(req!, 'file')).toEqual(['556677.txt'])
    expect(formField(req!, 'accountUid')).toBe('556677')
  })

  test('akun pernah terjual (409 ACCOUNT_DUPLICATE_SENT): konfirmasi lalu kirim ulang dengan allowDuplicate', async ({ page, mockApi }) => {
    const reqs: Request[] = []
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock', (route) => {
        reqs.push(route.request())
        return reqs.length === 1
          ? failCode(409, 'Akun ini sudah pernah terjual', { code: 'ACCOUNT_DUPLICATE_SENT', existingItemId: 3, existingProductName: 'Akun ML Lama' })
          : ok(makeStockItem(10))
      })

    await gotoHydrated(page, '/seller/stock/add/5')
    await main(page).getByPlaceholder('Contoh: 123456789').fill('112233')
    await main(page).getByRole('button', { name: 'Tambah Stok' }).click()

    await expect(dialog(page)).toContainText('Akun ini sudah pernah dikirim ke pembeli (produk: Akun ML Lama)')
    await dialog(page).getByRole('button', { name: 'Ya, tambahkan' }).click()

    await expect(page.getByText('Stock item berhasil ditambahkan').first()).toBeVisible()
    expect(reqs).toHaveLength(2)
    expect(formField(reqs[1]!, 'allowDuplicate')).toBe('true')
  })

  test('akun masih di stok aktif (409 ACCOUNT_DUPLICATE_ACTIVE): pesan jelas, tanpa opsi lanjut', async ({ page, mockApi }) => {
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock', failCode(409, 'Akun sudah ada', { code: 'ACCOUNT_DUPLICATE_ACTIVE', existingProductName: 'Akun ML' }))

    await gotoHydrated(page, '/seller/stock/add/5')
    await main(page).getByPlaceholder('Contoh: 123456789').fill('112233')
    await main(page).getByRole('button', { name: 'Tambah Stok' }).click()

    await expect(main(page).getByText('Akun ini masih ada di stok aktif (produk: Akun ML).')).toBeVisible()
    await expect(dialog(page)).toHaveCount(0)
  })
})

test.describe('Stok seller: edit item', () => {
  test('hanya field yang berubah dikirim ke PATCH /stock/{id}', async ({ page, mockApi }) => {
    let req: Request | null = null
    const item = makeStockItem(1, { account_username: 'lama', description: 'catatan' })
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      .on('GET', '/stock/my', () => ok(pageOf([item])))
      .on('PATCH', '/stock/1', (route) => { req = route.request(); return ok({ ...item, account_username: 'baru' }) })

    await gotoHydrated(page, '/seller/stock')
    await main(page).getByRole('button', { name: 'Edit' }).click()
    await dialog(page).getByPlaceholder('Username akun').fill('baru')
    await dialog(page).getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect(page.getByText('Perubahan item stok berhasil disimpan.').first()).toBeVisible()
    expect(formField(req!, 'accountUsername')).toBe('baru')
    expect(formField(req!, 'accountUid')).toBeNull()
    expect(formField(req!, 'description')).toBeNull()
  })

  test('item sudah terkirim (409 tanpa kode): peringatan dan daftar dimuat ulang', async ({ page, mockApi }) => {
    let listCalls = 0
    mockApi
      .asRole('SELLER')
      .on('GET', '/account-types', ok(ACCOUNT_TYPES))
      .on('GET', '/stock/my', () => { listCalls++; return ok(pageOf([makeStockItem(1)])) })
      .on('PATCH', '/stock/1', fail(409, 'Item stok sudah terkirim, tidak bisa diedit'))

    await gotoHydrated(page, '/seller/stock')
    await main(page).getByRole('button', { name: 'Edit' }).click()
    await dialog(page).getByPlaceholder('Username akun').fill('baru')
    await dialog(page).getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect(page.getByText('Item stok sudah terkirim, tidak bisa diedit').first()).toBeVisible()
    await expect.poll(() => listCalls).toBeGreaterThanOrEqual(2)
  })
})

test.describe('Stok seller: akun massal (cek lalu simpan)', () => {
  const PASTE = '111|user1|pass1\n222|user2|pass2\n333|user3|pass3\n111|user1|pass1'

  test('cek (dryRun) lalu simpan dengan pilihan per baris dan on_duplicate', async ({ page, mockApi }) => {
    let checkBody: any = null
    let saveBody: any = null
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', (route, url) => {
        if (url.searchParams.get('dryRun') === 'true') {
          checkBody = route.request().postDataJSON()
          return ok({
            summary: { total: 4, new: 1, duplicate_sent: 1, duplicate_active: 1, duplicate_in_file: 1, invalid: 0 },
            rows: [
              { row: 1, status: 'NEW' },
              { row: 2, status: 'DUPLICATE_SENT', existing_item_id: 9, existing_product_name: 'Akun ML' },
              { row: 3, status: 'DUPLICATE_ACTIVE', existing_item_id: 8 },
              { row: 4, status: 'DUPLICATE_IN_FILE', duplicate_of_row: 1 },
            ],
          })
        }
        saveBody = route.request().postDataJSON()
        return ok({ added: 2, skipped: 2 }, '2 akun ditambahkan, 2 dilewati')
      })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByPlaceholder('uid|username|password|email|password_email|2fa_secret|cookie|notes').fill(PASTE)
    await m.getByRole('button', { name: 'Proses & Preview' }).click()
    await expect(m.getByText('(4 akun)')).toBeVisible()

    const save = m.getByRole('button', { name: /^Simpan/ })
    await expect(save).toBeDisabled() // wajib cek dulu
    await m.getByRole('button', { name: 'Cek Akun' }).click()

    await expect(m.getByText('1 pernah terjual').first()).toBeVisible()
    expect(checkBody.items).toHaveLength(4)
    expect(checkBody.items[0]).toEqual({ account_uid: '111', account_username: 'user1', account_password: 'pass1' })
    expect(checkBody.items.some((i: any) => 'on_duplicate' in i)).toBe(false)
    await expect(m.getByText('Duplikat baris 1')).toBeVisible()
    await expect(save).toHaveText('Simpan (1 akun)')

    // akun pernah terjual default Skip; pilih Tambah ulang
    await m.getByRole('button', { name: 'Tambah ulang', exact: true }).click()
    await expect(save).toHaveText('Simpan (2 akun)')
    await save.click()

    await expect(page.getByText('2 akun ditambahkan, 2 dilewati').first()).toBeVisible()
    expect(saveBody.items.map((i: any) => i.on_duplicate)).toEqual([undefined, 'ADD', 'SKIP', 'SKIP'])
    await expect(m.getByText('(4 akun)')).toHaveCount(0)
  })

  test('mengubah data setelah dicek mewajibkan cek ulang', async ({ page, mockApi }) => {
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', ok({
        summary: { total: 2, new: 2, duplicate_sent: 0, duplicate_active: 0, duplicate_in_file: 0, invalid: 0 },
        rows: [{ row: 1, status: 'NEW' }, { row: 2, status: 'NEW' }],
      }))

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByPlaceholder('uid|username|password|email|password_email|2fa_secret|cookie|notes').fill('111|a|b\n222|c|d')
    await m.getByRole('button', { name: 'Proses & Preview' }).click()
    await m.getByRole('button', { name: 'Cek Akun' }).click()
    await expect(m.getByRole('button', { name: /^Simpan/ })).toBeEnabled()

    await m.locator('tr[data-row="1"]').getByRole('button').last().click() // hapus baris 2
    await expect(m.getByText('Data berubah, cek ulang')).toBeVisible()
    await expect(m.getByRole('button', { name: /^Simpan/ })).toBeDisabled()
  })

  test('baris tidak valid hasil cek memblokir simpan sampai dihapus', async ({ page, mockApi }) => {
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', ok({
        summary: { total: 2, new: 1, duplicate_sent: 0, duplicate_active: 0, duplicate_in_file: 0, invalid: 1 },
        rows: [{ row: 1, status: 'NEW' }, { row: 2, status: 'INVALID', message: 'Data akun kosong' }],
      }))

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByPlaceholder('uid|username|password|email|password_email|2fa_secret|cookie|notes').fill('111|a|b\n|||||||catatan')
    await m.getByRole('button', { name: 'Proses & Preview' }).click()
    await m.getByRole('button', { name: 'Cek Akun' }).click()

    await expect(m.getByText('1 tidak valid')).toBeVisible()
    await expect(m.getByRole('button', { name: /^Simpan/ })).toBeDisabled()
    await m.getByRole('button', { name: 'Hapus baris tidak valid' }).click()
    await expect(m.getByText('(1 akun)')).toBeVisible()
  })

  test('STOCK_CHECK_OUTDATED saat simpan: cek ulang otomatis, tidak ada yang tersimpan', async ({ page, mockApi }) => {
    let checks = 0
    let saves = 0
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', (_route, url) => {
        if (url.searchParams.get('dryRun') === 'true') {
          checks++
          const status = checks === 1 ? 'NEW' : 'DUPLICATE_ACTIVE'
          return ok({
            summary: { total: 1, new: status === 'NEW' ? 1 : 0, duplicate_sent: 0, duplicate_active: status === 'NEW' ? 0 : 1, duplicate_in_file: 0, invalid: 0 },
            rows: [{ row: 1, status }],
          })
        }
        saves++
        return failCode(409, 'Kondisi stok berubah sejak dicek.', { code: 'STOCK_CHECK_OUTDATED', row: 1 })
      })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByPlaceholder('uid|username|password|email|password_email|2fa_secret|cookie|notes').fill('111|a|b')
    await m.getByRole('button', { name: 'Proses & Preview' }).click()
    await m.getByRole('button', { name: 'Cek Akun' }).click()
    await m.getByRole('button', { name: 'Simpan (1 akun)' }).click()

    await expect(page.getByText('Data berubah sejak dicek').first()).toBeVisible()
    await expect(m.getByText('1 masih di stok')).toBeVisible()
    expect(checks).toBe(2)
    expect(saves).toBe(1)
    await expect(m.getByRole('button', { name: 'Simpan (0 akun)' })).toBeVisible()
  })
})

test.describe('Stok seller: banyak file', () => {
  const files = [
    { name: 'akun-a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
    { name: 'akun-b.txt', mimeType: 'text/plain', buffer: Buffer.from('bb') },
  ]

  test('mode biasa: setiap file dikirim sebagai satu item', async ({ page, mockApi }) => {
    const sent: string[] = []
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock', (route) => {
        sent.push(...fileNames(route.request(), 'file'))
        return ok(makeStockItem(sent.length))
      })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('File Only', { exact: true }).click()
    await m.locator('input[type="file"]').setInputFiles(files)
    await m.getByRole('button', { name: 'Upload Semua (2)' }).click()

    await expect(m.getByText('Berhasil: 2')).toBeVisible()
    expect(sent.sort()).toEqual(['akun-a.txt', 'akun-b.txt'])
  })

  test('mode UID dari nama file: cek hanya kirim nama file, simpan kirim file + onDuplicates berpasangan', async ({ page, mockApi }) => {
    let checkReq: Request | null = null
    let saveReq: Request | null = null
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/bulk', (route) => {
        const r = route.request()
        if (formField(r, 'dryRun') === 'true') {
          checkReq = r
          return ok({
            summary: { total: 2, new: 1, duplicate_sent: 1, duplicate_active: 0, duplicate_in_file: 0, invalid: 0 },
            rows: [{ row: 1, status: 'NEW' }, { row: 2, status: 'DUPLICATE_SENT', existing_item_id: 4 }],
          })
        }
        saveReq = r
        return ok({ added: 1, skipped: 1 }, '1 stock item ditambahkan, 1 dilewati')
      })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('File Only', { exact: true }).click()
    await m.getByRole('checkbox', { name: 'Isi UID dari nama file' }).click()
    await m.locator('input[type="file"]').setInputFiles(files)
    await expect(m.getByText('UID: akun-a')).toBeVisible()
    await m.getByRole('button', { name: 'Cek', exact: true }).click()
    await m.getByRole('button', { name: 'Simpan (1 file)' }).click()

    await expect(page.getByText('1 stock item ditambahkan, 1 dilewati').first()).toBeVisible()
    expect(formFields(checkReq!, 'fileNames')).toEqual(['akun-a.txt', 'akun-b.txt'])
    expect(fileNames(checkReq!, 'files')).toEqual([])
    expect(formField(checkReq!, 'uidFromFileName')).toBe('true')
    expect(fileNames(saveReq!, 'files')).toEqual(['akun-a.txt', 'akun-b.txt'])
    expect(formFields(saveReq!, 'onDuplicates')).toEqual(['', 'SKIP'])
    expect(formField(saveReq!, 'dryRun')).toBeNull()
  })
})

test.describe('Stok seller: import CSV akun massal', () => {
  const csvInput = (page: Page) => main(page).locator('input[type="file"][accept=".csv,text/csv"]')
  const okCheck = (n: number) => ok({
    summary: { total: n, new: n, duplicate_sent: 0, duplicate_active: 0, duplicate_in_file: 0, invalid: 0 },
    rows: Array.from({ length: n }, (_, i) => ({ row: i + 1, status: 'NEW' })),
  })

  test('BOM, header beda urutan/huruf besar, cookie berkoma & berkutip, tipe akun dari nama → body BE benar', async ({ page, mockApi }) => {
    let checkBody: any = null
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', (route) => { checkBody = route.request().postDataJSON(); return okCheck(2) })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByRole('button', { name: 'Import CSV' }).click()
    const csv = '﻿Username,Password,UID,Cookie,Type,Notes\r\n'
      + 'user1,pass1,111,"sid=a,b; tok=""x""",Mobile Legends,Rank Mythic\r\n'
      + 'user2,pass2,222,,,\r\n'
    await csvInput(page).setInputFiles({ name: 'akun.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') })
    await expect(m.getByText('(2 akun)')).toBeVisible()
    await m.getByRole('button', { name: 'Cek Akun' }).click()

    await expect.poll(() => checkBody?.items?.length).toBe(2)
    expect(checkBody.items[0]).toMatchObject({
      account_uid: '111', account_username: 'user1', account_password: 'pass1',
      account_cookie: 'sid=a,b; tok="x"', account_type_id: 2, description: 'Rank Mythic',
    })
    expect(checkBody.items[1]).toEqual({ account_uid: '222', account_username: 'user2', account_password: 'pass2' })
  })

  test('tipe akun tak dikenal memblokir cek; header salah ditolak dengan pesan', async ({ page, mockApi }) => {
    let calls = 0
    sellerWithStockProduct(mockApi)
      .on('POST', '/product/5/stock/accounts/bulk', () => { calls++; return okCheck(1) })

    await gotoHydrated(page, '/seller/stock/add/5')
    const m = main(page)
    await m.getByText('Akun Massal', { exact: true }).click()
    await m.getByRole('button', { name: 'Import CSV' }).click()

    await csvInput(page).setInputFiles({ name: 'a.csv', mimeType: 'text/csv', buffer: Buffer.from('type,uid,username\nGame Antah,111,user1\n') })
    await expect(m.getByText('Tipe akun "Game Antah" tidak dikenal')).toBeVisible()
    await expect(m.getByRole('button', { name: 'Cek Akun' })).toBeDisabled()

    await csvInput(page).setInputFiles({ name: 'b.csv', mimeType: 'text/csv', buffer: Buffer.from('nama,sandi\nuser1,pass1\n') })
    await expect(m.getByText(/Header CSV tidak dikenali/)).toBeVisible()
    expect(calls).toBe(0)
  })
})

test.describe('Stok seller: detail & tambah ulang item RETURNED', () => {
  test('detail RETURNED → Tambah ulang: form terisi data lama, password baru dikirim sebagai item baru, daftar dimuat ulang', async ({ page, mockApi }) => {
    let listCalls = 0
    let req: Request | null = null
    sellerWithStockProduct(mockApi)
      .on('GET', '/stock/my/summary', ok({ active: 0, sent: 0, returned: 1, restocked: 0 }))
      .on('GET', '/stock/my', () => { listCalls++; return ok(pageOf([makeStockItem(3, { status: 'RETURNED', account_username: 'lama', account_password: 'pass-lama', transaction_id: 'TX9' })])) })
      .on('POST', '/product/5/stock', (route) => { req = route.request(); return ok(null, 'Stock item berhasil ditambahkan') })

    await gotoHydrated(page, '/seller/stock')
    const m = main(page)
    await m.getByRole('button', { name: 'Detail' }).first().click()
    await page.getByRole('button', { name: 'Tambah ulang ke stok' }).click()

    const dialog = page.getByRole('dialog', { name: 'Tambah Ulang ke Stok' })
    await expect(dialog.getByText('Pastikan akun sudah aman')).toBeVisible()
    await expect(dialog.getByPlaceholder('Contoh: 123456789')).toHaveValue('uid-3')
    await expect(dialog.getByPlaceholder('Username akun')).toHaveValue('lama')
    const before = listCalls
    await dialog.locator('input[type="password"]').first().fill('pass-baru')
    await dialog.getByRole('button', { name: 'Tambah Stok' }).click()

    await expect.poll(() => req && formField(req, 'accountPassword')).toBe('pass-baru')
    expect(formField(req!, 'accountUid')).toBe('uid-3')
    expect(formField(req!, 'accountUsername')).toBe('lama')
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => listCalls).toBeGreaterThan(before)
  })
})
