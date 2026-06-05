<template>
  <div>
    <NuxtLink :to="`/product/${product.id}`" >
      <div class="relative aspect-square w-full overflow-hidden rounded-lg">
        <img
          :src="config.public.backendUrl +'/'+ product?.banner_url"
          :alt="product.name"
          class="size-full object-cover hover:scale-115 block transition"
        />
        <div
          v-if="product.delivery_type === 'AUTO' || product.delivery_type === 'STOCKING'"
          class="absolute top-2 left-2"
        >
          <UTooltip text="Produk ini dikirim secara otomatis begitu pembayaran dikonfirmasi, tanpa perlu menunggu proses manual dari seller.">
            <span class="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow cursor-default">
              <UIcon name="i-lucide-zap" class="size-3" />
              Instant
            </span>
          </UTooltip>
        </div>
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

      <!-- Rating -->
      <!-- Pattern minimal — di product card atau detail -->
      <div v-if="product.review_count > 0" class="flex items-center gap-1 text-sm">
        <UIcon name="material-symbols:star-rounded" class="text-yellow-400 size-4" />
        <span class="font-medium">{{ product.average_rating.toFixed(1) }}</span>
        <span class="text-gray-500">({{ product.review_count }})</span>
      </div>
      <!-- <div v-else class="text-sm text-gray-400">
        Belum ada review
      </div> -->

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

const config = useRuntimeConfig()

const props = defineProps<{
  product: ProductResponse
}>()

const limitWords = (text: string, maxWords: number) => {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '...'
}
</script>

<style>

</style>