<template>
  <LegalDocument title="Produk Terlarang" :source="source" />
</template>

<script lang="ts" setup>
// Teks dari draf legal repo BE (EP08-05); perbarui lewat scripts/sync-legal.mjs, jangan diedit di sini
import source from '~/legal/produk-terlarang.md?raw'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Produk Terlarang — Adsentral',
  meta: [{ name: 'description', content: 'Daftar produk yang dilarang dijual di Adsentral dan ketentuan produk.' }],
})
</script>
