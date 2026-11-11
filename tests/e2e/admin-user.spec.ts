import { test, expect, ok, fail, failCode, emptyPage, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const minutesFromNow = (m: number) => {
  // BE mengirim LocalDateTime tanpa offset (jam lokal)
  const d = new Date(Date.now() + m * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

const makeAdminUser = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  email: `user${id}@test.local`,
  username: `user${id}`,
  full_name: `User ${id}`,
  phone_number: null,
  birth_date: null,
  address: null,
  avatar_url: null,
  role: 'BUYER',
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00',
  locked_until: null,
  ...overrides,
})

const page1 = <T>(content: T[]) => ({ ...emptyPage(), content, total_elements: content.length, total_pages: 1 })

test.describe('Admin: daftar pengguna & buka kunci login (EP03-03)', () => {
  test('hanya akun yang sedang terkunci yang punya tombol Buka Kunci', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([
      makeAdminUser(1, { locked_until: minutesFromNow(30) }),
      makeAdminUser(2, { locked_until: minutesFromNow(-5) }), // kunci sudah lewat
      makeAdminUser(3),
    ])))

    await gotoHydrated(page, '/admin/users')

    await expect(main(page).getByText('user1@test.local', { exact: false })).toBeVisible()
    await expect(main(page).getByText(/Login terkunci s\/d/)).toHaveCount(1)
    await expect(main(page).getByRole('button', { name: 'Buka Kunci' })).toHaveCount(1)
  })

  test('buka kunci mengirim alasan, lalu daftar dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let unlocked = false
    let sentBody: unknown = null
    mockApi.on('GET', '/admin/users', () => ok(page1([
      makeAdminUser(5, { locked_until: unlocked ? null : minutesFromNow(30) }),
    ])))
    mockApi.on('PATCH', '/admin/users/5/unlock-login', (route) => {
      sentBody = route.request().postDataJSON()
      unlocked = true
      return ok(null)
    })

    await gotoHydrated(page, '/admin/users')
    await main(page).getByRole('button', { name: 'Buka Kunci' }).click()

    const dialog = page.getByRole('dialog')
    // alasan terlalu pendek ditolak di FE tanpa request
    await dialog.getByRole('textbox').fill('ok')
    await dialog.getByRole('button', { name: 'Buka Kunci' }).click()
    await expect(dialog.getByText('Alasan minimal 5 karakter')).toBeVisible()
    expect(sentBody).toBeNull()

    await dialog.getByRole('textbox').fill('  Pemilik terverifikasi via WA  ')
    await dialog.getByRole('button', { name: 'Buka Kunci' }).click()

    await expect(page.getByText('Kunci login dibuka').first()).toBeVisible()
    expect(sentBody).toEqual({ notes: 'Pemilik terverifikasi via WA' })
    await expect(main(page).getByRole('button', { name: 'Buka Kunci' })).toHaveCount(0)
  })

  test('LOGIN_NOT_LOCKED: modal ditutup dan daftar dimuat ulang', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    let calls = 0
    mockApi.on('GET', '/admin/users', () => {
      calls++
      return ok(page1([makeAdminUser(6, { locked_until: calls === 1 ? minutesFromNow(30) : null })]))
    })
    mockApi.on('PATCH', '/admin/users/6/unlock-login',
      failCode(400, 'Login akun ini tidak sedang terkunci', { code: 'LOGIN_NOT_LOCKED' }))

    await gotoHydrated(page, '/admin/users')
    await main(page).getByRole('button', { name: 'Buka Kunci' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Pemilik minta dibuka')
    await dialog.getByRole('button', { name: 'Buka Kunci' }).click()

    await expect(page.getByText('Akun sudah tidak terkunci').first()).toBeVisible()
    await expect(dialog).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Buka Kunci' })).toHaveCount(0)
  })

  test('error lain tampil di modal dan modal tetap terbuka', async ({ page, mockApi }) => {
    mockApi.asRole('ADMIN')
    mockApi.on('GET', '/admin/users', ok(page1([makeAdminUser(7, { locked_until: minutesFromNow(30) })])))
    mockApi.on('PATCH', '/admin/users/7/unlock-login', fail(500, 'Server sedang gangguan'))

    await gotoHydrated(page, '/admin/users')
    await main(page).getByRole('button', { name: 'Buka Kunci' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Pemilik minta dibuka')
    await dialog.getByRole('button', { name: 'Buka Kunci' }).click()

    await expect(dialog.getByText('Server sedang gangguan')).toBeVisible()
  })
})
