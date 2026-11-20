import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const setting = (id: string, key: string, value: string, over: Record<string, unknown> = {}) => ({
  id, key, value, description: '', group: 'FEE', is_public: true,
  created_at: '2026-11-01T10:00:00', updated_at: '2026-11-01T10:00:00', ...over,
})

const SETTINGS = [
  setting('11111111-1111-1111-1111-111111111111', 'APP_FEE', '1000'),
  setting('22222222-2222-2222-2222-222222222222', 'WD_MAX_UNVERIFIED', '5000000', { is_public: false }),
]

test.describe('System settings admin', () => {
  test('tambah setting: default privat; key duplikat menampilkan pesan BE', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/system/settings/all', ok(SETTINGS))
      .on('POST', '/system/setting/create', (route) => { body = route.request().postDataJSON(); return fail(409, 'Key "APP_FEE" sudah dipakai setting lain') })

    await gotoHydrated(page, '/admin/settings/system')
    await expect(main(page).getByText('WD_MAX_UNVERIFIED')).toBeVisible()
    await main(page).getByRole('button', { name: 'Create' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah System Setting' })
    await expect(dialog.getByRole('checkbox')).not.toBeChecked()
    await dialog.getByPlaceholder('contoh: app.name').fill(' APP_FEE ')
    await dialog.getByPlaceholder('Nilai konfigurasi').fill('1500')
    await dialog.getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByText('Key "APP_FEE" sudah dipakai setting lain').first()).toBeVisible()
    expect(body).toMatchObject({ key: 'APP_FEE', value: '1500', is_public: false })
  })

  test('edit: key terkunci, nilai baru dikirim; hapus setelah konfirmasi', async ({ page, mockApi }) => {
    let body: any = null
    let deleted = false
    mockApi.asRole('ADMIN')
      .on('GET', '/system/settings/all', ok(SETTINGS))
      .on('PATCH', `/system/setting/update/${SETTINGS[0].id}`, (route) => { body = route.request().postDataJSON(); return ok(null) })
      .on('DELETE', `/system/setting/delete/${SETTINGS[1].id}`, () => (deleted = true, ok(null)))
    page.on('dialog', d => d.accept())

    await gotoHydrated(page, '/admin/settings/system')
    const row = (key: string) => main(page).getByRole('row').filter({ hasText: key })
    await row('APP_FEE').getByRole('button').first().click()
    const dialog = page.getByRole('dialog', { name: 'Edit System Setting' })
    await expect(dialog.getByPlaceholder('contoh: app.name')).toBeDisabled()
    await dialog.getByPlaceholder('Nilai konfigurasi').fill('2000')
    await dialog.getByRole('button', { name: 'Update' }).click()
    await expect.poll(() => body).not.toBeNull()
    expect(body).toMatchObject({ key: 'APP_FEE', value: '2000', is_public: true })

    await row('WD_MAX_UNVERIFIED').getByRole('button').nth(1).click()
    await expect.poll(() => deleted).toBe(true)
  })

  test('gagal memuat: pesan error tampil, bukan "Belum ada system setting"', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/system/settings/all', fail(500, 'Internal server error'))

    await gotoHydrated(page, '/admin/settings/system')
    await expect(main(page).getByText('Gagal memuat system setting')).toBeVisible()
    await expect(main(page).getByText('Belum ada system setting')).toHaveCount(0)
  })

  test('dashboard: tautan System Settings membuka halaman setting, bukan salinan chat (F-53)', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/system/settings/all', ok(SETTINGS))

    await gotoHydrated(page, '/admin/dashboard')
    await expect(main(page).getByRole('link', { name: 'System Settings' })).toHaveAttribute('href', '/admin/settings/system')
    // tombol Kelola di kartu System Settings (ada beberapa tombol Kelola di dashboard)
    await expect(main(page).locator('a[href^="/admin/settings"]')).toHaveCount(2)
    await expect(main(page).locator('a[href="/admin/settings/system"]')).toHaveCount(2)
  })
})
