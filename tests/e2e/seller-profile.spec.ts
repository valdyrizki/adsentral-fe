import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const MERCHANT = {
  id: 10, name: 'Toko Budi', slug: 'toko-budi', description: 'Jual akun game', logo_url: null, banner_url: null,
  is_holiday: false, country: 'Indonesia', open_time: '08:00', close_time: '20:00', status: 'ACTIVE',
}

const fields = (req: Request) => Object.fromEntries(
  [...(req.postDataBuffer()?.toString('latin1') ?? '').matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)].map((m) => [m[1], m[2]]))

test.describe('Profil toko seller', () => {
  test('form terisi; simpan mengirim field multipart BE (camelCase)', async ({ page, mockApi }) => {
    let sent: Record<string, string> = {}
    mockApi.asRole('SELLER')
      .on('GET', '/merchant/my', ok(MERCHANT))
      .on('PATCH', '/merchant/update', (route) => { sent = fields(route.request()); return ok(MERCHANT) })

    await gotoHydrated(page, '/seller/profile')
    const m = main(page)
    await expect(m.getByPlaceholder('Masukkan nama toko')).toHaveValue('Toko Budi')
    await m.getByPlaceholder('Masukkan nama toko').fill('Toko Budi Jaya')
    await m.getByRole('switch').click()
    await m.getByRole('button', { name: /Simpan/ }).click()

    await expect(page.getByText('Profil toko berhasil diperbarui').first()).toBeVisible()
    expect(sent).toMatchObject({
      name: 'Toko Budi Jaya', description: 'Jual akun game', isHoliday: 'true',
      country: 'Indonesia', openTime: '08:00', closeTime: '20:00',
    })
  })

  test('pesan error BE tampil, bukan status HTTP', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
      .on('GET', '/merchant/my', ok(MERCHANT))
      .on('PATCH', '/merchant/update', fail(400, 'Format openTime tidak valid, gunakan HH:mm (contoh: 08:00)'))

    await gotoHydrated(page, '/seller/profile')
    await expect(main(page).getByPlaceholder('Masukkan nama toko')).toHaveValue('Toko Budi')
    await main(page).getByRole('button', { name: /Simpan/ }).click()
    await expect(page.getByText('Format openTime tidak valid, gunakan HH:mm (contoh: 08:00)').first()).toBeVisible()
  })

  test('logo GIF ditolak di klien sesuai aturan BE (JPG/PNG/WEBP) (F-74)', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('SELLER')
      .on('GET', '/merchant/my', ok(MERCHANT))
      .on('PATCH', '/merchant/update', () => { calls++; return fail(400, 'Logo must be JPG, PNG, or WEBP format') })

    await gotoHydrated(page, '/seller/profile')
    const m = main(page)
    await expect(m.getByText('JPG, PNG, atau WEBP (maks. 2MB)').first()).toBeVisible()
    await m.locator('input[type="file"]').first()
      .setInputFiles({ name: 'logo.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') })
    await m.getByRole('button', { name: /Simpan/ }).click()
    await expect(m.getByText('Logo harus JPG, PNG, atau WEBP')).toBeVisible()
    await page.waitForTimeout(300)
    expect(calls).toBe(0)
  })

  test('nama < 3 karakter & jam buka tanpa jam tutup ditolak di klien', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('SELLER')
      .on('GET', '/merchant/my', ok({ ...MERCHANT, open_time: null, close_time: null }))
      .on('PATCH', '/merchant/update', () => { calls++; return ok(MERCHANT) })

    await gotoHydrated(page, '/seller/profile')
    const m = main(page)
    await expect(m.getByPlaceholder('Masukkan nama toko')).toHaveValue('Toko Budi')
    await m.getByPlaceholder('Masukkan nama toko').fill('AB')
    await m.locator('input[type="time"]').first().fill('09:00')
    await m.getByRole('button', { name: /Simpan/ }).click()
    await expect(m.getByText(/Nama toko minimal 3 karakter/)).toBeVisible()
    await expect(m.getByText(/Jam buka dan jam tutup harus diisi keduanya/)).toBeVisible()
    expect(calls).toBe(0)
  })
})
