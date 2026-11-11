import { test, expect, ok, fail, emptyPage, gotoHydrated, type MockApi } from './support/fixtures'
import { makeTx } from './support/payment'
import type { Page } from '@playwright/test'

type Tx = ReturnType<typeof makeTx>

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

/** Transaksi yang ditangguhkan buyer setelah pesanan dikirim */
const arbitrageTx = (id: string, overrides: Record<string, unknown> = {}) =>
  makeTx(id, `PAY-${id}`, {
    status: 'ARBITRAGE',
    paid_at: hoursAgo(5),
    confirmed_at: hoursAgo(4),
    delivered_at: hoursAgo(3),
    tx_description: 'Akun tidak bisa login sama sekali',
    ...overrides,
  })

const main = (page: Page) => page.getByRole('main')

/** Ambil field multipart dari body mentah */
const multipartFields = (raw: string) =>
  Object.fromEntries([...raw.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)].map((m) => [m[1], m[2]]))

/** Mock halaman detail order admin; `getTx` dipanggil tiap fetch supaya status bisa berubah */
function mockAdminDetail(mockApi: MockApi, getTx: () => Tx, getDiscussions: () => unknown[] = () => []) {
  const id = getTx().id
  let alertFetches = 0
  mockApi
    .asRole('ADMIN')
    .on('GET', '/admin/alerts', () => (alertFetches++, ok({ arbitrage_pending: getTx().status === 'ARBITRAGE' ? 1 : 0 })))
    .on('GET', `/tx/get/${id}`, () => ok(getTx()))
    .on('GET', `/order/discussion/transaction/${id}`, () => ok(page1(getDiscussions())))
    .on('GET', `/order/file/transaction/${id}`, ok(emptyPage()))
    .on('GET', `/review/transaction/${id}`, ok([]))
    .on('GET', `/guarantee/transaction/${id}`, fail(404, 'Tidak ada garansi'))
  return { alertFetches: () => alertFetches }
}

/** Isi alasan di modal Refund/Selesaikan (validasi minimal 10 karakter) lalu kirim */
async function submitReason(page: Page, dialogName: string, submitName: string, reason: string) {
  const dialog = page.getByRole('dialog', { name: dialogName })
  await expect(dialog).toBeVisible()
  const submit = dialog.getByRole('button', { name: submitName })
  await dialog.getByRole('textbox').fill('salah')
  await expect(dialog.getByText('Alasan minimal 10 karakter')).toBeVisible()
  await expect(submit).toBeDisabled()
  await dialog.getByRole('textbox').fill(reason)
  await submit.click()
  return dialog
}

test.describe('Daftar pesanan admin', () => {
  test('filter ARBITRAGE dari URL badge sidebar & tautan ke detail', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi
      .asRole('ADMIN')
      .on('GET', '/admin/alerts', ok({ arbitrage_pending: 1 }))
      .on('GET', '/tx/all', (_r, url) => {
        queries.push(url.searchParams)
        return ok(page1([arbitrageTx('TX-1')]))
      })

    await gotoHydrated(page, '/admin/order?status=ARBITRAGE')
    const row = main(page).locator('div.divide-y > div').filter({ hasText: '#TX-1' })
    await expect(row.getByText('Pesanan Di-Review Admin')).toBeVisible()
    await expect(row.getByText('buyer_test · 2 pcs × Rp 25.000')).toBeVisible()
    expect(queries.at(-1)?.get('status')).toBe('ARBITRAGE')

    // Badge sidebar mengarah ke daftar terfilter
    await expect(page.locator('a[href="/admin/order?status=ARBITRAGE"]').first()).toBeVisible()

    await row.getByRole('link', { name: 'Detail' }).click()
    await expect(page).toHaveURL(/\/admin\/order\/TX-1$/)
  })

  test.fail('error BE pada daftar menampilkan pesan BE (F-26)', async ({ page, mockApi }) => {
    mockApi
      .asRole('ADMIN')
      .on('GET', '/tx/all', fail(400, 'Status tidak valid'))

    await gotoHydrated(page, '/admin/order')
    await expect(main(page).getByText('Terjadi Kesalahan')).toBeVisible()
    await expect(main(page).getByText('Status tidak valid')).toBeVisible()
  })
})

test.describe('Arbitrase & refund admin', () => {
  test('ARBITRAGE: alasan penangguhan & tombol aksi admin', async ({ page, mockApi }) => {
    mockAdminDetail(mockApi, () => arbitrageTx('TX-1'))

    await gotoHydrated(page, '/admin/order/TX-1')
    await expect(main(page).getByText('Pembeli Mengajukan Penangguhan!')).toBeVisible()
    await expect(main(page).getByText('Akun tidak bisa login sama sekali')).toBeVisible()
    await expect(main(page).getByText('Admin segera melakukan review !')).toBeVisible()
    for (const name of ['Refund Transaksi', 'Cancel Arbitrage', 'Selesaikan Transaksi']) {
      await expect(main(page).getByRole('button', { name })).toBeVisible()
    }
  })

  test('di luar ARBITRAGE tidak ada tombol refund/selesaikan paksa (T-02)', async ({ page, mockApi }) => {
    mockAdminDetail(mockApi, () => makeTx('TX-1', 'PAY-TX-1', { status: 'IN_PROGRESS', paid_at: hoursAgo(3), confirmed_at: hoursAgo(2) }))

    await gotoHydrated(page, '/admin/order/TX-1')
    await expect(main(page).getByRole('button', { name: 'Refresh' })).toBeVisible()
    for (const name of ['Refund Transaksi', 'Cancel Arbitrage', 'Selesaikan Transaksi']) {
      await expect(main(page).getByRole('button', { name })).toHaveCount(0)
    }
  })

  test('cancel arbitrage: "Tidak" tanpa API, "Ya, Teruskan" memanggil API & memuat ulang', async ({ page, mockApi }) => {
    let tx = arbitrageTx('TX-1')
    const { alertFetches } = mockAdminDetail(mockApi, () => tx)
    let calls = 0
    mockApi.on('PATCH', '/tx/cancel/arbitrage/TX-1', () => {
      calls++
      tx = { ...tx, status: 'DELIVERED', delivered_at: hoursAgo(0) }
      return ok(tx)
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Cancel Arbitrage' }).click()
    const dialog = page.getByRole('dialog', { name: 'Yakin ingin melanjutkan transaksi ini?' })
    await dialog.getByRole('button', { name: 'Tidak' }).click()
    await expect(dialog).toHaveCount(0)
    expect(calls).toBe(0)

    const alertsBefore = alertFetches()
    await main(page).getByRole('button', { name: 'Cancel Arbitrage' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ya, Teruskan' }).click()

    await expect(page.getByText('Pesanan berhasil diteruskan').first()).toBeVisible()
    expect(calls).toBe(1)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(main(page).getByText('Pesanan Telah Dikirim')).toBeVisible()
    await expect(main(page).getByText('Pembeli Mengajukan Penangguhan!')).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Cancel Arbitrage' })).toHaveCount(0)
    await expect.poll(alertFetches).toBeGreaterThan(alertsBefore)
  })

  test('refund: validasi alasan, body request & status REFUNDED', async ({ page, mockApi }) => {
    let tx = arbitrageTx('TX-1')
    mockAdminDetail(mockApi, () => tx)
    let body: unknown = null
    mockApi.on('PATCH', '/tx/refund/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'REFUNDED', tx_description: 'Akun terbukti bermasalah' }
      return ok(tx)
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Refund Transaksi' }).click()
    const dialog = await submitReason(page, 'Refund Pesanan', 'Refund Pesanan', '  Akun terbukti bermasalah  ')

    await expect(page.getByText('Pesanan berhasil direfund').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Akun terbukti bermasalah' })
    await expect(dialog).toHaveCount(0)
    await expect(main(page).getByText('Pesanan Direfund!')).toBeVisible()
    await expect(main(page).getByText('Akun terbukti bermasalah')).toBeVisible()
    // Status final → form kirim pesan disembunyikan
    await expect(main(page).getByText('Kirim Pesan / Orderan')).toHaveCount(0)
  })

  test('selesaikan paksa: body request & status COMPLETE menyembunyikan tombol aksi', async ({ page, mockApi }) => {
    let tx = arbitrageTx('TX-1')
    mockAdminDetail(mockApi, () => tx)
    let body: unknown = null
    mockApi.on('PATCH', '/tx/complete/TX-1', (route) => {
      body = route.request().postDataJSON()
      tx = { ...tx, status: 'COMPLETE', done_at: hoursAgo(0) }
      return ok(tx)
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Selesaikan Transaksi' }).click()
    const dialog = await submitReason(page, 'Selesaikan Pesanan', 'Selesaikan Pesanan', 'Akun sudah dicek dan normal')

    await expect(page.getByText('Pesanan berhasil diselesaikan').first()).toBeVisible()
    expect(body).toEqual({ reason: 'Akun sudah dicek dan normal' })
    await expect(dialog).toHaveCount(0)
    for (const name of ['Refund Transaksi', 'Cancel Arbitrage', 'Selesaikan Transaksi']) {
      await expect(main(page).getByRole('button', { name })).toHaveCount(0)
    }
  })

  test('refund 409: pesan BE tampil & data dimuat ulang', async ({ page, mockApi }) => {
    let tx = arbitrageTx('TX-1')
    mockAdminDetail(mockApi, () => tx)
    mockApi.on('PATCH', '/tx/refund/TX-1', () => {
      tx = { ...tx, status: 'COMPLETE' }
      return fail(409, 'Transaksi sudah selesai')
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Refund Transaksi' }).click()
    await submitReason(page, 'Refund Pesanan', 'Refund Pesanan', 'Akun terbukti bermasalah')

    await expect(page.getByText('Transaksi sudah selesai').first()).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Refund Transaksi' })).toHaveCount(0)
  })

  test.fail('refund 400: modal tetap terbuka dengan pesan BE & alasan tidak hilang (F-24)', async ({ page, mockApi }) => {
    mockAdminDetail(mockApi, () => arbitrageTx('TX-1'))
    mockApi.on('PATCH', '/tx/refund/TX-1', fail(400, 'Saldo escrow seller tidak mencukupi'))

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Refund Transaksi' }).click()
    const dialog = await submitReason(page, 'Refund Pesanan', 'Refund Pesanan', 'Akun terbukti bermasalah')

    await expect(page.getByText('Saldo escrow seller tidak mencukupi').first()).toBeVisible()
    // Tunggu animasi tutup modal selesai sebelum memastikan modal masih terbuka
    await page.waitForTimeout(800)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Saldo escrow seller tidak mencukupi')).toBeVisible()
    await expect(dialog.getByRole('textbox')).toHaveValue('Akun terbukti bermasalah')
  })

  test('status final (REFUNDED) tidak menampilkan tombol Refund/Selesaikan (F-25)', async ({ page, mockApi }) => {
    mockAdminDetail(mockApi, () => arbitrageTx('TX-1', { status: 'REFUNDED' }))

    await gotoHydrated(page, '/admin/order/TX-1')
    await expect(main(page).getByText('Pesanan Direfund!')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Refund Transaksi' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Selesaikan Transaksi' })).toHaveCount(0)
  })
})

test.describe('Diskusi order oleh admin', () => {
  test('kirim pesan: body multipart, textarea dikosongkan & diskusi dimuat ulang', async ({ page, mockApi }) => {
    const discussions: unknown[] = []
    mockAdminDetail(mockApi, () => arbitrageTx('TX-1'), () => discussions)
    let fields: Record<string, string> | null = null
    mockApi.on('POST', '/order/discussion/create', (route) => {
      fields = multipartFields(route.request().postData() ?? '')
      const msg = {
        id: 'D-1', transaction_id: 'TX-1', username: 'admin_test', sender_role: 'ADMIN',
        message: fields.message, discussion_type: 'MESSAGE', file: null, created_at: hoursAgo(0),
      }
      discussions.push(msg)
      return ok(msg)
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    const textarea = main(page).getByPlaceholder('Tulis pesan disini...')
    await textarea.fill('Mohon seller kirim bukti akun')
    await main(page).getByRole('button', { name: 'Kirim Pesan' }).click()

    await expect(page.getByText('Pesan terkirim').first()).toBeVisible()
    expect(fields).toEqual({ transactionId: 'TX-1', message: 'Mohon seller kirim bukti akun', discussionType: 'MESSAGE' })
    await expect(textarea).toHaveValue('')
    const bubble = main(page).locator('div.bg-yellow-100').filter({ hasText: 'Mohon seller kirim bukti akun' })
    await expect(bubble.getByText('ADMIN', { exact: true })).toBeVisible()
  })

  test.fail('pesan kosong divalidasi tanpa alert() browser (F-27)', async ({ page, mockApi }) => {
    mockAdminDetail(mockApi, () => arbitrageTx('TX-1'))
    const alerts: string[] = []
    page.on('dialog', (d) => {
      alerts.push(d.message())
      void d.dismiss()
    })

    await gotoHydrated(page, '/admin/order/TX-1')
    await main(page).getByRole('button', { name: 'Kirim Pesan' }).click()
    await expect(page.getByText('Pesan tidak boleh kosong').first()).toBeVisible({ timeout: 2000 })
    expect(alerts).toEqual([])
  })
})
