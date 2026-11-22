import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'

const setting = (key: string, value: string, group: string) => ({
  id: key, key, value, description: '', group, is_public: true,
  created_at: '2026-11-01T10:00:00', updated_at: '2026-11-01T10:00:00',
})

const CONTACT = [
  setting('WA_NUMBER', '0812-3456-789', 'CONTACT'),
  setting('EMAIL', 'cs@contoh.test', 'CONTACT'),
  setting('ADDRESS', 'Jl. Contoh 1, Bandung', 'CONTACT'),
]
const SOCIAL = [setting('INSTAGRAM', 'adsentral_tes', 'SOCIAL_MEDIA')]

test.describe('Halaman statis: smoke test', () => {
  for (const [path, heading] of [
    ['/tentang-kami', 'Tentang Adsentral'],
    ['/karir', 'Bergabung dengan Tim Adsentral'],
    ['/blog', 'Blog'],
    ['/hubungi-kami', 'Hubungi Kami'],
  ] as const) {
    test(`${path} terbuka tanpa error JavaScript`, async ({ page, mockApi }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      mockApi.on('GET', '/system/settings/public/group', ok([]))

      await gotoHydrated(page, path)
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText(heading)
      expect(errors).toEqual([])
    })
  }
})

test.describe('Hubungi Kami', () => {
  test('kontak & media sosial dari setting publik; email memakai SLA CS (F-66)', async ({ page, mockApi }) => {
    mockApi.on('GET', '/system/settings/public/group', (_r, url) =>
      ok(url.searchParams.get('group') === 'CONTACT' ? CONTACT : SOCIAL))

    await gotoHydrated(page, '/hubungi-kami')
    const m = page.getByRole('main')
    await expect(m.getByText('0812-3456-789')).toBeVisible()
    await expect(m.locator('a[href^="https://wa.me/08123456789"]').first()).toBeVisible()
    await expect(m.getByText('cs@contoh.test')).toBeVisible()
    await expect(m.getByText('Jl. Contoh 1, Bandung')).toBeVisible()
    await expect(m.locator('a[href="https://instagram.com/adsentral_tes"]')).toBeVisible()
    await expect(m.getByText('Balas dalam 1×24 jam', { exact: true })).toHaveCount(0)
    await expect(m.getByText('1×24 jam kerja').first()).toBeVisible()
    // jam layanan belum diisi di setting → jam CS di PRD, bukan "-"
    await expect(m.getByText('11.00–21.00 WIB').first()).toBeVisible()
  })

  test('media sosial gagal dimuat: kontak tetap tampil (F-67)', async ({ page, mockApi }) => {
    mockApi.on('GET', '/system/settings/public/group', (_r, url) =>
      url.searchParams.get('group') === 'CONTACT' ? ok(CONTACT) : fail(500, 'Internal server error'))

    await gotoHydrated(page, '/hubungi-kami')
    await expect(page.getByRole('main').getByText('0812-3456-789')).toBeVisible()
  })

  test('form: field wajib dicek; kirim membuka WhatsApp dengan isi pesan', async ({ page, mockApi }) => {
    mockApi.on('GET', '/system/settings/public/group', (_r, url) =>
      ok(url.searchParams.get('group') === 'CONTACT' ? CONTACT : SOCIAL))
    await page.addInitScript(() => {
      (window as any).__opened = [];
      window.open = ((url: string) => { (window as any).__opened.push(url); return null }) as typeof window.open
    })

    await gotoHydrated(page, '/hubungi-kami')
    const m = page.getByRole('main')
    await expect(m.getByText('0812-3456-789')).toBeVisible()
    await m.getByRole('button', { name: 'Kirim Pesan' }).click()
    await expect(page.getByText('Isi semua field wajib').first()).toBeVisible()

    await m.getByPlaceholder('Masukkan nama Anda').fill('Budi')
    await m.getByPlaceholder('email@contoh.com').fill('budi@contoh.test')
    await m.locator('textarea').first().fill('Pesanan saya belum dikirim')
    await m.getByRole('button', { name: 'Kirim Pesan' }).click()

    const opened: string[] = await page.evaluate(() => (window as any).__opened)
    expect(opened).toHaveLength(1)
    expect(opened[0]).toMatch(/^https:\/\/wa\.me\/08123456789\?text=/)
    const text = decodeURIComponent(opened[0]!.split('text=')[1]!)
    expect(text).toContain('*Nama:* Budi')
    expect(text).toContain('Pesanan saya belum dikirim')
  })
})

test.describe('Konten statis tanpa data contoh (F-71)', () => {
  const contactOnly = (mockApi: import('./support/fixtures').MockApi) =>
    mockApi.on('GET', '/system/settings/public/group', (_r, url) =>
      ok(url.searchParams.get('group') === 'CONTACT' ? CONTACT : []))

  test('header & Tentang Kami memakai kontak dari setting; tanpa angka statistik karangan', async ({ page, mockApi }) => {
    contactOnly(mockApi)
    await gotoHydrated(page, '/tentang-kami')
    await expect(page.locator('header').getByText('Hubungi Kami : 0812-3456-789')).toBeVisible()
    const m = page.getByRole('main')
    await expect(m.getByText('cs@contoh.test')).toBeVisible()
    await expect(m.getByText('Jl. Contoh 1, Bandung')).toBeVisible()
    await expect(page.getByText('085855558813')).toHaveCount(0)
    await expect(m.getByText('support@adsentral.id')).toHaveCount(0)
    await expect(m.getByText('Adsentral dalam Angka')).toHaveCount(0)
    await expect(m.getByText('99%')).toHaveCount(0)
  })

  test('Blog tanpa artikel contoh; Karir tanpa lowongan contoh, CV ke email setting', async ({ page, mockApi }) => {
    contactOnly(mockApi)
    await gotoHydrated(page, '/blog')
    await expect(page.getByRole('main').getByText('Belum ada artikel.')).toBeVisible()
    await expect(page.getByText('5 Tips Belanja Online Agar Tidak Tertipu')).toHaveCount(0)

    await gotoHydrated(page, '/karir')
    const m = page.getByRole('main')
    await expect(m.getByText('Belum ada lowongan tersedia')).toBeVisible()
    await expect(m.getByText('Frontend Engineer (Vue/Nuxt)')).toHaveCount(0)
    await expect(m.getByRole('link', { name: 'Kirim CV ke cs@contoh.test' })).toHaveAttribute('href', 'mailto:cs@contoh.test?subject=Lamaran')
  })
})
