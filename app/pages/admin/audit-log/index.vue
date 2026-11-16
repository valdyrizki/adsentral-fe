<template>
  <div class="space-y-6">
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput v-model="action" icon="mdi:magnify" placeholder="Aksi, mis. REFUND_TX" class="sm:w-56" />
        <UInput v-model="actor" icon="mdi:account-search" placeholder="Email pelaku" class="sm:w-56" />
        <UInput v-model="target" icon="mdi:account" placeholder="ID user target" inputmode="numeric" class="sm:w-40" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" class="sm:ml-auto" @click="refresh()">Refresh</UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <USkeleton class="h-40 w-full" />
      </template>
      <UCard class="shadow-sm">
        <AppLoadingSkeleton v-if="pending" />
        <UAlert
          v-else-if="error"
          color="error"
          icon="mdi:alert-circle"
          title="Terjadi Kesalahan"
          :description="apiErrorMessage(error, 'Gagal memuat audit log')"
        />
        <div v-else-if="!items.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:clipboard-text-search-outline" class="text-3xl mb-2" />
          <p>Belum ada aksi admin yang tercatat untuk filter ini.</p>
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div v-for="log in items" :key="log.id" class="py-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div class="sm:w-44 flex-shrink-0 text-xs text-gray-500">
              <p>{{ formatDate(log.created_at) }}</p>
              <p class="truncate" :title="log.user_agent ?? ''">{{ log.ip_address ?? '-' }}</p>
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="subtle" size="xs">{{ log.action }}</UBadge>
                <span class="text-xs text-gray-400">{{ log.service }}</span>
                <span class="text-sm font-medium text-gray-800 truncate">{{ log.actor_email }}</span>
              </div>
              <dl v-if="log.payload" class="text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <div v-for="(value, key) in log.payload" :key="key" class="flex gap-1 min-w-0">
                  <dt class="text-gray-400 flex-shrink-0">{{ key }}:</dt>
                  <dd class="truncate" :title="formatValue(value)">{{ formatValue(value) }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div v-if="data && data.total_pages > 1" class="flex justify-center pt-4">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="perPage"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { page = p - 1 }"
          />
        </div>
      </UCard>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAuditLogApi } from '~/composables/api/audit-log'
import type { AuditLogResponse } from '~/types/audit/AuditLogResponse'
import type { PageResponse } from '~/types/PageResponse'

// Khusus super admin (BE 403 untuk admin biasa); menu hanya tampil untuk super admin (EP06-05)
definePageMeta({ layout: 'admin', label: 'Audit Log' })

const { fetchAuditLog } = useAuditLogApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPage = 20
const action = ref('')
const actor = ref('')
const target = ref('')
const filters = ref({ action: '', actor: '', target: '' })
let debounce: ReturnType<typeof setTimeout> | undefined
watch([action, actor, target], () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    filters.value = { action: action.value.trim().toUpperCase(), actor: actor.value.trim(), target: target.value.trim() }
    page.value = 0
  }, 400)
})

// ===== FETCH =====
const { data, pending, error, refresh } = useAsyncData<PageResponse<AuditLogResponse>>(
  'admin-audit-log',
  () => fetchAuditLog({
    page: page.value,
    size: perPage,
    action: filters.value.action || undefined,
    actor: filters.value.actor || undefined,
    targetUserId: /^\d+$/.test(filters.value.target) ? Number(filters.value.target) : undefined,
  }),
  { watch: [page, filters], server: false },
)
const items = computed(() => data.value?.content ?? [])

// ===== HELPERS =====
const formatDate = (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm:ss')
const formatValue = (v: unknown) => (v === null || v === undefined ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v))
</script>
