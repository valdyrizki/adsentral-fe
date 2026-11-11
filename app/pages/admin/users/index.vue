<template>
  <div class="space-y-6">

    <!-- Modal buka kunci login -->
    <UModal
      v-if="showUnlock"
      v-model:open="showUnlock"
      title="Buka Kunci Login"
      :description="unlockTarget ? `${unlockTarget.email} terkunci s/d ${formatDate(unlockTarget.locked_until)}` : ''"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-gray-600">
            Pastikan pemilik akun sudah diverifikasi (email/nomor terdaftar cocok). Alasan dicatat di audit.
          </p>
          <UFormField label="Alasan" required :error="formError || undefined">
            <UTextarea
              v-model="notes"
              :rows="3"
              :maxlength="500"
              placeholder="Mis. pemilik terverifikasi via WA, salah ketik password"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" :disabled="saving" @click="showUnlock = false">Batal</UButton>
          <UButton color="primary" icon="mdi:lock-open-variant" :loading="saving" @click="handleUnlock">
            Buka Kunci
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Filter -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Cari email, username, atau nama..."
          icon="mdi:magnify"
          class="flex-1 min-w-48"
          clearable
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" @update:model-value="page = 0" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <USkeleton class="h-64 w-full" />
      </template>
      <UCard class="shadow-sm">
        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          color="error"
          icon="mdi:alert-circle"
          title="Terjadi Kesalahan"
          :description="error.message || 'Gagal memuat data'"
        />

        <div v-else-if="!users.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="i-lucide-users" class="text-4xl text-gray-300 mb-3" />
          <p>Tidak ada user.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
          >
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ user.full_name ?? user.username }}</p>
              <p class="text-xs text-gray-400 truncate">{{ user.email }} · @{{ user.username }}</p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <UBadge color="neutral" variant="subtle" size="xs">{{ user.role }}</UBadge>
                <UBadge :color="statusColor(user.status)" variant="subtle" size="xs">{{ user.status }}</UBadge>
                <UBadge v-if="isLocked(user)" color="error" variant="subtle" size="xs" icon="mdi:lock">
                  Login terkunci s/d {{ formatDate(user.locked_until) }}
                </UBadge>
              </div>
            </div>
            <div class="sm:ml-auto flex-shrink-0">
              <UButton
                v-if="isLocked(user)"
                size="sm"
                color="primary"
                variant="outline"
                icon="mdi:lock-open-variant"
                @click="openUnlock(user)"
              >
                Buka Kunci
              </UButton>
            </div>
          </div>
        </div>

        <div v-if="data && data.total_pages > 1" class="flex justify-center pt-4">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { page = p - 1 }"
          />
        </div>
      </UCard>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useAdminUserApi } from '~/composables/api/admin-user'
import type { AdminUserResponse } from '~/types/user/AdminUserResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Pengguna' })

const toast = useToast()
const { fetchUsers, unlockLogin } = useAdminUserApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    page.value = 0
  }, 400)
})

// ===== FETCH =====
const { data, pending, error, refresh } = useAsyncData<PageResponse<AdminUserResponse>>(
  'admin-users',
  () => fetchUsers({ page: page.value, size: perPageValue.value, keyword: debouncedSearch.value || undefined }),
  { watch: [page, perPageValue, debouncedSearch], server: false },
)

const users = computed(() => data.value?.content ?? [])

// ===== HELPERS =====
const isLocked = (u: AdminUserResponse) => !!u.locked_until && dayjs(u.locked_until).isAfter(dayjs())
const formatDate = (v: string | null | undefined) => (v ? dayjs(v).format('DD MMM YYYY, HH:mm') : '-')
const statusColor = (s: AdminUserResponse['status']) =>
  s === 'ACTIVE' ? 'success' : s === 'SUSPEND' ? 'error' : 'warning'

// ===== BUKA KUNCI LOGIN =====
const showUnlock = ref(false)
const unlockTarget = ref<AdminUserResponse | null>(null)
const notes = ref('')
const formError = ref('')
const saving = ref(false)

function openUnlock(user: AdminUserResponse) {
  unlockTarget.value = user
  notes.value = ''
  formError.value = ''
  showUnlock.value = true
}

async function handleUnlock() {
  if (!unlockTarget.value || saving.value) return
  const reason = notes.value.trim()
  if (reason.length < 5) {
    formError.value = 'Alasan minimal 5 karakter'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await unlockLogin(unlockTarget.value.id, reason)
    toast.add({ title: 'Kunci login dibuka', color: 'success', icon: 'mdi:check-circle' })
    showUnlock.value = false
    await refresh()
  } catch (err: any) {
    if (apiErrorDetail(err)?.code === 'LOGIN_NOT_LOCKED') {
      // kunci sudah habis atau dibuka admin lain
      toast.add({ title: 'Akun sudah tidak terkunci', description: apiErrorMessage(err), color: 'warning' })
      showUnlock.value = false
      await refresh()
      return
    }
    formError.value = apiErrorMessage(err, 'Gagal membuka kunci login')
    toast.add({ title: 'Gagal membuka kunci', description: formError.value, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
