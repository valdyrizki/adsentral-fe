import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const detail = (over: Record<string, unknown> = {}) => ({
  id: 'req-1', user_id: 42, user_email: 'seller@tes.local', nik_masked: '3273**********01',
  full_name_ktp: 'Budi Santoso', place_of_birth: 'Bandung', date_of_birth: '1995-05-17', gender: 'MALE',
  religion: null, marital_status: null, occupation: null, nationality: 'WNI', ktp_address: 'Jl. Contoh No. 1',
  rt: null, rw: null, village: null, district: null, city: 'Bandung', province: 'Jawa Barat', postal_code: null,
  ktp_photo_url: null, selfie_ktp_photo_url: null, selfie_note_photo_url: null,
  status: 'APPROVED', rejection_reason: null, reviewed_by: 'admin@tes.local', reviewed_at: '2026-11-10T10:00:00',
  created_at: '2026-11-09T10:00:00', bank_account: null, bank_account_name_check_status: null,
  active_verification: true, ...over,
})

// EP06-07: admin mencabut verifikasi KTP aktif dengan alasan wajib; tombol Cabut dan Edit hanya untuk verifikasi aktif.
test.describe('Admin: cabut verifikasi KTP (EP06-07)', () => {
  test('cabut verifikasi aktif mengirim alasan, lalu detail dimuat ulang tanpa tombol Cabut', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let revoked = false
    let sentBody: unknown = null
    mockApi.on('GET', '/admin/verification/req-1', () => ok(detail({ active_verification: !revoked })))
    mockApi.on('PATCH', '/admin/verification/user/42/revoke', (route) => {
      sentBody = route.request().postDataJSON()
      revoked = true
      return ok(null)
    })

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Cabut Verifikasi' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('  Foto KTP terbukti milik orang lain  ')
    await dialog.getByRole('button', { name: 'Cabut Verifikasi' }).click()

    await expect(page.getByText('Verifikasi Dicabut').first()).toBeVisible()
    expect(sentBody).toEqual({ reason: 'Foto KTP terbukti milik orang lain' })
    await expect(dialog).toBeHidden()
    await expect(main(page).getByRole('button', { name: 'Cabut Verifikasi' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Edit Data' })).toHaveCount(0)
  })

  test('pengajuan APPROVED yang bukan verifikasi aktif tidak menampilkan Cabut maupun Edit', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/verification/req-1', () => ok(detail({ active_verification: false })))

    await gotoHydrated(page, '/admin/verification/req-1')

    await expect(main(page).getByText('Budi Santoso').first()).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Cabut Verifikasi' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Edit Data' })).toHaveCount(0)
  })

  test('cabut ditolak (404 sudah tidak terverifikasi): pesan BE tampil dan detail dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let loads = 0
    mockApi.on('GET', '/admin/verification/req-1', () => {
      loads++
      return ok(detail({ active_verification: loads === 1 }))
    })
    mockApi.on('PATCH', '/admin/verification/user/42/revoke', () => fail(404, 'User ini tidak sedang terverifikasi'))

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Cabut Verifikasi' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Foto KTP terbukti milik orang lain')
    await dialog.getByRole('button', { name: 'Cabut Verifikasi' }).click()

    await expect(page.getByText('User ini tidak sedang terverifikasi').first()).toBeVisible()
    await expect.poll(() => loads).toBeGreaterThan(1)
  })
})
