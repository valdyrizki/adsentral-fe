export interface BalanceDetailResponse {
  id: number;
  balance: number;   // BigDecimal → number
  balance_held: number;   // BigDecimal → number
}
