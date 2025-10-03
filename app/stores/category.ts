import { defineStore } from 'pinia'
import { useCategoryApi } from '~/composables/api/category'
import type { CategoryResponse } from '~/types/CategoryResponse'

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categories: [] as CategoryResponse[],
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async getCategoriesStore() {
      if(this.categories.length > 0) return

      this.loading = true
      const { getCategories } = useCategoryApi()
      try {
        this.categories = await getCategories()
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch categories'
      } finally {
        this.loading = false
      }
    }
  }
})