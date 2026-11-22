import { test, expect, ok, emptyPage, gotoHydrated } from './support/fixtures'
import { makeTx } from './support/payment'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const card = (page: Page, label: string) => main(page).locator('div.flex.items-start.justify-between').filter({ hasText: label })

const metric = (year: number, month: number, gmv: number) => ({
  year, month, gmv, completed_transactions: 1, active_sellers: 1, paid_transactions: 1,
  refunded_transactions: 0, arbitrage_transactions: 0, guarantee_claims: 0,
})

test.describe('Dashboard admin', () => {
  test('arbitrase dari /admin/alerts & GMV dari metrik bulanan, bukan dari 20 transaksi terbaru (F-69)', async ({ page, mockApi }) => {
    // 20 transaksi terbaru: tidak ada ARBITRAGE, satu COMPLETE senilai Rp 999.000
    const txs = Array.from({ length: 20 }, (_, i) =>
      makeTx(`TX-${i}`, `PAY-${i}`, { status: i === 0 ? 'COMPLETE' : 'PAID', total_price: i === 0 ? 999000 : 10000 }))
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/alerts', ok({ arbitrage_pending: 4 }))
      .on('GET', '/tx/all', ok({ ...emptyPage(), content: txs, total_elements: 350, total_pages: 18 }))
      .on('GET', '/products', ok({ ...emptyPage(), total_elements: 42 }))
      .on('GET', '/categories', ok([]))
      .on('GET', '/system/settings/all', ok([]))
      .on('GET', '/admin/metrics/monthly', ok([
        metric(2026, 6, 100000), metric(2026, 7, 200000), metric(2026, 8, 300000),
        metric(2026, 9, 400000), metric(2026, 10, 500000), metric(2026, 11, 1500000),
      ]))

    await gotoHydrated(page, '/admin/dashboard')
    await expect(card(page, 'Total Transaksi')).toContainText('350')
    await expect(card(page, 'Perlu Ditinjau')).toContainText('4')
    await expect(card(page, 'GMV 6 Bulan')).toContainText('Rp 3.000.000')
    await expect(card(page, 'GMV 6 Bulan')).not.toContainText('999.000')
    await expect(main(page).getByText('20 transaksi terbaru')).toBeVisible()
  })

  test('alerts & metrik gagal: tampil "-", bukan 0', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/alerts', ok({ arbitrage_pending: null }))
      .on('GET', '/tx/all', ok(emptyPage()))
      .on('GET', '/products', ok(emptyPage()))
      .on('GET', '/categories', ok([]))
      .on('GET', '/system/settings/all', ok([]))

    await gotoHydrated(page, '/admin/dashboard')
    await expect(card(page, 'Perlu Ditinjau')).toContainText('-')
    await expect(card(page, 'Perlu Ditinjau')).not.toContainText('0')
    await expect(card(page, 'GMV 6 Bulan')).toContainText('-')
  })
})
