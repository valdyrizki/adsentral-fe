export interface FinanceJournalRequest {
  category_id: string
  description: string
  notes: string | null
  amount: number
  tx_date: string
}
