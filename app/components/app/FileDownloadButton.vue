<template>
  <UButton
    icon="mdi:download"
    :color="color"
    variant="soft"
    size="xs"
    class="max-w-full"
    :title="fileName"
    @click.stop="download"
  >
    <span class="truncate">{{ fileName }}</span>
  </UButton>
</template>

<script lang="ts" setup>
import type { FileManagementResponse } from '~/types/file-management/FileManagementResponse'

const props = withDefaults(defineProps<{
  file: FileManagementResponse
  color?: 'primary' | 'warning' | 'neutral'
}>(), { color: 'primary' })

// "nama.format" — ori_name biasanya sudah berekstensi; tambahkan format bila belum
const fileName = computed(() => {
  const name = props.file.ori_name || props.file.title || 'file'
  const ext = props.file.format?.replace(/^\./, '')
  if (!ext || name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) return name
  return `${name}.${ext}`
})

// URL file pengiriman/garansi presigned (1 jam); halaman induk menyediakan sumber refresh-nya
const openSignedFile = useSignedFileOpener()
const download = () => openSignedFile(props.file.url, fileName.value)
</script>
