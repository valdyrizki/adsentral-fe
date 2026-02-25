<template>
  <UModal v-model:open="open" title="Lampirkan product yang ingin kamu tanyakan" size="md">
    <template #body>
      <div v-if="props.loading">
        <AppLoadingSkeleton/>
      </div>
      <div v-else class="p-2 space-y-3">
        <div>
          <UInput
            v-model="keyword"
            placeholder="Cari produk..."
            clearable
            prefix="i-heroicons-magnifying-glass-solid"
            class="w-full"
            icon="mdi:magnify"
          />
        </div>
        <div v-for="product in props.products?.content" :key="product?.id">
          <div 
          class="flex flex-col gap-2 border border-gray-300 rounded-lg p-4 cursor-pointer transition-all duration-200" 
          :class="selectedProduct === product
        ? 'border-primary bg-primary/5 ring-2 ring-primary'
        : 'border-gray-200 hover:border-gray-400'"
          @click="selectProductHandler(product)">
            <div class="flex gap-4">
              <NuxtImg :src="config.public.backendUrl +'/'+ product?.banner_url" width="50" height="50" />
              <div>
                 <p class="text-sm">{{ product?.name }}</p>
              <p class="text-sm text-error">{{ product?.sell_price.toLocaleString('id-ID') }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <UButton
            size="sm"
            variant="ghost"
            icon="mdi:close"
            @click="close"
          >
            Batal
          </UButton>

          <UButton
            size="sm"
            color="primary"
            icon="mdi:paperclip"
            :loading="isSubmitting"
            :disabled="!selectedProduct"
            @click="submit"
          >
            Pilih
          </UButton>
        </div>

      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useProductsApi } from '~/composables/api/product';
import type { PageResponse } from '~/types/PageResponse';
import type { ProductResponse } from '~/types/product/ProductResponse';

  const props = defineProps<{
    modelValue: boolean
    loading?: boolean
    products?: PageResponse<ProductResponse>
  }>()

  // // Ambil API function
  // const { fetchProductsByMerchantId } = useProductsApi()

  // Emit untuk update modelValue
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', product: ProductResponse): void
  }>()

  //Ambil config
  const config = useRuntimeConfig()
  const toast = useToast()

  // Reactive open & close state yang terhubung dengan modelValue
  const open = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val),
  })

  const close = () => {
    emit('update:modelValue', false)
  }

  //reactive state
  const message = ref('')
  const localError = ref<string | null>(null)
  const isSubmitting = ref<boolean>(false)
  const selectedProduct = ref<ProductResponse>()
  
  //reactive state paging product
  const PerPageValue = ref<number>(10)
  const PageValue = ref<number>(0)
  const hasMore = ref<boolean>(false)
  const loadingMore = ref<boolean>(false)
  const active = ref<number | null>(null) 
  const keyword = ref<string>('')
  const container = ref<HTMLElement | null>(null)

  const selectProductHandler = (product: ProductResponse) => {
    if(product){
      selectedProduct.value = product
    }
  }
  


  // Reset saat modal dibuka
  watch(() => props.modelValue, (val) => {
    if (val) {
      message.value = ''
      localError.value = null
    }
  })

  // 🔥 VALIDATION
  const isValid = computed(() => {
    return selectedProduct !== null
  })

  // Watcher untuk validasi pesan
  // watch(message, () => {
  //   if (message.value.trim().length === 0) {
  //     localError.value = 'Produk wajib dipilih'
  //   } else {
  //     localError.value = null
  //   }
  // })

  //submit handler
  const submit = async() => {
    
    if (!isValid.value) {
      localError.value = 'Produk wajib dipilih'
      return
    }

    emit('update:modelValue', false)
    emit('submit', selectedProduct.value as ProductResponse)

    // try {
    //   isSubmitting.value = true
    //   const formData = new FormData()
    //   if(props.product?.id) formData.append("productId", props.product?.id.toString() || '')
    //   formData.append("message", message.value)
    //   if(props.merchantId) formData.append("receiverId", props.merchantId.toString() || '')
      
    //   await fetchSendChat(formData)
    //   toast.add({
    //     title: "Berhasil",
    //     description: "Pesan terkirim",
    //     color: "success",
    //     icon: "material-symbols:check-circle-outline"
    //   })
    //   message.value = '' // reset textarea
    //   navigateTo("/chat")
    //   emit('update:modelValue', false)
    // } catch (err) {
    //   console.error(err)
    //   toast.add({
    //     title: 'Gagal Mengirim Pesan',
    //     description: "Terjadi kesalahan saat mengirim pesan, silakan coba lagi nanti.",
    //     color: "error",
    //     icon: "i-heroicons-x-circle-solid"
    //   })
    // } finally {
    //   isSubmitting.value = false
    // }
  }

  


</script>
