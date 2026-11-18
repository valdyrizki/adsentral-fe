<template>
  <LegalDocument title="Kebijakan Privasi" :source="source" />
</template>

<script lang="ts" setup>
// Teks dari draf legal repo BE (EP08-05); perbarui lewat scripts/sync-legal.mjs, jangan diedit di sini
import source from '~/legal/kebijakan-privasi.md?raw'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Kebijakan Privasi — Adsentral',
  meta: [{ name: 'description', content: 'Data pribadi yang dikumpulkan Adsentral, tujuannya, masa simpan, dan hak Anda.' }],
})
</script>
