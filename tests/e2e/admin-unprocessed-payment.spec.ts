import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const dialog = (page: Page) => page.getByRole('dialog')

const item = (id: number, over: Record<string, unknown> = {}) => ({
  id, payment_id: `PAY${id}`, gateway_reference: `T${id}REF`, amount: 105000, reason: 'PAYMENT_EXPIRED',
  status: 'PENDING', created_at: '2026-11-18T10:00:00', resolved_at: null, resolved_by_username: null,
  resolution_note: null, ...over,
})

const pageOf = (content: unknown[]) => ({ page: 0, size: 20, total_elements: content.length, total_pages: 1, last: true, content })

test.describe('Admin: pembayaran tidak terproses', () => {
  test('tab default "Belum ditangani" mengirim status=PENDING; tab Semua tanpa status', async ({ page, mockApi }) => {
    const statuses: (string | null)[] = []
    mockApi.asRole('ADMIN').on('GET', '/admin/payments/unprocessed', (_r, url) => {
      statuses.push(url.searchParams.get('status'))
      return ok(pageOf([item(1)]))
    })

    await gotoHydrated(page, '/admin/payments/unprocessed')
    const m = main(page)
    await expect(m.getByText('Dibayar setelah kedaluwarsa')).toBeVisible()
    await expect(m.getByText('Rp 105.000')).toBeVisible()
    await expect(m.getByRole('link', { name: 'PAY1' })).toHaveAttribute('href', '/admin/payment/PAY1')
    expect(statuses[0]).toBe('PENDING')

    await m.getByRole('tab', { name: 'Semua' }).click()
    await expect.poll(() => statuses.at(-1)).toBeNull()
    await m.getByRole('tab', { name: 'Selesai' }).click()
    await expect.poll(() => statuses.at(-1)).toBe('RESOLVED')
  })

  test('respons camelCase dari BE tetap tampil (dinormalisasi)', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/admin/payments/unprocessed', ok({
      page: 0, size: 20, totalElements: 1, totalPages: 1, last: true,
      content: [{ id: 3, paymentId: 'PAY3', gatewayReference: 'T3REF', amount: 5000, reason: 'TX_LAPSED', status: 'PENDING', createdAt: '2026-11-18T10:00:00' }],
    }))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await expect(main(page).getByRole('link', { name: 'PAY3' })).toBeVisible()
    await expect(main(page).getByText('Dibayar setelah pesanan di-expired-kan')).toBeVisible()
  })

  test('tandai selesai wajib catatan; catatan dikirim ter-trim lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    let body: unknown = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/payments/unprocessed', () => ok(pageOf(body ? [] : [item(1)])))
      .on('PATCH', '/admin/payments/unprocessed/1/resolve', (route) => {
        body = route.request().postDataJSON()
        return ok(item(1, { status: 'RESOLVED' }))
      })

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await main(page).getByRole('button', { name: 'Tandai selesai' }).click()
    const save = dialog(page).getByRole('button', { name: 'Simpan' })
    await expect(save).toBeDisabled()
    await dialog(page).getByRole('textbox').fill('   ')
    await expect(save).toBeDisabled()

    await dialog(page).getByRole('textbox').fill('  Sudah di-refund lewat dashboard Tripay  ')
    await save.click()

    await expect(page.getByText('Ditandai selesai').first()).toBeVisible()
    expect(body).toEqual({ note: 'Sudah di-refund lewat dashboard Tripay' })
    await expect(main(page).getByText('Tidak ada pembayaran yang tertahan.')).toBeVisible()
  })

  test('detail item RESOLVED menampilkan penanganan tanpa tombol tandai selesai', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/admin/payments/unprocessed', ok(pageOf([item(2, {
      status: 'RESOLVED', resolved_at: '2026-11-19T09:00:00', resolved_by_username: 'admin_a', resolution_note: 'Saldo buyer dikreditkan',
    })])))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await main(page).getByText('Dibayar setelah kedaluwarsa').click()

    await expect(dialog(page).getByText('admin_a')).toBeVisible()
    await expect(dialog(page).getByText('Saldo buyer dikreditkan')).toBeVisible()
    await expect(dialog(page).getByRole('button', { name: 'Tandai selesai' })).toHaveCount(0)
  })

  test('sudah ditangani admin lain (409): pesan BE tampil, modal ditutup, daftar dimuat ulang', async ({ page, mockApi }) => {
    let listCalls = 0
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/payments/unprocessed', () => { listCalls++; return ok(pageOf([item(1)])) })
      .on('PATCH', '/admin/payments/unprocessed/1/resolve', fail(409, 'Pembayaran ini sudah ditandai selesai'))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await main(page).getByRole('button', { name: 'Tandai selesai' }).click()
    await dialog(page).getByRole('textbox').fill('Sudah di-refund')
    await dialog(page).getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByText('Pembayaran ini sudah ditandai selesai').first()).toBeVisible()
    await expect(dialog(page)).toHaveCount(0)
    await expect.poll(() => listCalls).toBeGreaterThanOrEqual(2)
  })

  test('admin biasa tidak melihat Kembalikan ke Saldo; pembeli tampil di daftar', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/admin/payments/unprocessed', ok(pageOf([item(1, { buyer_username: 'demo_buyer1' })])))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await expect(main(page).getByText('demo_buyer1')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Tandai selesai' })).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Kembalikan ke Saldo' })).toHaveCount(0)
  })

  test('super admin: Kembalikan ke Saldo menyebut pembeli dan nominal, catatan wajib, POST ter-trim lalu dimuat ulang', async ({ page, mockApi }) => {
    let body: unknown = null
    mockApi.asRole('SUPER_ADMIN')
      .on('GET', '/admin/payments/unprocessed', () => ok(pageOf(body ? [] : [item(1, { buyer_username: 'demo_buyer1', amount: 30250 })])))
      .on('POST', '/admin/payments/unprocessed/1/refund-to-balance', (route) => {
        body = route.request().postDataJSON()
        return ok(item(1, { status: 'RESOLVED' }))
      })

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await main(page).getByRole('button', { name: 'Kembalikan ke Saldo' }).click()
    await expect(dialog(page).getByText('demo_buyer1')).toBeVisible()
    await expect(dialog(page).getByText('Rp 30.250')).toBeVisible()
    const submit = dialog(page).getByRole('button', { name: 'Kembalikan', exact: true })
    await expect(submit).toBeDisabled()

    await dialog(page).getByRole('textbox').fill('  Pembeli setuju dikembalikan ke saldo  ')
    await submit.click()

    await expect(page.getByText('Dana dikembalikan ke saldo pembeli').first()).toBeVisible()
    expect(body).toEqual({ note: 'Pembeli setuju dikembalikan ke saldo' })
    await expect(main(page).getByText('Tidak ada pembayaran yang tertahan.')).toBeVisible()
  })

  test('super admin: Kembalikan ke Saldo pada antrean yang sudah ditangani (409) menutup modal dan memuat ulang', async ({ page, mockApi }) => {
    let listCalls = 0
    mockApi.asRole('SUPER_ADMIN')
      .on('GET', '/admin/payments/unprocessed', () => { listCalls++; return ok(pageOf([item(1)])) })
      .on('POST', '/admin/payments/unprocessed/1/refund-to-balance', fail(409, 'Data sudah diproses: RESOLVED'))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await main(page).getByText('Dibayar setelah kedaluwarsa').click()
    await dialog(page).getByRole('button', { name: 'Kembalikan ke Saldo' }).click()
    await dialog(page).getByRole('textbox').fill('setuju')
    await dialog(page).getByRole('button', { name: 'Kembalikan', exact: true }).click()

    await expect(page.getByText('Data sudah diproses: RESOLVED').first()).toBeVisible()
    await expect(dialog(page)).toHaveCount(0)
    await expect.poll(() => listCalls).toBeGreaterThanOrEqual(2)
  })

  test('gagal memuat daftar: pesan BE tampil', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN').on('GET', '/admin/payments/unprocessed', fail(403, "You're not Admin"))

    await gotoHydrated(page, '/admin/payments/unprocessed')
    await expect(main(page).getByText("You're not Admin")).toBeVisible()
  })
})
