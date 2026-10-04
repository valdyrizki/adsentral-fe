<template>
  <dl class="divide-y divide-gray-100">
    <div v-for="(f, i) in fields" :key="i" class="grid grid-cols-[7.5rem_1fr_auto] sm:grid-cols-[9rem_1fr_auto] items-start gap-2 px-3 py-1.5">
      <dt class="text-xs text-gray-500 pt-0.5">{{ f.label }}</dt>
      <dd
        class="text-sm text-gray-800 font-mono break-all min-w-0"
        :class="f.value.length > 120 ? 'max-h-32 overflow-y-auto' : ''"
      >
        {{ f.value || '-' }}
      </dd>
      <AppCopyButton v-if="f.value" :value="f.value" :label="`Salin ${f.label}`" />
    </div>
  </dl>
</template>

<script lang="ts" setup>
// Daftar "Label: nilai" detail akun, dengan tombol salin per field
defineProps<{ fields: { label: string; value: string }[] }>()
</script>
