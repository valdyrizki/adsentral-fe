export type AccountTypeStatus = 'ACTIVE' | 'INACTIVE'

export interface AccountTypeResponse {
  id: number
  name: string
  slug: string
  status: AccountTypeStatus
  // true hanya untuk tipe "Lainnya" (dibuat otomatis BE, tidak bisa diubah)
  is_default: boolean
  created_at: string
  updated_at: string | null
}
