export interface PaymentChannelResponse {
  code: string
  payment_method_id: string
  name: string
  type: string
  group: string
  icon_url: string | null
  minimum_amount: number
  maximum_amount: number
  fee_flat: number
  fee_percent: number
  status: 'ACTIVE' | 'SUSPEND' | string
}
