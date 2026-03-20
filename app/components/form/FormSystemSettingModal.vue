<template>
  <UModal
    v-model:open="open"
    :title="editingId ? 'Edit System Setting' : 'Tambah System Setting'"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmitForm">
        <UFormField label="Key" class="w-full">
          <UInput
            v-model="localForm.key"
            placeholder="contoh: app.name"
            :disabled="!!editingId"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Value">
          <UInput
            v-model="localForm.value"
            placeholder="Nilai konfigurasi"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Deskripsi">
          <UTextarea
            v-model="localForm.description"
            placeholder="Deskripsi (opsional)"
            :rows="2"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Group">
          <UInput
            v-model="localForm.group"
            placeholder="contoh: general"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Public">
          <UCheckbox v-model="localForm.is_public" label="Tampilkan ke publik" />
        </UFormField>
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            type="button"
            variant="outline"
            color="neutral"
            @click="close"
          >
            Batal
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="submitting"
          >
            {{ editingId ? 'Update' : 'Simpan' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { SystemSettingRequest } from '~/types/system-setting/SystemSettingRequest'

const props = defineProps<{
  modelValue: boolean
  editingId?: string | null
  initialForm?: SystemSettingRequest | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemSettingRequest): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const defaultForm = (): SystemSettingRequest => ({
  key: '',
  value: '',
  description: '',
  group: '',
  is_public: true,
})

const localForm = ref<SystemSettingRequest>(defaultForm())

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      localForm.value = props.initialForm
        ? { ...props.initialForm }
        : defaultForm()
    }
  },
  { immediate: true },
)

const submitting = computed(() => props.submitting ?? false)

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmitForm = () => {
  emit('submit', { ...localForm.value })
}
</script>