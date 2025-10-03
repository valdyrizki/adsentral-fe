import type { ProductResponse } from "./ProductResponse"

export interface CartItem {
  merchant_id: number
  product_id: number
  quantity: number
  lastUpdate? : string | number | null
  note? : string | null
  product?: ProductResponse | null;
}