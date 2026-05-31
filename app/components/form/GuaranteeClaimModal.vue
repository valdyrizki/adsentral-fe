<template>
  <UModal v-model:open="open" title="Ajukan Klaim Garansi">
    <template #body>
      <div class="p-2 space-y-3">

        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-500">
            Jelaskan keluhan Anda mengenai produk yang ingin diklaim garansi. 
          </p>
          <p class="text-sm text-error-500">
            Klaim garansi hanya dapat dilakukan 1x per transaksi. Maka dari itu sebelum klaim garansi pastikan produk benar" bermasalah dan sudah dikomunikasikan dengan Penjual terlebih dahulu
          </p>

          <label class="text-sm font-medium">
            Deskripsi Keluhan <span class="text-red-500">*</span>
          </label>

          <UTextarea
            v-model="localDescription"
            placeholder="Contoh: Akun tidak bisa diakses / produk tidak sesuai deskripsi"
            :rows="5"
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
            color="warning"
            icon="material-symbols:shield"
            :loading="loading"
            :disabled="!isValid"
            @click="submit"
          >
            Ajukan Klaim Garansi
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
  (e: 'submit', description: string): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const localDescription = ref('')
const localError = ref<string | null>(null)

watch(() => props.modelValue, (val) => {
  if (val) {
    localDescription.value = ''
    localError.value = null
  }
})

const isValid = computed(() => localDescription.value.trim().length >= 10)

watch(localDescription, () => {
  if (localDescription.value.trim().length === 0) {
    localError.value = 'Deskripsi keluhan wajib diisi'
  } else if (localDescription.value.trim().length < 10) {
    localError.value = 'Deskripsi keluhan minimal 10 karakter'
  } else {
    localError.value = null
  }
})

const close = () => emit('update:modelValue', false)

const submit = () => {
  if (!isValid.value) {
    localError.value = 'Deskripsi keluhan minimal 10 karakter'
    return
  }
  emit('submit', localDescription.value.trim())
}
</script>
