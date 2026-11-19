import { test, expect, ok, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({
  page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content,
})

test.describe('Admin: daftar produk', () => {
  test('daftar: status, toko & harga; pencarian dan filter toko dari URL dikirim ke BE', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/products/all', (_r, url) => {
      queries.push(url.searchParams)
      return ok(pageOf([
        makeProduct(1, { name: 'Akun Netflix', status: 'ACTIVE', sell_price: 25000 }),
        makeProduct(2, { name: 'Akun Spotify', status: 'REVIEW' }),
      ]))
    })

    await gotoHydrated(page, '/admin/product?merchant_id=10')
    const row = main(page).locator('div.divide-y > div').filter({ hasText: 'Akun Netflix' })
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible()
    await expect(row.getByText('Toko Tes').first()).toBeVisible()
    await expect(row.getByText('25.000')).toBeVisible()
    await expect(row.getByRole('link').first()).toHaveAttribute('href', '/admin/product/view/1')
    expect(queries.at(-1)?.get('merchant_id')).toBe('10')
    expect(queries.at(-1)?.get('status')).toBeNull()

    await main(page).getByPlaceholder('Cari nama produk / merchant...').fill('netflix')
    await main(page).getByPlaceholder('Cari nama produk / merchant...').press('Enter')
    await expect.poll(() => queries.at(-1)?.get('keyword')).toBe('netflix')
  })

  test('filter status: pilih "Aktif" mengirim status, kembali ke "Semua Status" tanpa parameter (F-42)', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/products/all', (_r, url) => {
      queries.push(url.searchParams)
      return ok(pageOf([makeProduct(1)]))
    })

    await gotoHydrated(page, '/admin/product')
    await expect(main(page).getByText('Produk Tes 1')).toBeVisible()

    await main(page).getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Aktif', exact: true }).click()
    await expect.poll(() => queries.at(-1)?.get('status')).toBe('ACTIVE')

    // BE memetakan `status` ke enum: "ALL" ditolak 400 sehingga daftar gagal dimuat
    const before = queries.length
    await main(page).getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Semua Status' }).click()
    await expect.poll(() => queries.length).toBeGreaterThan(before)
    expect(queries.at(-1)?.get('status')).toBeNull()
  })
})

test.describe('Admin: review produk', () => {
  test('daftar hanya REVIEW; setujui lewat konfirmasi, "Batal" tidak memanggil BE, lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    const statuses: (string | null)[] = []
    let products = [makeProduct(5, { name: 'Akun Canva', status: 'REVIEW' })]
    let activated: number[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/products/all', (_r, url) => {
        statuses.push(url.searchParams.get('status'))
        return ok(pageOf(products))
      })
      .on('PATCH', '/product/admin/activate/5', () => {
        activated.push(5)
        products = []
        return ok(makeProduct(5, { status: 'ACTIVE' }))
      })

    await gotoHydrated(page, '/admin/product/review')
    await expect(main(page).getByText('Akun Canva').first()).toBeVisible()
    expect(statuses[0]).toBe('REVIEW')

    await main(page).getByRole('button', { name: 'Setujui' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Setujui Produk?' })
    await dialog.getByRole('button', { name: 'Batal' }).click()
    expect(activated).toEqual([])

    const loadsBefore = statuses.length
    await main(page).getByRole('button', { name: 'Setujui' }).first().click()
    await dialog.getByRole('button', { name: 'Ya, Setujui' }).click()

    await expect(page.getByText('Akun Canva telah diaktifkan.').first()).toBeVisible()
    expect(activated).toEqual([5])
    await expect.poll(() => statuses.length).toBeGreaterThan(loadsBefore)
    await expect(main(page).getByText('Akun Canva')).toHaveCount(0)
  })
})
