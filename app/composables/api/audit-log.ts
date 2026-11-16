import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { AuditLogResponse } from '~/types/audit/AuditLogResponse'
import { useApi } from './useApi'

export const useAuditLogApi = () => {
  const api = useApi()

  /** Jejak aksi admin, terbaru dulu (EP06-05). Filter kosong = semua; pelaku dicocokkan sebagian dari email. */
  const fetchAuditLog = async (params: { page?: number; size?: number; action?: string; actor?: string; targetUserId?: number }) => {
    const query: Record<string, any> = { page: params.page ?? 0, size: params.size ?? 20 }
    if (params.action) query.action = params.action
    if (params.actor) query.actor = params.actor
    if (params.targetUserId) query.target_user_id = params.targetUserId
    const res = await api<WebResponse<PageResponse<AuditLogResponse>>>('/admin/audit-log', { query })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  return { fetchAuditLog }
}
