<template>
  <div class="w-full">
    
    <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-7xl lg:px-8">
        <div class="mx-auto mt-4 flow-root pb-10 border rounded-2xl border-blue-200 bg-gray-100">
          <AppHeaderSection title="Category" description="Cari kebutuhanmu berdasarkan kategori produk yang tersedia disini!" to="/category" icon="iconamoon:category-light"   />
            <USeparator/>
            <UCarousel
              v-if="categories"
              v-slot="{ item }"
              loop
              arrows
              dots
              :autoplay="{ delay: 3000 }"
              :items="categories"
              :ui="{ item: 'basis-1/3 md:basis-1/6 hover:transition-all hover:duration-300 hover:ease-in-out hover:-mt-1' }"
              class="mt-4"
            >
              <div class="m-1">
                  <!-- <a href={{ item.name }} > -->
                  <NuxtImg :src="item.image_url" class="mx-auto rounded-2xl"    />
                  <!-- <UB class="text-center mx-auto text-white">{{ item.name }}</h1> -->
                    <div class="w-full justify-items-center mx-auto flex items-center">
                      <UButton color="neutral" :label="item.name" class="bg-gray-200 opacity-75  mx-auto -mt-10 text-black hover:text-white" />
                    </div>
                <!-- </a> -->
              </div>
            </UCarousel>
        </div>
      </div>
      
      
          

  </div>
  
</template>

<script setup>

  const toast = useToast()

  function showToast() {
      toast.add({
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem with your request.',
      icon: props.icon
    })
  }


  const config = useRuntimeConfig()
  const api = config.public.apiBase 

  const { 
    data: categories, 
    error, 
    pending 
  } = await useFetch(api + '/categories', {
    transform: (res) => res.data,
    onRequest({ options }) {
      console.log('Fetching categories...')
    },
    onRequestError({ error }) {
      showToast()
    },
    onResponse({ response }) {
      console.log('Got response:', response._data)
    },
    onResponseError({ response }) {
      console.error('Response error:', response)
    }
  })


</script>