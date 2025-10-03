// stores/cart.ts
import { defineStore } from 'pinia'
import { useProductsApi } from '~/composables/api/product'
import type { CartItem } from '~/types/CartItem'
import type { ProductResponse } from '~/types/ProductResponse'
import type { WebResponse } from '~/types/WebResponse'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loading: false as boolean 
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    subTotal: (state) => state.items.reduce((sum, item) => sum + (item.quantity * item.product?.sell_price), 0),
  },

  actions: {
    addToCart(quantity:number = 1, product:ProductResponse | undefined) {
      
      if(quantity < 1 || !product || product?.id === 0){
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid data when adding product to cart',
        })
      }

      const existing = this.items.find((i) => i.product_id === product?.id)
      if (existing) {

        //check stock
        if(product.stock < (quantity+existing.quantity)){
          throw createError({
            statusCode: 400,
            statusMessage: 'Stock tidak cukup, tersisa : '+product.stock+" Dikeranjang ada : "+existing.quantity,
          })
        }

        existing.quantity += quantity
        existing.lastUpdate = Date.now()
      } else {

        //check stock
        if(product.stock < (quantity)){
          throw createError({
            statusCode: 400,
            statusMessage: 'Stock tidak cukup, tersisa : '+product.stock,
          })
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

    async checkValidQty(cartItem:CartItem) {

      const product = this.items.find((i) => i.product_id === cartItem.product_id)
      if(!product){
        this.removeFromCart(cartItem.product_id)
        throw createError({
          statusCode: 400,
          statusMessage: "Silahkan masukan ulang produk ke keranjang" ,
        })
      }
      
      if(cartItem.quantity === undefined){
        cartItem.quantity = 1
      }

      if(cartItem.quantity <= 0){
        cartItem.quantity = 1
         throw createError({
            statusCode: 400,
            statusMessage: 'Minimal membeli 1pcs',
          })
      }

      if(cartItem.quantity > (cartItem.product?.stock ?? cartItem.quantity)){
        await this.updateDataFromBackend() //update dlu stock dari backend

        //cek ulang
        if(cartItem.quantity > (cartItem.product?.stock ?? cartItem.quantity)){
          cartItem.quantity = cartItem.product?.stock ?? 1
          throw createError({
              statusCode: 400,
              statusMessage: "Stock tersisa : "+cartItem.product?.stock,
            })
        }
      }
      
    },
    

    removeFromCart(product_id: number) {
      this.items = this.items.filter((i) => i.product_id !== product_id)
    },

    clearCart() {
      this.items = []
    },

    async updateDataFromBackend() {
      if (this.items.length === 0) return

      this.loading = true
      let isChange:boolean = false;
      let messages:string[] = [];

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

          // Update setiap cartItem dengan data terbaru
          this.items.forEach((item) => {
            const updatedProduct = productsMap.get(item.product_id)

            if (updatedProduct) {

              // Cek apakah qty masih valid
              if (item.quantity > updatedProduct.stock) {
                item.quantity = updatedProduct.stock

                isChange = true;
                messages.push("Produk "+updatedProduct.name+" tersisa "+updatedProduct.stock)

              }

              //cek apakah harga berubah
              if(item.product?.sell_price != updatedProduct.sell_price){
                console.log("MASUKSINI");
                
                isChange = true;
                messages.push("Produk "+updatedProduct.name+" berubah harga menjadi "+updatedProduct.sell_price)
              }

              item.product = updatedProduct
            } else {
              // Kalau product sudah tidak ada di backend, hapus dari cart
              isChange = true;
              messages.push("Produk "+item.product?.name+" sudah tidak tersedia")
              this.removeFromCart(item.product_id)
            }
          })
        }else{
          throw createError({
            statusCode: 400,
            statusMessage: "Data tidak ditemukan",
          })
        }
      } catch (err:any) {
        this.loading = false
        console.error('❌ Gagal update cart dari backend:', err)
        
        throw createError({
          statusCode: 400,
          statusMessage: err.message,
        })
      } finally {
        this.loading = false
        if(isChange){
          throw createError({
          statusCode: 400,
          statusMessage: 'Terdapat perubahan data, silahkan periksa pesananmu lalu klik tombol checkout lagi!',
          data : messages
        })
        }
      }


    }

    // Fetch ulang detail produk untuk semua item di cart
    // async refreshCartProducts() {
    //   if (this.items.length === 0) return

    //   const { getProductsByIds } = useProductsApi()
    //   const ids = this.items.map((i) => i.product_id)

    //   try {
    //     const res = await getProductsByIds(ids) // ✅ bulk fetch by IDs
    //     if (res?.data) {
    //       const productsMap = new Map(res.data.map((p: any) => [p.id, p]))
    //       this.items.forEach((item) => {
    //         item.product = productsMap.get(item.product_id) || null
    //       })
    //     }
    //   } catch (err) {
    //     console.error('Gagal refresh cart products:', err)
    //   }
    // }
  },

  persist: true
})
