import { test, expect, ok, emptyPage, gotoHydrated } from './support/fixtures'
import { makeProduct } from './support/cart'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })
const queryOf = (url: string) => Object.fromEntries(new URL(url).searchParams)

const seller = {
  id: 5, email: 'seller5@test.local', username: 'seller5', full_name: 'Seller Lima', phone_number: null,
  birth_date: null, address: null, avatar_url: null, role: 'SELLER', status: 'ACTIVE', account_status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00', locked_until: null,
}

const guarantee = (id: string, over: Record<string, unknown> = {}) => ({
  id, transaction: { id: 'TX777' }, product: { name: 'Akun Tes' }, merchant_id: 9, merchant_name: 'Toko Sembilan',
  buyer_id: 3, buyer_name: 'Budi', status: 'IN_REVIEW', complain_description: 'akun tidak bisa login',
  seller_description: null, file_id: null, file_url: null, file_ori_name: null, discussions: [],
  created_at: '2026-11-15T09:00:00', updated_at: null, reviewed_at: null, rejected_at: null, progress_at: null,
  done_at: null, review_deadline: '2026-11-18T09:00:00', progress_deadline: null, ...over,
})

// EP06-08: CS melihat data seller tanpa akses DB.
test.describe('Admin: data seller (EP06-08)', () => {
  test('daftar garansi admin dengan filter status, toko, dan transaksi', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    const queries: Record<string, string>[] = []
    mockApi.on('GET', '/admin/guarantee', (route) => {
      queries.push(queryOf(route.request().url()))
      return ok(page1([guarantee('GR1')]))
    })

    await gotoHydrated(page, '/admin/guarantee?merchant_id=9')
    await expect(main(page).getByText('GR1')).toBeVisible()
    await expect(main(page).getByText('Toko Sembilan')).toBeVisible()
    await expect(main(page).getByText('akun tidak bisa login')).toBeVisible()
    expect(queries[0]).toMatchObject({ merchant_id: '9' })

    await main(page).getByPlaceholder('ID transaksi').fill('TX777')
    await expect.poll(() => queries.at(-1)).toMatchObject({ merchant_id: '9', transaction_id: 'TX777' })
  })

  test('detail seller di daftar pengguna: mutasi saldo, ringkasan, rekening penuh, dan tautan data toko', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([seller])))
    mockApi.on('GET', '/admin/balance/log/5', ok(page1([{
      id: 1, amount: 15000, type: 'CREDIT', source: 'SALES_ESCROW_RELEASE', description: 'Transaksi selesai TX1',
      deposit_balance_old: 0, deposit_balance_new: 0, sales_balance_old: 0, sales_balance_new: 15000,
      deposit_held_old: 0, deposit_held_new: 0, sales_held_old: 15000, sales_held_new: 0, created_at: '2026-11-15T10:00:00',
    }])))
    mockApi.on('GET', '/admin/seller/5/summary', ok({
      seller_id: 5, merchant_id: 9, merchant_name: 'Toko Sembilan',
      orders: { active: 2, waiting_confirmation: 1, cancel_request: 0, guarantee_request: 1, arbitrage: 0, completed: 7 },
      products: { active: 3, in_review: 1, blocked: 0 },
      finance: { today_transaction_amount: 50000, total_income: 700000, withdrawn: 300000 },
    }))
    mockApi.on('GET', '/admin/bank-account/5', ok({
      id: 'b1', bank_name: 'BCA', account_number: '9876543210', account_holder_name: 'Seller Lima', name_check_status: 'MATCHED',
    }))

    await gotoHydrated(page, '/admin/users')
    await main(page).getByRole('button', { name: 'Detail' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Transaksi selesai TX1')).toBeVisible()

    await dialog.getByRole('tab', { name: 'Ringkasan Seller' }).click()
    await expect(dialog.getByText('Toko Sembilan')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Produk' })).toHaveAttribute('href', '/admin/product?merchant_id=9')
    await expect(dialog.getByRole('link', { name: 'Withdrawal' })).toHaveAttribute('href', '/admin/withdrawal?user_id=5')

    await dialog.getByRole('tab', { name: 'Rekening' }).click()
    await expect(dialog.getByText('9876543210')).toBeVisible()
  })

  test('daftar produk & withdrawal admin memakai filter toko/user dari URL', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let productQuery: Record<string, string> = {}
    let withdrawalQuery: Record<string, string> = {}
    mockApi.on('GET', '/products/all', (route) => {
      productQuery = queryOf(route.request().url())
      return ok(page1([makeProduct(1)]))
    })
    mockApi.on('GET', '/admin/withdrawal', (route) => {
      withdrawalQuery = queryOf(route.request().url())
      return ok(page1([]))
    })
    mockApi.on('GET', '/system/settings/all', ok([]))

    await gotoHydrated(page, '/admin/product?merchant_id=9')
    await expect.poll(() => productQuery.merchant_id).toBe('9')
    await expect(main(page).getByText('Filter toko #9')).toBeVisible()

    await gotoHydrated(page, '/admin/withdrawal?user_id=5')
    await expect.poll(() => withdrawalQuery.user_id).toBe('5')
  })
})
