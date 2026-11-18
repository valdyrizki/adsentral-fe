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
  /** Label status akun (BE EP06-06): DEACTIVATED = dinonaktifkan pemiliknya sendiri (status SUSPEND), bukan penalti. */
  account_status?: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED' | null
  /** EP03-05: pemilik minta hapus akun pada waktu ini; data dianonimkan 30 hari sesudahnya kecuali diaktifkan kembali. */
  deletion_requested_at?: string | null
  /** EP03-05: terisi = sudah dihapus permanen (dianonimkan), tidak bisa diaktifkan kembali. */
  anonymized_at?: string | null
}
