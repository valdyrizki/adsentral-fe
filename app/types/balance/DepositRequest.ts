
export interface DepositRequest {
  amount: number;
  payment_method: string;
  payment_channel_code?: string | null;
}