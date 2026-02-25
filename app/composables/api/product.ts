import type { PageResponse } from "~/types/PageResponse"
import type { ProductRequest } from "~/types/product/ProductRequest"
import type { ProductResponse } from "~/types/product/ProductResponse"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/products.ts
export const useProductsApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })

  // GET products dengan pagination + search
  const getProducts = async (page = 0, size = 10, keyword = '') => {
    const { data, error } = await useFetch<WebResponse<PageResponse<ProductResponse>>>(`${config.public.apiBase}/products`, {
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
    const { data, error } = await useFetch<WebResponse<PageResponse<ProductResponse>>>(`${config.public.apiBase}/product/category/${id}`, {
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

  const fetchProductsByMerchantId = async (merchantId:any, page = 0, size = 10, keyword = '')
  : Promise<PageResponse<ProductResponse>> => {
    try{
      const res = await $fetch<WebResponse<PageResponse<ProductResponse>>>(
        `${config.public.apiBase}/products/merchant/${merchantId}`,
        { headers: getHeaders(),
          query: {
            page,
            size,
            keyword
        },
          },
      )

      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message)
      }

      return res.data

    } catch (err:any) {
      console.error('Failed fetch product', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch product',
      })
    }
  }

  // GET products by category id
  const getMyProducts = async (page = 0, size = 10, keyword = '', refresh = false) => {

    const { data, error } = await useFetch<WebResponse<PageResponse<ProductResponse>>>(`${config.public.apiBase}/products/my`, {
      method: 'GET',
      query: {
        page,
        size,
        keyword
      },
      headers: getHeaders(),
      key: refresh
      ? `my-products-${page}-${size}-${keyword}-${Date.now()}`
      : `my-products-${page}-${size}-${keyword}`,
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
  const fetchMyProduct = async (page = 0, size = 10, keyword = '', refresh = false) => {
    try {
      const response = await $fetch<WebResponse<PageResponse<ProductResponse>>
      >(`${config.public.apiBase}/products/my`, {
        method: 'GET',
        query: {
          page,
          size,
          keyword
        },
        headers: getHeaders(),
      })

      // Validasi status dari backend
      if (response.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: response.message || 'Failed to fetch products',
        })
      }

      return response.data

    } catch (err: any) {
      throw createError({
        statusCode: err?.statusCode || err?.response?.status || 500,
        statusMessage:
          err?.statusMessage ||
          err?.response?._data?.message ||
          'Failed to fetch products',
      })
    }
  }

  const fetchProductById = async (id : string)
    : Promise<ProductResponse> => {
      try{
        const res = await $fetch<WebResponse<ProductResponse>>(
          `${config.public.apiBase}/product/${id}`,
          { headers: getHeaders() }
        )
  
        if (res.status !== 'success' || !res.data) {
          throw new Error(res.message)
        }
  
        return res.data
  
      } catch (err:any) {
        console.error('Failed fetch discussion', err)
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.message || 'Failed to fetch Review',
        })
      }
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

  // GET my products by id
  const getMyProductById = async (id:string) => {
    const { data, error } = await useFetch<WebResponse<ProductResponse>>(`${config.public.apiBase}/product/my/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': useUserStore.auth?.token || '',
      },
      key: `my-product-${id}`, // cache per request
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

    // GET Merchant dengan pagination + search
    const createProduct = async (request:ProductRequest) => {
      try {
  
        const formData = new FormData()
        console.log(request);
        
        if (request.banner) formData.append("banner", request.banner as File)
        if (request.product_image1) formData.append("productImage1", request.product_image1 as File)
        if (request.product_image2) formData.append("productImage2", request.product_image2 as File)
        if (request.product_image3) formData.append("productImage3", request.product_image3 as File)
        if (request.name) formData.append("name", request.name)
        if (request.description) formData.append("description", request.description)
        if (request.slug) formData.append("slug", request.slug)
        if (request.sell_price) formData.append("sellPrice", request.sell_price.toString())
        if (request.base_price) formData.append("basePrice", "0")
        if (request.stock) formData.append("stock", request.stock.toString())
        if (request.category_id) formData.append("categoryId", request.category_id.toString())
        if (request.distributor) formData.append("distributor", request.distributor)
        if (request.status) formData.append("status", request.status) 

        console.log(formData.values);
        
          
        const res = await $fetch<WebResponse<ProductResponse>>(
          `${config.public.apiBase}/product/create`,
          {
            method: 'POST',
            body: formData ,
            headers: {
              'X-API-TOKEN': useUserStore.auth?.token || '',
            },
          }
        )
  
        if (!res || res.status !== 'success') {
          throw createError({
            statusCode: 400,
            statusMessage: res?.message || 'Create Failed',
          })
        }
  
        return res.data
  
      } catch (err: any) {
        console.log(err);
        
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.statusMessage || 'Create failed, server error',
        })
      }
    }

    // Update Product
    const updateProduct = async (request:ProductRequest) => {
      try {
  
        const formData = new FormData()
        
        if (request.banner) formData.append("banner", request.banner as File)
        if (request.product_image1) formData.append("productImage1", request.product_image1 as File)
        if (request.product_image2) formData.append("productImage2", request.product_image2 as File)
        if (request.product_image3) formData.append("productImage3", request.product_image3 as File)
        if (request.name) formData.append("name", request.name)
        if (request.description) formData.append("description", request.description)
        if (request.slug) formData.append("slug", request.slug)
        if (request.sell_price) formData.append("sellPrice", request.sell_price.toString())
        if (request.base_price) formData.append("basePrice", "0")
        if (request.stock) formData.append("stock", request.stock.toString())
        if (request.category_id) formData.append("categoryId", request.category_id.toString())
        if (request.distributor) formData.append("distributor", request.distributor)
        if (request.status) formData.append("status", request.status) 

          
        const res = await $fetch<WebResponse<ProductResponse>>(
          `${config.public.apiBase}/product/update/${request.id}`,
          {
            method: 'PATCH',
            body: formData ,
            headers: {
              'X-API-TOKEN': useUserStore.auth?.token || '',
            },
          }
        )
  
        if (!res || res.status !== 'success') {
          throw createError({
            statusCode: 400,
            statusMessage: res?.message || 'Create Failed',
          })
        }
  
        return res.data
  
      } catch (err: any) {
        console.log(err);
        
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.statusMessage || 'Create failed, server error',
        })
      }
    }

    const deactivateProduct = async (id:number) => {
      try {
        const res = await $fetch<WebResponse<ProductResponse>>(
          `${config.public.apiBase}/product/deactivate/${id}`,
          {
            method: 'PATCH',
            headers: {
              'X-API-TOKEN': useUserStore.auth?.token || '',
            },
          }
        )
  
        if (!res || res.status !== 'success') {
          throw createError({
            statusCode: 400,
            statusMessage: res?.message || 'Create Failed',
          })
        }
  
        return res.data
  
      } catch (err: any) {
        console.log(err);
        
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.statusMessage || 'Create failed, server error',
        })
      }
    }

    const activateProduct = async (id:number) => {
      try {
        const res = await $fetch<WebResponse<ProductResponse>>(
          `${config.public.apiBase}/product/activate/${id}`,
          {
            method: 'PATCH',
            headers: {
              'X-API-TOKEN': useUserStore.auth?.token || '',
            },
          }
        )
  
        if (!res || res.status !== 'success') {
          throw createError({
            statusCode: 400,
            statusMessage: res?.message || 'Create Failed',
          })
        }
  
        return res.data
  
      } catch (err: any) {
        console.log(err);
        
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.statusMessage || 'Create failed, server error',
        })
      }
    }

  return { getProducts, getProductsByCategoryId, fetchProductById, getProductsByIds, fetchProductsByMerchantId,getMyProducts, fetchMyProduct, getMyProductById, createProduct, updateProduct, deactivateProduct, activateProduct }
}
