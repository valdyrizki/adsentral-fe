<template>
  <UBadge v-for="b in badges" :key="b.label" :color="b.color" variant="soft">{{ b.count }} {{ b.label }}</UBadge>
</template>

<script lang="ts" setup>
import type { StockBulkCheckSummary } from '~/types/product/StockBulkCheck'

// Ringkasan hasil cek, mis. "2 baru · 1 pernah terjual · 1 duplikat" (angka 0 tidak ditampilkan)
const props = defineProps<{ summary?: StockBulkCheckSummary | null }>()

type BadgeColor = 'success' | 'warning' | 'info' | 'neutral' | 'error'

const badges = computed(() => {
  const s = props.summary
  if (!s) return []
  return [
    { count: s.new, label: 'baru', color: 'success' as BadgeColor },
    { count: s.duplicate_sent, label: 'pernah terjual', color: 'warning' as BadgeColor },
    { count: s.duplicate_active, label: 'masih di stok', color: 'info' as BadgeColor },
    { count: s.duplicate_in_file, label: 'duplikat', color: 'neutral' as BadgeColor },
    { count: s.invalid, label: 'tidak valid', color: 'error' as BadgeColor },
  ].filter(b => b.count > 0)
})
</script>
