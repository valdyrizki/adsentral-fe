export interface BankAccountResponse {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  created_at: string;
  updated_at: string | null;
}
