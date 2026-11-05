import { test, expect, ok, fail, emptyPage, gotoHydrated, makeUser, type MockApi } from './support/fixtures'
import type { Page } from '@playwright/test'

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400_000).toISOString()

const setting = (key: string, value: string) => ({
  id: key, key, value, description: key, group: 'KONTAK', is_public: true,
  created_at: '2026-01-01T00:00:00', updated_at: '2026-01-01T00:00:00',
})

const makeRule = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: 'Keterlambatan Pengiriman',
  description: 'Seller mengirim melewati estimasi',
  target_role: 'SELLER',
  points: 10,
  expired_days: 30,
  trigger_type: 'MANUAL',
  is_active: true,
  created_at: '2026-01-01T00:00:00',
  ...overrides,
})
type Rule = ReturnType<typeof makeRule>

const SELLER = makeUser('SELLER', { id: 7 })

const makePenaltyUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'PU-7',
  active_points: 10,
  active_point_merchant: 10,
  suspend_status: 'NONE',
  suspend_until: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  user: SELLER,
  verified_seller: true,
  ...overrides,
})

const makePenalty = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  user_id: 7,
  user_email: SELLER.email,
  rule_id: 'SELLER_LATE',
  rule_name: 'Keterlambatan Pengiriman',
  points: 10,
  transaction_id: null,
  given_by_email: 'admin@test.local',
  notes: null,
  is_expired: false,
  expired_at: daysFromNow(30),
  created_at: '2026-10-01T10:00:00',
  ...overrides,
})

const main = (page: Page) => page.getByRole('main')

/** Ambil nilai JSON dari body request */
const jsonBody = (route: { request(): { postDataJSON(): unknown } }) => route.request().postDataJSON()

// ───────────────────────── Penalty rule ─────────────────────────

function mockRules(mockApi: MockApi, getRules: () => Rule[]) {
  let fetches = 0
  mockApi.asRole('ADMIN').on('GET', '/admin/penalty/rules', () => (fetches++, ok(page1(getRules()))))
  return { fetches: () => fetches }
}

const ruleRow = (page: Page, id: string) => main(page).locator('div.divide-y > div.py-4').filter({ hasText: id })

test.describe('Penalty rule (admin)', () => {
  test('daftar rule: role, trigger, status, poin & masa berlaku', async ({ page, mockApi }) => {
    mockRules(mockApi, () => [
      makeRule('SELLER_LATE'),
      makeRule('BUYER_SPAM', { name: 'Spam Chat', target_role: 'BUYER', trigger_type: 'AUTO', is_active: false, points: 5, expired_days: 7 }),
    ])

    await gotoHydrated(page, '/admin/penalty-rule')
    const seller = ruleRow(page, 'SELLER_LATE')
    for (const text of ['Seller', 'Manual', 'Aktif', '10 poin', 'Berlaku 30 hari']) {
      await expect(seller.getByText(text, { exact: true })).toBeVisible()
    }
    await expect(seller.getByRole('button', { name: 'Nonaktifkan', exact: true })).toBeVisible()

    const buyer = ruleRow(page, 'BUYER_SPAM')
    for (const text of ['Buyer', 'Otomatis', 'Nonaktif', '5 poin', 'Berlaku 7 hari']) {
      await expect(buyer.getByText(text, { exact: true })).toBeVisible()
    }
    await expect(buyer.getByRole('button', { name: 'Aktifkan', exact: true })).toBeVisible()
  })

  test('tambah rule: validasi & body request', async ({ page, mockApi }) => {
    let rules: Rule[] = []
    mockRules(mockApi, () => rules)
    let body: any = null
    mockApi.on('POST', '/admin/penalty/rules', (route) => {
      body = jsonBody(route)
      rules = [makeRule(body.id, body)]
      return ok(rules[0])
    })

    await gotoHydrated(page, '/admin/penalty-rule')
    await expect(main(page).getByText('Tidak ada penalty rule.')).toBeVisible()
    await main(page).getByRole('button', { name: 'Tambah Rule' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah Penalty Rule' })

    await dialog.getByRole('button', { name: 'Simpan Rule' }).click()
    for (const msg of ['Rule ID wajib diisi', 'Nama rule wajib diisi', 'Target role wajib dipilih', 'Trigger type wajib dipilih', 'Poin minimal 1', 'Masa berlaku minimal 1 hari']) {
      await expect(dialog.getByText(msg)).toBeVisible()
    }
    expect(body).toBeNull()

    await dialog.getByPlaceholder('cth: SELLER_LATE_DELIVERY').fill('SELLER_LATE')
    await dialog.getByPlaceholder('cth: Keterlambatan Pengiriman Seller').fill('Keterlambatan Pengiriman')
    await dialog.getByRole('button', { name: 'Seller' }).click()
    await dialog.getByRole('button', { name: /Manual/ }).click()
    await dialog.getByPlaceholder('Jumlah poin').fill('10')
    await dialog.getByPlaceholder('Jumlah hari').fill('30')
    await dialog.getByRole('button', { name: 'Simpan Rule' }).click()

    await expect(page.getByText('Penalty rule berhasil dibuat').first()).toBeVisible()
    expect(body).toEqual({
      id: 'SELLER_LATE', name: 'Keterlambatan Pengiriman', description: '', target_role: 'SELLER',
      points: 10, expired_days: 30, trigger_type: 'MANUAL', is_active: true,
    })
    await expect(dialog).toHaveCount(0)
    await expect(ruleRow(page, 'SELLER_LATE')).toBeVisible()
  })

  test.fail('Rule ID yang diketik dinormalisasi ke huruf kapital + underscore (F-29)', async ({ page, mockApi }) => {
    mockRules(mockApi, () => [])

    await gotoHydrated(page, '/admin/penalty-rule')
    await main(page).getByRole('button', { name: 'Tambah Rule' }).click()
    const input = page.getByRole('dialog', { name: 'Tambah Penalty Rule' }).getByPlaceholder('cth: SELLER_LATE_DELIVERY')
    await input.pressSequentially('seller late', { delay: 30 })
    await expect(input).toHaveValue('SELLER_LATE', { timeout: 2000 })
  })

  test.fail('tambah rule dengan ID duplikat (409) menampilkan pesan BE (F-20)', async ({ page, mockApi }) => {
    mockRules(mockApi, () => [])
    mockApi.on('POST', '/admin/penalty/rules', fail(409, 'Rule ID sudah dipakai'))

    await gotoHydrated(page, '/admin/penalty-rule')
    await main(page).getByRole('button', { name: 'Tambah Rule' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah Penalty Rule' })
    await dialog.getByPlaceholder('cth: SELLER_LATE_DELIVERY').fill('SELLER_LATE')
    await dialog.getByPlaceholder('cth: Keterlambatan Pengiriman Seller').fill('Keterlambatan')
    await dialog.getByRole('button', { name: 'Seller' }).click()
    await dialog.getByRole('button', { name: /Manual/ }).click()
    await dialog.getByPlaceholder('Jumlah poin').fill('10')
    await dialog.getByPlaceholder('Jumlah hari').fill('30')
    await dialog.getByRole('button', { name: 'Simpan Rule' }).click()

    await expect(page.getByText('Gagal membuat rule').first()).toBeVisible()
    await expect(page.getByText('Rule ID sudah dipakai').first()).toBeVisible({ timeout: 2000 })
  })

  test('edit rule: form terisi data rule & body request', async ({ page, mockApi }) => {
    let rules = [makeRule('SELLER_LATE')]
    mockRules(mockApi, () => rules)
    let body: any = null
    mockApi.on('PATCH', '/admin/penalty/rules/SELLER_LATE', (route) => {
      body = jsonBody(route)
      rules = [{ ...rules[0]!, ...body }]
      return ok(rules[0])
    })

    await gotoHydrated(page, '/admin/penalty-rule')
    await ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Edit' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Penalty Rule' })
    await expect(dialog.getByRole('textbox', { name: /Deskripsi/ }).or(dialog.locator('textarea'))).toHaveValue('Seller mengirim melewati estimasi')
    await expect(dialog.getByPlaceholder('Jumlah poin')).toHaveValue('10')
    await expect(dialog.getByPlaceholder('Jumlah hari')).toHaveValue('30')

    await dialog.getByPlaceholder('Jumlah poin').fill('15')
    await dialog.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect(page.getByText('Penalty rule berhasil diupdate').first()).toBeVisible()
    expect(body).toEqual({ description: 'Seller mengirim melewati estimasi', points: 15, expired_days: 30, is_active: true })
    await expect(ruleRow(page, 'SELLER_LATE').getByText('15 poin')).toBeVisible()
  })

  test.fail('edit dibatalkan lalu dibuka lagi: form kembali ke data rule (F-29)', async ({ page, mockApi }) => {
    mockRules(mockApi, () => [makeRule('SELLER_LATE')])

    await gotoHydrated(page, '/admin/penalty-rule')
    await ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Edit' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Penalty Rule' })
    await dialog.getByPlaceholder('Jumlah poin').fill('99')
    await dialog.getByRole('button', { name: 'Batal' }).click()
    await expect(dialog).toHaveCount(0)

    await ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Edit' }).click()
    await expect(dialog.getByPlaceholder('Jumlah poin')).toHaveValue('10', { timeout: 2000 })
  })

  test('nonaktifkan rule lewat dialog konfirmasi', async ({ page, mockApi }) => {
    let rules = [makeRule('SELLER_LATE')]
    mockRules(mockApi, () => rules)
    let calls = 0
    mockApi.on('PATCH', '/admin/penalty/rules/SELLER_LATE/toggle', () => {
      calls++
      rules = [{ ...rules[0]!, is_active: false }]
      return ok(rules[0])
    })

    await gotoHydrated(page, '/admin/penalty-rule')
    await ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Nonaktifkan', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Nonaktifkan Rule?' })
    await dialog.getByRole('button', { name: 'Batal' }).click()
    expect(calls).toBe(0)

    await ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Nonaktifkan', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, Nonaktifkan' }).click()

    await expect(page.getByText('Rule dinonaktifkan').first()).toBeVisible()
    expect(calls).toBe(1)
    await expect(ruleRow(page, 'SELLER_LATE').getByRole('button', { name: 'Aktifkan', exact: true })).toBeVisible()
    await expect(ruleRow(page, 'SELLER_LATE').getByText('Nonaktif', { exact: true })).toBeVisible()
  })
})

// ───────────────────────── Manage penalty ─────────────────────────

function mockManagePenalty(mockApi: MockApi, opts: { getUsers: () => unknown[]; getDetail?: () => unknown[]; rules?: Rule[] }) {
  const queries: URLSearchParams[] = []
  let detailFetches = 0
  mockApi
    .asRole('ADMIN')
    .on('GET', '/admin/penalty/stat', (_r, url) => {
      queries.push(url.searchParams)
      return ok(page1(opts.getUsers()))
    })
    .on('GET', '/admin/penalty/rules', ok(page1(opts.rules ?? [
      makeRule('SELLER_LATE'),
      makeRule('SELLER_OLD', { name: 'Rule Lama', is_active: false }),
    ])))
    .on('GET', '/admin/penalty/user/7', () => (detailFetches++, ok(page1(opts.getDetail?.() ?? []))))
  return { queries, detailFetches: () => detailFetches }
}

const userRow = (page: Page) => main(page).locator('div.divide-y > button').filter({ hasText: SELLER.email })

test.describe('Manage penalty (admin)', () => {
  test('daftar user: status suspend & poin aktif', async ({ page, mockApi }) => {
    mockManagePenalty(mockApi, {
      getUsers: () => [makePenaltyUser({ suspend_status: 'TEMPORARY', suspend_until: '2026-12-01T00:00:00', active_points: 40 })],
    })

    await gotoHydrated(page, '/admin/penalty')
    const row = userRow(page)
    await expect(row.getByText('Suspend Sementara')).toBeVisible()
    await expect(row.getByText('s/d 01 Dec 2026')).toBeVisible()
    await expect(row.getByText('40', { exact: true })).toBeVisible()
  })

  test.fail('filter "Semua" tidak mengirim status=ALL ke BE (F-30)', async ({ page, mockApi }) => {
    const { queries } = mockManagePenalty(mockApi, { getUsers: () => [makePenaltyUser()] })

    await gotoHydrated(page, '/admin/penalty')
    await expect(userRow(page)).toBeVisible()
    expect(queries.at(-1)?.get('status')).toBeNull()
  })

  test.fail('status WARNING tampil "Peringatan", bukan "Normal" (F-30)', async ({ page, mockApi }) => {
    mockManagePenalty(mockApi, { getUsers: () => [makePenaltyUser({ suspend_status: 'WARNING' })] })

    await gotoHydrated(page, '/admin/penalty')
    await expect(userRow(page).getByText('Peringatan')).toBeVisible({ timeout: 3000 })
  })

  test('kenakan penalty: validasi, cari user, rule aktif saja & body request', async ({ page, mockApi }) => {
    let users: unknown[] = []
    const { queries } = mockManagePenalty(mockApi, { getUsers: () => users })
    const searches: string[] = []
    mockApi.on('GET', '/admin/users', (_r, url) => {
      searches.push(url.searchParams.get('keyword') ?? '')
      return ok(page1([SELLER]))
    })
    let body: unknown = null
    mockApi.on('POST', '/admin/penalty', (route) => {
      body = jsonBody(route)
      users = [makePenaltyUser()]
      return ok(makePenalty('P-1'))
    })

    await gotoHydrated(page, '/admin/penalty')
    await expect(main(page).getByText('Tidak ada user dengan riwayat penalty.')).toBeVisible()
    await main(page).getByRole('button', { name: 'Kenakan Penalty' }).click()
    const dialog = page.getByRole('dialog', { name: 'Kenakan Penalty' })

    await dialog.getByRole('button', { name: 'Kenakan Penalty' }).click()
    await expect(dialog.getByText('User harus dipilih')).toBeVisible()
    await expect(dialog.getByText('Penalty rule harus dipilih')).toBeVisible()
    expect(body).toBeNull()

    // Hanya rule aktif yang bisa dipilih
    await expect(dialog.getByText('SELLER_LATE')).toBeVisible()
    await expect(dialog.getByText('SELLER_OLD')).toHaveCount(0)

    await dialog.getByPlaceholder('Ketik username atau email...').fill('seller')
    await page.getByRole('option', { name: /Tes SELLER/ }).click()
    expect(searches).toContain('seller')

    await dialog.getByRole('button', { name: /Keterlambatan Pengiriman/ }).click()
    await expect(dialog.getByRole('spinbutton')).toHaveValue('30')
    await dialog.getByPlaceholder('Alasan / catatan pengenaan penalty (opsional)').fill('Telat kirim 3x')
    const fetchesBefore = queries.length
    await dialog.getByRole('button', { name: 'Kenakan Penalty' }).click()

    await expect(page.getByText('Tes SELLER telah dikenakan penalty.').first()).toBeVisible()
    expect(body).toEqual({ user_id: 7, rule_id: 'SELLER_LATE', expired_days: 30, notes: 'Telat kirim 3x' })
    await expect(dialog).toHaveCount(0)
    await expect(userRow(page)).toBeVisible()
    expect(queries.length).toBeGreaterThan(fetchesBefore)
  })

  test('detail user: batalkan penalty aktif lewat konfirmasi & riwayat dimuat ulang', async ({ page, mockApi }) => {
    let penalties = [makePenalty('P-1', { notes: 'Telat kirim 3x' }), makePenalty('P-0', { is_expired: true, rule_name: 'Spam Chat' })]
    const { queries, detailFetches } = mockManagePenalty(mockApi, {
      getUsers: () => [makePenaltyUser({ active_points: penalties.filter((p) => !p.is_expired).length * 10 })],
      getDetail: () => penalties,
    })
    let cancelled: string | null = null
    mockApi.on('DELETE', '/admin/penalty/P-1', () => {
      cancelled = 'P-1'
      penalties = penalties.filter((p) => p.id !== 'P-1')
      return ok(null)
    })

    await gotoHydrated(page, '/admin/penalty')
    await userRow(page).click()
    const slideover = page.getByRole('dialog', { name: 'Tes SELLER' })
    const active = slideover.locator('div.border').filter({ hasText: 'Telat kirim 3x' })
    await expect(active.getByText('Aktif', { exact: true })).toBeVisible()
    await expect(active.getByText('Oleh: admin@test.local')).toBeVisible()
    // Penalty kedaluwarsa tidak bisa dibatalkan
    const expired = slideover.locator('div.border').filter({ hasText: 'Spam Chat' })
    await expect(expired.getByText('Kedaluwarsa')).toBeVisible()
    await expect(expired.getByRole('button', { name: 'Batalkan' })).toHaveCount(0)

    const listBefore = queries.length
    const detailBefore = detailFetches()
    await active.getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog', { name: 'Batalkan Penalty?' }).getByRole('button', { name: 'Ya, Batalkan' }).click()

    await expect(page.getByText('Penalty dibatalkan').first()).toBeVisible()
    expect(cancelled).toBe('P-1')
    await expect(slideover.getByText('Telat kirim 3x')).toHaveCount(0)
    expect(detailFetches()).toBeGreaterThan(detailBefore)
    expect(queries.length).toBeGreaterThan(listBefore)
  })

  test.fail('detail user: poin aktif di header ikut berubah setelah penalty dibatalkan (F-31)', async ({ page, mockApi }) => {
    let penalties = [makePenalty('P-1')]
    mockManagePenalty(mockApi, {
      getUsers: () => [makePenaltyUser({ active_points: penalties.length * 10 })],
      getDetail: () => penalties,
    })
    mockApi.on('DELETE', '/admin/penalty/P-1', () => ((penalties = []), ok(null)))

    await gotoHydrated(page, '/admin/penalty')
    await userRow(page).click()
    const slideover = page.getByRole('dialog', { name: 'Tes SELLER' })
    await expect(slideover.getByText('10', { exact: true })).toBeVisible()
    await slideover.getByRole('button', { name: 'Batalkan' }).click()
    await page.getByRole('dialog', { name: 'Batalkan Penalty?' }).getByRole('button', { name: 'Ya, Batalkan' }).click()
    await expect(slideover.getByText('Tidak ada riwayat penalty.')).toBeVisible()

    await expect(slideover.getByText('0', { exact: true })).toBeVisible({ timeout: 2000 })
  })

  test('dari detail user: modal kenakan penalty terisi user tersebut', async ({ page, mockApi }) => {
    mockManagePenalty(mockApi, { getUsers: () => [makePenaltyUser()] })
    let body: any = null
    mockApi.on('POST', '/admin/penalty', (route) => ((body = jsonBody(route)), ok(makePenalty('P-2'))))

    await gotoHydrated(page, '/admin/penalty')
    await userRow(page).click()
    await page.getByRole('button', { name: 'Kenakan Penalty ke User Ini' }).click()
    const dialog = page.getByRole('dialog', { name: 'Kenakan Penalty' })
    await expect(dialog.getByPlaceholder('Ketik username atau email...')).toHaveValue(`Tes SELLER (${SELLER.email})`)

    await dialog.getByRole('button', { name: /Keterlambatan Pengiriman/ }).click()
    await dialog.getByRole('button', { name: 'Kenakan Penalty' }).click()
    await expect(page.getByText('Penalty berhasil dikenakan').first()).toBeVisible()
    expect(body).toMatchObject({ user_id: 7, rule_id: 'SELLER_LATE', expired_days: 30 })
  })
})

// ───────────────────────── Penalty buyer & seller ─────────────────────────

test.describe('Penalty milik user', () => {
  test('buyer: banner suspend sementara & riwayat penalty', async ({ page, mockApi }) => {
    mockApi
      .asRole('BUYER')
      .on('GET', '/system/settings/public', ok([setting('WA_NUMBER', '+62 812-3456-7890')]))
      .on('GET', '/user/penalty/stat', ok({
        active_points: 30, active_point_merchant: 0, suspend_status: 'TEMPORARY',
        suspend_until: '2026-12-01T00:00:00', verified_seller: false,
      }))
      .on('GET', '/user/penalty', ok(page1([
        makePenalty('P-1', { rule_name: 'Pembatalan Berulang', points: 30, transaction_id: 'TX-9', notes: 'Batal 5x seminggu' }),
        makePenalty('P-0', { rule_name: 'Spam Chat', points: 5, is_expired: true }),
      ])))

    await gotoHydrated(page, '/penalty')
    await expect(page.getByText('Akun Disuspend Sementara')).toBeVisible()
    await expect(page.getByText('Berlaku hingga 01 Dec 2026.')).toBeVisible()
    await expect(page.getByText('30 poin aktif')).toBeVisible()

    const m = main(page)
    await expect(m.getByText('Pembatalan Berulang')).toBeVisible()
    await expect(m.getByText('Transaksi: TX-9')).toBeVisible()
    await expect(m.getByText('Batal 5x seminggu')).toBeVisible()
    await expect(m.getByRole('link', { name: 'Hubungi Admin via WA' })).toHaveAttribute('href', 'https://wa.me/6281234567890')
    // Kartu statistik: total 2, aktif 1, kedaluwarsa 1, poin aktif 30
    for (const [label, value] of [['Total Penalty', '2'], ['Masih Aktif', '1'], ['Kedaluwarsa', '1'], ['Poin Aktif', '30']]) {
      await expect(m.locator('div').filter({ has: page.getByText(label, { exact: true }) }).getByText(value, { exact: true }).first()).toBeVisible()
    }
  })

  test('buyer tanpa penalty: banner tidak tampil', async ({ page, mockApi }) => {
    mockApi
      .asRole('BUYER')
      .on('GET', '/user/penalty/stat', ok({ active_points: 0, active_point_merchant: 0, suspend_status: 'NONE', suspend_until: null, verified_seller: false }))
      .on('GET', '/user/penalty', ok(emptyPage()))

    await gotoHydrated(page, '/penalty')
    await expect(main(page).getByText('Tidak ada riwayat penalty')).toBeVisible()
    await expect(page.getByText('Lihat Detail')).toHaveCount(0)
  })

  // /penalty tidak ada di authRequiredRoutes; redirect terjadi karena useApi menangani 401 dari BE (lihat F-19)
  test('pengunjung yang membuka /penalty diarahkan ke login (lewat 401 BE)', async ({ page, mockApi }) => {
    mockApi.on('GET', '/user/penalty', fail(401, 'Unauthorized'))

    await gotoHydrated(page, '/penalty')
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 })
  })

  test('seller: riwayat penalty di dashboard seller', async ({ page, mockApi }) => {
    mockApi
      .asRole('SELLER')
      .on('GET', '/user/penalty', ok(page1([makePenalty('P-1', { notes: 'Telat kirim 3x' })])))

    await gotoHydrated(page, '/seller/penalty')
    const m = main(page)
    await expect(m.getByText('Keterlambatan Pengiriman')).toBeVisible()
    await expect(m.getByText('Telat kirim 3x')).toBeVisible()
  })
})
