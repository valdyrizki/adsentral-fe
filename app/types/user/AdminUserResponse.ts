/** Baris `GET /admin/users` (BE `UserAdminResponse`). */
export interface AdminUserResponse {
  id: number
  email: string
  username: string
  full_name: string | null
  phone_number: string | null
  birth_date: string | null
  address: string | null
  avatar_url: string | null
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPEND'
  created_at: string
  /** Login terkunci sampai waktu ini (WIB). Di masa lalu/null = tidak terkunci. */
  locked_until: string | null
}
