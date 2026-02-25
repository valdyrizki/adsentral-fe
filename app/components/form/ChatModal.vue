<template>
  <UModal v-model:open="open" title="Kirim pesan ke penjual">
    <template #body>
      <div class="p-2 space-y-3">
        <div v-if="product">
          <div class="flex flex-col gap-2 border-1 border-gray-300 p-4 rounded-2xl bg-blue-100">
            <p class="text-sm"> Produk Terkait : </p>
            <div class="flex gap-4">
              <NuxtImg :src="config.public.backendUrl +'/'+ product.banner_url" width="50" height="50" />
              <p class="text-sm">{{ product.name }}</p>
            </div>
          </div>
          
          <USeparator class="mt-4"/>
        </div>
        

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">
            Pesan <span class="text-red-500">*</span>
          </label>

          <UTextarea
            v-model="message"
            placeholder="Tulis pesanmu untuk penjual disini..."
            :rows="4"
          />

          <p v-if="localError || error" class="text-sm text-red-500 mt-1">
            {{ localError || error }}
          </p>
        </div>

        <div class="flex gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click="message = 'Siap kirim?'"
          >
            Siap kirim? 
          </UButton>
          <UButton
            size="xs"
            variant="outline"
            @click="message = 'Masih ada?'"
          >
            Masih ada? 
          </UButton>
          <UButton
            size="xs"
            variant="outline"
            @click="message = 'Berapa lama prosesnya?'"
          >
            Berapa lama prosesnya? 
          </UButton>
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
            icon="mdi:send"
            :loading="isSubmitting"
            :disabled="!message.trim() || message.trim().length < 10"
            @click="submit"
          >
            Kirim Pesan
          </UButton>
        </div>

      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useChatApi } from '~/composables/api/chat';
import type { ProductResponse } from '~/types/product/ProductResponse';

  const props = defineProps<{
    modelValue: boolean
    product? : ProductResponse
    loading?: boolean
    error?: string | null
    buyerId?: number
    merchantId?: number
  }>()

  // Ambil API function
  const { fetchSendChat } = useChatApi()

  // Emit untuk update modelValue
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  //Ambil config
  const config = useRuntimeConfig()
  const toast = useToast()

  // Reactive open & close state yang terhubung dengan modelValue
  const open = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
  })

  const close = () => {
    emit('update:modelValue', false)
  }

  //reactive state
  const message = ref('')
  const localError = ref<string | null>(null)
  const isSubmitting = ref<boolean>(false)

  // Reset saat modal dibuka
  watch(() => props.modelValue, (val) => {
    if (val) {
      message.value = ''
      localError.value = null
    }
  })

  // 🔥 VALIDATION
  const isValid = computed(() => {
    return message.value.trim().length >= 10
  })

  // Watcher untuk validasi pesan
  watch(message, () => {
    if (message.value.trim().length === 0) {
      localError.value = 'Pesan wajib diisi'
    } else {
      localError.value = null
    }
  })

  //submit handler
  const submit = async() => {
    if (!isValid.value) {
      localError.value = 'Pesan wajib diisi'
      return
    }

    try {
      isSubmitting.value = true
      const formData = new FormData()
      if(props.product?.id) formData.append("productId", props.product?.id.toString() || '')
      formData.append("message", message.value)
      if(props.merchantId) formData.append("receiverId", props.merchantId.toString() || '')
      
      await fetchSendChat(formData)
      toast.add({
        title: "Berhasil",
        description: "Pesan terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })
      message.value = '' // reset textarea
      navigateTo("/chat")
      emit('update:modelValue', false)
    } catch (err) {
      console.error(err)
      toast.add({
        title: 'Gagal Mengirim Pesan',
        description: "Terjadi kesalahan saat mengirim pesan, silakan coba lagi nanti.",
        color: "error",
        icon: "i-heroicons-x-circle-solid"
      })
    } finally {
      isSubmitting.value = false
    }
  }

  


</script>
