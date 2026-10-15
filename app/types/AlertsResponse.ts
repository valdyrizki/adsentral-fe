// Angka badge per role. Tiap field bisa null bila BE gagal menghitungnya
// (= tidak diketahui: sembunyikan badge itu saja, jangan anggap 0).

export interface AdminAlertsResponse {
  unread_notifications: number | null
  pending_payment_confirmation: number | null
  unprocessed_payments: number | null
  failed_journals: number | null
  products_in_review: number | null
}

export interface SellerAlertsResponse {
  unread_notifications: number | null
  pending_confirmation: number | null
  unread_chats: number | null
}

export interface BuyerAlertsResponse {
  unread_notifications: number | null
  unread_chats: number | null
}
