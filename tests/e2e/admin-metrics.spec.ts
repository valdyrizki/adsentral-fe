import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const metric = (year: number, month: number, overrides: Record<string, number> = {}) => ({
  year,
  month,
  completed_transactions: 0,
  gmv: 0,
  active_sellers: 0,
  paid_transactions: 0,
  refunded_transactions: 0,
  arbitrage_transactions: 0,
  guarantee_claims: 0,
  ...overrides,
})

test.describe('Admin: metrik bulanan (EP05-04)', () => {
  test('kartu bulan berjalan + perubahan dari bulan lalu, rincian terbaru di atas dengan rasio', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    const requestedMonths: string[] = []
    mockApi.on('GET', '/admin/metrics/monthly', (_route, url) => {
      requestedMonths.push(url.searchParams.get('months') ?? '')
      return ok([
        metric(2026, 10, { completed_transactions: 40, gmv: 4_000_000, active_sellers: 5, paid_transactions: 50 }),
        metric(2026, 11, {
          completed_transactions: 50, gmv: 5_500_000, active_sellers: 4,
          paid_transactions: 80, refunded_transactions: 4, arbitrage_transactions: 2, guarantee_claims: 5,
        }),
      ])
    })

    await gotoHydrated(page, '/admin/finance/metrics')

    await expect(main(page).getByText('Rp 5.500.000').first()).toBeVisible()
    await expect(main(page).getByText('+25% dari Oktober 2026')).toBeVisible()
    await expect(main(page).getByText('+37,5% dari Oktober 2026')).toBeVisible()
    await expect(main(page).getByText('-20% dari Oktober 2026')).toBeVisible()

    const rows = main(page).getByTestId('metric-row')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('November 2026')
    await expect(rows.first()).toContainText('(5% dari 80 dibayar)')
    await expect(rows.first()).toContainText('(2,5%)')
    await expect(rows.first()).toContainText('(10% per selesai)')
    await expect(rows.nth(1)).toContainText('Oktober 2026')
    expect(requestedMonths[0]).toBe('6')
  })

  test('ganti rentang memuat ulang dengan jumlah bulan baru; pembagi 0 tampil "-"', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    const requestedMonths: string[] = []
    mockApi.on('GET', '/admin/metrics/monthly', (_route, url) => {
      requestedMonths.push(url.searchParams.get('months') ?? '')
      return ok([metric(2026, 11)])
    })

    await gotoHydrated(page, '/admin/finance/metrics')
    await expect(main(page).getByTestId('metric-row')).toContainText('(- dari 0 dibayar)')

    await main(page).getByRole('combobox').click()
    await page.getByRole('option', { name: '12 bulan terakhir' }).click()

    await expect.poll(() => requestedMonths).toContain('12')
  })

  test('error BE ditampilkan', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/metrics/monthly', fail(500, 'Database sedang gangguan'))

    await gotoHydrated(page, '/admin/finance/metrics')

    await expect(main(page).getByText('Database sedang gangguan')).toBeVisible()
  })
})
