<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-primary-200 bg-gray-100">
      <div class="p-6 md:p-10">
        <UBreadcrumb :items="breadcrumb" class="mb-4" />

        <UAlert
          v-if="legalConfig.draft"
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          title="Draf, belum berlaku"
          description="Dokumen ini masih rancangan dan sedang ditinjau. Isinya dapat berubah sebelum ditetapkan."
          class="mb-6"
          data-testid="legal-draft-banner"
        />

        <!-- Isi dari draf repo BE (scripts/sync-legal.mjs), bukan input pengguna; tetap disanitasi -->
        <article
          class="prose prose-sm md:prose-base max-w-none bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-primary-100 prose-a:text-primary prose-table:text-sm"
          data-testid="legal-document"
          v-html="html"
        />

        <div class="mt-10 bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
          <p class="text-gray-700 font-semibold mb-1">Ada pertanyaan?</p>
          <p class="text-sm text-gray-500 mb-4">Hubungi CS kami: {{ CS_SLA_TEXT }}.</p>
          <UButton to="/hubungi-kami" color="primary" icon="i-heroicons-envelope">Hubungi Kami</UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { legalConfig, fillLegalPlaceholders, CS_SLA_TEXT } from '~/legal/config'

const props = defineProps<{ title: string; source: string }>()

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: props.title, icon: 'i-heroicons-document-text' },
]

const html = computed(() => DOMPurify.sanitize(marked.parse(fillLegalPlaceholders(props.source), { async: false }) as string))
</script>
