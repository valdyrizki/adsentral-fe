<template>
  <UInput
    v-model="model"
    :type="visible ? 'text' : 'password'"
    :placeholder="placeholder"
    :disabled="disabled"
    autocomplete="new-password"
    class="w-full"
    :ui="{ trailing: 'pe-1' }"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="visible ? 'Sembunyikan' : 'Tampilkan'"
        :aria-pressed="visible"
        @click="visible = !visible"
      />
    </template>
  </UInput>
</template>

<script lang="ts" setup>
defineProps<{ placeholder?: string; disabled?: boolean }>()
const model = defineModel<string>({ default: '' })
const visible = ref(false)
</script>
