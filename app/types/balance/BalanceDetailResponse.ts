export interface BalanceDetailResponse {
  id: number;   // BigDecimal → number
  deposit_balance: number;   // BigDecimal → number
  sales_balance: number;   // BigDecimal → number
  deposit_held: number;   // BigDecimal → number
  sales_held: number;   // BigDecimal → number
  // rincian sales_held (EP04-07): withdrawal PENDING + escrow pesanan; opsional untuk BE lama
  sales_held_withdrawal?: number | null;
  sales_held_escrow?: number | null;
}
