import type { StockDuplicateAction } from './ProductStockItemRequest'

export type StockBulkRowStatus = 'NEW' | 'DUPLICATE_SENT' | 'DUPLICATE_ACTIVE' | 'DUPLICATE_IN_FILE' | 'INVALID'

// Satu baris hasil cek (dryRun). `row` = nomor baris 1-based sesuai urutan items yang dikirim.
export interface StockBulkCheckRow {
  row: number
  status: StockBulkRowStatus
  message?: string
  existing_item_id?: number
  existing_product_name?: string
  duplicate_of_row?: number
  allowed_actions?: StockDuplicateAction[]
}

export interface StockBulkCheckSummary {
  total: number
  new: number
  duplicate_sent: number
  duplicate_active: number
  duplicate_in_file: number
  invalid: number
}

export interface StockBulkCheckResponse {
  summary: StockBulkCheckSummary
  rows: StockBulkCheckRow[]
}

export interface StockBulkSaveResult {
  message: string
  added: number
  skipped: number
}

// Isi `data` pada response error stok (409/400). Gunakan `code` untuk logika, bukan teks pesan.
export type StockErrorCode =
  | 'ACCOUNT_DUPLICATE_SENT'
  | 'ACCOUNT_DUPLICATE_ACTIVE'
  | 'STOCK_ROW_INVALID'
  | 'STOCK_CHECK_OUTDATED'

export interface StockErrorData {
  code?: StockErrorCode | string
  existing_item_id?: number
  existing_product_name?: string
  row?: number
  status?: StockBulkRowStatus
}

// Hasil POST /stock/bulk-delete
export interface StockBulkDeleteSkipped {
  id: number
  reason: string
}

export interface StockBulkDeleteResult {
  message: string
  deleted: number
  skipped: StockBulkDeleteSkipped[]
}
