import { test, expect, ok, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')

const row = (id: number, over: Record<string, unknown> = {}) => ({
  id, created_at: '2026-11-16T10:15:00', actor_id: 3, actor_email: 'cs1@adsentral.test', service: 'withdrawal',
  action: 'REJECT_WITHDRAWAL', payload: { withdrawal_id: 'WD123', target_user_id: 42, notes: 'rekening tidak valid' },
  ip_address: '10.0.0.1', user_agent: 'Mozilla', ...over,
})
const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })

// EP06-05: pemilik (super admin) membaca jejak aksi admin tanpa akses DB.
test.describe('Super admin: audit log aksi admin (EP06-05)', () => {
  test('menampilkan pelaku, aksi, dan detail; filter aksi/pelaku/target dikirim sebagai query', async ({ page, mockApi }) => {
    mockApi.asRole('SUPER_ADMIN')
    const queries: Record<string, string>[] = []
    mockApi.on('GET', '/admin/audit-log', (route) => {
      queries.push(Object.fromEntries(new URL(route.request().url()).searchParams))
      return ok(page1([row(1)]))
    })

    await gotoHydrated(page, '/admin/audit-log')
    await expect(main(page).getByText('REJECT_WITHDRAWAL')).toBeVisible()
    await expect(main(page).getByText('cs1@adsentral.test')).toBeVisible()
    await expect(main(page).getByText('rekening tidak valid', { exact: false })).toBeVisible()

    await main(page).getByPlaceholder('Aksi, mis. REFUND_TX').fill('REFUND_TX')
    await main(page).getByPlaceholder('Email pelaku').fill('cs1')
    await main(page).getByPlaceholder('ID user target').fill('42')

    await expect.poll(() => queries.at(-1)).toMatchObject({ action: 'REFUND_TX', actor: 'cs1', target_user_id: '42' })
  })

  test('menu Audit Log hanya untuk super admin', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([])))

    await gotoHydrated(page, '/admin/users')

    await expect(page.getByRole('link', { name: 'Audit Log' })).toHaveCount(0)
  })
})
