<template>
  <UModal v-if="open" v-model:open="open" title="Lepas Suspend" :description="description">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Alasan" required :hint="`${trimmed.length}/${MAX}`" :error="tooLong ? `Maksimal ${MAX} karakter` : undefined">
          <UTextarea
            v-model="notes"
            :rows="3"
            class="w-full"
            placeholder="Mis. banding diterima pemilik, penalty keliru"
            data-testid="unlock-notes"
          />
        </UFormField>

        <URadioGroup v-model="mode" :items="modeItems" />

        <UFormField v-if="mode === 'set'" label="Poin aktif setelah dilepas" :error="pointsError">
          <UInput v-model="points" type="number" :min="0" :max="MAX_POINTS" class="w-32" data-testid="unlock-points" />
        </UFormField>

        <p class="text-xs text-gray-400">
          Status suspend langsung dicabut dan tercatat di log admin. Minimal {{ MIN }} karakter alasan.
        </p>

        <UAlert v-if="error" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="error" />

        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="open = false">Batal</UButton>
          <UButton color="warning" :loading="saving" :disabled="!valid" @click="submit">Lepas Suspend</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PenaltyUserResponse } from '~/types/penalty/PenaltyUserResponse'
import { usePenaltyApi } from '~/composables/api/penalty'

/** Lepas suspend penalty (BE `UnlockUserRequest`: alasan 5-500 karakter, poin opsional 0-7; T-54). */
const props = defineProps<{ user: PenaltyUserResponse | null }>()
const emit = defineEmits<{ (e: 'unlocked'): void; (e: 'failed'): void }>()
const open = defineModel<boolean>('open', { required: true })

const MIN = 5
const MAX = 500
// ambang SUSPENDED di BE = 8 poin; poin setelah unlock harus di bawahnya
const MAX_POINTS = 7

const toast = useToast()
const { unlockPenaltyUser } = usePenaltyApi()

const notes = ref('')
const mode = ref<'reset' | 'set'>('reset')
const points = ref<number | string>(0)
const saving = ref(false)
const error = ref<string | null>(null)

const modeItems = [
  { label: 'Batalkan semua penalty aktif (poin menjadi 0)', value: 'reset' },
  { label: 'Atur poin aktif menjadi', value: 'set' },
]

const description = computed(() => {
  const u = props.user?.user
  return u ? `${u.full_name ?? u.username} (${u.email}), ${props.user?.active_points ?? 0} poin aktif` : undefined
})

const trimmed = computed(() => notes.value.trim())
const tooLong = computed(() => trimmed.value.length > MAX)
const pointsValue = computed(() => Number(points.value))
const pointsValid = computed(() =>
  mode.value === 'reset'
  || (points.value !== '' && Number.isInteger(pointsValue.value) && pointsValue.value >= 0 && pointsValue.value <= MAX_POINTS))
const pointsError = computed(() => (pointsValid.value ? undefined : `Poin harus 0 sampai ${MAX_POINTS}`))
const valid = computed(() => trimmed.value.length >= MIN && !tooLong.value && pointsValid.value && !saving.value)

watch(open, (v) => {
  if (v) {
    notes.value = ''
    mode.value = 'reset'
    points.value = 0
    error.value = null
  }
})

async function submit() {
  if (!valid.value || !props.user) return
  saving.value = true
  error.value = null
  try {
    const payload: { notes: string; points?: number } = { notes: trimmed.value }
    if (mode.value === 'set') payload.points = pointsValue.value
    await unlockPenaltyUser(props.user.user.id, payload)
    toast.add({ title: 'Suspend dilepas', color: 'success', icon: 'i-heroicons-check-circle' })
    open.value = false
    emit('unlocked')
  } catch (err) {
    // pesan BE tampil di modal (mis. "User tidak sedang disuspend"); daftar dimuat ulang karena status bisa sudah berubah
    error.value = apiErrorMessage(err, 'Gagal melepas suspend')
    emit('failed')
  } finally {
    saving.value = false
  }
}
</script>
