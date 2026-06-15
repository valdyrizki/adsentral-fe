<template>
  <div class="space-y-6">
    <ClientOnly>
      <template #fallback>
        <UCard class="rounded-2xl shadow-lg"><AppLoadingSkeleton /></UCard>
      </template>
    <UCard class="rounded-2xl shadow-lg">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 class="text-lg font-semibold">System Setting</h2>
            <p class="text-sm text-gray-500">
              Daftar konfigurasi sistem yang aktif di aplikasi.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              @click="openCreateModal"
            >
              Create
            </UButton>
            <UButton
              icon="i-lucide-refresh-ccw"
              variant="outline"
              color="neutral"
              @click="handleRefresh"
              :loading="systemSettingLoading"
            >
              Reload
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="systemSettingLoading">
        <AppLoadingSkeleton />
      </div>

      <div v-else-if="!systemSettings.length">
        <UAlert
          title="Belum ada system setting"
          description="Belum ada data konfigurasi sistem yang tersimpan."
          icon="icon-park-solid:error"
          color="neutral"
        />
      </div>

      <div v-else class="space-y-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Public
                </th>
                
                <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Diubah
                </th>
                <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-32">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="systemSetting in systemSettings"
                :key="systemSetting.id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-2 font-mono text-xs text-gray-900">
                  {{ systemSetting.key }}
                </td>
                <td class="px-4 py-2 max-w-xs">
                  <p class="text-xs text-gray-900 truncate">
                    {{ systemSetting.value }}
                  </p>
                </td>
                <td class="px-4 py-2 max-w-xs">
                  <p class="text-xs text-gray-900 truncate">
                    {{ systemSetting.group || '-' }}
                  </p>
                </td>
                <td class="px-4 py-2 max-w-sm">
                  <p class="text-xs text-gray-600 line-clamp-2">
                    {{ systemSetting.description || '-' }}
                  </p>
                </td>
                <td class="px-4 py-2">
                  <UBadge
                    :color="systemSetting.is_public ? 'success' : 'neutral'"
                    size="xs"
                  >
                    {{ systemSetting.is_public ? 'Public' : 'Private' }}
                  </UBadge>
                </td>
                <td class="px-4 py-2 text-right text-xs text-gray-500">
                  {{ formatDate(systemSetting.updated_at || systemSetting.created_at) }}
                </td>
                <td class="px-4 py-2 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <UButton
                      icon="i-lucide-pencil"
                      size="xs"
                      color="primary"
                      variant="ghost"
                      :loading="submittingId === systemSetting.id"
                      @click="openEditModal(systemSetting)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      color="error"
                      variant="ghost"
                      :loading="deletingId === systemSetting.id"
                      @click="handleDelete(systemSetting)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </UCard>
    </ClientOnly>

    <!-- Modal Create / Edit -->
    <FormSystemSettingModal
      v-model="isFormModalOpen"
      :editing-id="editingId"
      :initial-form="modalInitialForm"
      :submitting="formSubmitting"
      @submit="handleSubmitFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import AppLoadingSkeleton from '~/components/app/LoadingSkeleton.vue'
import { useSystemSettingApi } from '~/composables/api/system-setting'
import type { SystemSettingRequest } from '~/types/system-setting/SystemSettingRequest'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'

definePageMeta({
  layout: 'admin',
  label: 'System Setting',
})

const toast = useToast()

//fetch api
const {
  systemSettings,
  fetchAllSystemSetting,
  systemSettingLoading,
  createSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
} = useSystemSettingApi()


useAsyncData('system-settings-data', () => fetchAllSystemSetting(), { server: false })

const isFormModalOpen = ref(false)
const editingId = ref<string | null>(null)
const formSubmitting = ref(false)
const submittingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const modalInitialForm = ref<SystemSettingRequest | null>(null)

function openCreateModal() {
  editingId.value = null
  modalInitialForm.value = {
    key: '',
    value: '',
    description: '',
    group:'',
    is_public: true,
  }
  isFormModalOpen.value = true
}

function openEditModal(setting: SystemSettingResponse) {
  editingId.value = setting.id
  modalInitialForm.value = {
    key: setting.key,
    value: setting.value,
    description: setting.description ?? '',
    group: setting.group ?? '',
    is_public: setting.is_public ?? false,
  }
  isFormModalOpen.value = true
}

async function handleSubmitFromModal(form: SystemSettingRequest) {
  if (!form.key?.trim() || !form.value?.trim()) {
    toast.add({
      title: 'Validasi gagal',
      description: 'Key dan Value wajib diisi.',
      color: 'error',
    })
    return
  }
  formSubmitting.value = true
  try {
    const payload: SystemSettingRequest = {
      key: form.key.trim(),
      value: form.value.trim(),
      description: form.description?.trim() ?? '',
      group: form.group?.trim() ?? 'general',
      is_public: form.is_public ?? false,
    }

    console.log(payload);
    
    if (editingId.value) {
      submittingId.value = editingId.value
      await updateSystemSetting(editingId.value, payload)
      toast.add({
        title: 'Berhasil',
        description: 'System setting berhasil diupdate.',
        color: 'success',
      })
    } else {
      await createSystemSetting(payload)
      toast.add({
        title: 'Berhasil',
        description: 'System setting berhasil ditambahkan.',
        color: 'success',
      })
    }
    isFormModalOpen.value = false
    await fetchAllSystemSetting()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err?.message ?? 'Terjadi kesalahan.',
      color: 'error',
    })
  } finally {
    formSubmitting.value = false
    submittingId.value = null
  }
}

async function handleDelete(setting: SystemSettingResponse) {
  const ok = confirm(`Hapus setting "${setting.key}"?`)
  if (!ok) return
  deletingId.value = setting.id
  try {
    await deleteSystemSetting(setting.id)
    toast.add({
      title: 'Berhasil',
      description: 'System setting berhasil dihapus.',
      color: 'success',
    })
    await fetchAllSystemSetting()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err?.message ?? 'Gagal menghapus system setting.',
      color: 'error',
    })
  } finally {
    deletingId.value = null
  }
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('id-ID')
  } catch {
    return value
  }
}

async function handleRefresh() {
  await fetchAllSystemSetting()
}
</script>