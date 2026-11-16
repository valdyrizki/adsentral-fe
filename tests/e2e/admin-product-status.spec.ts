import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({
  page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content,
})

// EP06-03: BE menolak aksi status admin dari status asal yang tidak sah dengan 409 (mis. seller baru saja
// menonaktifkan produknya). Pesan BE tampil apa adanya dan daftar dimuat ulang supaya tombolnya sesuai status baru.
test.describe('Admin: aksi status produk dari status basi (EP06-03)', () => {
  test('aktifkan ditolak 409: pesan BE tampil dan daftar dimuat ulang dengan status terbaru', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let loads = 0
    mockApi.on('GET', '/products/all', () => {
      loads++
      return ok(pageOf([makeProduct(9, { status: loads === 1 ? 'SUSPEND' : 'INACTIVE' })]))
    })
    mockApi.on('PATCH', '/product/admin/activate/9', () => fail(409, 'Produk berstatus INACTIVE tidak bisa diaktifkan admin'))

    await gotoHydrated(page, '/admin/product')
    await main(page).getByRole('button', { name: 'Aktifkan' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, Setujui' }).click()

    await expect(page.getByText('Produk berstatus INACTIVE tidak bisa diaktifkan admin').first()).toBeVisible()
    await expect.poll(() => loads).toBeGreaterThan(1)
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toHaveCount(0)
  })

  test('suspend ditolak 409: dialog alasan ditutup, pesan BE tampil, daftar dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let loads = 0
    mockApi.on('GET', '/products/all', () => {
      loads++
      return ok(pageOf([makeProduct(8, { status: loads === 1 ? 'ACTIVE' : 'NONACTIVE' })]))
    })
    mockApi.on('PATCH', '/product/suspend/8', () => fail(409, 'Produk berstatus NONACTIVE tidak bisa ditangguhkan admin'))

    await gotoHydrated(page, '/admin/product/review')
    await main(page).getByRole('button', { name: 'Suspend' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Produk termasuk daftar terlarang')
    await dialog.getByRole('button', { name: 'Suspend Produk' }).click()

    await expect(page.getByText('Produk berstatus NONACTIVE tidak bisa ditangguhkan admin').first()).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect.poll(() => loads).toBeGreaterThan(1)
  })
})
