<template>
  <UModal v-model:open="open" :title=title>
    <template #body>
      <p class="text-sm text-gray-600">
        {{ description }}
      </p>
    </template>
    <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="soft"
              @click="close"
            >
              {{ cancelLabel }}
            </UButton>

            <UButton
              color="primary"
              :loading="loading"
              @click="confirm"
            >
              {{ confirmLabel }}
            </UButton>
          </div>
        </template>
  </UModal>
</template>

<script setup lang="ts">

  const props = defineProps<{
    modelValue: boolean
    loading?: boolean
    error?: string | null
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', isConfirm: boolean): void
  }>()

  const open = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
  })

  const isConfirm = ref<boolean>(false)
  const localReason = ref('')
  const localError = ref<string | null>(null)

  // Reset saat modal dibuka
  watch(() => props.modelValue, (val) => {
    if (val) {
      localReason.value = ''
      localError.value = null
    }
  })

  const close = () => {
    emit('update:modelValue', false)
  }

  const confirm = () => {
    emit('submit', isConfirm.value)
  }



</script>
