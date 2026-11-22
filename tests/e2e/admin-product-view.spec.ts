import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const FEES = [{ key: 'TRX_FEE', value: '10' }, { key: 'TRX_FEE_VERIFIED', value: '5' }]

test.describe('Admin: detail produk (/admin/product/view/[id])', () => {
  test('detail tampil; estimasi pendapatan sesuai status verifikasi seller (F-75); lampiran AUTO bisa diunduh', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/system/settings/public', ok(FEES))
      .on('GET', '/product/admin/7', ok(makeProduct(7, {
        name: 'Akun Spotify Family', sell_price: 50000, status: 'REVIEW', delivery_type: 'AUTO', verified_seller: true,
        auto_config: { title: 'Akun Spotify', description: 'Login pakai email', file_url: 'https://r2.test/a.txt?sig=1', file_name: 'akun.txt' },
      })))

    await gotoHydrated(page, '/admin/product/view/7')
    const m = main(page)
    await expect(m.locator('input[disabled]').first()).toBeVisible()
    await expect(m.getByText('Menunggu Review').first()).toBeVisible()
    await expect(m.getByText('Biaya Admin (5%)')).toBeVisible()
    await expect(m.getByText('Rp 47.500')).toBeVisible()
    await expect(m.getByText('akun.txt')).toBeVisible()
    await expect(m.getByRole('link', { name: 'Unduh' })).toBeVisible()
  })

  test('seller belum terverifikasi memakai TRX_FEE (F-75)', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/system/settings/public', ok(FEES))
      .on('GET', '/product/admin/8', ok(makeProduct(8, { sell_price: 50000, verified_seller: false })))

    await gotoHydrated(page, '/admin/product/view/8')
    await expect(main(page).getByText('Biaya Admin (10%)')).toBeVisible()
    await expect(main(page).getByText('Rp 45.000')).toBeVisible()
  })

  test('produk tidak ditemukan / gagal dimuat', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/system/settings/public', ok(FEES))
      .on('GET', '/product/admin/9', fail(404, 'Product not found'))

    await gotoHydrated(page, '/admin/product/view/9')
    await expect(main(page).getByText('Produk yang Anda cari tidak ditemukan atau tidak dapat diakses.')).toBeVisible()
  })
})

test.describe('Halaman create/edit produk admin dihapus (F-43)', () => {
  for (const path of ['/admin/product/create', '/admin/product/edit/7']) {
    test(`${path} → 404 (admin tidak membuat/mengubah produk seller)`, async ({ page, mockApi }) => {
      let writes = 0
      mockApi.asRole('ADMIN')
        .on('GET', '/system/settings/public', ok(FEES))
        .on('GET', '/product/my/7', ok(makeProduct(7)))
        .on('POST', '/product/create', () => { writes++; return fail(403, 'Forbidden') })
        .on('PATCH', '/product/update/7', () => { writes++; return fail(403, 'Forbidden') })

      await page.goto(path)
      await expect(page.getByText(`Page not found: ${path}`)).toBeVisible()
      expect(writes).toBe(0)
    })
  }
})
