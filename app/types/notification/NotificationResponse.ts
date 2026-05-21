export type NotificationType = 'ORDER' | 'PAYMENT' | 'PENALTY' | 'SYSTEM' | 'PROMOTION' | string

export type NotificationStatus = 'UNREAD' | 'READ' | string

export interface NotificationResponse {
  id: number
  title: string
  message: string
  type: NotificationType
  status: NotificationStatus
  action_url: string | null
  user_id: number
  read_at: string | null
  created_at: string
}
