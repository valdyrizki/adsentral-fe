<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Notifikasi</h2>
        <p class="text-sm text-gray-400 mt-0.5">Semua pemberitahuan untuk akun Anda.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="hasUnread"
          size="sm"
          color="primary"
          variant="soft"
          icon="i-heroicons-check-circle"
          :loading="readingAll"
          @click="handleReadAll"
        >
          Tandai Semua Dibaca
        </UButton>
        <UButton icon="mdi:refresh" size="sm" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </div>

    <!-- List -->
    <UCard class="shadow-sm overflow-hidden p-0">
      <AppLoadingSkeleton v-if="pending" class="p-4" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="icon-park-solid:error"
        color="error"
        class="m-4"
      />

      <div v-else-if="!data?.content?.length" class="py-16 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-bell-slash" class="text-4xl text-gray-300 mb-3" />
        <p class="font-medium">Belum ada notifikasi</p>
        <p class="text-xs mt-1">Notifikasi Anda akan muncul di sini.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="notif in data.content"
          :key="notif.id"
          class="flex items-start gap-4 px-5 py-4 transition-colors"
          :class="!notif.read_at ? 'bg-sky-50 hover:bg-sky-100/60' : 'hover:bg-gray-50'"
        >
          <!-- Icon -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            :class="notifIconBg(notif.type)"
          >
            <UIcon :name="notifIcon(notif.type)" class="text-lg" :class="notifIconColor(notif.type)" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  {{ notif.title }}
                  <span v-if="!notif.read_at" class="inline-block w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                </p>
                <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ notif.message }}</p>
                <div class="flex flex-wrap gap-1 mt-1.5">
                  <UBadge :color="notif.read_at ? 'neutral' : 'info'" variant="subtle" size="xs">
                    {{ notif.read_at ? 'Dibaca' : 'Belum Dibaca' }}
                  </UBadge>
                  <UBadge color="neutral" variant="soft" size="xs">{{ notif.type }}</UBadge>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p class="text-xs text-gray-400">{{ dayjs(notif.created_at).format('DD MMM YYYY') }}</p>
                <UButton
                  v-if="!notif.read_at"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-check"
                  :loading="readingId === notif.id"
                  @click="handleRead(notif)"
                >
                  Tandai Dibaca
                </UButton>
              </div>
            </div>
            <div v-if="notif.action_url" class="mt-2">
              <UButton :to="notif.action_url" size="xs" color="primary" variant="soft" trailing-icon="i-heroicons-arrow-right">
                Lihat Detail
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="data && data.total_pages > 1 && !pending" class="flex justify-center py-4 border-t border-gray-100">
        <UPagination
          :page="page + 1"
          :total="data.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="(p) => { page = p - 1 }"
        />
      </div>
    </UCard>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useNotificationApi } from '~/composables/api/notification'
import type { PageResponse } from '~/types/PageResponse'
import type { NotificationResponse, NotificationType } from '~/types/notification/NotificationResponse'

definePageMeta({ layout: 'seller', label: 'Notifikasi' })

const toast = useToast()
const notificationStore = useNotificationStore()
const { fetchSellerNotifications, markAsRead, markAllAsRead } = useNotificationApi()

const page = ref(0)
const perPageValue = ref(10)
const readingId = ref<number | null>(null)
const readingAll = ref(false)

const data = ref<PageResponse<NotificationResponse> | null>(null)
const pending = ref(false)
const error = ref<Error | null>(null)

const hasUnread = computed(() => data.value?.content?.some(n => !n.read_at) ?? false)

async function refresh() {
  pending.value = true
  error.value = null
  try {
    data.value = await fetchSellerNotifications(page.value, perPageValue.value)
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

async function handleRead(notif: NotificationResponse) {
  readingId.value = notif.id
  try {
    await markAsRead(notif.id)
    notif.read_at = new Date().toISOString()
  } catch {
    toast.add({ title: 'Gagal menandai notifikasi', color: 'error' })
  } finally {
    readingId.value = null
  }
}

async function handleReadAll() {
  readingAll.value = true
  try {
    await markAllAsRead()
    const now = new Date().toISOString()
    data.value?.content?.forEach(n => { n.read_at = now })
    toast.add({ title: 'Semua notifikasi ditandai dibaca', color: 'success' })
  } catch {
    toast.add({ title: 'Gagal menandai semua notifikasi', color: 'error' })
  } finally {
    readingAll.value = false
  }
}

watch([page, perPageValue], refresh)
onMounted(refresh)

function notifIcon(type: NotificationType): string {
  const map: Record<string, string> = {
    ORDER: 'i-heroicons-shopping-bag',
    PAYMENT: 'i-heroicons-credit-card',
    PENALTY: 'i-heroicons-shield-exclamation',
    PROMOTION: 'i-heroicons-tag',
    SYSTEM: 'i-heroicons-cog-6-tooth',
  }
  return map[type] ?? 'i-heroicons-bell'
}

function notifIconBg(type: NotificationType): string {
  const map: Record<string, string> = {
    ORDER: 'bg-blue-50',
    PAYMENT: 'bg-green-50',
    PENALTY: 'bg-red-50',
    PROMOTION: 'bg-orange-50',
    SYSTEM: 'bg-gray-100',
  }
  return map[type] ?? 'bg-sky-50'
}

function notifIconColor(type: NotificationType): string {
  const map: Record<string, string> = {
    ORDER: 'text-blue-400',
    PAYMENT: 'text-green-400',
    PENALTY: 'text-red-400',
    PROMOTION: 'text-orange-400',
    SYSTEM: 'text-gray-400',
  }
  return map[type] ?? 'text-sky-400'
}
</script>
