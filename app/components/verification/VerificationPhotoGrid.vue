<template>
  <div class="mt-4">
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Foto Verifikasi</p>
      <UButton
        icon="mdi:refresh"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="$emit('stale')"
      >
        Muat Ulang Foto
      </UButton>
    </div>
    <p v-if="anyFailed" class="text-xs text-amber-600 mb-2 flex items-center gap-1">
      <UIcon name="mdi:alert-outline" class="size-3.5" />
      Link foto sudah kedaluwarsa (15 menit). Klik "Muat Ulang Foto" untuk memuat ulang.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="photo in photos" :key="photo.key" class="space-y-1">
        <p class="text-xs text-gray-500">{{ photo.label }}</p>
        <div
          class="aspect-video rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer"
          @click="!photo.failed && openPreview(photo)"
        >
          <img
            v-if="!photo.failed"
            :src="photo.url"
            :alt="photo.label"
            class="w-full h-full object-cover"
            @error="markFailed(photo.key)"
          />
          <div v-else class="flex flex-col items-center gap-1 text-gray-400 text-xs p-2 text-center">
            <UIcon name="mdi:image-broken-variant" class="text-2xl" />
            Gagal memuat foto
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="previewOpen" :title="previewLabel">
      <template #body>
        <img v-if="previewUrl" :src="previewUrl" :alt="previewLabel" class="w-full rounded-lg" @error="previewOpen = false" />
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { UserVerificationData } from '~/types/verification/UserVerificationData'

const props = defineProps<{
  data: UserVerificationRequest | UserVerificationData
}>()

defineEmits<{ stale: [] }>()

const failed = reactive<Record<string, boolean>>({})

// Reset status gagal saat foto dimuat ulang dengan URL presigned yang baru
watch(
  () => [props.data.ktp_photo_url, props.data.selfie_ktp_photo_url, props.data.selfie_note_photo_url],
  () => {
    failed.ktp = false
    failed.selfieKtp = false
    failed.selfieNote = false
  },
)

const photos = computed(() => [
  { key: 'ktp', label: 'Foto KTP', url: props.data.ktp_photo_url, failed: failed.ktp },
  { key: 'selfieKtp', label: 'Selfie Pegang KTP', url: props.data.selfie_ktp_photo_url, failed: failed.selfieKtp },
  { key: 'selfieNote', label: 'Selfie Pegang Kertas', url: props.data.selfie_note_photo_url, failed: failed.selfieNote },
])

const anyFailed = computed(() => photos.value.some(p => p.failed))

function markFailed(key: string) {
  failed[key] = true
}

const previewOpen = ref(false)
const previewUrl = ref<string | null>(null)
const previewLabel = ref('')

function openPreview(photo: { url: string; label: string }) {
  previewUrl.value = photo.url
  previewLabel.value = photo.label
  previewOpen.value = true
}
</script>
