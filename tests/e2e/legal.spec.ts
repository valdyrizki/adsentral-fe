import { test, expect, ok, gotoHydrated } from './support/fixtures'

// EP08-05: halaman legal dari draf BE (scripts/sync-legal.mjs) + persetujuan wajib saat registrasi.

const PAGES = [
  { path: '/syarat-ketentuan', heading: 'Syarat & Ketentuan Adsentral' },
  { path: '/kebijakan-privasi', heading: 'Kebijakan Privasi Adsentral' },
  { path: '/kebijakan-refund-garansi', heading: 'Kebijakan Refund & Garansi Adsentral' },
  { path: '/produk-terlarang', heading: 'Daftar Produk Terlarang & Ketentuan Produk' },
]

test.describe('Halaman legal', () => {
  for (const { path, heading } of PAGES) {
    test(`${path}: isi draf tampil dengan banner Draf, tanpa catatan internal`, async ({ page, mockApi }) => {
      mockApi.asGuest()
      await gotoHydrated(page, path)

      const doc = page.getByTestId('legal-document')
      await expect(doc.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(page.getByTestId('legal-draft-banner')).toBeVisible()
      await expect(doc).not.toContainText('belum ditinjau ahli hukum')
      await expect(doc).not.toContainText('*(')
      // tautan antar-dokumen menuju route, bukan file .md
      for (const href of await doc.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
        expect(href).not.toMatch(/\.md/)
      }
    })
  }

  test('tautan antar-dokumen membuka halaman legal lain', async ({ page, mockApi }) => {
    mockApi.asGuest()
    await gotoHydrated(page, '/syarat-ketentuan')
    await page.getByTestId('legal-document').getByRole('link', { name: 'Kebijakan Refund & Garansi' }).first().click()
    await expect(page).toHaveURL(/\/kebijakan-refund-garansi$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Kebijakan Refund & Garansi Adsentral' })).toBeVisible()
  })
})

test.describe('Registrasi: persetujuan S&K dan privasi', () => {
  test('tombol Daftar nonaktif sampai dicentang; request membawa accepted_terms', async ({ page, mockApi }) => {
    mockApi.asGuest()
    let sent: any = null
    mockApi.on('POST', '/user/register', (route) => {
      sent = route.request().postDataJSON()
      return ok(null)
    })

    await gotoHydrated(page, '/register')
    await page.locator('#fullname').fill('Tes Daftar')
    await page.locator('#email').fill('daftar@test.local')
    await page.locator('#username').fill('tesdaftar')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')
    const daftar = page.getByRole('main').getByRole('button', { name: 'Daftar' })
    await expect(daftar).toBeDisabled()
    const terms = page.getByTestId('register-terms')
    await expect(terms.getByRole('link', { name: 'Syarat & Ketentuan' })).toHaveAttribute('href', '/syarat-ketentuan')
    await expect(terms.getByRole('link', { name: 'Kebijakan Privasi' })).toHaveAttribute('href', '/kebijakan-privasi')

    await page.getByTestId('register-terms-checkbox').check()
    await daftar.click()

    await expect(page.getByText('Register Berhasil').first()).toBeVisible()
    expect(sent).toMatchObject({ email: 'daftar@test.local', accepted_terms: true })
  })
})
