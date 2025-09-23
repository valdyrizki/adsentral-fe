<template>
  <div class="flex gap-4 justify-center md:justify-end">
      <div class="hidden md:flex gap-2">
        <UChip :text="5" color="error" size="3xl">
          <UButton color="neutral" variant="subtle" icon="material-symbols:notifications-rounded" />
        </UChip>
        <UChip :text="5" color="error" size="3xl">
          <UButton color="neutral" variant="subtle" icon="mynaui:envelope" />
        </UChip>
      </div>

      <div v-if="isLoggedIn">
        <UDropdownMenu
        size="xl"
        :items="itemsProfile"
        :content="{
          align: 'start'
        }"
      >

    <UButton size="xl" label="Profile" icon="i-lucide-user" color="neutral" variant="outline" />
  </UDropdownMenu>
      </div>
      <div v-else>
        <div class="flex gap-2">
          <UButton @click="isRegisterOpen = true">Daftar</UButton>
          <UModal v-model:open="isRegisterOpen" title="Register">
            <template #body>
              <FormRegister @register-success="handleRegisterSuccess" />
            </template>
          </UModal>

          <UButton @click="isLoginOpen = true">Masuk</UButton>
          <UModal v-model:open="isLoginOpen" title="Login">
            <template #body>
              <FormLogin @login-success="handleLoginSuccess" />
            </template>
          </UModal>
        </div>
      </div>
      
    </div>
</template>

<style>

</style>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth'


const isLoggedIn: Ref<boolean> = ref(false)
const config = useRuntimeConfig()
const api = config.public.apiBase
const isLoginOpen = ref(false)
const isRegisterOpen = ref(false)
const { token } = useAuth()

const handleLoginSuccess = () => {
  isLoginOpen.value = false
}

const handleRegisterSuccess = () => {
  isRegisterOpen.value = false
}

const itemsProfile = ref<DropdownMenuItem[]>([
  {
    label: 'Billing',
    icon: 'i-lucide-credit-card'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-cog'
  }
])

onMounted( async() =>{
  console.log(token);
    
  if(token != null){
    const isValid = await validateToken(api)
    if (isValid) {
      isLoggedIn.value = true;
    } else {
      isLoggedIn.value = false;
    }
  }
})

</script>