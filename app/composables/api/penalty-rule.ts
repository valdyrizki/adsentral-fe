import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyRuleRequest } from '~/types/penalty/PenaltyRuleRequest'
import type { PenaltyRuleResponse } from '~/types/penalty/PenaltyRuleResponse'
import type { PenaltyRuleUpdateRequest } from '~/types/penalty/PenaltyRuleUpdateRequest'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'

export const usePenaltyRuleApi = () => {
  const api = useApi()

  const fetchAllPenaltyRules = async (
    page = 0,
    size = 20,
    keyword = '',
  ): Promise<PageResponse<PenaltyRuleResponse>> => {
    const res = await api<WebResponse<PageResponse<PenaltyRuleResponse>>>('/admin/penalty/rules', {
      query: {
        page,
        size,
        keyword: keyword || undefined,
      },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat penalty rule' })
    }
    return res.data
  }

  const fetchTogglePenaltyRule = async (id: string): Promise<PenaltyRuleResponse> => {
    const res = await api<WebResponse<PenaltyRuleResponse>>(`/admin/penalty/rules/${id}/toggle`, {
      method: 'PATCH',
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengubah status rule' })
    }
    return res.data
  }

  const createPenaltyRule = async (payload: PenaltyRuleRequest): Promise<PenaltyRuleResponse> => {
    const res = await api<WebResponse<PenaltyRuleResponse>>('/admin/penalty/rules', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membuat penalty rule' })
    }
    return res.data
  }

  const updatePenaltyRule = async (id: string, payload: PenaltyRuleUpdateRequest): Promise<PenaltyRuleResponse> => {
    const res = await api<WebResponse<PenaltyRuleResponse>>(`/admin/penalty/rules/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengupdate penalty rule' })
    }
    return res.data
  }

  return { fetchAllPenaltyRules, fetchTogglePenaltyRule, createPenaltyRule, updatePenaltyRule }
}
