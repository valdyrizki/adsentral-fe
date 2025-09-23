import { defineStore } from 'pinia'
import { CategoryController } from '~/composables/controller/CategoryController'
import type { Category } from '~/dto/CategoryResponse'

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categories: [] as Category[],
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      const { getCategories } = CategoryController()
      try {
        const res = await getCategories()
        if (res.status === "success" && res.data) {
          this.categories = res.data
        } else {
          this.error = res.errors?.toString() || res.message
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch categories'
      } finally {
        this.loading = false
      }
    }
  }
})