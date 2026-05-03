<template>
  <UModal v-model:open="open" title="Refund Pesanan">
    <template #body>
      <div class="p-2 space-y-3">

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">
            Alasan Refund <span class="text-red-500">*</span>
          </label>

          <UTextarea
            v-model="localReason"
            placeholder="Contoh: Stok habis / Produk sudah tidak tersedia"
            :rows="4"
          />

          <p v-if="localError || error" class="text-sm text-red-500 mt-1">
            {{ localError || error }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            size="sm"
            variant="ghost"
            @click="close"
          >
            Batal
          </UButton>

          <UButton
            size="sm"
            color="error"
            :loading="loading"
            :disabled="!localReason.trim() || localReason.trim().length < 10"
            @click="submit"
          >
            Refund Pesanan
          </UButton>
        </div>

      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
  const props = defineProps<{
    modelValue: boolean
    loading?: boolean
    error?: string | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', reason: string): void
  }>()

  const open = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
  })

  const localReason = ref('')
  const localError = ref<string | null>(null)

  // Reset saat modal dibuka
  watch(() => props.modelValue, (val) => {
    if (val) {
      localReason.value = ''
      localError.value = null
    }
  })

  // 🔥 VALIDATION
  const isValid = computed(() => {
    return localReason.value.trim().length >= 10
  })

  watch(localReason, () => {
    if (localReason.value.trim().length === 0) {
      localError.value = 'Alasan wajib diisi'
    } else if (localReason.value.trim().length < 10) {
      localError.value = 'Alasan minimal 10 karakter'
    } else {
      localError.value = null
    }
  })

  const close = () => {
    emit('update:modelValue', false)
  }

  const submit = () => {
    if (!isValid.value) {
      localError.value = 'Alasan minimal 10 karakter'
      return
    }

    emit('submit', localReason.value.trim())
  }



</script>
