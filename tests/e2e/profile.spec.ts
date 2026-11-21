import { test, expect, ok, fail, gotoHydrated, makeUser } from './support/fixtures'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const PROFILE = makeUser('BUYER', {
  username: 'budi_buyer',
  full_name: 'Budi Santoso',
  phone_number: '081234567890',
  address: 'Jl. Melati 1',
  birth_date: '1995-05-17',
})

/** Field teks multipart PATCH /user/profile → { nama: nilai } */
const multipartFields = (req: Request) => {
  const raw = req.postDataBuffer()?.toString('latin1') ?? ''
  const fields: Record<string, string> = {}
  for (const m of raw.matchAll(/name="([^"]+)"(?:; filename="[^"]*")?\r\n(?:Content-Type: [^\r\n]+\r\n)?\r\n([\s\S]*?)\r\n--/g)) {
    fields[m[1]!] = m[2]!
  }
  return fields
}

test.describe('Profil buyer', () => {
  test('profil tampil dari BE; ubah nama & HP dikirim dengan nama field multipart BE', async ({ page, mockApi }) => {
    let fields: Record<string, string> = {}
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', (route) => { fields = multipartFields(route.request()); return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    const m = main(page)
    await expect(m.locator('#full_name')).toHaveValue('Budi Santoso')
    await expect(m.locator('#email')).toHaveValue('buyer@test.local')
    await expect(m.locator('#email')).toBeDisabled()
    await expect(m.locator('#birth_date')).toHaveValue('1995-05-17')

    await m.locator('#full_name').fill('Budi S.')
    await m.locator('#phone_number').fill('089999')
    await m.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Berhasil Simpan User').first()).toBeVisible()
    expect(fields).toMatchObject({ fullName: 'Budi S.', phoneNumber: '089999', address: 'Jl. Melati 1', birthDate: '1995-05-17' })
    expect(fields).not.toHaveProperty('newPassword')
    expect(fields).not.toHaveProperty('oldPassword')
  })

  test('username tidak bisa diubah: BE mengabaikannya, jadi field dikunci dan tidak dikirim (F-57)', async ({ page, mockApi }) => {
    let fields: Record<string, string> = {}
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', (route) => { fields = multipartFields(route.request()); return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    const m = main(page)
    await expect(m.locator('#username')).toHaveValue('budi_buyer')
    await expect(m.locator('#username')).toBeDisabled()
    await m.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Berhasil Simpan User').first()).toBeVisible()
    expect(fields).not.toHaveProperty('username')
  })

  test('mengosongkan HP & alamat ikut dikirim, bukan diam-diam dipertahankan (F-58)', async ({ page, mockApi }) => {
    let fields: Record<string, string> = {}
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', (route) => { fields = multipartFields(route.request()); return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    const m = main(page)
    await expect(m.locator('#phone_number')).toHaveValue('081234567890')
    await m.locator('#phone_number').fill('')
    await m.locator('#address').fill('')
    await m.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Berhasil Simpan User').first()).toBeVisible()
    expect(fields).toMatchObject({ phoneNumber: '', address: '' })
  })

  test('ganti password: kolom password lama berlabel jelas, ketiganya dikirim benar (F-56)', async ({ page, mockApi }) => {
    let fields: Record<string, string> = {}
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', (route) => { fields = multipartFields(route.request()); return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    const m = main(page)
    const passwords = m.locator('input[type="password"]')
    await passwords.nth(0).fill('passwordBaru1')
    await expect(m.getByText('Password Lama', { exact: true })).toBeVisible()
    await expect(m.getByText('Confirm Password', { exact: true })).toHaveCount(1)
    await passwords.nth(1).fill('passwordBaru1')
    await passwords.nth(2).fill('passwordLama1')
    await m.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Perangkat lain telah dikeluarkan').first()).toBeVisible()
    expect(fields).toMatchObject({ newPassword: 'passwordBaru1', oldPassword: 'passwordLama1' })
    await expect(passwords).toHaveCount(1) // dikosongkan setelah berhasil
  })

  test('konfirmasi password beda: ditolak di klien, tidak dikirim', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', () => { calls++; return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    const passwords = main(page).locator('input[type="password"]')
    await passwords.nth(0).fill('passwordBaru1')
    await passwords.nth(1).fill('passwordBaru2')
    await passwords.nth(2).fill('passwordLama1')
    await main(page).getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Password and Confirm Password do not match').first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(calls).toBe(0)
  })

  test('avatar GIF ditolak di klien sesuai aturan BE (JPG/PNG/WEBP) (F-59)', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', () => { calls++; return fail(400, 'Avatar must be JPG, PNG, or WEBP format') })

    await gotoHydrated(page, '/profile')
    const m = main(page)
    await expect(m.getByText('JPG, PNG, atau WEBP (maks. 2MB)')).toBeVisible()
    await m.locator('input[type="file"]').first()
      .setInputFiles({ name: 'avatar.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') })
    await m.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Avatar harus JPG, PNG, atau WEBP').first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(calls).toBe(0)
  })

  test('error BE saat simpan: pesan BE tampil', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', ok(PROFILE))
      .on('PATCH', '/user/profile', fail(400, 'Invalid old password'))

    await gotoHydrated(page, '/profile')
    const passwords = main(page).locator('input[type="password"]')
    await passwords.nth(0).fill('passwordBaru1')
    await passwords.nth(1).fill('passwordBaru1')
    await passwords.nth(2).fill('salah')
    await main(page).getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Gagal Simpan User').first()).toBeVisible()
    await expect(page.getByText('Invalid old password').first()).toBeVisible()
  })

  test('gagal memuat profil: pesan error tampil, form tidak bisa disimpan (F-60)', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('BUYER')
      .on('GET', '/user/profile', fail(500, 'Internal server error'))
      .on('PATCH', '/user/profile', () => { calls++; return ok(PROFILE) })

    await gotoHydrated(page, '/profile')
    await expect(main(page).getByText('Gagal memuat profil')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(calls).toBe(0)
  })
})
