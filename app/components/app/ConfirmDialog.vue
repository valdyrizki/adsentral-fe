<!-- app/components/app/ConfirmDialog.vue -->
<template>
  <UModal v-model:open="isOpen" :title="title">
    <template #body>
      <p class="text-gray-700 mb-4">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <UButton 
          variant="ghost" 
          color="neutral"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UButton>
        <UButton 
          :color="confirmColor" 
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Konfirmasi',
  message: 'Apakah Anda yakin?',
  confirmText: 'Ya',
  cancelText: 'Batal',
  confirmColor: 'primary',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>