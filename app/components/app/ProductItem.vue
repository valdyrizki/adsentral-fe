<template>
  <div>
    <NuxtLink :to="`/product/${product.id}`" >
      <div class="relative aspect-square w-full overflow-hidden rounded-lg">
        <img
          :src="config.public.backendUrl +'/'+ product?.banner_url"
          :alt="product.name"
          class="size-full object-cover hover:scale-115 block transition"
        />
      </div>
    </NuxtLink>

    <!-- UnderImage -->
    <div class="flex justify-between">
      <div class="basis-1/3">
        
      </div>
      <div></div>
      <div class="basis-1/2 sm:basis-1/3">
        <div class="relative font-semibol bg-primary rounded-l-full -mt-4">
          <p class="text-white text-sm p-1 text-center">
            {{ product.sell_price.toLocaleString('id-ID') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Product Info -->
    <div class="relative mt-4">
      <NuxtLink :to="`/product/${product.id}`" class="text-sm font-medium text-gray-900">
        {{ limitWords(product.name, 15) }}
      </NuxtLink>

      <!-- Avatar container with slide-down -->
      <div
        class="transition-all duration-300 ease-in-out md:max-h-0 max-h-12 md:opacity-0 opacity-100 md:overflow-hidden group-hover:max-h-12 group-hover:opacity-100"
      >
        <div class="flex items-center space-x-2 mt-2">
          <NuxtLink :to="`/merchant/${product.merchant_id}`" class="text-xs text-gray-600 hover:underline">
          <UAvatar
            size="sm"
            :src="config.public.backendUrl +'/'+ product?.merchant_logo"
          />
                                  <UAvatar  size="xs" /> 

          <span class="text-xs text-gray-600">{{ product.merchant_name }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProductResponse } from '~/types/product/ProductResponse';

//Ambil config
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl

defineProps<{
  product: ProductResponse
}>();

  const limitWords = (text: string, maxWords: number) => {
    if (!text) return ''
    const words = text.trim().split(/\s+/)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '...'
  }
</script>

<style>

</style>