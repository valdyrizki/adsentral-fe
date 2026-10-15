<template>
  <!-- Pesan berisi detail akun → teks pengantar + detail akun (1 akun langsung tampil, >1 akun lewat popup) -->
  <div v-if="parsed.items.length" class="w-full text-left space-y-2">
    <p v-for="(line, i) in parsed.intro" :key="`i${i}`" class="text-sm text-gray-600 whitespace-pre-wrap break-words">{{ line }}</p>

    <!-- 1 akun: langsung tampil -->
    <div v-if="parsed.items.length === 1" class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
        <span class="text-xs font-medium text-gray-600 flex items-center gap-1">
          <UIcon name="i-lucide-user-round" class="size-3.5" />
          {{ parsed.items[0]!.title }}
        </span>
        <AppCopyButton :value="parsed.items[0]!.raw" label="Salin semua" show-label />
      </div>
      <AppAccountFields :fields="parsed.items[0]!.fields" :file="file" :file-color="fileColor" />
    </div>

    <!-- Lebih dari 1 akun: tombol per item, detail di popup -->
    <div v-else class="flex flex-wrap gap-2">
      <UButton
        v-for="(it, idx) in parsed.items"
        :key="idx"
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-user-round"
        class="max-w-full"
        @click="openItem(idx)"
      >
        <span class="font-medium">{{ it.title }}</span>
        <span v-if="it.summary" class="font-mono text-gray-500 truncate max-w-52">{{ it.summary }}</span>
      </UButton>
    </div>

    <!-- File berlaku untuk semua item -->
    <div v-if="parsed.items.length > 1 && file" class="flex items-center gap-2 text-sm min-w-0">
      <span class="text-xs text-gray-500 shrink-0">File :</span>
      <AppFileDownloadButton :file="file" :color="fileColor" />
    </div>

    <p v-for="(line, i) in parsed.outro" :key="`o${i}`" class="text-sm text-gray-600 whitespace-pre-wrap break-words">{{ line }}</p>

    <UModal v-if="parsed.items.length > 1" v-model:open="detailOpen" :title="selected?.title ?? title" :description="selected?.summary || undefined">
      <template #body>
        <div v-if="selected" class="space-y-3">
          <div class="flex justify-end">
            <AppCopyButton :value="selected.raw" label="Salin semua" show-label size="sm" />
          </div>
          <div class="rounded-lg border border-gray-200">
            <AppAccountFields :fields="selected.fields" :file="file" :file-color="fileColor" />
          </div>
        </div>
      </template>
    </UModal>
  </div>

  <!-- Pesan biasa -->
  <div v-else class="w-full text-left space-y-2">
    <div class="flex items-start gap-1">
      <span class="flex-1 min-w-0 text-gray-600 whitespace-pre-wrap break-words">{{ message || fallback }}</span>
      <AppCopyButton v-if="message && copyable" :value="message" />
    </div>
    <div v-if="file" class="flex items-center gap-2 text-sm min-w-0">
      <span class="text-xs text-gray-500 shrink-0">File :</span>
      <AppFileDownloadButton :file="file" :color="fileColor" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FileManagementResponse } from '~/types/file-management/FileManagementResponse'

const props = withDefaults(defineProps<{
  message: string | null | undefined
  // Teks bila pesan kosong (mis. "Download filenya dibawah ini ya")
  fallback?: string
  // Judul item bila pesan tidak punya header "Item N:"
  title?: string
  // Tombol salin untuk pesan biasa (non detail akun)
  copyable?: boolean
  // File lampiran → baris "File : [download nama.format]"
  file?: FileManagementResponse | null
  fileColor?: 'primary' | 'warning' | 'neutral'
}>(), { fallback: '', title: 'Detail Akun', copyable: true, file: null, fileColor: 'primary' })

interface AccountField { label: string; value: string }
interface AccountItem { title: string; summary: string; fields: AccountField[]; raw: string }

// "Label: nilai" — label pendek (≤ 30 karakter, tanpa titik dua), nilai boleh kosong / mengandung ":"
const FIELD_LINE = /^([^:\n]{1,30}?)\s*:\s?(.*)$/
// Header blok akun dari BE untuk pesanan > 1, mis. "Item 2:"
const ITEM_HEADER = /^item\s+\d+\s*:?\s*$/i

const isField = (l: string) => FIELD_LINE.test(l) && !/^https?$/i.test(l.split(':')[0]!.trim())

const toField = (l: string): AccountField => {
  const m = l.match(FIELD_LINE)
  // Baris tanpa "Label:" di dalam blok ditampilkan sebagai lanjutan tanpa label
  return m ? { label: m[1]!.trim(), value: m[2]!.trim() } : { label: '', value: l }
}

// Ringkasan tombol: UID, lalu Username / Email, lalu nilai pertama
const summarize = (fields: AccountField[]) => {
  const find = (re: RegExp) => fields.find(f => re.test(f.label) && f.value)
  const f = find(/^uid$/i) ?? find(/^username$/i) ?? find(/^email$/i)
  if (f) return `${f.label} ${f.value}`
  return fields.find(x => x.value)?.value ?? ''
}

/**
 * Pecah pesan menjadi blok (dipisah baris kosong):
 * - blok diawali "Item N:" atau berisi ≥ 2 baris "Label: nilai" → item akun
 * - blok lain → teks pengantar (sebelum item pertama) / penutup (sesudah item terakhir)
 */
const parsed = computed(() => {
  const blocks = (props.message ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map(b => b.split(/\r?\n/).map(l => l.trim()).filter(Boolean))
    .filter(b => b.length)

  const intro: string[] = []
  const outro: string[] = []
  const items: AccountItem[] = []

  for (const lines of blocks) {
    const hasHeader = ITEM_HEADER.test(lines[0]!)
    const body = hasHeader ? lines.slice(1) : lines
    if (hasHeader || body.filter(isField).length >= 2) {
      const fields = body.map(toField)
      const itemTitle = hasHeader ? lines[0]!.replace(/\s*:\s*$/, '') : (items.length ? `Item ${items.length + 1}` : props.title)
      items.push({ title: itemTitle, summary: summarize(fields), fields, raw: body.join('\n') })
    } else {
      (items.length ? outro : intro).push(...lines)
    }
  }
  return { intro, items, outro }
})

const detailOpen = ref(false)
const selectedIndex = ref(0)
const selected = computed(() => parsed.value.items[selectedIndex.value] ?? null)

function openItem(idx: number) {
  selectedIndex.value = idx
  detailOpen.value = true
}
</script>
