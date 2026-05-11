<template>
  <UModal v-model:open="open" title="Edit Penalty Rule" :ui="{ body: 'space-y-4' }">
    <template #body>
      <div v-if="rule" class="space-y-1 p-3 bg-gray-50 rounded-xl mb-2">
        <p class="text-sm font-semibold text-gray-800">{{ rule.name }}</p>
        <p class="text-xs text-gray-400 font-mono">{{ rule.id }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmitForm">

        <!-- Description -->
        <UFormField label="Deskripsi">
          <UTextarea
            v-model="localForm.description"
            placeholder="Deskripsi rule (opsional)"
            :rows="3"
            class="w-full"
          />
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
        <UFormField label="Status">
          <UCheckbox v-model="localForm.is_active" label="Rule ini aktif" />
        </UFormField>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton type="button" variant="outline" color="neutral" @click="close">Batal</UButton>
          <UButton type="submit" color="primary" :loading="submitting" icon="i-heroicons-pencil-square">
            Simpan Perubahan
          </UButton>
        </div>

      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PenaltyRuleResponse } from '~/types/penalty/PenaltyRuleResponse'
import type { PenaltyRuleUpdateRequest } from '~/types/penalty/PenaltyRuleUpdateRequest'

const props = defineProps<{
  modelValue: boolean
  rule: PenaltyRuleResponse | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: PenaltyRuleUpdateRequest): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const localForm = reactive<PenaltyRuleUpdateRequest>({
  description: '',
  points: null,
  expired_days: null,
  is_active: true,
})
const errors = reactive<Partial<Record<keyof PenaltyRuleUpdateRequest, string>>>({})

watch(
  () => props.rule,
  (rule) => {
    if (rule) {
      localForm.description = rule.description
      localForm.points = rule.points
      localForm.expired_days = rule.expired_days
      localForm.is_active = rule.is_active
      Object.keys(errors).forEach((k) => delete errors[k as keyof PenaltyRuleUpdateRequest])
    }
  },
  { immediate: true },
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k as keyof PenaltyRuleUpdateRequest])
  if (!localForm.points || localForm.points < 1) errors.points = 'Poin minimal 1'
  if (!localForm.expired_days || localForm.expired_days < 1) errors.expired_days = 'Masa berlaku minimal 1 hari'
  return Object.keys(errors).length === 0
}

const close = () => emit('update:modelValue', false)

const handleSubmitForm = () => {
  if (!validate()) return
  emit('submit', {
    description: localForm.description,
    points: localForm.points,
    expired_days: localForm.expired_days,
    is_active: localForm.is_active,
  })
}
</script>
