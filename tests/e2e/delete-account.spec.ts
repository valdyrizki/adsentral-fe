import { test, expect, ok, failCode, gotoHydrated } from './support/fixtures'

// Hapus akun dari halaman profil (EP03-05): konfirmasi password; BE menolak 409 selama masih ada saldo/urusan.

test.describe('Hapus akun', () => {
  test('password dikirim, akun keluar dan diarahkan ke beranda', async ({ page, mockApi }) => {
    mockApi.asRole('BUYER')
    let body: any = null
    mockApi.on('PATCH', '/user/deactivate', (route) => {
      body = route.request().postDataJSON()
      return ok(null, 'Akun dinonaktifkan dan akan dihapus permanen dalam 30 hari')
    })

    await gotoHydrated(page, '/profile')
    await page.getByTestId('delete-account-section').getByRole('button', { name: 'Hapus Akun' }).click()
    const confirm = page.getByTestId('delete-account-confirm')
    await expect(confirm).toBeDisabled()
    await page.getByTestId('delete-account-password').fill('Rahasia123')
    await confirm.click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('dihapus permanen dalam 30 hari').first()).toBeVisible()
    expect(body).toEqual({ password: 'Rahasia123' })
  })

  test('ditolak karena masih ada saldo/pesanan: alasan dari BE tampil, tetap di halaman profil', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
    const message = 'Akun belum bisa dihapus: saldo masih ada (tarik atau habiskan dulu); masih ada pesanan berjalan'
    mockApi.on('PATCH', '/user/deactivate',
      failCode(409, message, { code: 'ACCOUNT_DELETION_BLOCKED', reasons: ['BALANCE', 'ACTIVE_TRANSACTION'] }))

    await gotoHydrated(page, '/profile')
    await page.getByTestId('delete-account-section').getByRole('button', { name: 'Hapus Akun' }).click()
    await page.getByTestId('delete-account-password').fill('Rahasia123')
    await page.getByTestId('delete-account-confirm').click()

    await expect(page.getByTestId('delete-account-error')).toHaveText(message)
    await expect(page).toHaveURL(/\/profile$/)
  })
})
