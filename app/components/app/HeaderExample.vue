<template>
  <header class="bg-gradient-to-br from-blue-500 to-teal-800 w-full text-white">
    <div class="h-auto">
      
        <!-- informasi (desktop only) -->
         <div class="w-full bg-blue-900">
            <div class="hidden md:flex w-3/4 mx-auto justify-between items-center py-2 ">
                <div class="basis-1/4">
                    <p class="text-xs mx-2">Hubungi Kami : 085855558813</p>
                    </div>
                    <div></div>
                    <div class="basis-2/4">
                    <p class="text-xs text-right mx-2">
                        Panduan Belanja | Panduan Berjualan | Tentang Kami | Blogs | Karir | Pusat Bantuan
                    </p>
                </div>
            </div>
         </div>
      

      <!-- header utama -->
       <div class="w-full bg-blue-600 py-4">
        <div class="flex flex-col md:flex-row w-full md:w-3/4 mx-auto justify-between items-center gap-4 ">
            <!-- Logo -->
            <div class="w-full md:basis-1/6 md:text-left">
                
                
                <div class="flex">
                  <!-- Drawer -->
                  <div class="visible md:hidden basis1/4 pl-4">
                      <UDrawer direction="left">
                          <UButton color="info" trailing-icon="game-icons:hamburger-menu" />

                          <template #content>
                            <LazyAppSidebar class="min-w-96 min-h-96 size-full m-4" />
                          </template>
                      </UDrawer>
                  </div>
                    
                    <!-- LOGO -->
                     <div class="w-full text-left">
                        <p class="text-2xl mx-2">ADSENTRAL</p>
                     </div>

                     <div class="basis-1/6 flex md:hidden pr-4">
                        <LazyAppAuthButtons />
                      </div>

                     
                </div>
                 
            </div>

            <!-- Search box -->
            <div class="basis-2/3 w-full md:w-auto">
            <UButtonGroup class="w-full mx-auto px-4">
              <UInput color="neutral" variant="outline" size="xl" placeholder="Search..." class="w-full" />
              <UTooltip text="Search">
              <UButton color="neutral" variant="subtle" icon="mdi:magnify" />
              </UTooltip>
            </UButtonGroup>
            </div>

            <div class="basis-1/6 hidden md:flex">
              <LazyAppAuthButtons />
            </div>

            
        </div>
    </div>
      
    </div>
  </header>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Guide',
    icon: 'i-lucide-book-open',
    to: '/getting-started',
    children: [
      {
        label: 'Introduction',
        description: 'Fully styled and customizable components for Nuxt.',
        icon: 'i-lucide-house'
      },
      {
        label: 'Installation',
        description: 'Learn how to install and configure Nuxt UI in your application.',
        icon: 'i-lucide-cloud-download'
      },
      {
        label: 'Icons',
        icon: 'i-lucide-smile',
        description: 'You have nothing to do, @nuxt/icon will handle it automatically.'
      },
      {
        label: 'Colors',
        icon: 'i-lucide-swatch-book',
        description: 'Choose a primary and a neutral color from your Tailwind CSS theme.'
      },
      {
        label: 'Theme',
        icon: 'i-lucide-cog',
        description: 'You can customize components by using the `class` / `ui` props or in your app.config.ts.'
      }
    ]
  },
  {
    label: 'Composables',
    icon: 'i-lucide-database',
    to: '/composables',
    children: [
      {
        label: 'defineShortcuts',
        icon: 'i-lucide-file-text',
        description: 'Define shortcuts for your application.',
        to: '/composables/define-shortcuts'
      },
      {
        label: 'useOverlay',
        icon: 'i-lucide-file-text',
        description: 'Display a modal/slideover within your application.',
        to: '/composables/use-overlay'
      },
      {
        label: 'useToast',
        icon: 'i-lucide-file-text',
        description: 'Display a toast within your application.',
        to: '/composables/use-toast'
      }
    ]
  },
  {
    label: 'Components',
    icon: 'i-lucide-box',
    to: '/components',
    active: true,
    children: [
      {
        label: 'Link',
        icon: 'i-lucide-file-text',
        description: 'Use NuxtLink with superpowers.',
        to: '/components/link'
      },
      {
        label: 'Modal',
        icon: 'i-lucide-file-text',
        description: 'Display a modal within your application.',
        to: '/components/modal'
      },
      {
        label: 'NavigationMenu',
        icon: 'i-lucide-file-text',
        description: 'Display a list of links.',
        to: '/components/navigation-menu'
      },
      {
        label: 'Pagination',
        icon: 'i-lucide-file-text',
        description: 'Display a list of pages.',
        to: '/components/pagination'
      },
      {
        label: 'Popover',
        icon: 'i-lucide-file-text',
        description: 'Display a non-modal dialog that floats around a trigger element.',
        to: '/components/popover'
      },
      {
        label: 'Progress',
        icon: 'i-lucide-file-text',
        description: 'Show a horizontal bar to indicate task progression.',
        to: '/components/progress'
      }
    ]
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    badge: '3.8k',
    to: 'https://github.com/nuxt/ui',
    target: '_blank'
  },
  {
    label: 'Help',
    icon: 'i-lucide-circle-help',
    disabled: true
  }
])
</script>