// Field akun pada satu item stok. Semua opsional; minimal salah satu dari file, data akun, atau notes harus diisi.
export interface StockAccountFields {
  account_uid?: string
  account_username?: string
  account_password?: string
  account_email?: string
  account_email_password?: string
  account_two_fa_secret?: string
  account_cookie?: string
}

export interface ProductStockItemRequest extends StockAccountFields {
  file?: File | null
  // Label di UI: "Notes / Catatan"
  description?: string
  // Kosong + ada data akun = otomatis "Lainnya" di BE
  account_type_id?: number | null
  // true = tetap simpan walau akun pernah terjual (setelah konfirmasi seller)
  allow_duplicate?: boolean
}

export type StockDuplicateAction = 'SKIP' | 'ADD'

export interface StockAccountBulkItem extends StockAccountFields {
  account_type_id?: number
  description?: string
  // Hanya untuk simpan (bukan dryRun), sesuai status hasil cek & pilihan seller
  on_duplicate?: StockDuplicateAction
}

export interface StockAccountBulkRequest {
  account_type_id?: number
  items: StockAccountBulkItem[]
}

// State form "Data Akun" di UI (string kosong = tidak diisi)
export interface StockAccountForm {
  account_type_id: number | null
  account_uid: string
  account_username: string
  account_password: string
  account_email: string
  account_email_password: string
  account_two_fa_secret: string
  account_cookie: string
}

// Body PATCH /stock/{itemId}. Field tidak ada = tidak diubah, "" = dikosongkan.
export interface ProductStockItemPatch extends StockAccountFields {
  description?: string
  account_type_id?: number
  file?: File
  remove_file?: boolean
  allow_duplicate?: boolean
}
