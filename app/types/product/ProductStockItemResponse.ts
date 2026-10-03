export interface ProductStockItemResponse {
  id: number
  product_id: number
  product_name: string | null
  product_banner_url: string | null
  description: string | null
  file_name: string | null
  file_url: string | null
  file_size: number | null
  file_type: string | null
  // ACTIVE | SENT | RETURNED | DELETED
  status: string
  created_at: string
  // Terisi untuk item SENT/RETURNED yang terkirim lewat pesanan (null untuk kiriman garansi)
  transaction_id: string | null

  // Data akun (semua nullable). Di endpoint admin, field sensitif sudah di-mask "********" oleh BE.
  account_type_id: number | null
  account_type_name: string | null
  account_uid: string | null
  account_username: string | null
  account_password: string | null
  account_email: string | null
  account_email_password: string | null
  account_two_fa_secret: string | null
  account_cookie: string | null
}
