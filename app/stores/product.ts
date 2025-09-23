import { defineStore } from 'pinia'
import { ProductController } from '~/composables/controller/ProductController'
import type { PageResponse } from '~/dto/PageResponse'
import type { ProductResponse } from '~/dto/ProductResponse'

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products : {} as PageResponse<ProductResponse[]>,
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async fetchProducts() {
      this.loading = true
      const { getProducts } = ProductController()
      try {
        const res = await getProducts()
        if (res.status === "success" && res.data) {
          this.products = res.data
        } else {
          
          console.error(res);
          this.error = res.errors?.toString() || res.message
        }
      } catch (err: any) {
          console.error(err);
        this.error = err.message || 'Failed to fetch products'
      } finally {
        this.loading = false
      }
    },
    
    async getProductByCategoryId(id : number) {
      this.loading = true
      const { getProductByCategoryId } = ProductController()
      try {
        const res = await getProductByCategoryId(id)
        if (res.status === "success" && res.data) {
          this.products = res.data
        } else {
          
          console.error(res);
          this.error = res.errors?.toString() || res.message
        }
      } catch (err: any) {
          console.error(err);
        this.error = err.message || 'Failed to fetch products'
      } finally {
        this.loading = false
      }
    }
  }
})