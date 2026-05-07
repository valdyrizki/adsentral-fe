export interface BalanceLogResponse {
  id: number;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  old_balance: number;
  new_balance: number;
  created_at: string;
}
