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
    <!-- File lampiran akun -->
    <div v-if="file" class="grid grid-cols-[7.5rem_1fr_auto] sm:grid-cols-[9rem_1fr_auto] items-center gap-2 px-3 py-1.5">
      <dt class="text-xs text-gray-500">File</dt>
      <dd class="min-w-0">
        <AppFileDownloadButton :file="file" :color="fileColor" />
      </dd>
    </div>
  </dl>
</template>

<script lang="ts" setup>
import type { FileManagementResponse } from '~/types/file-management/FileManagementResponse'

// Daftar "Label: nilai" detail akun, dengan tombol salin per field (+ baris File bila ada)
defineProps<{ fields: { label: string; value: string }[]; file?: FileManagementResponse | null; fileColor?: 'primary' | 'warning' | 'neutral' }>()
</script>
