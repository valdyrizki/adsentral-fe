
export interface DepositResponse {
  id: number;  
  amount: number;  
  status: string;  
  payment_id: string;  
  balance_id: string;  
  payment_method:string
  unique_code?: number | null  // sudah termasuk di dalam amount
  created_at: Date;  
}