import { Status } from "../enum/status";

// types/product-request.ts
export class ProductRequest {
  id: number = 0                 // nama produk
  name: string = ''                 // nama produk
  slug: string = ''                 // slug unik
  description: string = ''          // deskripsi produk
  base_price: number = 0          // harga dasar
  sell_price: number = 0            // harga jual
  stock: number | null = null                // stok produk
  delivery_days: number | null = null        // estimasi hari pengiriman
  guarantee_days: number | null = null       // masa garansi (hari), opsional
  distributor?: string = ''         // opsional
  category_id: number | undefined = undefined           // id kategori
  banner: File | null = null                    // url banner utama
  product_image1: File | null = null
  product_image2: File | null = null
  product_image3: File | null = null
}
