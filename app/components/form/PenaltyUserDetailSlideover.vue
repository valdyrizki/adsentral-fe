<template>
  <USlideover
    v-model:open="isOpen"
    :title="user?.user.full_name ?? user?.user.username ?? user?.user.email ?? ''"
  >
    <template #body>
      <div v-if="user" class="space-y-4 p-4">

        <!-- User Info -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div
            class="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
            :class="user.user.role === 'SELLER' ? 'bg-orange-100' : 'bg-sky-100'"
          >
            <NuxtImg
              v-if="user.user.avatar_url"
              :src="config.public.backendUrl + user.user.avatar_url"
              class="w-full h-full object-cover"
              alt="avatar"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon
                :name="user.user.role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                :class="user.user.role === 'SELLER' ? 'text-orange-500' : 'text-sky-500'"
                class="text-lg"
              />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-800">{{ user.user.full_name ?? user.user.username }}</p>
            <p class="text-xs text-gray-400">{{ user.user.email }}</p>
            <div class="flex gap-1 mt-1">
              <UBadge :color="user.user.role === 'SELLER' ? 'warning' : 'info'" variant="subtle" size="xs">
                {{ user.user.role === 'SELLER' ? 'Seller' : 'Buyer' }}
              </UBadge>
              <UBadge :color="suspendColor(user.suspend_status)" variant="subtle" size="xs">
                {{ suspendLabel(user.suspend_status) }}
              </UBadge>
              <span v-if="user.suspend_until && user.suspend_status === 'TEMPORARY'" class="text-xs text-gray-400 self-center">
                s/d {{ dayjs(user.suspend_until).format('DD MMM YYYY') }}
              </span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xl font-bold text-red-500">{{ user.active_points }}</p>
            <p class="text-xs text-gray-400">poin aktif</p>
          </div>
        </div>

        <!-- Action -->
        <UButton
          icon="i-heroicons-shield-exclamation"
          color="error"
          variant="soft"
          class="w-full"
          @click="emit('apply-penalty', user)"
        >
          Kenakan Penalty ke User Ini
        </UButton>

        <!-- Penalty List -->
        <AppLoadingSkeleton v-if="pending" />

        <div v-else-if="!detailData?.content?.length" class="py-8 text-center text-sm text-gray-400">
          <UIcon name="i-heroicons-shield-check" class="text-3xl text-gray-300 mb-2" />
          <p>Tidak ada riwayat penalty.</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="log in detailData.content"
            :key="log.id"
            class="border border-gray-100 rounded-xl p-3 space-y-1"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ log.rule_name }}</p>
                <p class="text-xs text-gray-400 font-mono">{{ log.rule_id }}</p>
              </div>
              <div class="flex-shrink-0 text-right space-y-1">
                <p class="text-sm font-bold text-red-500">{{ log.points }} poin</p>
                <UBadge :color="log.is_expired ? 'neutral' : 'success'" variant="subtle" size="xs">
                  {{ log.is_expired ? 'Kedaluwarsa' : 'Aktif' }}
                </UBadge>
              </div>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
              <span>Exp: {{ dayjs(log.expired_at).format('DD MMM YYYY') }}</span>
              <span>{{ dayjs(log.created_at).format('DD MMM YYYY, HH:mm') }}</span>
              <span v-if="log.given_by_email">Oleh: {{ log.given_by_email }}</span>
            </div>
            <p v-if="log.notes" class="text-xs text-gray-400 italic">{{ log.notes }}</p>
            <div v-if="!log.is_expired" class="pt-1">
              <UButton
                color="error"
                variant="soft"
                size="xs"
                icon="i-heroicons-x-circle"
                label="Batalkan"
                :loading="cancellingId === log.id"
                @click="handleCancel(log)"
              />
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="detailData && detailData.total_pages > 1" class="flex justify-center pt-2">
          <UPagination
            :page="detailPage + 1"
            :total="detailData.total_elements"
            :items-per-page="10"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { detailPage = p - 1; loadDetail() }"
          />
        </div>

      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import type { PenaltyUserResponse, UserSuspendStatus } from '~/types/penalty/PenaltyUserResponse'
import type { PenaltyResponse } from '~/types/penalty/PenaltyResponse'
import type { PageResponse } from '~/types/PageResponse'
import { usePenaltyApi } from '~/composables/api/penalty'

const props = defineProps<{
  modelValue: boolean
  user: PenaltyUserResponse | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply-penalty': [user: PenaltyUserResponse]
  'penalty-cancelled': []
}>()

const config = useRuntimeConfig()
const toast = useToast()
const { cancelPenalty, fetchUserPenaltyDetail } = usePenaltyApi()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const detailData = ref<PageResponse<PenaltyResponse> | null>(null)
const pending = ref(false)
const cancellingId = ref<string | null>(null)
const detailPage = ref(0)

watch(() => props.user, (u) => {
  if (u && isOpen.value) {
    detailPage.value = 0
    detailData.value = null
    loadDetail()
  }
})

watch(isOpen, (opened) => {
  if (opened && props.user) {
    detailPage.value = 0
    detailData.value = null
    loadDetail()
  }
})

async function loadDetail() {
  if (!props.user) return
  pending.value = true
  try {
    detailData.value = await fetchUserPenaltyDetail(props.user.user.id, detailPage.value, 10)
  } finally {
    pending.value = false
  }
}

function suspendColor(status: UserSuspendStatus) {
  if (status === 'PERMANENT') return 'error'
  if (status === 'TEMPORARY') return 'warning'
  return 'success'
}

function suspendLabel(status: UserSuspendStatus) {
  if (status === 'PERMANENT') return 'Suspend Permanen'
  if (status === 'TEMPORARY') return 'Suspend Sementara'
  return 'Normal'
}

const { confirm, close: closeConfirm } = useConfirm()

async function handleCancel(log: PenaltyResponse) {
  const yes = await confirm({
    title: 'Batalkan Penalty?',
    message: `Penalty ${log.rule_name} akan dibatalkan.`,
    confirmText: 'Ya, Batalkan',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!yes) return

  cancellingId.value = log.id
  try {
    await cancelPenalty(log.id)
    toast.add({ title: 'Penalty dibatalkan', color: 'success', icon: 'i-heroicons-check-circle' })
    emit('penalty-cancelled')
    await loadDetail()
  } catch (err: any) {
    toast.add({ title: 'Gagal membatalkan penalty', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    cancellingId.value = null
    closeConfirm()
  }
}
</script>
