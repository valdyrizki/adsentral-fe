<template>
  <UModal v-model:open="isOpen" title="Broadcast Notifikasi" :ui="{ body: 'space-y-4' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">

        <!-- Target Role -->
        <UFormField label="Target Role" required :error="formErrors.targetRoles">
          <div class="flex gap-2 flex-wrap mt-1">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              type="button"
              :class="[
                'flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                form.targetRoles.includes(role.value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              ]"
              @click="toggleRole(role.value)"
            >
              <UIcon :name="role.icon" class="text-base" />
              {{ role.label }}
              <UIcon
                v-if="form.targetRoles.includes(role.value)"
                name="i-heroicons-check-circle-solid"
                class="text-primary text-base"
              />
            </button>
          </div>
          <p v-if="form.targetRoles.length" class="text-xs text-gray-400 mt-1.5">
            Akan dikirim ke: {{ form.targetRoles.join(', ') }}
          </p>
        </UFormField>

        <!-- Tipe Notifikasi -->
        <UFormField label="Tipe Notifikasi" required :error="formErrors.notificationType">
          <USelect
            v-model="form.notificationType"
            :items="notificationTypeOptions"
            value-key="value"
            placeholder="Pilih tipe..."
            class="w-full"
          />
        </UFormField>

        <!-- Judul -->
        <UFormField label="Judul" required :error="formErrors.title">
          <UInput
            v-model="form.title"
            placeholder="Judul broadcast..."
            class="w-full"
          />
        </UFormField>

        <!-- Pesan -->
        <UFormField label="Pesan" required :error="formErrors.message">
          <UTextarea
            v-model="form.message"
            placeholder="Isi pesan broadcast..."
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <!-- Preview Info -->
        <UAlert
          v-if="form.targetRoles.length"
          icon="i-heroicons-megaphone"
          color="warning"
          variant="soft"
          :title="`Broadcast ke ${form.targetRoles.length} role`"
          :description="`Notifikasi akan dikirim ke semua user dengan role: ${form.targetRoles.join(', ')}`"
        />

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton type="button" variant="outline" color="neutral" @click="isOpen = false">Batal</UButton>
          <UButton type="submit" color="warning" :loading="submitting" icon="i-heroicons-megaphone">
            Kirim Broadcast
          </UButton>
        </div>

      </form>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { useNotificationApi } from '~/composables/api/notification'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': []
}>()

const toast = useToast()
const { broadcastNotification } = useNotificationApi()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const roleOptions = [
  { label: 'Buyer', value: 'BUYER', icon: 'i-heroicons-user' },
  { label: 'Seller', value: 'SELLER', icon: 'i-heroicons-building-storefront' },
  { label: 'Admin', value: 'ADMIN', icon: 'i-heroicons-shield-check' },
]

const notificationTypeOptions = [
  { label: 'Informasi Sistem', value: 'SYSTEM_INFO' },
  { label: 'Update Order', value: 'ORDER_UPDATE' },
  { label: 'Informasi Pembayaran', value: 'PAYMENT_INFO' },
  { label: 'Pemberitahuan Penalty', value: 'PENALTY_NOTICE' },
  { label: 'Promosi', value: 'PROMOTION' },
]

const submitting = ref(false)

const form = reactive({
  targetRoles: [] as string[],
  notificationType: '',
  title: '',
  message: '',
})

const formErrors = reactive<Partial<Record<'targetRoles' | 'notificationType' | 'title' | 'message', string>>>({})

watch(isOpen, (opened) => {
  if (opened) resetForm()
})

function resetForm() {
  form.targetRoles = []
  form.notificationType = ''
  form.title = ''
  form.message = ''
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof typeof formErrors])
}

function toggleRole(role: string) {
  const idx = form.targetRoles.indexOf(role)
  if (idx === -1) form.targetRoles.push(role)
  else form.targetRoles.splice(idx, 1)
}

function validate(): boolean {
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof typeof formErrors])
  if (!form.targetRoles.length) formErrors.targetRoles = 'Pilih minimal satu role'
  if (!form.notificationType) formErrors.notificationType = 'Tipe notifikasi harus dipilih'
  if (!form.title.trim()) formErrors.title = 'Judul tidak boleh kosong'
  if (!form.message.trim()) formErrors.message = 'Pesan tidak boleh kosong'
  return Object.keys(formErrors).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await broadcastNotification({
      title: form.title.trim(),
      message: form.message.trim(),
      notification_type: form.notificationType || undefined,
      target_roles: [...form.targetRoles],
    })
    toast.add({
      title: 'Broadcast terkirim',
      description: `Notifikasi berhasil di-broadcast ke role: ${form.targetRoles.join(', ')}.`,
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })
    isOpen.value = false
    emit('submitted')
  } catch (err: any) {
    toast.add({ title: 'Gagal mengirim broadcast', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
