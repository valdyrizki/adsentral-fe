export interface FileManagementResponse {
  id: string
  title: string
  ori_name: string
  format: string
  url: string
  status: string   // enum di BE jadi string di FE
  size: number
  created_at: string  // ISO datetime string
  updated_at: string  // ISO datetime string
}
