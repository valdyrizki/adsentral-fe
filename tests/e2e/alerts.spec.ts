import { test, expect, ok, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

/** Badge (UChip) membungkus tombol header; teksnya ada di elemen induk tombol */
const headerChip = (page: Page, href: string) => page.locator(`a[href="${href}"]`).first().locator('xpath=..')

const setVisibility = (page: Page, state: 'visible' | 'hidden') =>
  page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s })
    document.dispatchEvent(new Event('visibilitychange'))
  }, state)

test.describe('Badge alerts', () => {
  test('buyer: angka dari /alerts, null & 0 disembunyikan, >99 jadi 99+', async ({ page, mockApi }) => {
    let alerts: Record<string, number | null> = { unread_notifications: 5, unread_chats: null }
    mockApi.asRole('BUYER').on('GET', '/alerts', () => ok(alerts)).on('GET', '/products', ok(emptyPage()))

    await gotoHydrated(page, '/profile')
    await expect(headerChip(page, '/notification')).toContainText('5')
    await expect(headerChip(page, '/chat')).not.toContainText(/\d/)

    alerts = { unread_notifications: 0, unread_chats: 150 }
    await gotoHydrated(page, '/profile')
    await expect(headerChip(page, '/chat')).toContainText('99+')
    await expect(headerChip(page, '/notification')).not.toContainText(/\d/)
  })

  test('polling tiap 45 detik; berhenti saat tab tersembunyi, muat ulang saat kembali', async ({ page, mockApi }) => {
    await page.clock.install()
    let calls = 0
    mockApi.asRole('BUYER').on('GET', '/alerts', () => { calls++; return ok({ unread_notifications: calls, unread_chats: 0 }) })

    await gotoHydrated(page, '/profile')
    await expect.poll(() => calls).toBeGreaterThan(0)
    const afterMount = calls

    await page.clock.fastForward(45_000)
    await expect.poll(() => calls).toBe(afterMount + 1)
    await expect(headerChip(page, '/notification')).toContainText(String(afterMount + 1))

    await setVisibility(page, 'hidden')
    await page.clock.fastForward(3 * 45_000)
    await page.waitForTimeout(300)
    expect(calls).toBe(afterMount + 1)

    await setVisibility(page, 'visible')
    await expect.poll(() => calls).toBe(afterMount + 2)
  })

  test('seller: field null hanya menyembunyikan badge itu', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
      .on('GET', '/seller/alerts', ok({
        unread_notifications: 4, pending_confirmation: null, unread_chats: 2, guarantee_requests: null,
        rejected_orders: null, cancel_requests: null, arbitrage_orders: null,
      }))
      .on('GET', '/notification', ok(emptyPage()))

    await gotoHydrated(page, '/seller/notification')
    await expect(page.locator('a[href="/seller/notification"]').first()).toContainText('4')
    await expect(page.locator('a[href="/seller/chat"]').first()).toContainText('2')
    await expect(page.locator('a[href="/seller/order"]').first()).not.toContainText(/\d/)
  })
})
