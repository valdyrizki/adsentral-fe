<template>
  <!-- Pesan berformat "Label: nilai" per baris (detail akun) → daftar rapi + salin per field -->
  <div v-if="parsed.fields.length" class="w-full text-left rounded-lg border border-gray-200 bg-white overflow-hidden">
    <div class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
      <span class="text-xs font-medium text-gray-600 flex items-center gap-1">
        <UIcon name="i-lucide-user-round" class="size-3.5" />
        {{ title }}
      </span>
      <AppCopyButton :value="message" label="Salin semua" show-label />
    </div>
    <p v-for="(line, i) in parsed.before" :key="`b${i}`" class="px-3 pt-2 text-sm text-gray-600 whitespace-pre-wrap break-words">{{ line }}</p>
    <dl class="divide-y divide-gray-100">
      <div v-for="(f, i) in parsed.fields" :key="i" class="grid grid-cols-[7.5rem_1fr_auto] sm:grid-cols-[9rem_1fr_auto] items-start gap-2 px-3 py-1.5">
        <dt class="text-xs text-gray-500 pt-0.5">{{ f.label }}</dt>
        <dd
          class="text-sm text-gray-800 font-mono break-all min-w-0"
          :class="f.value.length > 120 ? 'max-h-24 overflow-y-auto' : ''"
        >
          {{ f.value || '-' }}
        </dd>
        <AppCopyButton v-if="f.value" :value="f.value" :label="`Salin ${f.label}`" />
      </div>
    </dl>
    <p v-for="(line, i) in parsed.after" :key="`a${i}`" class="px-3 pb-2 text-sm text-gray-600 whitespace-pre-wrap break-words">{{ line }}</p>
  </div>

  <!-- Pesan biasa -->
  <div v-else class="flex items-start gap-1">
    <span class="flex-1 min-w-0 text-gray-600 whitespace-pre-wrap break-words">{{ message || fallback }}</span>
    <AppCopyButton v-if="message && copyable" :value="message" />
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  message: string | null | undefined
  // Teks bila pesan kosong (mis. "Download filenya dibawah ini ya")
  fallback?: string
  title?: string
  // Tombol salin untuk pesan biasa (non detail akun)
  copyable?: boolean
}>(), { fallback: '', title: 'Detail Akun', copyable: true })

// "Label: nilai" — label pendek (≤ 30 karakter, tanpa titik dua), nilai boleh kosong / mengandung ":"
const FIELD_LINE = /^([^:\n]{1,30}?)\s*:\s?(.*)$/

const parsed = computed(() => {
  const lines = (props.message ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const isField = (l: string) => FIELD_LINE.test(l) && !/^https?$/i.test(l.split(':')[0]!.trim())
  const fieldCount = lines.filter(isField).length
  // Dianggap detail akun bila minimal 2 baris berformat "Label: nilai"
  if (fieldCount < 2) return { before: [] as string[], fields: [] as { label: string; value: string }[], after: [] as string[] }

  const first = lines.findIndex(isField)
  let last = lines.length - 1
  while (last > first && !isField(lines[last]!)) last--

  const fields = lines.slice(first, last + 1).map((l) => {
    const m = l.match(FIELD_LINE)
    // Baris non "Label: nilai" di tengah blok ditampilkan sebagai lanjutan tanpa label
    return m ? { label: m[1]!.trim(), value: m[2]!.trim() } : { label: '', value: l }
  })
  return { before: lines.slice(0, first), fields, after: lines.slice(last + 1) }
})
</script>
