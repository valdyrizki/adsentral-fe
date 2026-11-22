import { test, expect, ok, fail, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const makeStockItem = (id: number, overrides: Record<string, unknown> = {}) => ({
  id, product_id: 5, product_name: 'Akun ML', product_banner_url: null, description: null,
  file_name: null, file_url: null, file_size: null, file_type: null, status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00', transaction_id: null, account_type_id: null, account_type_name: null,
  account_uid: `uid-${id}`, account_username: null, account_password: null, account_email: null,
  account_email_password: null, account_two_fa_secret: null, account_cookie: null, ...overrides,
})

test.describe('Admin: stok semua seller (/admin/stock)', () => {
  test('daftar tampil; filter produk & akun dikirim dengan nama param BE, kembali ke halaman 1; reset', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/admin/stock/summary', ok({ active: 0, sent: 0, returned: 0, restocked: 0 })).on('GET', '/admin/stock', (_r, url) => {
      queries.push(url.searchParams)
      return ok({ ...emptyPage(), total_elements: 2, total_pages: 1, content: [
        makeStockItem(1, { product_name: 'Akun ML Sultan' }),
        makeStockItem(2, { product_name: 'Akun FF', status: 'SENT', transaction_id: 'TX-9' }),
      ] })
    })

    await gotoHydrated(page, '/admin/stock')
    await expect(main(page).getByText('Akun ML Sultan')).toBeVisible()
    await expect(main(page).getByText('(2 item)')).toBeVisible()
    await expect(main(page).getByText('uid-1')).toBeVisible()

    await main(page).getByPlaceholder('Nama produk...').fill('Sultan')
    await main(page).getByPlaceholder('Cari akun (UID / username / email)...').fill('  uid-1  ')
    await expect.poll(() => queries.at(-1)?.get('account')).toBe('uid-1')
    const q = queries.at(-1)!
    expect(q.get('productName')).toBe('Sultan')
    expect(q.get('page')).toBe('0')
    expect(q.get('status')).toBeNull()

    await main(page).getByRole('button', { name: 'Reset' }).click()
    await expect.poll(() => queries.at(-1)?.get('productName') ?? null).toBeNull()
    expect(queries.at(-1)!.get('account')).toBeNull()
  })

  test('filter toko dari detail seller (?merchant_id) dikirim sebagai merchant_id', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/admin/stock/summary', ok({ active: 0, sent: 0, returned: 0, restocked: 0 })).on('GET', '/admin/stock', (_r, url) => { queries.push(url.searchParams); return ok(emptyPage()) })

    await gotoHydrated(page, '/admin/stock?merchant_id=7')
    await expect(main(page).getByText('Filter toko #7')).toBeVisible()
    expect(queries.at(-1)!.get('merchant_id')).toBe('7')
  })

  test('badge status dari ringkasan BE (seluruh hasil filter), bukan dari halaman aktif (F-70)', async ({ page, mockApi }) => {
    const summaryQueries: URLSearchParams[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/stock', ok({ ...emptyPage(), total_elements: 120, total_pages: 6, content: [makeStockItem(1)] }))
      .on('GET', '/admin/stock/summary', (_r, url) => {
        summaryQueries.push(url.searchParams)
        return ok({ active: 90, sent: 25, returned: 3, restocked: 2 })
      })

    await gotoHydrated(page, '/admin/stock?merchant_id=7')
    await expect(main(page).getByText('Aktif: 90')).toBeVisible()
    await expect(main(page).getByText('Terkirim: 25')).toBeVisible()
    await expect(main(page).getByText('Dikembalikan: 3')).toBeVisible()
    await expect(main(page).getByText('Ditambah Ulang: 2')).toBeVisible()
    expect(summaryQueries.at(-1)!.get('merchant_id')).toBe('7')

    await main(page).getByPlaceholder('Nama produk...').fill('Sultan')
    await expect.poll(() => summaryQueries.at(-1)?.get('productName')).toBe('Sultan')
    expect(summaryQueries.at(-1)!.get('page')).toBeNull()
  })

  test('kosong dan gagal muat dibedakan', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/admin/stock/summary', ok({ active: 0, sent: 0, returned: 0, restocked: 0 })).on('GET', '/admin/stock', fail(500, 'Gagal memuat stok dari server'))
    await gotoHydrated(page, '/admin/stock')
    await expect(main(page).getByText('Gagal memuat stok dari server')).toBeVisible()
  })
})
