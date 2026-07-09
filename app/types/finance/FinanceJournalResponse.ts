export interface FinanceJournalResponse {
  id: number
  category_id: string
  category_name: string
  db_cr: 'CREDIT' | 'DEBIT'
  description: string
  notes: string | null
  amount: number
  tx_date: string
  ref_id: string | null
  created_by_username: string
  created_at: string
  is_void: boolean
  void_reason: string | null
  void_at: string | null
  void_by_username: string | null
}
