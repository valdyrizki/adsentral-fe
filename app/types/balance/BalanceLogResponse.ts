export type WalletSource =
  | 'DEPOSIT'
  | 'PURCHASE_DEBIT'
  | 'REFUND'
  | 'SALES_ESCROW_CREDIT'
  | 'SALES_ESCROW_RELEASE'
  | 'SALES_ESCROW_REVERSE'
  | 'WITHDRAWAL_HOLD'
  | 'WITHDRAWAL_COMPLETE'
  | 'WITHDRAWAL_CANCELLED_REJECTED'
  | 'ADMIN_ADJUSTMENT'
  | 'SALES_TO_DEPOSIT_TRANSFER'

export interface BalanceLogResponse {
  id: number;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  source: WalletSource;
  description: string;
  deposit_balance_old: number;
  deposit_balance_new: number;
  sales_balance_old: number;
  sales_balance_new: number;
  deposit_held_old: number;
  deposit_held_new: number;
  sales_held_old: number;
  sales_held_new: number;
  created_at: string;
}
