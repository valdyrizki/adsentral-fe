
export interface DepositSubmitResponse {
  payment_id: string;  
  reference_id: string;  
  checkout_url: string;  
  qr_url: string;  
  unique_code?: number | null;  // sudah termasuk di dalam amount
}
