<template>
  <div class="space-y-6">

    <UButton to="/admin/verification" icon="mdi:arrow-left" color="neutral" variant="ghost" size="sm">
      Kembali ke Daftar
    </UButton>

    <AppLoadingSkeleton v-if="pending" />

    <UAlert
      v-else-if="error"
      title="Terjadi Kesalahan"
      :description="error.message || 'Gagal memuat detail verifikasi'"
      icon="mdi:alert-circle:error"
      color="error"
    />

    <template v-else-if="detail">

      <!-- Status Banner -->
      <div
        class="rounded-2xl p-5 flex items-center gap-4"
        :class="{
          'bg-amber-50 border border-amber-200': detail.status === 'PENDING',
          'bg-green-50 border border-green-200': detail.status === 'APPROVED',
          'bg-red-50 border border-red-200': detail.status === 'REJECTED',
        }"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="{
            'bg-amber-100': detail.status === 'PENDING',
            'bg-green-100': detail.status === 'APPROVED',
            'bg-red-100': detail.status === 'REJECTED',
          }"
        >
          <UIcon
            :name="detail.status === 'APPROVED' ? 'mdi:check-circle' : detail.status === 'REJECTED' ? 'mdi:close-circle' : 'mdi:clock-outline'"
            class="text-2xl"
            :class="{
              'text-amber-500': detail.status === 'PENDING',
              'text-green-500': detail.status === 'APPROVED',
              'text-red-500': detail.status === 'REJECTED',
            }"
          />
        </div>
        <div>
          <p class="font-semibold text-gray-800">{{ statusLabel(detail.status) }}</p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ detail.user_email }} — diajukan {{ dayjs(detail.created_at).format('DD MMM YYYY, HH:mm') }}
          </p>
        </div>
        <UBadge
          :color="detail.status === 'APPROVED' ? 'success' : detail.status === 'REJECTED' ? 'error' : 'warning'"
          variant="soft"
          class="ml-auto"
        >
          {{ statusLabel(detail.status) }}
        </UBadge>
      </div>

      <!-- Info Proses (jika sudah direview) -->
      <UAlert
        v-if="detail.status === 'REJECTED' && detail.rejection_reason"
        title="Alasan Penolakan"
        :description="detail.rejection_reason"
        color="error"
        icon="mdi:close-circle"
        variant="subtle"
      />
      <UAlert
        v-if="detail.reviewed_by"
        :description="`Direview oleh ${detail.reviewed_by} pada ${detail.reviewed_at ? dayjs(detail.reviewed_at).format('DD MMM YYYY, HH:mm') : '-'}`"
        color="neutral"
        icon="mdi:account-check-outline"
        variant="subtle"
      />

      <!-- Data Pengajuan -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:card-account-details-outline" class="text-primary" /> Data Sesuai KTP
            </p>
            <UButton
              v-if="detail.status === 'APPROVED' && detail.user_id"
              icon="mdi:pencil"
              size="xs"
              color="primary"
              variant="soft"
              @click="openEdit"
            >
              Edit Data
            </UButton>
          </div>
        </template>
        <VerificationDataView :data="detail" />
        <VerificationPhotoGrid :data="detail" @stale="refresh" />
      </UCard>

      <!-- Rekening Bank (referensi) -->
      <UCard v-if="detail.bank_account" class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:bank" class="text-primary" /> Rekening Bank (Referensi)
            </p>
            <NameCheckBadge :status="detail.bank_account_name_check_status" />
          </div>
        </template>
        <p class="text-xs text-gray-400 mb-3">Data rekening ini hanya sebagai referensi admin, bukan validasi otomatis.</p>

        <UAlert
          v-if="detail.bank_account_name_check_status === 'MISMATCH'"
          class="mb-3"
          title="Nama rekening tidak cocok dengan nama KTP"
          description="Nama pemilik rekening berbeda dengan nama pada pengajuan KTP ini. Ini hanya informasi — tetap bisa disetujui/ditolak seperti biasa, mohon periksa lebih teliti."
          color="warning"
          icon="mdi:alert-outline"
          variant="subtle"
        />

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Nama Bank</p>
            <p class="font-semibold text-gray-800">{{ detail.bank_account.bank_name }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Nomor Rekening</p>
            <p class="font-semibold text-gray-800 tracking-widest">{{ detail.bank_account.account_number }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Atas Nama</p>
            <p class="font-semibold text-gray-800">{{ detail.bank_account.account_holder_name }}</p>
          </div>
        </div>
      </UCard>

      <!-- Action (hanya PENDING) -->
      <div v-if="detail.status === 'PENDING'" class="flex gap-3 justify-end">
        <UButton color="error" variant="soft" icon="mdi:close-circle" @click="openReject">
          Tolak
        </UButton>
        <UButton color="success" icon="mdi:check-circle" @click="openApprove">
          Setujui &amp; Verifikasi
        </UButton>
      </div>

    </template>

    <!-- Modal Approve -->
    <UModal v-model:open="isApproveOpen" title="Setujui Verifikasi Akun">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="actionError"
            :description="actionError"
            color="error"
            icon="material-symbols:error-outline"
          />
          <UAlert
            title="Pastikan data & foto sudah diperiksa dengan teliti"
            description="Setelah disetujui, status akun akan otomatis menjadi VERIFIED dan data ini menjadi data final."
            color="warning"
            icon="mdi:information-outline"
          />
          <div class="flex justify-end gap-2 pt-1">
            <UButton color="neutral" variant="outline" @click="isApproveOpen = false">Batal</UButton>
            <UButton color="success" icon="mdi:check-circle" :loading="actionLoading" @click="handleApprove">
              Setujui &amp; Verifikasi
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Reject -->
    <UModal v-model:open="isRejectOpen" title="Tolak Pengajuan Verifikasi">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="actionError"
            :description="actionError"
            color="error"
            icon="material-symbols:error-outline"
          />
          <UFormField label="Alasan Penolakan" required>
            <UTextarea
              v-model="rejectReason"
              placeholder="Contoh: Foto KTP buram, mohon upload ulang dengan pencahayaan yang lebih baik"
              :rows="3"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-1">
            <UButton color="neutral" variant="outline" @click="isRejectOpen = false">Batal</UButton>
            <UButton color="error" icon="mdi:close-circle" :loading="actionLoading" @click="handleReject">
              Tolak Pengajuan
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Edit (setelah VERIFIED) -->
    <UModal v-model:open="isEditOpen" title="Edit Data Verifikasi">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="actionError"
            :description="actionError"
            color="error"
            icon="material-symbols:error-outline"
          />
          <UAlert
            description="Hanya field yang diubah yang akan dikirim. Perubahan ini tidak memerlukan submit ulang foto oleh user."
            color="neutral"
            icon="mdi:information-outline"
            variant="subtle"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <UFormField label="NIK Baru (opsional)">
              <UInput v-model="editForm.nik" placeholder="Kosongkan jika tidak berubah" :maxlength="16" inputmode="numeric" class="w-full" />
            </UFormField>
            <UFormField label="Nama Lengkap">
              <UInput v-model="editForm.full_name_ktp" class="w-full" />
            </UFormField>
            <UFormField label="Tempat Lahir">
              <UInput v-model="editForm.place_of_birth" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal Lahir">
              <UInput v-model="editForm.date_of_birth" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Jenis Kelamin">
              <USelect v-model="editForm.gender" :items="genderOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Agama">
              <UInput v-model="editForm.religion" class="w-full" />
            </UFormField>
            <UFormField label="Status Perkawinan">
              <UInput v-model="editForm.marital_status" class="w-full" />
            </UFormField>
            <UFormField label="Pekerjaan">
              <UInput v-model="editForm.occupation" class="w-full" />
            </UFormField>
            <UFormField label="Kewarganegaraan">
              <UInput v-model="editForm.nationality" class="w-full" />
            </UFormField>
            <UFormField label="Kota/Kabupaten">
              <UInput v-model="editForm.city" class="w-full" />
            </UFormField>
            <UFormField label="Provinsi">
              <UInput v-model="editForm.province" class="w-full" />
            </UFormField>
            <UFormField label="Kode Pos">
              <UInput v-model="editForm.postal_code" class="w-full" />
            </UFormField>
            <UFormField label="Alamat KTP" class="sm:col-span-2">
              <UTextarea v-model="editForm.ktp_address" :rows="2" class="w-full" />
            </UFormField>
            <UFormField label="RT">
              <UInput v-model="editForm.rt" class="w-full" />
            </UFormField>
            <UFormField label="RW">
              <UInput v-model="editForm.rw" class="w-full" />
            </UFormField>
            <UFormField label="Kelurahan/Desa">
              <UInput v-model="editForm.village" class="w-full" />
            </UFormField>
            <UFormField label="Kecamatan">
              <UInput v-model="editForm.district" class="w-full" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <UButton color="neutral" variant="outline" @click="isEditOpen = false">Batal</UButton>
            <UButton color="primary" icon="mdi:content-save" :loading="actionLoading" @click="handleEdit">
              Simpan Perubahan
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import NameCheckBadge from '~/components/bank-account/NameCheckBadge.vue'
import VerificationDataView from '~/components/verification/VerificationDataView.vue'
import VerificationPhotoGrid from '~/components/verification/VerificationPhotoGrid.vue'
import { useVerificationApi } from '~/composables/api/verification'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { VerificationEditRequest } from '~/types/verification/VerificationEditRequest'

definePageMeta({ layout: 'admin', label: 'Review Verifikasi Akun' })

const route = useRoute()
const toast = useToast()
const { fetchAdminVerificationDetail, approveVerification, rejectVerification, editVerifiedUser } = useVerificationApi()

const id = route.params.id as string

const genderOptions = [
  { label: 'Laki-laki', value: 'MALE' },
  { label: 'Perempuan', value: 'FEMALE' },
]

const {
  data: detail,
  pending,
  error,
  refresh,
} = await useAsyncData<UserVerificationRequest>(
  `admin-verification-${id}`,
  () => fetchAdminVerificationDetail(id),
  { server: false },
)

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: 'Menunggu Review', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }
  return map[status] ?? status
}

// ===== APPROVE / REJECT =====
const isApproveOpen = ref(false)
const isRejectOpen = ref(false)
const rejectReason = ref('')
const actionLoading = ref(false)
const actionError = ref<string | null>(null)

function openApprove() {
  actionError.value = null
  isApproveOpen.value = true
}

function openReject() {
  rejectReason.value = ''
  actionError.value = null
  isRejectOpen.value = true
}

async function handleApprove() {
  if (!detail.value) return
  try {
    actionLoading.value = true
    actionError.value = null
    await approveVerification(detail.value.id)
    toast.add({
      title: 'Verifikasi Disetujui',
      description: 'Akun seller berhasil diverifikasi.',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    isApproveOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal menyetujui verifikasi.'
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  if (!detail.value) return
  if (!rejectReason.value.trim()) {
    actionError.value = 'Alasan penolakan harus diisi.'
    return
  }
  try {
    actionLoading.value = true
    actionError.value = null
    await rejectVerification(detail.value.id, rejectReason.value.trim())
    toast.add({
      title: 'Pengajuan Ditolak',
      description: 'Pengajuan verifikasi telah ditolak.',
      color: 'warning',
      icon: 'mdi:close-circle',
    })
    isRejectOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal menolak verifikasi.'
  } finally {
    actionLoading.value = false
  }
}

// ===== EDIT (setelah VERIFIED) =====
const isEditOpen = ref(false)
const editForm = reactive<VerificationEditRequest>({})

function openEdit() {
  if (!detail.value) return
  actionError.value = null
  Object.assign(editForm, {
    full_name_ktp: detail.value.full_name_ktp,
    place_of_birth: detail.value.place_of_birth,
    date_of_birth: detail.value.date_of_birth,
    gender: detail.value.gender,
    religion: detail.value.religion ?? '',
    marital_status: detail.value.marital_status ?? '',
    occupation: detail.value.occupation ?? '',
    nationality: detail.value.nationality ?? '',
    ktp_address: detail.value.ktp_address,
    rt: detail.value.rt ?? '',
    rw: detail.value.rw ?? '',
    village: detail.value.village ?? '',
    district: detail.value.district ?? '',
    city: detail.value.city,
    province: detail.value.province,
    postal_code: detail.value.postal_code ?? '',
    nik: '',
  })
  isEditOpen.value = true
}

async function handleEdit() {
  if (!detail.value?.user_id) return
  try {
    actionLoading.value = true
    actionError.value = null

    // Hanya kirim field yang terisi (nik kosong artinya tidak diubah)
    const payload: VerificationEditRequest = { ...editForm }
    if (!payload.nik) delete payload.nik

    await editVerifiedUser(detail.value.user_id, payload)
    toast.add({
      title: 'Berhasil',
      description: 'Data verifikasi berhasil diperbarui.',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    isEditOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal memperbarui data verifikasi.'
  } finally {
    actionLoading.value = false
  }
}
</script>
