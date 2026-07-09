export interface FinanceSummaryResponse {
  total_credit: number
  total_debit: number
  net_profit: number
  year: number | null
  month: number | null
}
