import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyApplyRequest } from '~/types/penalty/PenaltyApplyRequest'
import type { PenaltyUserResponse, UserSuspendStatus } from '~/types/penalty/PenaltyUserResponse'
import type { UserResponse } from '~/types/UserResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'
import type { PenaltyResponse } from '~/types/penalty/PenaltyResponse'

export interface MyPenaltyStat {
  active_points: number
  suspend_status: UserSuspendStatus
  suspend_until: string | null
}

export const usePenaltyApi = () => {
  const api = useApi()

  const searchUsers = async (keyword: string): Promise<UserResponse[]> => {
    const res = await api<WebResponse<PageResponse<UserResponse>>>('/admin/users', {
      query: { keyword, size: 10 },
    })
    if (res.status !== 'success' || !res.data) return []
    return res.data.content ?? []
  }

  const applyPenalty = async (payload: PenaltyApplyRequest): Promise<PenaltyResponse> => {
    const res = await api<WebResponse<PenaltyResponse>>('/admin/penalty', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menerapkan penalty' })
    }
    return res.data
  }

  const fetchPenalty = async (
    page = 0,
    size = 20,
    keyword = '',
  ): Promise<PageResponse<PenaltyResponse>> => {
    const res = await api<WebResponse<PageResponse<PenaltyResponse>>>('/admin/penalty', {
      query: {
        page,
        size,
        keyword: keyword || undefined,
      },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat riwayat penalty' })
    }
    return res.data
  }

  const cancelPenalty = async (penaltyId: string): Promise<void> => {
    const res = await api<WebResponse<null>>(`/admin/penalty/${penaltyId}`, {
      method: 'DELETE',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membatalkan penalty' })
    }
  }

  const fetchPenaltyUsers = async (
    page = 0,
    size = 20,
    keyword = '',
    status = '',
  ): Promise<PageResponse<PenaltyUserResponse>> => {
    const res = await api<WebResponse<PageResponse<PenaltyUserResponse>>>('/admin/penalty/stat', {
      query: {
        page,
        size,
        keyword: keyword || undefined,
        status: status || undefined,
      },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat data pengguna' })
    }
    return res.data
  }

  const fetchUserPenaltyDetail = async (
    userId: number,
    page = 0,
    size = 20,
  ): Promise<PageResponse<PenaltyResponse>> => {
    const res = await api<WebResponse<PageResponse<PenaltyResponse>>>(`/admin/penalty/user/${userId}`, {
      query: { page, size },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat riwayat penalty user' })
    }
    return res.data
  }

  const fetchMyPenalties = async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<PenaltyResponse>> => {
    const res = await api<WebResponse<PageResponse<PenaltyResponse>>>('/user/penalty', {
      query: { page, size },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat riwayat penalty' })
    }
    return res.data
  }

  const fetchMyPenaltyStat = async (): Promise<MyPenaltyStat | null> => {
    try {
      const res = await api<WebResponse<MyPenaltyStat>>('/user/penalty/stat')
      if (res.status !== 'success' || !res.data) return null
      return res.data
    } catch {
      return null
    }
  }

  return { searchUsers, applyPenalty, fetchPenalty, cancelPenalty, fetchPenaltyUsers, fetchUserPenaltyDetail, fetchMyPenalties, fetchMyPenaltyStat }
}
