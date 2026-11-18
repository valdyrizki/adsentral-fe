<template>
  <LegalDocument title="Kebijakan Refund & Garansi" :source="source" />
</template>

<script lang="ts" setup>
// Teks dari draf legal repo BE (EP08-05); perbarui lewat scripts/sync-legal.mjs, jangan diedit di sini
import source from '~/legal/kebijakan-refund-garansi.md?raw'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Kebijakan Refund & Garansi — Adsentral',
  meta: [{ name: 'description', content: 'Kapan dana pembeli dikembalikan dan bagaimana garansi produk berlaku di Adsentral.' }],
})
</script>
