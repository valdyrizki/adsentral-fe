<template>
  <div v-if="stat && stat.suspend_status !== 'NONE'" class="w-full border-b" :class="outerClass">
    <div class="max-w-5xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">

      <!-- Icon + Text -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" :class="iconBgClass">
          <UIcon :name="bannerIcon" class="text-sm" :class="iconClass" />
        </div>
        <div class="min-w-0">
          <span class="text-sm font-semibold" :class="titleClass">{{ bannerTitle }}</span>
          <span class="text-xs ml-2 opacity-75" :class="titleClass">{{ bannerDesc }}</span>
        </div>
      </div>

      <!-- Right: badge + button -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span
          class="text-xs font-semibold px-2 py-0.5 rounded-full"
          :class="badgeClass"
        >
          {{ stat.active_points }} poin aktif
        </span>
        <UButton
          v-if="waLink"
          :to="waLink"
          target="_blank"
          size="xs"
          color="success"
          variant="outline"
          icon="i-heroicons-chat-bubble-left-ellipsis"
        >
          Hubungi Admin via WA
        </UButton>
        <UButton
          to="/penalty"
          size="xs"
          :color="btnColor"
          variant="ghost"
          trailing-icon="i-heroicons-chevron-right"
        >
          Lihat Detail
        </UButton>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { usePenaltyApi } from '~/composables/api/penalty'
import type { MyPenaltyStat } from '~/composables/api/penalty'

const authStore = useAuthStore()
const systemSettingStore = useSystemSettingStore()
const { fetchMyPenaltyStat } = usePenaltyApi()

const waLink = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return null
  return `https://wa.me/${number.replace(/\D/g, '')}`
})

const stat = ref<MyPenaltyStat | null>(null)

onMounted(async () => {
  if (authStore.user) {
    stat.value = await fetchMyPenaltyStat()
  }
})

const isPermanent = computed(() => stat.value?.suspend_status === 'PERMANENT')
const isTemporary = computed(() => stat.value?.suspend_status === 'TEMPORARY')

const outerClass = computed(() => {
  if (isPermanent.value) return 'bg-red-50 border-red-200'
  if (isTemporary.value) return 'bg-orange-50 border-orange-200'
  return 'bg-yellow-50 border-yellow-200'
})

const iconBgClass = computed(() => {
  if (isPermanent.value) return 'bg-red-100'
  if (isTemporary.value) return 'bg-orange-100'
  return 'bg-yellow-100'
})

const iconClass = computed(() => {
  if (isPermanent.value) return 'text-red-600'
  if (isTemporary.value) return 'text-orange-500'
  return 'text-yellow-600'
})

const titleClass = computed(() => {
  if (isPermanent.value) return 'text-red-700'
  if (isTemporary.value) return 'text-orange-700'
  return 'text-yellow-800'
})

const badgeClass = computed(() => {
  if (isPermanent.value) return 'bg-red-100 text-red-700'
  if (isTemporary.value) return 'bg-orange-100 text-orange-700'
  return 'bg-yellow-100 text-yellow-800'
})

const btnColor = computed(() => {
  if (isPermanent.value) return 'error' as const
  if (isTemporary.value) return 'warning' as const
  return 'warning' as const
})

const bannerIcon = computed(() => {
  if (isPermanent.value) return 'i-heroicons-x-circle'
  if (isTemporary.value) return 'i-heroicons-no-symbol'
  return 'i-heroicons-exclamation-triangle'
})

const bannerTitle = computed(() => {
  if (isPermanent.value) return 'Akun Disuspend Permanen'
  if (isTemporary.value) return 'Akun Disuspend Sementara'
  return 'Peringatan Penalty'
})

const bannerDesc = computed(() => {
  if (isPermanent.value)
    return 'Hubungi kami untuk informasi lebih lanjut.'
  if (isTemporary.value && stat.value?.suspend_until)
    return `Berlaku hingga ${dayjs(stat.value.suspend_until).format('DD MMM YYYY')}.`
  return `${stat.value?.active_points ?? 0} poin aktif — jaga kepatuhan untuk menghindari suspensi.`
})
</script>
