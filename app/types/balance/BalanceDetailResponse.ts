export interface BalanceDetailResponse {
  id: number;   // BigDecimal → number
  deposit_balance: number;   // BigDecimal → number
  sales_balance: number;   // BigDecimal → number
  deposit_held: number;   // BigDecimal → number
  sales_held: number;   // BigDecimal → number
}
