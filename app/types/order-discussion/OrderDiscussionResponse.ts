import type { FileManagementResponse } from "../file-management/FileManagementResponse";
import type { DiscussionType } from "./DiscussionType";

export interface OrderDiscussionResponse {
  id: number;
  transaction_id: string;
  message: string;
  file: FileManagementResponse | null
  status: string;
  discussion_type: DiscussionType;
  created_at: string;
  updated_at: string;
  username: string;
  sender_role: string
}
