import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({
  page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content,
})

test.describe('Admin: tolak/suspend produk wajib alasan (EP06-02)', () => {
  test('tolak dari antrean review mengirim alasan; alasan < 10 karakter tidak bisa dikirim', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let rejected = false
    let sentBody: unknown = null
    mockApi.on('GET', '/products/all', () => ok(pageOf(rejected ? [] : [makeProduct(7, { status: 'REVIEW' })])))
    mockApi.on('PATCH', '/product/reject/7', (route) => {
      sentBody = route.request().postDataJSON()
      rejected = true
      return ok(null)
    })

    await gotoHydrated(page, '/admin/product/review')
    await main(page).getByRole('button', { name: 'Tolak' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Produk "Produk Tes 7" dari Toko Tes akan ditolak')
    const submit = dialog.getByRole('button', { name: 'Tolak Produk' })
    await dialog.getByRole('textbox').fill('kurang  ')
    await expect(submit).toBeDisabled()

    await dialog.getByRole('textbox').fill('  Deskripsi memuat nomor WA penjual  ')
    await submit.click()

    await expect(page.getByText('Produk Ditolak').first()).toBeVisible()
    expect(sentBody).toEqual({ reason: 'Deskripsi memuat nomor WA penjual' })
    await expect(dialog).toBeHidden()
    await expect(main(page).getByRole('button', { name: 'Tolak' })).toHaveCount(0)
  })

  test('suspend produk aktif mengirim alasan; error BE tampil dan dialog tetap terbuka', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let calls = 0
    let sentBody: unknown = null
    mockApi.on('GET', '/products/all', () => ok(pageOf([makeProduct(8)])))
    mockApi.on('PATCH', '/product/suspend/8', (route) => {
      calls++
      sentBody = route.request().postDataJSON()
      return calls === 1 ? fail(400, 'Alasan 10-500 karakter') : ok(null)
    })

    await gotoHydrated(page, '/admin/product')
    await main(page).getByRole('button', { name: 'Suspend' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Produk termasuk daftar terlarang')
    await dialog.getByRole('button', { name: 'Suspend Produk' }).click()

    await expect(page.getByText('Alasan 10-500 karakter').first()).toBeVisible()
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Suspend Produk' }).click()
    await expect(page.getByText('Produk Disuspend').first()).toBeVisible()
    expect(sentBody).toEqual({ reason: 'Produk termasuk daftar terlarang' })
  })
})
