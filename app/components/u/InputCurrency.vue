<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  placeholder?: string
  label?: string
  id?: string
  name?: string
  icon?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// state lokal untuk string terformat
const displayValue = ref('')

watch(
  () => props.modelValue,
  (newVal) => {
    displayValue.value = formatRupiah(newVal)
  },
  { immediate: true }
)

function handleChange(val: string) {
  // 🚨 hanya izinkan angka
  const numericOnly = val.replace(/[^\d]/g, '')

  // parse ke number
  const parsed = Number(numericOnly) || 0

  // emit angka murni
  emit('update:modelValue', parsed)

  // update tampilan dengan format rupiah
  displayValue.value = formatRupiah(parsed)
}

function formatRupiah(value: number | string) {
  const number = Number(value.toString().replace(/\D/g, '')) || 0
  return number.toLocaleString('id-ID') // contoh: 10.000
}
</script>

<template>
  <UInput
    :icon="icon || 'fa6-solid:rupiah-sign'"
    :id="id"
    :name="name"
    :placeholder="placeholder || 'Masukkan harga'"
    :label="label || 'Harga'"
    v-model="displayValue"
    @update:model-value="handleChange"
    inputmode="numeric"
  />
</template>
