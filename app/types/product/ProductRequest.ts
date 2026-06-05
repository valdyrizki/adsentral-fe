import { Status } from "../enum/status";

// types/product-request.ts
export class ProductRequest {
  id: number = 0
  name: string = ''
  slug: string = ''
  description: string = ''
  base_price: number = 0
  sell_price: number = 0
  stock: number | null = null
  delivery_days: number | null = null
  guarantee_days: number | null = null
  distributor?: string = ''
  category_id: number | undefined = undefined
  delivery_type: string = 'MANUAL'
  auto_config_title: string = ''
  auto_config_description: string = ''
  auto_config_file: File | null = null
  banner: File | null = null
  product_image1: File | null = null
  product_image2: File | null = null
  product_image3: File | null = null
}
