import { makeProduct } from './cart'
import { makeUser } from './fixtures'

const METHODS = {
  SALDO: { id: 'SALDO', name: 'Saldo', description: 'Bayar pakai saldo', icon_url: null, status: 'ACTIVE', channels: [] },
  MANUAL_BANK: { id: 'MANUAL_BANK', name: 'Transfer Bank Manual', description: 'Transfer manual', icon_url: null, status: 'ACTIVE', channels: [] },
  TRIPAY: { id: 'TRIPAY', name: 'Payment Gateway', description: 'QRIS / VA', icon_url: null, status: 'ACTIVE', channels: [] },
} as const

/** Payment default: transaksi MANUAL_BANK yang belum dibayar, batas bayar 2 jam lagi */
export const makePayment = (id: string, overrides: Record<string, unknown> & { method?: keyof typeof METHODS } = {}) => {
  const { method = 'MANUAL_BANK', ...rest } = overrides
  const now = Date.now()
  return {
    id,
    ref_id: null,
    status: 'UNPAID',
    payment_type: 'TRANSACTION',
    amount: 50000,
    total_amount: 51123,
    app_fee: 1000,
    gateway_fee: null,
    discount_amount: null,
    coupon: null,
    unique_code: 123,
    pay_code: null,
    pay_url: null,
    checkout_url: null,
    qr_url: null,
    payment_method: METHODS[method],
    payment_channel: null,
    payment_proof_url: null,
    user: makeUser('BUYER'),
    paid_at: null,
    created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    expired_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    updated_at: null,
    ...rest,
  }
}

export type MockPayment = ReturnType<typeof makePayment>

export const makeTx = (id: string, paymentId: string, overrides: Record<string, unknown> = {}) => ({
  id,
  tx_description: '',
  order_request: '',
  payment_id: paymentId,
  product_id: 1,
  qty: 2,
  price: 25000,
  fee: 0,
  total_price: 50000,
  status: 'UNPAID',
  paid_at: null,
  confirmed_at: null,
  created_at: new Date().toISOString(),
  updated_at: null,
  expired_at: null,
  delivered_at: null,
  rejected_at: null,
  done_at: null,
  buyer_id: '1',
  buyer_username: 'buyer_test',
  buyer_fullname: 'Tes BUYER',
  buyer_avatar_url: '',
  seller_email: 'seller@test.local',
  payment_method: 'MANUAL_BANK',
  product: makeProduct(1, { name: 'Produk Pesanan' }),
  ...overrides,
})

export const REKENING_SETTINGS = [
  {
    id: 'r1', key: 'REKENING_BCA', value: '1234567890', description: 'BCA a.n. Adsentral', group: 'REKENING',
    is_public: true, created_at: '2026-01-01T00:00:00', updated_at: '2026-01-01T00:00:00',
  },
]
