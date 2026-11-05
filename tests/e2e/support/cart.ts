import type { BrowserContext } from '@playwright/test'

export const makeProduct = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  merchant_id: 10,
  merchant_name: 'Toko Tes',
  merchant_logo: '',
  name: `Produk Tes ${id}`,
  slug: `produk-tes-${id}`,
  description: '',
  base_price: 9000,
  sell_price: 10000,
  stock: 50,
  min_qty: 1,
  max_qty: null,
  delivery_days: null,
  sold: 0,
  average_rating: 0,
  review_count: 0,
  distributor: '',
  category_id: 1,
  category_name: 'Kategori',
  banner_url: '',
  image_urls: [],
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00',
  updated_at: null,
  product_image_url: [],
  guarantee_days: null,
  delivery_type: 'MANUAL',
  auto_config: null,
  verified_seller: true,
  ...overrides,
})

export type MockProduct = ReturnType<typeof makeProduct>

export const makeBalance = (deposit: number) => ({
  deposit_balance: deposit,
  sales_balance: 0,
  deposit_held: 0,
  sales_held: 0,
})

export const PAYMENT_METHODS = [
  { id: 'SALDO', name: 'Saldo', description: 'Bayar pakai saldo', icon_url: null, status: 'ACTIVE', channels: [] },
  { id: 'MANUAL_BANK', name: 'Transfer Bank Manual', description: 'Transfer manual', icon_url: null, status: 'ACTIVE', channels: [] },
  {
    id: 'TRIPAY',
    name: 'Payment Gateway',
    description: 'QRIS / VA',
    icon_url: null,
    status: 'ACTIVE',
    channels: [
      {
        code: 'QRIS', payment_method_id: 'TRIPAY', name: 'QRIS', type: 'DIRECT', group: 'E-Wallet',
        icon_url: null, minimum_amount: 1000, maximum_amount: 10_000_000, fee_flat: 750, fee_percent: 0.7, status: 'ACTIVE',
      },
    ],
  },
]

/**
 * Isi keranjang lewat cookie `cart` (pinia-plugin-persistedstate menyimpan store cart di cookie),
 * sehingga keranjang sudah terisi sejak SSR.
 */
export async function seedCart(
  context: BrowserContext,
  items: { product: MockProduct; quantity: number; note?: string }[],
  paymentMethod = 'SALDO',
) {
  const state = {
    items: items.map(({ product, quantity, note }) => ({
      merchant_id: product.merchant_id,
      product_id: product.id,
      quantity,
      note,
      lastUpdate: Date.now(),
      product,
    })),
    payment_method: paymentMethod,
    payment_channel_code: null,
    loading: false,
  }
  await context.addCookies([
    { name: 'cart', value: encodeURIComponent(JSON.stringify(state)), url: 'http://localhost:3100' },
  ])
}
