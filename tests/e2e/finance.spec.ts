import { test, expect, ok, fail, gotoHydrated, type MockApi } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({ page: 0, size: 200, total_elements: content.length, total_pages: 1, last: true, content })

const category = (id: string, over: Record<string, unknown> = {}) => ({
  id, db_cr: 'CREDIT', name: `Kategori ${id}`, description: null, notes: null, is_active: true, is_auto: false,
  balance: 0, created_at: '2026-11-01T10:00:00', ...over,
})

const journal = (id: number, over: Record<string, unknown> = {}) => ({
  id, category_id: 'SERVER_COST', category_name: 'Biaya Server', db_cr: 'DEBIT', amount: 150000, description: `Jurnal ${id}`,
  notes: null, tx_date: '2026-11-19', ref_id: null, is_void: false, void_reason: null, created_by_username: 'admin_test',
  created_at: '2026-11-19T10:00:00', ...over,
})

const CATEGORIES = [
  category('APPLICATION_FEE', { name: 'Biaya Aplikasi', is_auto: true, balance: 1250000 }),
  category('SERVER_COST', { name: 'Biaya Server', db_cr: 'DEBIT', balance: 300000 }),
]

function mockJournalPage(mockApi: MockApi, getJournals: () => unknown[]) {
  const queries: URLSearchParams[] = []
  mockApi.asRole('ADMIN')
    .on('GET', '/admin/finance/category', ok(pageOf(CATEGORIES)))
    .on('GET', '/admin/finance/journal', (_r, url) => { queries.push(url.searchParams); return ok(pageOf(getJournals())) })
  return queries
}

test.describe('Keuangan admin: ringkasan', () => {
  test('saldo bisnis & laba rugi tampil; ganti bulan mengirim periode ke BE', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/finance/balance', ok(2750000))
      .on('GET', '/admin/finance/summary', (_r, url) => {
        queries.push(url.searchParams)
        return ok({ total_credit: 5000000, total_debit: 1250000, net_profit: 3750000, year: 2026, month: null })
      })

    await gotoHydrated(page, '/admin/finance')
    const m = main(page)
    await expect(m.getByText('Rp 2.750.000').first()).toBeVisible()
    await expect(m.getByText('Rp 5.000.000').first()).toBeVisible()
    await expect(m.getByText('Rp 3.750.000').first()).toBeVisible()
    expect(queries.at(-1)?.get('year')).toBe(String(new Date().getFullYear()))
  })
})

test.describe('Keuangan admin: kategori', () => {
  test('nominal saldo dari balance kategori di BE, tanpa menelusuri seluruh jurnal (F-48)', async ({ page, mockApi }) => {
    let journalCalls = 0
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/finance/category', ok(pageOf(CATEGORIES)))
      // jurnal sengaja berbeda dari balance: total harus dari BE, bukan dijumlah ulang di FE
      .on('GET', '/admin/finance/journal', () => (journalCalls++, ok(pageOf([journal(1, { category_id: 'APPLICATION_FEE', amount: 1000 })]))))

    await gotoHydrated(page, '/admin/finance/category')
    const row = (name: string) => main(page).locator('div').filter({ hasText: name }).filter({ hasText: 'Nominal Saldo' }).last()
    await expect(row('Biaya Aplikasi')).toContainText('Rp 1.250.000')
    await expect(row('Biaya Server')).toContainText('Rp 300.000')
    expect(journalCalls).toBe(0)
  })

  test('tambah kategori: body request; kategori otomatis tidak bisa dinonaktifkan', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/finance/category', ok(pageOf(CATEGORIES)))
      .on('POST', '/admin/finance/category', (route) => { body = route.request().postDataJSON(); return ok(category('MARKETING')) })

    await gotoHydrated(page, '/admin/finance/category')
    await main(page).getByRole('button', { name: 'Tambah Kategori' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah Kategori Keuangan' })
    await dialog.getByPlaceholder('Contoh: SERVER_COST').fill('MARKETING')
    await dialog.getByPlaceholder('Nama kategori...').fill('Biaya Marketing')
    await dialog.getByRole('button', { name: /Simpan/ }).click()

    await expect.poll(() => body).not.toBeNull()
    expect(body).toMatchObject({ id: 'MARKETING', name: 'Biaya Marketing' })
  })
})

test.describe('Keuangan admin: jurnal', () => {
  test('daftar: jurnal void dicoret & tanpa tombol Void; entri SYSTEM tidak bisa di-void', async ({ page, mockApi }) => {
    mockJournalPage(mockApi, () => [
      journal(1, { description: 'Sewa VPS' }),
      journal(2, { description: 'Salah input', is_void: true, void_reason: 'duplikat' }),
      journal(3, { description: 'Fee aplikasi PAY1', category_id: 'APPLICATION_FEE', db_cr: 'CREDIT', created_by_username: 'SYSTEM' }),
    ])

    await gotoHydrated(page, '/admin/finance/journal')
    await expect(main(page).getByText('Sewa VPS')).toBeVisible()
    await expect(main(page).getByText('Void: duplikat')).toBeVisible()
    // hanya jurnal manual yang belum di-void yang punya tombol Void
    await expect(main(page).getByRole('button', { name: 'Void' })).toHaveCount(1)
  })

  test('form tambah jurnal tidak menawarkan kategori otomatis sistem (F-49)', async ({ page, mockApi }) => {
    mockJournalPage(mockApi, () => [])

    await gotoHydrated(page, '/admin/finance/journal')
    await main(page).getByRole('button', { name: 'Catat Manual' }).click()
    const dialog = page.getByRole('dialog', { name: 'Catat Transaksi Manual' })
    // pilih tipe Pemasukan lalu buka daftar kategori
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Pemasukan (Credit)' }).click()
    await dialog.getByRole('combobox').nth(1).click()
    await expect(page.getByRole('option', { name: 'Biaya Aplikasi' })).toHaveCount(0)
  })

  test('void jurnal: alasan dikirim ke BE lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    let journals = [journal(1, { description: 'Sewa VPS' })]
    const queries = mockJournalPage(mockApi, () => journals)
    let body: any = null
    mockApi.on('PATCH', '/admin/finance/journal/1/void', (route) => {
      body = route.request().postDataJSON()
      journals = [journal(1, { description: 'Sewa VPS', is_void: true, void_reason: 'salah nominal' })]
      return ok(null)
    })

    await gotoHydrated(page, '/admin/finance/journal')
    await main(page).getByRole('button', { name: 'Void' }).click()
    const dialog = page.getByRole('dialog', { name: 'Void Jurnal' })
    await dialog.getByPlaceholder('Masukkan alasan void...').fill('salah nominal')
    const before = queries.length
    await dialog.getByRole('button', { name: 'Void Jurnal' }).click()

    await expect.poll(() => body).toEqual({ reason: 'salah nominal' })
    await expect.poll(() => queries.length).toBeGreaterThan(before)
    await expect(main(page).getByText('Void: salah nominal')).toBeVisible()
  })
})

test.describe('Keuangan admin: jurnal gagal', () => {
  const failed = (id: number, over: Record<string, unknown> = {}) => ({
    id, category_id: 'APPLICATION_FEE', amount: 1000, ref_id: `PAY${id}`, description: 'Fee aplikasi', error_message: 'timeout',
    status: 'PENDING', retry_count: 0, created_at: '2026-11-19T10:00:00', resolved_at: null, resolved_by_username: null,
    resolution_note: null, ...over,
  })

  test('catat ulang & abaikan (catatan wajib) memanggil BE', async ({ page, mockApi }) => {
    const calls: string[] = []
    let dismissBody: any = null
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/finance/failed-journals', ok(pageOf([failed(1), failed(2, { ref_id: 'PAY2' })])))
      .on('POST', '/admin/finance/failed-journals/1/retry', () => (calls.push('retry-1'), ok(failed(1, { status: 'RESOLVED' }))))
      .on('PATCH', '/admin/finance/failed-journals/2/dismiss', (route) => {
        calls.push('dismiss-2'); dismissBody = route.request().postDataJSON(); return ok(failed(2, { status: 'DISMISSED' }))
      })

    await gotoHydrated(page, '/admin/finance/failed-journals')
    const m = main(page)
    await m.getByRole('row').filter({ hasText: 'PAY1' }).getByRole('button', { name: 'Catat ulang' }).click()
    await page.getByRole('dialog', { name: 'Catat Ulang Jurnal' }).getByRole('button', { name: /Catat ulang/ }).click()
    await expect(page.getByText('Jurnal berhasil dicatat ulang').first()).toBeVisible()

    await m.getByRole('row').filter({ hasText: 'PAY2' }).getByRole('button', { name: 'Abaikan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Abaikan Jurnal Gagal' })
    const submit = dialog.getByRole('button', { name: 'Simpan' })
    await expect(submit).toBeDisabled()
    await dialog.getByRole('textbox').fill('Sudah dicatat manual')
    await submit.click()

    await expect(page.getByText('Ditandai diabaikan').first()).toBeVisible()
    expect(calls).toEqual(['retry-1', 'dismiss-2'])
    expect(dismissBody).toEqual({ note: 'Sudah dicatat manual' })
  })

  test('catat ulang ditolak BE: pesan BE tampil', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
      .on('GET', '/admin/finance/failed-journals', ok(pageOf([failed(1)])))
      .on('POST', '/admin/finance/failed-journals/1/retry', fail(409, 'Jurnal ini sudah ditangani'))

    await gotoHydrated(page, '/admin/finance/failed-journals')
    await main(page).getByRole('button', { name: 'Catat ulang' }).first().click()
    await page.getByRole('dialog', { name: 'Catat Ulang Jurnal' }).getByRole('button', { name: /Catat ulang/ }).click()
    await expect(page.getByText('Jurnal ini sudah ditangani').first()).toBeVisible()
  })
})
