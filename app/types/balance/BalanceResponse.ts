
export interface BalanceResponse {
  deposit_balance: number;
  sales_balance: number;
  deposit_held: number;
  sales_held: number;
  // rincian sales_held (EP04-07): withdrawal PENDING + escrow pesanan; opsional untuk BE lama
  sales_held_withdrawal?: number | null;
  sales_held_escrow?: number | null;
}
