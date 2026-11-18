import { test, expect, ok, failCode, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const makeAdminUser = (id: number, overrides: Record<string, unknown> = {}) => ({
  id, email: `user${id}@test.local`, username: `user${id}`, full_name: `User ${id}`,
  phone_number: null, birth_date: null, address: null, avatar_url: null,
  role: 'BUYER', status: 'ACTIVE', account_status: 'ACTIVE', created_at: '2026-01-01T00:00:00', locked_until: null,
  ...overrides,
})
const deactivated = (id: number, overrides: Record<string, unknown> = {}) =>
  makeAdminUser(id, { status: 'SUSPEND', account_status: 'DEACTIVATED', ...overrides })

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })

// EP06-06: akun yang dinonaktifkan pemiliknya sendiri tampil "Nonaktif" (bukan penalti) dan bisa diaktifkan admin.
test.describe('Admin: aktifkan kembali akun nonaktif (EP06-06)', () => {
  test('akun nonaktif berlabel Nonaktif dan punya tombol Aktifkan; aktifkan mengirim alasan lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let activated = false
    let sentBody: unknown = null
    mockApi.on('GET', '/admin/users', () => ok(page1([activated ? makeAdminUser(5) : deactivated(5), makeAdminUser(6)])))
    mockApi.on('PATCH', '/admin/users/5/activate', (route) => {
      sentBody = route.request().postDataJSON()
      activated = true
      return ok(null)
    })

    await gotoHydrated(page, '/admin/users')
    await expect(main(page).getByText('Nonaktif (oleh pemilik)')).toHaveCount(1)
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toHaveCount(1)

    await main(page).getByRole('button', { name: 'Aktifkan' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('  Pemilik terverifikasi via WA minta akun dibuka  ')
    await dialog.getByRole('button', { name: 'Aktifkan Akun' }).click()

    await expect(page.getByText('Akun diaktifkan kembali').first()).toBeVisible()
    expect(sentBody).toEqual({ reason: 'Pemilik terverifikasi via WA minta akun dibuka' })
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toHaveCount(0)
  })

  test('minta hapus akun (EP03-05): label tanggal hapus + tombol Aktifkan; yang sudah dihapus permanen tanpa tombol', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([
      deactivated(7, { deletion_requested_at: '2026-11-18T10:00:00' }),
      deactivated(8, { email: 'deleted-8@deleted.invalid', deletion_requested_at: '2026-10-01T10:00:00', anonymized_at: '2026-10-31T02:40:00' }),
    ])))

    await gotoHydrated(page, '/admin/users')
    await expect(main(page).getByText(/Minta hapus \(dihapus 18 (Dec|Des) 2026\)/)).toHaveCount(1)
    await expect(main(page).getByText('Dihapus permanen')).toHaveCount(1)
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toHaveCount(1)
  })

  test('admin biasa tidak melihat tombol Aktifkan untuk akun admin (BE 403; hanya super admin)', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([deactivated(7, { role: 'ADMIN' })])))

    await gotoHydrated(page, '/admin/users')
    await expect(main(page).getByText('user7@test.local', { exact: false })).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Aktifkan' })).toHaveCount(0)
  })

  test('409 ACCOUNT_NOT_DEACTIVATED (sudah diaktifkan admin lain): peringatan tampil dan daftar dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let loads = 0
    mockApi.on('GET', '/admin/users', () => {
      loads++
      return ok(page1([loads === 1 ? deactivated(8) : makeAdminUser(8)]))
    })
    mockApi.on('PATCH', '/admin/users/8/activate', failCode(409, 'Akun ini tidak sedang nonaktif (status ACTIVE)', { code: 'ACCOUNT_NOT_DEACTIVATED' }))

    await gotoHydrated(page, '/admin/users')
    await main(page).getByRole('button', { name: 'Aktifkan' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Pemilik terverifikasi via WA minta akun dibuka')
    await dialog.getByRole('button', { name: 'Aktifkan Akun' }).click()

    await expect(page.getByText('Akun ini tidak sedang nonaktif (status ACTIVE)').first()).toBeVisible()
    await expect.poll(() => loads).toBeGreaterThan(1)
    await expect(dialog).toBeHidden()
  })
})
