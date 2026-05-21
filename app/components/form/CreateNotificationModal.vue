<template>
  <UModal v-model:open="isOpen" title="Buat Notifikasi" :ui="{ body: 'space-y-4' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">

        <!-- Cari & Pilih User -->
        <UFormField label="Tujuan User (bisa lebih dari satu)" required :error="formErrors.user_ids">
          <UInputMenu
            v-model="pickedUser"
            v-model:search-term="userSearch"
            :items="availableUserItems"
            :filter="false"
            :loading="searchingUsers"
            placeholder="Cari username atau email..."
            icon="i-heroicons-magnifying-glass"
            class="w-full"
            @update:search-term="onUserSearchInput"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-2 py-0.5">
                <div
                  :class="item.role === 'SELLER' ? 'bg-orange-100' : 'bg-sky-100'"
                  class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <UIcon
                    :name="item.role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                    :class="item.role === 'SELLER' ? 'text-orange-500' : 'text-sky-500'"
                    class="text-xs"
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ item.full_name ?? item.username }}</p>
                  <p class="text-xs text-gray-400">{{ item.email }} · {{ item.role }}</p>
                </div>
              </div>
            </template>
          </UInputMenu>

          <!-- Chip user yang sudah dipilih -->
          <div v-if="selectedUsers.length" class="flex flex-wrap gap-1.5 mt-2">
            <div
              v-for="u in selectedUsers"
              :key="u.id"
              class="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-1 text-xs text-sky-700"
            >
              <UIcon
                :name="u.role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                class="text-sky-500 flex-shrink-0"
              />
              <span class="font-medium truncate max-w-32">{{ u.full_name ?? u.username }}</span>
              <button type="button" class="text-sky-400 hover:text-red-500 transition-colors ml-0.5" @click="removeUser(u.id)">
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
          </div>
        </UFormField>

        <!-- Tipe -->
        <UFormField label="Tipe Notifikasi" required :error="formErrors.type">
          <USelect
            v-model="form.type"
            :items="typeOptions"
            value-key="value"
            placeholder="Pilih tipe..."
            class="w-full"
          />
        </UFormField>

        <!-- Judul -->
        <UFormField label="Judul" required :error="formErrors.title">
          <UInput
            v-model="form.title"
            placeholder="Judul notifikasi..."
            class="w-full"
          />
        </UFormField>

        <!-- Pesan -->
        <UFormField label="Pesan" required :error="formErrors.message">
          <UTextarea
            v-model="form.message"
            placeholder="Isi pesan notifikasi..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Action URL -->
        <UFormField label="URL Tindakan (opsional)">
          <UInput
            v-model="form.action_url"
            placeholder="Contoh: /transaction atau /product/123"
            icon="i-heroicons-link"
            class="w-full"
          />
          <template #hint>
            <span class="text-xs text-gray-400">Jika diisi, user akan diarahkan ke URL ini saat klik notifikasi</span>
          </template>
        </UFormField>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton type="button" variant="outline" color="neutral" @click="isOpen = false">Batal</UButton>
          <UButton type="submit" color="primary" :loading="submitting" icon="i-heroicons-bell">
            Kirim ke {{ selectedUsers.length || 0 }} User
          </UButton>
        </div>

      </form>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { UserResponse } from '~/types/UserResponse'
import { usePenaltyApi } from '~/composables/api/penalty'
import { useNotificationApi } from '~/composables/api/notification'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': []
}>()

const toast = useToast()
const { searchUsers } = usePenaltyApi()
const { createNotification } = useNotificationApi()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const typeOptions = [
  { label: 'Informasi', value: 'INFO' },
  { label: 'Peringatan', value: 'WARNING' },
  { label: 'Darurat', value: 'URGENT' },
  { label: 'Informasi Sistem', value: 'SYSTEM_INFO' },
  { label: 'Promosi', value: 'PROMOTION' },
]

const submitting = ref(false)

type UserMenuItem = UserResponse & { label: string }

const userSearch = ref('')
const userResults = ref<UserResponse[]>([])
const selectedUsers = ref<UserResponse[]>([])
const pickedUser = ref<UserMenuItem | null>(null)
const searchingUsers = ref(false)
let userSearchTimeout: ReturnType<typeof setTimeout> | null = null

const form = reactive({
  type: '',
  title: '',
  message: '',
  action_url: '',
})

const formErrors = reactive<Partial<Record<'user_ids' | 'type' | 'title' | 'message', string>>>({})

const selectedUserIds = computed(() => new Set(selectedUsers.value.map(u => u.id)))

const availableUserItems = computed<UserMenuItem[]>(() =>
  userResults.value
    .filter(u => !selectedUserIds.value.has(u.id))
    .map(u => ({
      ...u,
      label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
    }))
)

watch(pickedUser, (u) => {
  if (!u) return
  if (!selectedUserIds.value.has(u.id)) {
    selectedUsers.value.push(u)
  }
  nextTick(() => {
    pickedUser.value = null
    userSearch.value = ''
  })
})

watch(isOpen, (opened) => {
  if (opened) resetForm()
})

function resetForm() {
  userSearch.value = ''
  userResults.value = []
  selectedUsers.value = []
  pickedUser.value = null
  form.type = ''
  form.title = ''
  form.message = ''
  form.action_url = ''
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof typeof formErrors])
}

function removeUser(id: number) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== id)
}

function onUserSearchInput(val: string) {
  if (userSearchTimeout) clearTimeout(userSearchTimeout)
  if (!val?.trim()) { userResults.value = []; return }
  userSearchTimeout = setTimeout(async () => {
    searchingUsers.value = true
    try {
      userResults.value = await searchUsers(val.trim())
    } finally {
      searchingUsers.value = false
    }
  }, 400)
}

function validate(): boolean {
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof typeof formErrors])
  if (!selectedUsers.value.length) formErrors.user_ids = 'Pilih minimal satu user tujuan'
  if (!form.type) formErrors.type = 'Tipe notifikasi harus dipilih'
  if (!form.title.trim()) formErrors.title = 'Judul tidak boleh kosong'
  if (!form.message.trim()) formErrors.message = 'Pesan tidak boleh kosong'
  return Object.keys(formErrors).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await createNotification({
      user_ids: selectedUsers.value.map(u => u.id),
      notification_type: form.type,
      title: form.title.trim(),
      message: form.message.trim(),
      action_url: form.action_url.trim() || null,
    })
    const names = selectedUsers.value
      .map(u => u.full_name ?? u.username)
      .join(', ')
    toast.add({
      title: 'Notifikasi terkirim',
      description: `Notifikasi berhasil dikirim ke ${names}.`,
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })
    isOpen.value = false
    emit('submitted')
  } catch (err: any) {
    toast.add({ title: 'Gagal mengirim notifikasi', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
