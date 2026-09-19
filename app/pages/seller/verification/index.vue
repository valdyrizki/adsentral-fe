<template>
  <div class="space-y-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Verifikasi Akun (KTP)</h1>
        <p class="text-sm text-gray-500 mt-0.5">Lengkapi data diri sesuai KTP untuk mengaktifkan status Terverifikasi.</p>
      </div>
      <UButton to="/seller/verification/history" icon="mdi:history" color="neutral" variant="outline" size="sm">
        Riwayat Pengajuan
      </UButton>
    </div>

    <ClientOnly>
      <template #fallback><AppLoadingSkeleton /></template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat status verifikasi'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <template v-else-if="statusData">

        <!-- ===== VERIFIED ===== -->
        <template v-if="statusData.status === 'VERIFIED' && statusData.verified_data">
          <UCard class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <UIcon name="mdi:shield-check" class="text-green-500 text-lg" />
                  </div>
                  <p class="font-semibold text-gray-800">Akun Terverifikasi</p>
                </div>
                <UBadge color="success" variant="soft" icon="mdi:check-decagram">Terverifikasi</UBadge>
              </div>
            </template>

            <VerificationDataView :data="statusData.verified_data" />

            <div class="flex items-center gap-3 mt-4 text-xs text-gray-400">
              <span v-if="statusData.verified_data.verified_at" class="flex items-center gap-1">
                <UIcon name="mdi:clock-check-outline" class="size-3.5" />
                Diverifikasi: {{ dayjs(statusData.verified_data.verified_at).format('DD MMM YYYY, HH:mm') }}
              </span>
            </div>
          </UCard>
        </template>

        <!-- ===== PENDING ===== -->
        <template v-else-if="statusData.status === 'PENDING' && statusData.latest_request">
          <UAlert
            title="Sedang Direview Admin"
            description="Pengajuan verifikasi Anda sedang ditinjau. Kami akan memberi tahu setelah proses review selesai."
            icon="mdi:clock-outline"
            color="warning"
            variant="subtle"
          />

          <UCard class="shadow-sm mt-4">
            <template #header>
              <p class="font-semibold text-gray-800 flex items-center gap-2">
                <UIcon name="mdi:file-document-outline" class="text-primary" /> Data yang Diajukan
              </p>
            </template>
            <VerificationDataView :data="statusData.latest_request" />
            <VerificationPhotoGrid :data="statusData.latest_request" @stale="refresh" />
          </UCard>
        </template>

        <!-- ===== REJECTED ===== -->
        <template v-else-if="statusData.status === 'REJECTED' && statusData.latest_request">
          <UAlert
            title="Pengajuan Ditolak"
            :description="statusData.latest_request.rejection_reason || 'Data tidak valid, silakan submit ulang.'"
            icon="mdi:close-circle"
            color="error"
            variant="subtle"
          />

          <UCard v-if="!showForm" class="shadow-sm mt-4">
            <template #header>
              <p class="font-semibold text-gray-800 flex items-center gap-2">
                <UIcon name="mdi:file-document-outline" class="text-primary" /> Data Pengajuan Sebelumnya
              </p>
            </template>
            <VerificationDataView :data="statusData.latest_request" />
            <VerificationPhotoGrid :data="statusData.latest_request" @stale="refresh" />

            <template #footer>
              <div class="flex justify-end">
                <UButton icon="mdi:reload" color="primary" @click="openForm(statusData.latest_request)">
                  Submit Ulang
                </UButton>
              </div>
            </template>
          </UCard>
        </template>

        <!-- ===== UNVERIFIED ===== -->
        <template v-else-if="statusData.status === 'UNVERIFIED'">
          <UCard v-if="!showForm" class="shadow-sm">
            <div class="py-12 flex flex-col items-center gap-4 text-center">
              <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <UIcon name="mdi:card-account-details-outline" class="text-3xl text-gray-400" />
              </div>
              <div>
                <p class="font-semibold text-gray-700">Akun Anda belum terverifikasi</p>
                <p class="text-sm text-gray-400 mt-1 max-w-md">
                  Lengkapi data sesuai KTP dan unggah 3 foto untuk memulai proses verifikasi. Admin akan meninjau pengajuan Anda secara manual.
                </p>
              </div>
              <UButton icon="mdi:shield-check-outline" color="primary" @click="openForm(null)">
                Mulai Verifikasi
              </UButton>
            </div>
          </UCard>
        </template>

        <!-- ===== FORM (submit / resubmit) ===== -->
        <UCard v-if="showForm" class="shadow-sm mt-4">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-800">Form Verifikasi Akun</p>
              <UButton icon="mdi:close" color="neutral" variant="ghost" size="xs" @click="showForm = false" />
            </div>
          </template>

          <div class="space-y-6">
            <UAlert
              v-if="submitError"
              :description="submitError"
              color="error"
              icon="material-symbols:error-outline"
            />

            <!-- Upload foto -->
            <div>
              <p class="font-medium text-gray-800 mb-2">Unggah Foto</p>
              <ul class="list-disc list-inside text-sm text-gray-500 mb-3 space-y-0.5">
                <li>Foto KTP asli (jelas &amp; tidak buram)</li>
                <li>Selfie sambil memegang KTP</li>
                <li>Selfie sambil memegang kertas tulisan tangan: "Verifikasi Adsentral {{ authStore.user?.email }}"</li>
                <li>Format JPG/PNG, maksimal 5MB per foto</li>
              </ul>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 mb-1">Foto KTP <span class="text-red-500">*</span></p>
                  <UFileUpload
                    v-model="form.ktpPhoto"
                    label="Foto KTP"
                    description="JPG/PNG, max 5MB"
                    class="w-full min-h-40"
                    @change="() => validatePhoto('ktpPhoto')"
                  />
                  <p v-if="formErrors.ktpPhoto" class="mt-1 text-sm text-red-500">{{ formErrors.ktpPhoto }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 mb-1">Selfie Pegang KTP <span class="text-red-500">*</span></p>
                  <UFileUpload
                    v-model="form.selfieKtpPhoto"
                    label="Selfie Pegang KTP"
                    description="JPG/PNG, max 5MB"
                    class="w-full min-h-40"
                    @change="() => validatePhoto('selfieKtpPhoto')"
                  />
                  <p v-if="formErrors.selfieKtpPhoto" class="mt-1 text-sm text-red-500">{{ formErrors.selfieKtpPhoto }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 mb-1">Selfie Pegang Kertas <span class="text-red-500">*</span></p>
                  <UFileUpload
                    v-model="form.selfieNotePhoto"
                    label="Selfie Pegang Kertas"
                    description="JPG/PNG, max 5MB"
                    class="w-full min-h-40"
                    @change="() => validatePhoto('selfieNotePhoto')"
                  />
                  <p v-if="formErrors.selfieNotePhoto" class="mt-1 text-sm text-red-500">{{ formErrors.selfieNotePhoto }}</p>
                </div>
              </div>
            </div>

            <USeparator />

            <!-- Data diri -->
            <div>
              <p class="font-medium text-gray-800 mb-4">Data Sesuai KTP</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <UFormField label="NIK" required>
                  <UInput v-model="form.nik" placeholder="16 digit NIK" :maxlength="16" inputmode="numeric" class="w-full" />
                  <p v-if="formErrors.nik" class="mt-1 text-sm text-red-500">{{ formErrors.nik }}</p>
                </UFormField>

                <UFormField label="Nama Lengkap (sesuai KTP)" required>
                  <UInput v-model="form.fullNameKtp" placeholder="Nama lengkap sesuai KTP" class="w-full" />
                  <p v-if="formErrors.fullNameKtp" class="mt-1 text-sm text-red-500">{{ formErrors.fullNameKtp }}</p>
                </UFormField>

                <UFormField label="Tempat Lahir" required>
                  <UInput v-model="form.placeOfBirth" placeholder="Contoh: Jakarta" class="w-full" />
                  <p v-if="formErrors.placeOfBirth" class="mt-1 text-sm text-red-500">{{ formErrors.placeOfBirth }}</p>
                </UFormField>

                <UFormField label="Tanggal Lahir" required>
                  <UInput v-model="form.dateOfBirth" type="date" class="w-full" />
                  <p v-if="formErrors.dateOfBirth" class="mt-1 text-sm text-red-500">{{ formErrors.dateOfBirth }}</p>
                </UFormField>

                <UFormField label="Jenis Kelamin" required>
                  <USelect v-model="form.gender" :items="genderOptions" value-key="value" placeholder="Pilih jenis kelamin" class="w-full" />
                  <p v-if="formErrors.gender" class="mt-1 text-sm text-red-500">{{ formErrors.gender }}</p>
                </UFormField>

                <UFormField label="Agama">
                  <UInput v-model="form.religion" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Status Perkawinan">
                  <UInput v-model="form.maritalStatus" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Pekerjaan">
                  <UInput v-model="form.occupation" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Kewarganegaraan">
                  <UInput v-model="form.nationality" placeholder="WNI" class="w-full" />
                </UFormField>
              </div>
            </div>

            <USeparator />

            <!-- Alamat -->
            <div>
              <p class="font-medium text-gray-800 mb-4">Alamat Sesuai KTP</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <UFormField label="Alamat KTP" required class="sm:col-span-2">
                  <UTextarea v-model="form.ktpAddress" placeholder="Alamat sesuai KTP" :rows="2" class="w-full" />
                  <p v-if="formErrors.ktpAddress" class="mt-1 text-sm text-red-500">{{ formErrors.ktpAddress }}</p>
                </UFormField>

                <UFormField label="RT">
                  <UInput v-model="form.rt" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="RW">
                  <UInput v-model="form.rw" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Kelurahan/Desa">
                  <UInput v-model="form.village" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Kecamatan">
                  <UInput v-model="form.district" placeholder="Opsional" class="w-full" />
                </UFormField>

                <UFormField label="Kota/Kabupaten" required>
                  <UInput v-model="form.city" placeholder="Contoh: Jakarta Selatan" class="w-full" />
                  <p v-if="formErrors.city" class="mt-1 text-sm text-red-500">{{ formErrors.city }}</p>
                </UFormField>

                <UFormField label="Provinsi" required>
                  <UInput v-model="form.province" placeholder="Contoh: DKI Jakarta" class="w-full" />
                  <p v-if="formErrors.province" class="mt-1 text-sm text-red-500">{{ formErrors.province }}</p>
                </UFormField>

                <UFormField label="Kode Pos">
                  <UInput v-model="form.postalCode" placeholder="Opsional" class="w-full" inputmode="numeric" />
                </UFormField>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton color="neutral" variant="outline" :disabled="submitting" @click="showForm = false">Batal</UButton>
              <UButton color="primary" icon="mdi:send" :loading="submitting" @click="handleSubmit">
                Kirim Pengajuan
              </UButton>
            </div>
          </div>
        </UCard>

      </template>

    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import VerificationDataView from '~/components/verification/VerificationDataView.vue'
import VerificationPhotoGrid from '~/components/verification/VerificationPhotoGrid.vue'
import { useVerificationApi } from '~/composables/api/verification'
import { validateImage } from '~/helper/imageHelper'
import { createEmptyVerificationForm, type VerificationSubmitForm } from '~/types/verification/VerificationSubmitForm'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { VerificationStatusResponse } from '~/types/verification/VerificationStatusResponse'

definePageMeta({ layout: 'seller', label: 'Verifikasi Akun' })

const toast = useToast()
const authStore = useAuthStore()
const { fetchVerificationStatus, submitVerification } = useVerificationApi()

const genderOptions = [
  { label: 'Laki-laki', value: 'MALE' },
  { label: 'Perempuan', value: 'FEMALE' },
]

const {
  data: statusData,
  pending,
  error,
  refresh,
} = await useAsyncData<VerificationStatusResponse>(
  'seller-verification-status',
  () => fetchVerificationStatus(),
  { server: false },
)

// ===== FORM =====
const showForm = ref(false)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const form = reactive<VerificationSubmitForm>(createEmptyVerificationForm())
const formErrors = reactive<Record<string, string>>({})

function openForm(prefillFrom: UserVerificationRequest | null) {
  submitError.value = null
  Object.assign(form, createEmptyVerificationForm())
  Object.keys(formErrors).forEach(k => delete formErrors[k])

  if (prefillFrom) {
    form.fullNameKtp = prefillFrom.full_name_ktp
    form.placeOfBirth = prefillFrom.place_of_birth
    form.dateOfBirth = prefillFrom.date_of_birth
    form.gender = prefillFrom.gender
    form.religion = prefillFrom.religion ?? ''
    form.maritalStatus = prefillFrom.marital_status ?? ''
    form.occupation = prefillFrom.occupation ?? ''
    form.nationality = prefillFrom.nationality || 'WNI'
    form.ktpAddress = prefillFrom.ktp_address
    form.rt = prefillFrom.rt ?? ''
    form.rw = prefillFrom.rw ?? ''
    form.village = prefillFrom.village ?? ''
    form.district = prefillFrom.district ?? ''
    form.city = prefillFrom.city
    form.province = prefillFrom.province
    form.postalCode = prefillFrom.postal_code ?? ''
    // NIK asli tidak pernah dikirim ke FE (cuma nik_masked) -> user wajib input ulang NIK
    // Foto juga wajib diunggah ulang
  }

  showForm.value = true
}

async function validatePhoto(field: 'ktpPhoto' | 'selfieKtpPhoto' | 'selfieNotePhoto') {
  const file = form[field]
  delete formErrors[field]
  if (!file) return
  try {
    await validateImage(file)
  } catch (err: any) {
    form[field] = null
    formErrors[field] = typeof err === 'string' ? err : 'File tidak valid'
  }
}

function validateForm(): boolean {
  Object.keys(formErrors).forEach(k => delete formErrors[k])

  if (!/^\d{16}$/.test(form.nik)) formErrors.nik = 'NIK harus 16 digit angka'
  if (!form.fullNameKtp.trim()) formErrors.fullNameKtp = 'Nama lengkap wajib diisi'
  if (!form.placeOfBirth.trim()) formErrors.placeOfBirth = 'Tempat lahir wajib diisi'
  if (!form.dateOfBirth) formErrors.dateOfBirth = 'Tanggal lahir wajib diisi'
  if (!form.gender) formErrors.gender = 'Jenis kelamin wajib dipilih'
  if (!form.ktpAddress.trim()) formErrors.ktpAddress = 'Alamat KTP wajib diisi'
  if (!form.city.trim()) formErrors.city = 'Kota/Kabupaten wajib diisi'
  if (!form.province.trim()) formErrors.province = 'Provinsi wajib diisi'
  if (!form.ktpPhoto) formErrors.ktpPhoto = 'Foto KTP wajib diunggah'
  if (!form.selfieKtpPhoto) formErrors.selfieKtpPhoto = 'Selfie pegang KTP wajib diunggah'
  if (!form.selfieNotePhoto) formErrors.selfieNotePhoto = 'Selfie pegang kertas wajib diunggah'

  return Object.keys(formErrors).length === 0
}

async function handleSubmit() {
  submitError.value = null

  if (!validateForm()) return

  try {
    submitting.value = true
    await submitVerification(form as VerificationSubmitForm)
    toast.add({
      title: 'Pengajuan Terkirim',
      description: 'Pengajuan verifikasi Anda sedang menunggu review admin.',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    showForm.value = false
    await refresh()
  } catch (err: any) {
    submitError.value = err.statusMessage || 'Gagal mengirim pengajuan verifikasi.'
  } finally {
    submitting.value = false
  }
}
</script>
