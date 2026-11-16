/** Baris `GET /admin/audit-log` (BE `AuditLogResponse`, EP06-05). Khusus super admin. */
export interface AuditLogResponse {
  id: number
  created_at: string
  actor_id: number
  actor_email: string
  service: string
  action: string
  /** Detail aksi apa adanya (target, alasan, nilai lama/baru); isi berbeda per aksi. */
  payload: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
}
