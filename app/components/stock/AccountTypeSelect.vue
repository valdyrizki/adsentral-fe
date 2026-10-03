<template>
  <USelect
    :model-value="modelValue ?? 0"
    :items="items"
    value-key="value"
    :loading="pending"
    :disabled="disabled"
    class="w-full"
    @update:model-value="(v: number) => emit('update:modelValue', v || null)"
  />
</template>

<script lang="ts" setup>

// Dropdown tipe akun ACTIVE (GET /account-types). Nilai null = tidak dipilih.
const props = withDefaults(defineProps<{
  modelValue: number | null | undefined
  emptyLabel?: string
  disabled?: boolean
  // Tipe yang sedang dipakai item tapi sudah INACTIVE (tidak ada di daftar ACTIVE): tetap tampil sebagai pilihan
  currentType?: { id: number; name: string } | null
}>(), { emptyLabel: 'Tidak dipilih', disabled: false, currentType: null })

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const { data, pending } = useAccountTypes()

// Sentinel 0 untuk "kosong" karena USelect tidak menerima value kosong
const items = computed(() => {
  const list = (data.value ?? []).map(t => ({ label: t.name, value: t.id }))
  const current = props.currentType
  if (current && !list.some(t => t.value === current.id)) {
    list.push({ label: `${current.name} (nonaktif)`, value: current.id })
  }
  return [{ label: props.emptyLabel, value: 0 }, ...list]
})
</script>
