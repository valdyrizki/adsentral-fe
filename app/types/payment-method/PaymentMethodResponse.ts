import type { PaymentChannelResponse } from '../payment-channel/PaymentChannelResponse'

export interface PaymentMethodResponse {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  channels: PaymentChannelResponse[];
}
