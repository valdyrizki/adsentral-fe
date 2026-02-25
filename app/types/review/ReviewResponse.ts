
export interface ReviewResponse {
  id: number;
  transaction_id: string;
  product_id: number;
  reviewed_user_id: number;
  reviewed_username: string;
  reviewer_id: number;
  reviewer_username: string;
  review_type: string; // enum dikirim sebagai string
  rating: number;
  comment: string;
  created_at: string; // ISO string dari LocalDateTime
  updated_at: string; // ISO string dari LocalDateTime
}
