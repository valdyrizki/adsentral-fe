export interface FinanceCategoryResponse {
  id: string
  db_cr: 'CREDIT' | 'DEBIT'
  name: string
  description: string | null
  notes: string | null
  is_active: boolean
  is_auto: boolean
  /** Total nominal jurnal non-void kategori ini, dijaga BE */
  balance: number
  created_at: string
}
