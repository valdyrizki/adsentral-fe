import { test, expect, gotoHydrated } from './support/fixtures'

// FAQ Pusat Bantuan dan panduan wajib sesuai S&K dan Kebijakan Refund & Garansi (app/legal), bukan template toko barang fisik.

test.describe('Halaman bantuan', () => {
  test('Pusat Bantuan: FAQ refund sesuai kebijakan dan kontak diarahkan ke Hubungi Kami', async ({ page, mockApi }) => {
    mockApi.asGuest()
    await gotoHydrated(page, '/pusat-bantuan')

    await page.getByRole('button', { name: 'Refund & Garansi' }).click()
    await page.getByRole('button', { name: 'Ke mana uang refund dikembalikan?' }).click()
    await expect(page.getByText('Ke Saldo Belanja, segera setelah status pesanan berubah')).toBeVisible()

    await page.getByRole('button', { name: 'Pengiriman' }).click()
    await expect(page.getByRole('button', { name: 'Kapan produk dikirim?' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/resi|kurir/i)

    await expect(page.getByTestId('help-contact-link')).toHaveAttribute('href', '/hubungi-kami')
    await expect(page.locator('body')).not.toContainText('Senin – Jumat')
  })

  test('Panduan Belanja: komplain kiriman 24 jam, bukan 2×24 jam', async ({ page, mockApi }) => {
    mockApi.asGuest()
    await gotoHydrated(page, '/panduan-belanja')

    await page.getByRole('button', { name: 'Bagaimana jika produk yang diterima tidak sesuai?' }).click()
    await expect(page.getByText('Tolak kiriman dari halaman pesanan dalam 24 jam')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('2×24')
    await expect(page.locator('body')).not.toContainText(/alamat|kurir/i)
  })

  test('Panduan Berjualan: fee sesuai S&K', async ({ page, mockApi }) => {
    mockApi.asGuest()
    await gotoHydrated(page, '/panduan-berjualan')

    await page.getByRole('button', { name: 'Apakah berjualan di Adsentral gratis?' }).click()
    await expect(page.getByText('fee transaksi 10% dari harga produk')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('tipe akun Seller')
  })
})
