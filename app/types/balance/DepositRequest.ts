
export interface DepositRequest {
  amount: number;
  payment_method: string;
  channel_code?: string | null;
}