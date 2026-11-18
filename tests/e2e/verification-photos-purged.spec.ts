import { test, expect, ok, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

// EP08-07: foto KTP/selfie yang sudah dihapus karena masa simpan ditampilkan sebagai keterangan, bukan gambar rusak.

const main = (page: Page) => page.getByRole('main')

const detail = (over: Record<string, unknown> = {}) => ({
  id: 'req-1', user_id: 42, user_email: 'seller@tes.local', nik_masked: '3273**********01',
  full_name_ktp: 'Budi Santoso', place_of_birth: 'Bandung', date_of_birth: '1995-05-17', gender: 'MALE',
  marital_status: null, occupation: null, nationality: 'WNI', ktp_address: 'Jl. Contoh No. 1',
  rt: null, rw: null, village: null, district: null, city: 'Bandung', province: 'Jawa Barat', postal_code: null,
  ktp_photo_url: 'https://signed/ktp', selfie_ktp_photo_url: 'https://signed/selfie', selfie_note_photo_url: 'https://signed/note',
  photos_purged_at: null,
  status: 'APPROVED', rejection_reason: null, reviewed_by: 'admin@tes.local', reviewed_at: '2025-11-10T10:00:00',
  created_at: '2025-11-09T10:00:00', bank_account: null, bank_account_name_check_status: null,
  active_verification: true, ...over,
})

test('admin: foto dihapus karena masa simpan → keterangan, tanpa gambar & tombol muat ulang', async ({ page, mockApi }) => {
  mockApi.asRole('ADMIN')
  mockApi.on('GET', '/admin/verification/req-1', ok(detail({
    ktp_photo_url: null, selfie_ktp_photo_url: null, selfie_note_photo_url: null, photos_purged_at: '2026-11-11T03:10:00',
  })))

  await gotoHydrated(page, '/admin/verification/req-1')

  await expect(main(page).getByTestId('verification-photos-purged')).toContainText('Foto sudah dihapus sesuai masa simpan data')
  await expect(main(page).getByRole('img', { name: 'Foto KTP' })).toHaveCount(0)
  await expect(main(page).getByRole('button', { name: 'Muat Ulang Foto' })).toHaveCount(0)
})

test('admin: foto yang belum dihapus tetap tampil', async ({ page, mockApi }) => {
  mockApi.asRole('ADMIN')
  mockApi.on('GET', '/admin/verification/req-1', ok(detail()))

  await gotoHydrated(page, '/admin/verification/req-1')

  await expect(main(page).getByRole('img', { name: 'Foto KTP' })).toHaveCount(1)
  await expect(main(page).getByTestId('verification-photos-purged')).toHaveCount(0)
})
