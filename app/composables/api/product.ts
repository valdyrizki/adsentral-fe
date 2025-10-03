import type { PageResponse } from "~/types/PageResponse"
import type { ProductResponse } from "~/types/ProductResponse"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/products.ts
export const useProductsApi = () => {
  const config = useRuntimeConfig()


  // GET products dengan pagination + search
  const getProducts = async (page = 0, size = 10, keyword = '') => {
    const { data, error } = await useFetch<WebResponse<PageResponse<ProductResponse[]>>>(`${config.public.apiBase}/products`, {
      method: 'GET',
      query: {
        page,
        size,
        keyword
      },
      key: `products-${page}-${size}-${keyword}`, // cache per request
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch products',
      })
    }

    //throw Error 2
    if(data.value?.status !== 'success'){
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch products',
      })
    }
    return data.value?.data
  }

  // GET products by category id
  const getProductsByCategoryId = async (id:number, page = 0, size = 10, keyword = '') => {
    const { data, error } = await useFetch<WebResponse<PageResponse<ProductResponse[]>>>(`${config.public.apiBase}/product/category/${id}`, {
      method: 'GET',
      query: {
        page,
        size,
        keyword
      },
      key: `products-by-category-${id}-${page}-${size}-${keyword}`, // cache per request
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch products',
      })
    }

    //throw Error 2
    if(data.value?.status !== 'success'){
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch products',
      })
    }
    return data.value?.data
  }

  

  // GET products by id
  const getProductById = async (id:string[]) => {
    const { data, error } = await useFetch<WebResponse<ProductResponse>>(`${config.public.apiBase}/product/${id}`, {
      method: 'GET',
      key: `product-${id}`, // cache per request
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch products',
      })
    }

    //throw Error 2
    if(data.value?.status !== 'success'){
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch products',
      })
    }
    return data.value?.data
  }

    // GET products by id
  const getProductsByIds = async (ids:number[]) => {



    try {
      const res = await $fetch<WebResponse<ProductResponse[]>>(
        `${config.public.apiBase}/products/ids`,
        {
          method: 'POST',
          body: { ids }
        }
      )

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Get products failed',
        })
      }

      return res.data

    } catch (err: any) {
      console.log(err);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Get products failed, server error',
      })
    }
  }

  return { getProducts, getProductsByCategoryId, getProductById, getProductsByIds }
}
