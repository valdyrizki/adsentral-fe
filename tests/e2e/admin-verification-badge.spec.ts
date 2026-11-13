import { test, expect, ok, emptyPage, gotoHydrated } from './support/fixtures'

test.describe('Admin: badge Verifikasi Akun (EP06-01)', () => {
  test('jumlah pengajuan PENDING tampil di menu; null/0 disembunyikan', async ({ page, mockApi }) => {
    let pending: number | null = 3
    mockApi
      .asRole('ADMIN')
      .on('GET', '/admin/alerts', () => ok({ pending_verifications: pending }))
      .on('GET', '/admin/verification', ok(emptyPage()))

    await gotoHydrated(page, '/admin/verification')
    const menu = page.locator('a[href="/admin/verification"]').first()
    await expect(menu).toContainText('3')

    pending = null
    await gotoHydrated(page, '/admin/verification')
    await expect(page.locator('a[href="/admin/verification"]').first()).toBeVisible()
    await expect(page.locator('a[href="/admin/verification"]').first()).not.toContainText(/\d/)
  })
})
