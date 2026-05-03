
export interface DepositResponse {
  id: number;  
  amount: number;  
  status: string;  
  payment_id: string;  
  balance_id: string;  
  payment_method:string
  created_at: Date;  
}