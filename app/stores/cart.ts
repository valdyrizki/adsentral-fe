// stores/cart.ts
import { defineStore } from 'pinia'
import { useProductsApi } from '~/composables/api/product'
import { useTransactionApi } from '~/composables/api/transaction'
import type { CartItem } from '~/types/CartItem'
import type { ProductResponse } from '~/types/product/ProductResponse'
import type { TransactionDetailRequest } from '~/types/TransactionDetailRequest'
import type { TransactionRequest } from '~/types/TransactionRequest'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    payment_method: 'QRIS' as string,
    loading: false as boolean 
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    subTotal: (state) => state.items.reduce((sum, item) => sum + (item.quantity * (item.product?.sell_price ?? 0)), 0),
  },

  actions: {
    addToCart(quantity:number = 1, product:ProductResponse | undefined) {
      
      if(quantity < 1 || !product || product?.id === 0){
        throw new Error("Item tidak boleh kosong!")
      }

      const existing = this.items.find((i) => i.product_id === product?.id)
      if (existing) {

        //check stock
        if(product.stock < (quantity+existing.quantity)){
          throw new Error("Stock tidak cukup, tersisa : "+product.stock+" Dikeranjang ada : "+existing.quantity)
        }

        existing.quantity += quantity
        existing.lastUpdate = Date.now()
      } else {

        //check stock         
        if(product.stock < (quantity)){
          throw new Error('Stock tidak cukup, tersisa : '+product.stock)
        }

        let merchant_id = product.merchant_id;
        let product_id = product.id

        this.items.push({
          merchant_id,
          product_id,
          quantity,
          lastUpdate: Date.now(),
          product: product
        })
      }
      
      
    },

    checkValidQty(cartItem:CartItem) {

      const product = this.items.find((i) => i.product_id === cartItem.product_id)
      if(!product){
        this.removeFromCart(cartItem.product_id)
        throw new Error("Silahkan masukan ulang produk ke keranjang")
      }
      
      if(cartItem.quantity === undefined){
        cartItem.quantity = 1
      }

      if(cartItem.quantity <= 0){
        cartItem.quantity = 1          
        throw new Error("Minimal membeli 1pcs")
      }

      if(cartItem.quantity > (cartItem.product?.stock ?? cartItem.quantity)){
        //cek ulang
        if(cartItem.quantity > (cartItem.product?.stock ?? cartItem.quantity)){
          cartItem.quantity = cartItem.product?.stock ?? 1
          console.log("masuk sini");
          throw new Error("Stock tersisa: " + cartItem.product?.stock)
        }
      }
      
    },

    async validation() {

      const useUserStore = useAuthStore()
      
      if(!useUserStore.isAuthenticated){
        throw new Error("Silahkan login untuk melanjutkan checkout")
      }

      this.items.map(async (item) => {
        this.checkValidQty(item)
      })
    },
    

    removeFromCart(product_id: number) {
      this.items = this.items.filter((i) => i.product_id !== product_id)
    },

    clearCart() {
      this.items = []
    },

    async syncCart(): Promise<{ removed: string[], priceChanged: string[] }> {
      if (this.items.length === 0) return { removed: [], priceChanged: [] }

      const removed: string[] = []
      const priceChanged: string[] = []

      try {
        const { getProductsByIds } = useProductsApi()
        const ids = this.items.map(i => i.product_id)
        const data = await getProductsByIds(ids)

        if (data) {
          const productsMap = new Map(data.map((p: ProductResponse) => [p.id, p]))

          this.items.forEach((item) => {
            const updated = productsMap.get(item.product_id)

            if (!updated) {
              removed.push(item.product?.name ?? `Produk #${item.product_id}`)
              this.removeFromCart(item.product_id)
              return
            }

            // Deteksi perubahan harga
            if (item.product && item.product.sell_price !== updated.sell_price) {
              priceChanged.push(
                `${updated.name} (Rp ${item.product.sell_price.toLocaleString('id-ID')} → Rp ${updated.sell_price.toLocaleString('id-ID')})`
              )
            }

            // Selalu update data produk terbaru
            item.product = updated

            // Hapus dari cart jika tidak ACTIVE
            if (updated.status !== 'ACTIVE') {
              removed.push(updated.name)
              this.removeFromCart(item.product_id)
            }
          })
        }
      } catch (err: any) {
        console.error('Sync cart failed:', err)
      }

      return { removed, priceChanged }
    },

    async updateDataFromBackend() {
      if (this.items.length === 0) return

      this.loading = true
      // let isChange:boolean = false;
      // let messages:string[] = [];

      try {
        // ✅ Ambil API helper (misalnya composable API product)
        const { getProductsByIds } = useProductsApi()

        // Ambil semua product_id dari cart
        const ids = this.items.map((i) => i.product_id)

        // ✅ Fetch data produk terbaru dari backend (bulk by IDs)
        const data = await getProductsByIds(ids)

        if (data) {
          // Buat map biar gampang update per item
          const productsMap = new Map(data.map((p: ProductResponse) => [p.id, p]))
          const removedNames: string[] = []

          // Update setiap cartItem dengan data terbaru
          this.items.forEach((item) => {
            const updatedProduct = productsMap.get(item.product_id)

            if (updatedProduct) {
              // Update data produk terbaru (harga, stok, status)
              item.product = updatedProduct

              // Hapus dari cart jika produk tidak lagi ACTIVE
              if (updatedProduct.status !== 'ACTIVE') {
                removedNames.push(updatedProduct.name)
                this.removeFromCart(item.product_id)
              }
            } else {
              // Produk sudah tidak ada di backend
              removedNames.push(item.product?.name ?? `Produk #${item.product_id}`)
              this.removeFromCart(item.product_id)
            }
          })

          if (removedNames.length > 0) {
            throw new Error(
              `Beberapa produk tidak tersedia dan telah dihapus dari keranjang: ${removedNames.join(', ')}`
            )
          }
        }else{
          throw new Error("Data tidak ditemukan")
        }
      } catch (err:any) {
        this.loading = false
        console.error('❌ Gagal update cart dari backend:', err)
        throw new Error(err.message)
      } finally {
        this.loading = false
        // if(isChange){
        //   const err: any = new Error("Terdapat perubahan data, silahkan periksa pesananmu lalu klik tombol checkout lagi!")
        //   err.data = messages
        //   throw err
        // }
      }


    },
    async checkout() {
      if (this.items.length === 0){
          throw new Error("Item tidak boleh kosong!")
      }

      this.loading = true

      await this.updateDataFromBackend() //update data stock dari backend
      await this.validation() //cek validasi qty

      try {
        // ✅ Ambil API helper (misalnya composable API product)
        const { createTransaction } = useTransactionApi()

        const detailRequest:TransactionDetailRequest[] = this.items.map((item) => ({
          product_id: item.product_id,
          qty: item.quantity,
          order_request: item.note ?? null
        }))

        const request:TransactionRequest = {
          payment_method: this.payment_method,
          transaction_details: detailRequest
        }

        // ✅ Fetch data produk terbaru dari backend (bulk by IDs)
        const data = await createTransaction(request)
        if (data) {
          this.clearCart()
          return data
        }else{
          throw new Error("Transaksi gagal, silahkan coba lagi")
        }
      } catch (err:any) {
        this.loading = false
        console.error('❌ Transaksi Gagal:', err)
        throw new Error(err.message)
      } finally {
        this.loading = false
      }


    

    
    },
    
  },
  persist: true

})
