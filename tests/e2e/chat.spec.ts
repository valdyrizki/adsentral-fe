import { test, expect, ok, fail, gotoHydrated, type MockApi } from './support/fixtures'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const pageOf = (content: unknown[]) => ({ page: 0, size: 10, total_elements: content.length, total_pages: 1, last: true, content })

const MERCHANT = { id: 10, name: 'Toko Tes', slug: 'toko-tes', logo_url: '', banner_url: '', description: '', status: 'ACTIVE' }

const conversation = (over: Record<string, unknown> = {}) => ({
  id: 77, buyer_id: 1, buyer_username: 'buyer_test', buyer_avatar_url: null, merchant: MERCHANT,
  created_at: '2026-11-19T08:00:00', last_message: 'Masih ada stok?', last_message_at: '2026-11-19T09:00:00',
  last_sender_id: 1, last_sender_type: 'BUYER', buyer_unread_count: 2, seller_unread_count: 0, ...over,
})

const chat = (id: number, sender: 'BUYER' | 'SELLER', message: string) => ({
  id, conversation_id: 77, senderId: sender === 'BUYER' ? 1 : 2, sender_type: sender, message,
  product: null, transaction: null, file: null, status: 'SENT', created_at: '2026-11-19T09:00:00', updated_at: '2026-11-19T09:00:00',
})

/** Nilai field teks dari body multipart (FormData) */
const formField = (req: Request, name: string): string | null => {
  const body = req.postDataBuffer()?.toString('latin1') ?? ''
  const m = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`))
  return m ? m[1]! : null
}

function mockChat(mockApi: MockApi, role: 'BUYER' | 'SELLER') {
  const sent: Request[] = []
  mockApi.asRole(role)
    .on('GET', role === 'BUYER' ? '/chat/buyer/conversation' : '/chat/seller/conversation', ok(pageOf([conversation()])))
    .on('GET', '/chat/conversation/77', ok(pageOf([chat(2, 'SELLER', 'Halo, ada yang bisa dibantu?'), chat(1, 'BUYER', 'Masih ada stok?')])))
    .on('GET', '/products/merchant/10', ok(pageOf([])))
    .on('POST', '/chat/send', (route) => { sent.push(route.request()); return ok(chat(3, role, 'x')) })
  return sent
}

const messageBox = (page: Page) => main(page).getByPlaceholder('Ketik pesan...')

test.describe('Chat buyer', () => {
  test('daftar percakapan: toko, pesan terakhir, belum dibaca; buka percakapan menampilkan pesan', async ({ page, mockApi }) => {
    mockChat(mockApi, 'BUYER')

    await gotoHydrated(page, '/chat')
    const m = main(page)
    const item = m.getByText('Masih ada stok?').first()
    await expect(m.getByText('Toko Tes').first()).toBeVisible()
    await expect(item).toBeVisible()
    await expect(m.getByText('2', { exact: true }).first()).toBeVisible()

    await item.click()
    await expect(m.getByText('Halo, ada yang bisa dibantu?')).toBeVisible()
  })

  test('kirim pesan: body multipart berisi toko, peran, percakapan & pesan', async ({ page, mockApi }) => {
    const sent = mockChat(mockApi, 'BUYER')

    await gotoHydrated(page, '/chat')
    await main(page).getByText('Masih ada stok?').first().click()
    await messageBox(page).fill('Saya mau 2 akun')
    await main(page).getByRole('button', { name: 'Kirim', exact: true }).click()

    await expect(page.getByText('Pesan terkirim').first()).toBeVisible()
    expect(formField(sent[0]!, 'merchantId')).toBe('10')
    expect(formField(sent[0]!, 'senderType')).toBe('BUYER')
    expect(formField(sent[0]!, 'conversationId')).toBe('77')
    expect(formField(sent[0]!, 'message')).toBe('Saya mau 2 akun')
    await expect(messageBox(page)).toHaveValue('')
  })

  test('pesan kosong atau hanya spasi: tombol Kirim nonaktif', async ({ page, mockApi }) => {
    mockChat(mockApi, 'BUYER')

    await gotoHydrated(page, '/chat')
    await main(page).getByText('Masih ada stok?').first().click()
    const send = main(page).getByRole('button', { name: 'Kirim', exact: true })
    await expect(send).toBeDisabled()
    await messageBox(page).fill('   ')
    await expect(send).toBeDisabled()
  })

  test('kirim gagal: pesan BE tampil dan pesan yang diketik tidak hilang (F-45)', async ({ page, mockApi }) => {
    mockChat(mockApi, 'BUYER')
    mockApi.on('POST', '/chat/send', fail(400, 'Pesan mengandung nomor telepon'))

    await gotoHydrated(page, '/chat')
    await main(page).getByText('Masih ada stok?').first().click()
    await messageBox(page).fill('Hubungi 08123456789')
    await main(page).getByRole('button', { name: 'Kirim', exact: true }).click()

    await expect(page.getByText('Pesan mengandung nomor telepon').first()).toBeVisible()
    await expect(messageBox(page)).toHaveValue('Hubungi 08123456789')
  })
})

test.describe('Chat seller', () => {
  test('daftar percakapan pembeli; kirim balasan dengan senderType SELLER', async ({ page, mockApi }) => {
    const sent = mockChat(mockApi, 'SELLER')

    await gotoHydrated(page, '/seller/chat')
    await main(page).getByText('buyer_test').first().click()
    await expect(main(page).getByText('Halo, ada yang bisa dibantu?')).toBeVisible()
    await messageBox(page).fill('Stok masih ada, silakan order')
    await main(page).getByRole('button', { name: 'Kirim', exact: true }).click()

    await expect(page.getByText('Pesan terkirim').first()).toBeVisible()
    expect(formField(sent[0]!, 'senderType')).toBe('SELLER')
    expect(formField(sent[0]!, 'conversationId')).toBe('77')
    expect(formField(sent[0]!, 'message')).toBe('Stok masih ada, silakan order')
  })

  test('kirim gagal: pesan BE tampil dan balasan yang diketik tidak hilang (F-45)', async ({ page, mockApi }) => {
    mockChat(mockApi, 'SELLER')
    mockApi.on('POST', '/chat/send', fail(403, 'Toko sedang ditangguhkan'))

    await gotoHydrated(page, '/seller/chat')
    await main(page).getByText('buyer_test').first().click()
    await messageBox(page).fill('Stok masih ada')
    await main(page).getByRole('button', { name: 'Kirim', exact: true }).click()

    await expect(page.getByText('Toko sedang ditangguhkan').first()).toBeVisible()
    await expect(messageBox(page)).toHaveValue('Stok masih ada')
  })
})

test.describe('Chat admin', () => {
  test('memakai percakapan seller; kirim gagal tidak menghapus pesan (F-45)', async ({ page, mockApi }) => {
    const sent: Request[] = []
    mockApi.asRole('ADMIN')
      .on('GET', '/chat/seller/conversation', ok(pageOf([conversation()])))
      .on('GET', '/chat/conversation/77', ok(pageOf([chat(1, 'BUYER', 'Halo admin')])))
      .on('GET', '/products/merchant/10', ok(pageOf([])))
      .on('POST', '/chat/send', (route) => { sent.push(route.request()); return fail(500, 'Internal Server Error') })

    await gotoHydrated(page, '/admin/chat')
    await main(page).getByText('buyer_test').first().click()
    await expect(main(page).getByText('Halo admin')).toBeVisible()
    await messageBox(page).fill('Baik, kami cek')
    await main(page).getByRole('button', { name: 'Kirim', exact: true }).click()

    await expect.poll(() => sent.length).toBe(1)
    await expect(page.getByText('Gagal mengirim pesan').first()).toBeVisible()
    await expect(messageBox(page)).toHaveValue('Baik, kami cek')
  })
})
