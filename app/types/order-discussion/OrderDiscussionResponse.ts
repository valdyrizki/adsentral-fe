import type { FileManagementResponse } from "../file-management/FileManagementResponse";

export interface OrderDiscussionResponse {
  id: number;
  transaction_id: string;
  message: string;
  file:FileManagementResponse | null
  status: string; // bisa diganti ke enum jika ada enum Status di frontend
  is_file_order: boolean;
  created_at: string; // biasanya dikirim sebagai ISO string dari backend
  updated_at: string; // biasanya dikirim sebagai ISO string dari backend
  username: string; // nama pengguna yang mengirim pesan, bisa diganti ke user_id jika hanya ingin menyimpan ID pengguna
  sender_role:string
}
