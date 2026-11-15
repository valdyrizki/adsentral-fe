<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <div class="space-y-3">
        <UFormField label="Alasan" required :hint="`${trimmed.length}/${MAX}`" :error="tooLong ? `Maksimal ${MAX} karakter` : undefined">
          <UTextarea v-model="reason" :rows="4" class="w-full" :placeholder="placeholder" data-testid="admin-reason" />
        </UFormField>
        <p class="text-xs text-gray-400">Alasan dikirim ke seller lewat notifikasi dan dicatat di log admin. Minimal {{ MIN }} karakter.</p>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="open = false">Batal</UButton>
          <UButton :color="confirmColor" :loading="loading" :disabled="!valid" @click="emit('submit', trimmed)">
            {{ confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
/** Dialog alasan wajib untuk aksi admin yang dikirim ke seller (BE `AdminReasonRequest`: 10-500 karakter, EP06-02). */
const props = withDefaults(defineProps<{
  title: string
  description?: string
  confirmText: string
  confirmColor?: 'error' | 'warning' | 'primary'
  placeholder?: string
  loading?: boolean
}>(), { confirmColor: 'error', description: undefined, placeholder: '', loading: false })

const emit = defineEmits<{ (e: 'submit', reason: string): void }>()
const open = defineModel<boolean>('open', { required: true })

const MIN = 10
const MAX = 500
const reason = ref('')
const trimmed = computed(() => reason.value.trim())
const tooLong = computed(() => trimmed.value.length > MAX)
const valid = computed(() => trimmed.value.length >= MIN && !tooLong.value && !props.loading)

watch(open, (v) => { if (v) reason.value = '' })
</script>
