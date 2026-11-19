import { test, expect, ok, fail, gotoHydrated, makeUser } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({ page: 0, size: 10, total_elements: content.length, total_pages: 1, last: true, content })

const notif = (id: number, over: Record<string, unknown> = {}) => ({
  id, title: `Judul ${id}`, message: `Isi notifikasi ${id}`, type: 'INFO', status: 'UNREAD', action_url: null,
  user_id: 1, read_at: null, created_at: '2026-11-19T10:00:00', ...over,
})

// Nilai NotificationType di BE (common/enumz/NotificationType.java)
const BE_NOTIFICATION_TYPES = ['USER_INFO', 'SELLER_INFO', 'ADMIN_INFO', 'SYSTEM_INFO', 'INFO', 'URGENT', 'WARNING', 'PROMOTION']

test.describe('Notifikasi buyer & seller', () => {
  test('daftar: belum dibaca ditandai; tandai dibaca & tandai semua memanggil BE', async ({ page, mockApi }) => {
    const calls: string[] = []
    let alertFetches = 0
    mockApi.asRole('BUYER')
      .on('GET', '/alerts', () => (alertFetches++, ok({})))
      .on('GET', '/notification', ok(pageOf([
        notif(1, { action_url: '/transaction/TX-1' }),
        notif(2),
        notif(3, { status: 'READ', read_at: '2026-11-19T11:00:00' }),
      ])))
      .on('PATCH', '/notification/user/read/1', () => (calls.push('read-1'), ok(null)))
      .on('PATCH', '/notification/user/read-all', () => (calls.push('read-all'), ok(null)))

    await gotoHydrated(page, '/notification')
    const m = main(page)
    await expect(m.getByText('Isi notifikasi 1')).toBeVisible()
    await expect(m.getByRole('link').filter({ hasText: /./ }).and(m.locator('[href="/transaction/TX-1"]'))).toBeVisible()
    await expect(m.getByRole('button', { name: 'Tandai Dibaca', exact: true })).toHaveCount(2)

    const alertsBefore = alertFetches
    await m.getByRole('button', { name: 'Tandai Dibaca', exact: true }).first().click()
    await expect(m.getByRole('button', { name: 'Tandai Dibaca', exact: true })).toHaveCount(1)
    expect(calls).toEqual(['read-1'])
    await expect.poll(() => alertFetches).toBeGreaterThan(alertsBefore)

    await m.getByRole('button', { name: 'Tandai Semua Dibaca' }).click()
    await expect(page.getByText('Semua notifikasi ditandai dibaca').first()).toBeVisible()
    expect(calls).toEqual(['read-1', 'read-all'])
    await expect(m.getByRole('button', { name: 'Tandai Dibaca', exact: true })).toHaveCount(0)
    await expect(m.getByRole('button', { name: 'Tandai Semua Dibaca' })).toHaveCount(0)
  })

  test('gagal memuat: pesan error tampil, bukan "tidak ada notifikasi"', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER').on('GET', '/notification', fail(500, 'Internal Server Error'))

    await gotoHydrated(page, '/notification')
    await expect(main(page).getByText('Terjadi Kesalahan').first()).toBeVisible()
  })

  test('seller memakai /seller/notification', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('SELLER').on('GET', '/seller/notification', () => (calls++, ok(pageOf([notif(5, { message: 'Pesanan baru masuk' })]))))

    await gotoHydrated(page, '/seller/notification')
    await expect(main(page).getByText('Pesanan baru masuk')).toBeVisible()
    expect(calls).toBeGreaterThan(0)
  })
})

test.describe('Notifikasi admin', () => {
  test('buat notifikasi: validasi, cari user, body request', async ({ page, mockApi }) => {
    const target = makeUser('BUYER', { id: 21, full_name: 'Budi Pembeli', email: 'budi@test.local' })
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/notification', ok(pageOf([])))
      .on('GET', '/admin/users', ok({ ...pageOf([target]) }))
      .on('POST', '/admin/notification', (route) => { body = route.request().postDataJSON(); return ok(null) })

    await gotoHydrated(page, '/admin/notification')
    await main(page).getByRole('button', { name: 'Buat Notifikasi' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /Kirim ke/ }).click()
    await expect(dialog.getByText('Pilih minimal satu user tujuan')).toBeVisible()
    await expect(dialog.getByText('Judul tidak boleh kosong')).toBeVisible()
    expect(body).toBeNull()

    await dialog.getByPlaceholder('Cari username atau email...').fill('budi')
    await page.getByRole('option', { name: /Budi Pembeli/ }).click()
    await dialog.getByRole('combobox').last().click()
    await page.getByRole('option', { name: 'Peringatan' }).click()
    await dialog.getByPlaceholder('Judul notifikasi...').fill('  Akun diperiksa  ')
    await dialog.getByPlaceholder('Isi pesan notifikasi...').fill('Mohon lengkapi verifikasi')
    await dialog.getByRole('button', { name: 'Kirim ke 1 User' }).click()

    await expect(page.getByText('Notifikasi terkirim').first()).toBeVisible()
    expect(body).toMatchObject({ user_ids: [21], notification_type: 'WARNING', title: 'Akun diperiksa', message: 'Mohon lengkapi verifikasi' })
  })

  test('broadcast: hanya tipe yang dikenal BE, body memuat role & tipe (F-46)', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/notification', ok(pageOf([])))
      .on('POST', '/admin/notification/broadcast', (route) => { body = route.request().postDataJSON(); return ok(null) })

    await gotoHydrated(page, '/admin/notification')
    await main(page).getByRole('button', { name: 'Broadcast' }).click()
    const dialog = page.getByRole('dialog', { name: 'Broadcast Notifikasi' })
    await dialog.getByRole('combobox').click()
    const options = await page.getByRole('option').allTextContents()
    await page.keyboard.press('Escape')
    // tiap opsi harus punya padanan enum BE; dulu ORDER_UPDATE/PAYMENT_INFO/PENALTY_NOTICE ditolak 400
    expect(options.length).toBeGreaterThan(0)

    await dialog.getByRole('button', { name: 'Seller' }).click()
    await dialog.getByRole('combobox').click()
    await page.getByRole('option').first().click()
    await dialog.getByPlaceholder('Judul broadcast...').fill('Maintenance')
    await dialog.getByPlaceholder('Isi pesan broadcast...').fill('Sistem maintenance pukul 01.00')
    await dialog.getByRole('button', { name: 'Kirim Broadcast' }).click()

    await expect(page.getByText('Broadcast terkirim').first()).toBeVisible()
    expect(body).toMatchObject({ title: 'Maintenance', target_roles: ['SELLER'] })
    expect(BE_NOTIFICATION_TYPES).toContain(body.notification_type)
  })

  test('broadcast: semua opsi tipe ada di enum BE (F-46)', async ({ page, mockApi }) => {
    const sentTypes: string[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/notification', ok(pageOf([])))
      .on('POST', '/admin/notification/broadcast', (route) => { sentTypes.push(route.request().postDataJSON().notification_type); return ok(null) })

    await gotoHydrated(page, '/admin/notification')
    await main(page).getByRole('button', { name: 'Broadcast' }).click()
    const dialog = page.getByRole('dialog', { name: 'Broadcast Notifikasi' })
    await dialog.getByRole('combobox').click()
    const count = await page.getByRole('option').count()
    await page.keyboard.press('Escape')

    for (let i = 0; i < count; i++) {
      if (i > 0) await main(page).getByRole('button', { name: 'Broadcast' }).click()
      await dialog.getByRole('button', { name: 'Buyer' }).click()
      await dialog.getByRole('combobox').click()
      await page.getByRole('option').nth(i).click()
      await dialog.getByPlaceholder('Judul broadcast...').fill(`Judul ${i}`)
      await dialog.getByPlaceholder('Isi pesan broadcast...').fill('Isi')
      await dialog.getByRole('button', { name: 'Kirim Broadcast' }).click()
      await expect.poll(() => sentTypes.length).toBe(i + 1)
      await expect(dialog).toHaveCount(0)
    }
    for (const t of sentTypes) expect(BE_NOTIFICATION_TYPES).toContain(t)
  })

  test('broadcast ditolak BE: pesan BE tampil', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/notification', ok(pageOf([])))
      .on('POST', '/admin/notification/broadcast', fail(400, 'Message maksimal 1000 karakter'))

    await gotoHydrated(page, '/admin/notification')
    await main(page).getByRole('button', { name: 'Broadcast' }).click()
    const dialog = page.getByRole('dialog', { name: 'Broadcast Notifikasi' })
    await dialog.getByRole('button', { name: 'Buyer' }).click()
    await dialog.getByRole('combobox').click()
    await page.getByRole('option').first().click()
    await dialog.getByPlaceholder('Judul broadcast...').fill('Promo')
    await dialog.getByPlaceholder('Isi pesan broadcast...').fill('Isi')
    await dialog.getByRole('button', { name: 'Kirim Broadcast' }).click()

    await expect(page.getByText('Message maksimal 1000 karakter').first()).toBeVisible()
  })
})
