import { Status } from "../enum/status";

// types/product-request.ts
export class ProductRequest {
  name: string = ''                 // nama produk
  slug: string = ''                 // slug unik
  description: string = ''          // deskripsi produk
  base_price: number = 0          // harga dasar
  sell_price: number = 0            // harga jual
  stock: number | null = null                // stok produk
  distributor?: string = ''         // opsional
  category_id: number = 0           // id kategori
  banner: string = ''            // url banner utama
  imageUrls?: string[] = []         // daftar url gambar
  status?: Status = Status.ACTIVE // status (default ACTIVE)
}
