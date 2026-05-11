<template>
  <UModal v-model:open="open" title="Tambah Penalty Rule" :ui="{ body: 'space-y-4' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmitForm">

        <!-- ID -->
        <UFormField label="Rule ID" required :error="errors.id">
          <UInput
            v-model="localForm.id"
            placeholder="cth: SELLER_LATE_DELIVERY"
            class="w-full font-mono uppercase"
            @input="localForm.id = (localForm.id as string).toUpperCase().replace(/\s+/g, '_')"
          />
          <template #hint>
            <span class="text-xs text-gray-400">Huruf kapital, pisahkan kata dengan underscore</span>
          </template>
        </UFormField>

        <!-- Name -->
        <UFormField label="Nama Rule" required :error="errors.name">
          <UInput
            v-model="localForm.name"
            placeholder="cth: Keterlambatan Pengiriman Seller"
            class="w-full"
          />
        </UFormField>

        <!-- Description -->
        <UFormField label="Deskripsi">
          <UTextarea
            v-model="localForm.description"
            placeholder="Deskripsi rule (opsional)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Target Role -->
        <UFormField label="Target Role" required :error="errors.target_role">
          <div class="flex gap-3">
            <button
              v-for="opt in roleOptions"
              :key="opt.value"
              type="button"
              :class="[
                'flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer transition-colors',
                localForm.target_role === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
              @click="localForm.target_role = opt.value"
            >
              <UIcon :name="opt.icon" :class="opt.iconColor" class="text-lg flex-shrink-0" />
              <span class="text-sm font-medium">{{ opt.label }}</span>
            </button>
          </div>
        </UFormField>

        <!-- Trigger Type -->
        <UFormField label="Trigger Type" required :error="errors.trigger_type">
          <div class="flex gap-3">
            <button
              v-for="opt in triggerOptions"
              :key="opt.value"
              type="button"
              :class="[
                'flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer transition-colors',
                localForm.trigger_type === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
              @click="localForm.trigger_type = opt.value"
            >
              <UIcon :name="opt.icon" :class="opt.iconColor" class="text-lg flex-shrink-0" />
              <div class="text-left">
                <p class="text-sm font-medium">{{ opt.label }}</p>
                <p class="text-xs text-gray-400">{{ opt.desc }}</p>
              </div>
            </button>
          </div>
        </UFormField>

        <!-- Points & Expired Days -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Poin Penalti" required :error="errors.points">
            <UInputNumber
              v-model="localForm.points"
              :min="1"
              orientation="vertical"
              placeholder="Jumlah poin"
              class="w-full"
            />
            <template #hint>
              <span class="text-xs text-gray-400">Minimal 1 poin</span>
            </template>
          </UFormField>

          <UFormField label="Masa Berlaku (hari)" required :error="errors.expired_days">
            <UInputNumber
              v-model="localForm.expired_days"
              :min="1"
              orientation="vertical"
              placeholder="Jumlah hari"
              class="w-full"
            />
            <template #hint>
              <span class="text-xs text-gray-400">Minimal 1 hari</span>
            </template>
          </UFormField>
        </div>

        <!-- Is Active -->
        <UFormField label="Status Awal">
          <UCheckbox v-model="localForm.is_active" label="Aktifkan rule ini langsung setelah dibuat" />
        </UFormField>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton type="button" variant="outline" color="neutral" @click="close">Batal</UButton>
          <UButton type="submit" color="primary" :loading="submitting" icon="i-heroicons-plus">
            Simpan Rule
          </UButton>
        </div>

      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PenaltyRuleRequest } from '~/types/penalty/PenaltyRuleRequest'

const props = defineProps<{
  modelValue: boolean
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: PenaltyRuleRequest): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const roleOptions = [
  { value: 'SELLER', label: 'Seller', icon: 'i-heroicons-building-storefront', iconColor: 'text-orange-500' },
  { value: 'BUYER', label: 'Buyer', icon: 'i-heroicons-user', iconColor: 'text-sky-500' },
]

const triggerOptions = [
  { value: 'AUTO', label: 'Otomatis', desc: 'Diterapkan oleh sistem', icon: 'i-heroicons-bolt', iconColor: 'text-purple-500' },
  { value: 'MANUAL', label: 'Manual', desc: 'Diterapkan oleh admin', icon: 'i-heroicons-hand-raised', iconColor: 'text-gray-500' },
]

const localForm = reactive<PenaltyRuleRequest>({
  id: '',
  name: '',
  description: '',
  target_role: '',
  points: null,
  expired_days: null,
  trigger_type: '',
  is_active: true,
})
const errors = reactive<Partial<Record<keyof PenaltyRuleRequest, string>>>({})

function resetForm() {
  localForm.id = ''
  localForm.name = ''
  localForm.description = ''
  localForm.target_role = ''
  localForm.points = null
  localForm.expired_days = null
  localForm.trigger_type = ''
  localForm.is_active = true
  Object.keys(errors).forEach((k) => delete errors[k as keyof PenaltyRuleRequest])
}

watch(
  () => props.modelValue,
  (val) => { if (val) resetForm() },
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k as keyof PenaltyRuleRequest])
  if (!localForm.id.trim()) errors.id = 'Rule ID wajib diisi'
  if (!localForm.name.trim()) errors.name = 'Nama rule wajib diisi'
  if (!localForm.target_role) errors.target_role = 'Target role wajib dipilih'
  if (!localForm.trigger_type) errors.trigger_type = 'Trigger type wajib dipilih'
  if (!localForm.points || localForm.points < 1) errors.points = 'Poin minimal 1'
  if (!localForm.expired_days || localForm.expired_days < 1) errors.expired_days = 'Masa berlaku minimal 1 hari'
  return Object.keys(errors).length === 0
}

const close = () => emit('update:modelValue', false)

const handleSubmitForm = () => {
  if (!validate()) return
  emit('submit', {
    id: localForm.id,
    name: localForm.name,
    description: localForm.description,
    target_role: localForm.target_role as PenaltyRuleRequest['target_role'],
    points: localForm.points,
    expired_days: localForm.expired_days,
    trigger_type: localForm.trigger_type as PenaltyRuleRequest['trigger_type'],
    is_active: localForm.is_active,
  })
}
</script>
