import { test, expect, ok, fail, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

test.describe('Dashboard seller', () => {
  test('ringkasan keuangan & produk dari endpoint ringkasan; satu ringkasan gagal tidak menyembunyikan yang lain', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
      .on('GET', '/seller/finance/summary', ok({ today_transaction_amount: 150000, total_income: 2500000, withdrawn: 1000000 }))
      .on('GET', '/seller/products/summary', ok({ active: 7, in_review: 2, blocked: 1 }))
      .on('GET', '/seller/orders/summary', fail(500, 'Gagal memuat ringkasan pesanan'))
      .on('GET', '/tx/seller', ok(emptyPage()))
      .on('GET', '/user/penalty/stat', ok(null))

    await gotoHydrated(page, '/seller/dashboard')
    const m = main(page)
    await expect(m.getByText('Rp 2.500.000').first()).toBeVisible()
    await expect(m.getByText('Rp 1.000.000').first()).toBeVisible()
    await expect(m.getByText('Produk sedang direview')).toBeVisible()
    await expect(m.getByText('Gagal memuat ringkasan pesanan').first()).toBeVisible()
    await expect(m.getByText('dari 20 pesanan terbaru').first()).toBeVisible()
  })
})
