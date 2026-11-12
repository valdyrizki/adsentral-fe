import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { AdminUserResponse } from '~/types/user/AdminUserResponse'
import type { ResetCodeResponse } from '~/types/user/ResetCodeResponse'
import type { BalanceResponse } from '~/types/balance/BalanceResponse'
import { useApi } from './useApi'

export const useAdminUserApi = () => {
  const api = useApi()

  const fetchUsers = async (params?: { page?: number; size?: number; keyword?: string }) => {
    const res = await api<WebResponse<PageResponse<AdminUserResponse>>>('/admin/users', {
      query: { page: params?.page ?? 0, size: params?.size ?? 20, keyword: params?.keyword },
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  /** Buka kunci login sementara; alasan 5–500 karakter, tercatat di audit BE. 400 `LOGIN_NOT_LOCKED` bila sudah tidak terkunci. */
  const unlockLogin = async (userId: number, notes: string) => {
    const res = await api<WebResponse<null>>(`/admin/users/${userId}/unlock-login`, {
      method: 'PATCH',
      body: { notes },
    })
    if (res.status !== 'success') throw new Error(res.message)
  }

  /**
   * Kode reset password aktif user (alur lupa password via WA). Hanya super admin; alasan 5–500 karakter, tercatat di audit BE.
   * 404 `NO_ACTIVE_RESET_CODE` bila tidak ada kode yang masih bisa dipakai.
   */
  const viewResetCode = async (userId: number, notes: string) => {
    const res = await api<WebResponse<ResetCodeResponse>>(`/admin/users/${userId}/reset-code`, {
      method: 'POST',
      body: { notes },
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  // Pencairan refund tunai (super admin, EP04-16): saldo belanja dipotong sebelum transfer manual
  const payoutRefund = async (userId: number, amount: number, notes: string) => {
    const res = await api<WebResponse<BalanceResponse>>(`/admin/balance/${userId}/refund-payout`, {
      method: 'POST',
      body: { amount, notes },
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  return { fetchUsers, unlockLogin, viewResetCode, payoutRefund }
}
