<template>
  <UButton
    :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
    :color="copied ? 'success' : 'neutral'"
    variant="ghost"
    :size="size"
    :disabled="!value"
    :title="label"
    @click.stop="copy"
  >
    <template v-if="showLabel">{{ copied ? 'Disalin' : label }}</template>
  </UButton>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  value: string | null | undefined
  label?: string
  showLabel?: boolean
  size?: 'xs' | 'sm' | 'md'
}>(), { label: 'Salin', showLabel: false, size: 'xs' })

const toast = useToast()
const copied = ref(false)

function copy() {
  if (!props.value) return
  navigator.clipboard.writeText(props.value).then(() => {
    copied.value = true
    toast.add({ title: 'Disalin!', color: 'success', icon: 'i-heroicons-check-circle' })
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {
    toast.add({ title: 'Gagal menyalin', color: 'error' })
  })
}
</script>
