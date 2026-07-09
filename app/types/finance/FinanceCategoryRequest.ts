export interface FinanceCategoryRequest {
  id: string
  db_cr: 'CREDIT' | 'DEBIT'
  name: string
  description: string | null
  notes: string | null
  is_auto: boolean
}
