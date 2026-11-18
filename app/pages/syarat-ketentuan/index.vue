<template>
  <LegalDocument title="Syarat & Ketentuan" :source="source" />
</template>

<script lang="ts" setup>
// Teks dari draf legal repo BE (EP08-05); perbarui lewat scripts/sync-legal.mjs, jangan diedit di sini
import source from '~/legal/syarat-ketentuan.md?raw'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Syarat & Ketentuan — Adsentral',
  meta: [{ name: 'description', content: 'Syarat dan ketentuan penggunaan layanan Adsentral untuk pembeli dan penjual.' }],
})
</script>
