export interface PaymentMethodRequest {
  id: string
  name: string
  description: string
  icon_url: string | null
  status: 'ACTIVE' | 'SUSPENDED'
}
