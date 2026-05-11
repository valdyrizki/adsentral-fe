<template>
  <UModal v-model:open="isOpen" title="Kenakan Penalty" :ui="{ body: 'space-y-4' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">

        <!-- Cari User -->
        <UFormField label="Cari User (username / email)" required :error="formErrors.user_id">
          <UInputMenu
            v-model="selectedUser"
            v-model:search-term="userSearch"
            :items="userItems"
            :filter="false"
            :loading="searchingUsers"
            placeholder="Ketik username atau email..."
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
        </UFormField>

        <!-- Pilih Rule -->
        <UFormField label="Penalty Rule" required :error="formErrors.rule_id">
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <button
              v-for="rule in penaltyRules"
              :key="rule.id"
              type="button"
              :class="[
                'w-full flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors text-left',
                form.rule_id === rule.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
                !rule.is_active ? 'opacity-50 cursor-not-allowed' : '',
              ]"
              :disabled="!rule.is_active"
              @click="form.rule_id = rule.id"
            >
              <div
                :class="rule.target_role === 'SELLER' ? 'bg-orange-100' : 'bg-sky-100'"
                class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  :name="rule.target_role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                  :class="rule.target_role === 'SELLER' ? 'text-orange-500' : 'text-sky-500'"
                  class="text-sm"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ rule.name }}</p>
                <p class="text-xs text-gray-400">{{ rule.id }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <UBadge color="error" variant="subtle" size="xs">{{ rule.points }} poin</UBadge>
                <UBadge color="neutral" variant="subtle" size="xs">{{ rule.expired_days }} hari</UBadge>
              </div>
            </button>
            <div v-if="!penaltyRules.length" class="py-4 text-center text-sm text-gray-400">
              Tidak ada rule aktif.
            </div>
          </div>
        </UFormField>

        <!-- Expired Days -->
        <UFormField label="Masa Berlaku (hari)" required :error="formErrors.expired_days">
          <UInputNumber
            v-model="form.expired_days"
            :min="1"
            orientation="vertical"
            class="w-full"
          />
          <template #hint>
            <span class="text-xs text-gray-400">Terisi otomatis dari rule, admin dapat mengubahnya</span>
          </template>
        </UFormField>

        <!-- Catatan -->
        <UFormField label="Catatan Admin">
          <UTextarea
            v-model="form.notes"
            placeholder="Alasan / catatan pengenaan penalty (opsional)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton type="button" variant="outline" color="neutral" @click="isOpen = false">Batal</UButton>
          <UButton type="submit" color="error" :loading="submitting" icon="i-heroicons-shield-exclamation">
            Kenakan Penalty
          </UButton>
        </div>

      </form>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { PenaltyRuleResponse } from '~/types/penalty/PenaltyRuleResponse'
import type { PenaltyApplyRequest } from '~/types/penalty/PenaltyApplyRequest'
import type { UserResponse } from '~/types/UserResponse'
import { usePenaltyApi } from '~/composables/api/penalty'

const props = defineProps<{
  modelValue: boolean
  penaltyRules: PenaltyRuleResponse[]
  initialUser?: UserResponse | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': []
}>()

const toast = useToast()
const { searchUsers, applyPenalty } = usePenaltyApi()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const submitting = ref(false)

type UserMenuItem = UserResponse & { label: string }
const userSearch = ref('')
const userResults = ref<UserResponse[]>([])
const selectedUser = ref<UserMenuItem | null>(null)
const searchingUsers = ref(false)
let userSearchTimeout: ReturnType<typeof setTimeout> | null = null

const form = reactive<PenaltyApplyRequest>({
  user_id: 0,
  rule_id: '',
  expired_days: null,
  notes: '',
})
const formErrors = reactive<Partial<Record<keyof PenaltyApplyRequest, string>>>({})

const userItems = computed<UserMenuItem[]>(() =>
  userResults.value.map(u => ({
    ...u,
    label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
  }))
)

watch(selectedUser, (u) => {
  form.user_id = u ? u.id : 0
})

watch(() => form.rule_id, (ruleId) => {
  const rule = props.penaltyRules.find(r => r.id === ruleId)
  form.expired_days = rule ? rule.expired_days : null
})

watch(isOpen, (opened) => {
  if (opened) {
    resetForm()
    if (props.initialUser) prefillUser(props.initialUser)
  }
})

watch(() => props.initialUser, (u) => {
  if (u && isOpen.value) prefillUser(u)
})

function prefillUser(u: UserResponse) {
  selectedUser.value = { ...u, label: u.full_name ? `${u.full_name} (${u.email})` : u.email }
  form.user_id = u.id
  userResults.value = [u]
}

function resetForm() {
  selectedUser.value = null
  userSearch.value = ''
  userResults.value = []
  form.user_id = 0
  form.rule_id = ''
  form.expired_days = null
  form.notes = ''
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof PenaltyApplyRequest])
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
  Object.keys(formErrors).forEach(k => delete formErrors[k as keyof PenaltyApplyRequest])
  if (!form.user_id) formErrors.user_id = 'User harus dipilih'
  if (!form.rule_id) formErrors.rule_id = 'Penalty rule harus dipilih'
  if (!form.expired_days || form.expired_days < 1) formErrors.expired_days = 'Masa berlaku minimal 1 hari'
  return Object.keys(formErrors).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await applyPenalty({ ...form })
    toast.add({
      title: 'Penalty berhasil dikenakan',
      description: `${selectedUser.value?.full_name ?? selectedUser.value?.username ?? selectedUser.value?.email} telah dikenakan penalty.`,
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })
    isOpen.value = false
    emit('submitted')
  } catch (err: any) {
    toast.add({ title: 'Gagal menerapkan penalty', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
