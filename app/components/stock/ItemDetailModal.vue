<template>
  <UModal v-model:open="open" title="Detail Item Stok" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div v-if="item" class="space-y-5">
        <!-- Ringkasan -->
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm font-semibold text-gray-800 mr-auto">{{ item.product_name || '-' }}</p>
          <UBadge color="neutral" variant="soft" size="sm" :icon="STOCK_CONTENT_ICON[kind]">
            {{ STOCK_CONTENT_LABEL[kind] }}
          </UBadge>
          <UBadge v-if="item.account_type_name" color="primary" variant="soft" size="sm">
            {{ item.account_type_name }}
          </UBadge>
          <StockStatusBadge :status="item.status" />
        </div>

        <!-- Item dikembalikan: transaksi dibatalkan/direfund setelah akun terkirim -->
        <UAlert
          v-if="item.status === 'RETURNED'"
          icon="i-lucide-undo-2"
          color="warning"
          variant="subtle"
          title="Item dikembalikan"
          :description="STOCK_STATUS_META.RETURNED!.hint"
        >
          <template v-if="editable" #actions>
            <UButton size="xs" color="warning" icon="i-lucide-rotate-ccw" @click="emit('readd', item)">
              Tambah ulang ke stok
            </UButton>
          </template>
        </UAlert>

        <!-- File -->
        <div v-if="item.file_name" class="space-y-1">
          <p class="text-xs font-medium text-gray-500">File</p>
          <a
            :href="item.file_url ? getImageUrl(item.file_url) : undefined"
            :download="item.file_name"
            target="_blank"
            class="text-sm text-blue-500 hover:underline flex items-center gap-1 w-fit max-w-full break-all"
          >
            <UIcon name="i-lucide-download" class="size-4 flex-none" />
            {{ item.file_name }}
          </a>
        </div>

        <!-- Data Akun -->
        <div v-if="accountRows.length" class="space-y-2">
          <p class="text-xs font-medium text-gray-500">Data Akun</p>
          <div class="divide-y divide-gray-100 rounded-xl border border-gray-100">
            <div v-for="row in accountRows" :key="row.key" class="flex items-start gap-3 px-3 py-2">
              <p class="w-32 flex-none text-xs text-gray-500 pt-1">{{ row.label }}</p>
              <p
                class="flex-1 min-w-0 text-sm text-gray-800 font-mono break-all"
                :class="row.key === 'account_cookie' && isShown(row) ? 'max-h-40 overflow-y-auto whitespace-pre-wrap' : ''"
              >
                {{ isShown(row) ? row.value : '••••••••' }}
              </p>
              <div v-if="!masked || !row.sensitive" class="flex-none flex items-center gap-0.5">
                <UButton
                  v-if="row.sensitive"
                  :icon="revealed[row.key] ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="revealed[row.key] ? 'Sembunyikan' : 'Tampilkan'"
                  @click="revealed[row.key] = !revealed[row.key]"
                />
                <AppCopyButton :value="row.value" :label="`Salin ${row.label}`" />
              </div>
            </div>
          </div>
          <p v-if="masked" class="text-xs text-gray-400">Field sensitif disembunyikan untuk admin.</p>
        </div>

        <!-- Notes -->
        <div v-if="item.description" class="space-y-1">
          <p class="text-xs font-medium text-gray-500">Notes / Catatan</p>
          <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ item.description }}</p>
        </div>

        <div class="flex flex-wrap gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span class="flex items-center gap-1">
            <UIcon name="mdi:calendar" class="size-3" />
            {{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}
          </span>
          <span class="font-mono">#{{ item.id }}</span>
          <NuxtLink
            v-if="item.transaction_id && transactionBase"
            :to="`${transactionBase}/${item.transaction_id}`"
            class="font-mono text-blue-500 hover:underline flex items-center gap-1"
          >
            <UIcon name="i-lucide-receipt" class="size-3" />
            {{ item.transaction_id }}
          </NuxtLink>
          <span v-else-if="item.transaction_id" class="font-mono">{{ item.transaction_id }}</span>
          <UButton
            v-if="editable && item.status === 'ACTIVE'"
            icon="mdi:pencil-outline"
            size="xs"
            color="primary"
            variant="soft"
            class="ml-auto"
            @click="emit('edit', item)"
          >
            Edit
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { StockAccountFields } from '~/types/product/ProductStockItemRequest'
import {
  ACCOUNT_FIELD_KEYS,
  ACCOUNT_FIELD_LABELS,
  SENSITIVE_ACCOUNT_FIELDS,
  STOCK_CONTENT_ICON,
  STOCK_CONTENT_LABEL,
  STOCK_STATUS_META,
  stockContentKind,
} from '~/helper/stockAccountHelper'

// masked = tampilan admin: field sensitif sudah "********" dari BE, tanpa reveal/copy.
const props = defineProps<{
  item: ProductStockItemResponse | null
  masked?: boolean
  // Aksi seller: Edit (item ACTIVE) & Tambah ulang ke stok (item RETURNED)
  editable?: boolean
  // Prefix link detail transaksi, mis. "/seller/order" atau "/admin/order"
  transactionBase?: string
}>()

const emit = defineEmits<{
  edit: [item: ProductStockItemResponse]
  readd: [item: ProductStockItemResponse]
}>()

const open = defineModel<boolean>('open', { default: false })

const revealed = reactive<Partial<Record<keyof StockAccountFields, boolean>>>({})

// Reset reveal setiap kali item berganti / modal dibuka ulang
watch([() => props.item?.id, open], () => {
  for (const k of ACCOUNT_FIELD_KEYS) revealed[k] = false
})

const kind = computed(() => (props.item ? stockContentKind(props.item) : 'NOTES'))

interface AccountRow { key: keyof StockAccountFields; label: string; value: string; sensitive: boolean }

const accountRows = computed<AccountRow[]>(() => {
  const item = props.item
  if (!item) return []
  return ACCOUNT_FIELD_KEYS
    .filter(k => !!item[k])
    .map(k => ({ key: k, label: ACCOUNT_FIELD_LABELS[k], value: item[k] as string, sensitive: SENSITIVE_ACCOUNT_FIELDS.has(k) }))
})

function isShown(row: AccountRow) {
  // Admin: tampilkan apa adanya (sudah di-mask BE)
  if (!row.sensitive || props.masked) return true
  return !!revealed[row.key]
}
</script>
