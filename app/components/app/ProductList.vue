<template>
  <div class="w-full p-1 md:p-0 bg-white">
    <div class="mx-auto w-full md:w-3/4 border rounded-2xl border-blue-200 bg-gray-100">
      <!-- PRODUCT HEADER -->
      <div>
        <AppHeaderSection
          title="Product"
          description="Cari produk yang kamu cari disini!"
          to="/product"
          icon="material-symbols:shopping-bag-sharp"
        />
      </div>

      <USeparator />

      <div>
        <!-- PRODUCT LIST -->
        <div class="mx-auto w-full p-4">
          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="product in products"
              :key="product.id"
              class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
            >
              <div class="relative aspect-square w-full overflow-hidden rounded-lg">
                <img
                  :src="product.imageSrc"
                  :alt="product.imageAlt"
                  class="size-full object-cover hover:scale-125 block transition"
                />
              </div>

              <!-- UnderImage -->
               <div class="flex justify-between">
                <div class="basis-1/3">
                  PROMO
                </div>
                <div></div>
                <div class="basis-1/2 sm:basis-1/3">
                  <div class="relative font-semibol bg-teal-500 rounded-l-full -mt-4">
                    <p class="text-white text-sm p-1 text-center">
                      {{ product.price }}
                    </p>
                  </div>
                </div>
               </div>

              <!-- Product Info -->
              <div class="relative mt-4">
                <h3 class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </h3>

                <!-- Avatar container with slide-down -->
                <div
                  class="transition-all duration-300 ease-in-out md:max-h-0 max-h-12 md:opacity-0 opacity-100 md:overflow-hidden group-hover:max-h-12 group-hover:opacity-100"
                >
                  <div class="flex items-center space-x-2 mt-2">
                    <UAvatar
                      size="sm"
                      :src="`https://i.pravatar.cc/100?u=${product.id}`"
                    />
                    <span class="text-xs text-gray-600">Seller Name</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
const products = [
  {
    id: 1,
    name: 'Akun Facebook + BM Verified Ispol',
    color: 'White and black',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=1',
    imageAlt: 'Front of zip tote bag with white canvas, black canvas straps and handle, and black zipper pulls.',
    price: 'Rp.50.000',
  },
  {
    id: 2,
    name: 'Zip High Wall Tote',
    color: 'White and blue',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=2',
    imageAlt: 'Front of zip tote bag with white canvas, blue canvas straps and handle, and front zipper pocket.',
    price: 'Rp. 120.000',
  },
  {
    id: 3,
    name: 'Halfsize Tote',
    color: 'Clay',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=3',
    imageAlt: 'Front of tote with monochrome natural canvas body, straps, roll top, and handles.',
    price: 'Rp. 11.500.000',
  },
  {
    id: 4,
    name: 'High Wall Tote',
    color: 'Black and orange',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=4',
    imageAlt: 'Front of zip tote bag with black canvas, black handles, and orange drawstring top.',
    price: 'Rp. 1.500.000',
  },
  {
    id: 1,
    name: 'Akun Facebook + BM Verified Ispol',
    color: 'White and black',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=5',
    imageAlt: 'Front of zip tote bag with white canvas, black canvas straps and handle, and black zipper pulls.',
    price: 'Rp.50.000',
  },
  {
    id: 2,
    name: 'Zip High Wall Tote',
    color: 'White and blue',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=6',
    imageAlt: 'Front of zip tote bag with white canvas, blue canvas straps and handle, and front zipper pocket.',
    price: 'Rp. 120.000',
  },
  {
    id: 3,
    name: 'Halfsize Tote',
    color: 'Clay',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=7',
    imageAlt: 'Front of tote with monochrome natural canvas body, straps, roll top, and handles.',
    price: 'Rp. 1.500.000',
  },
  {
    id: 4,
    name: 'High Wall Tote',
    color: 'Black and orange',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=8',
    imageAlt: 'Front of zip tote bag with black canvas, black handles, and orange drawstring top.',
    price: 'Rp. 1.500.000',
  },
  {
    id: 1,
    name: 'Akun Facebook + BM Verified Ispol',
    color: 'White and black',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=9',
    imageAlt: 'Front of zip tote bag with white canvas, black canvas straps and handle, and black zipper pulls.',
    price: 'Rp.50.000',
  },
  {
    id: 2,
    name: 'Zip High Wall Tote',
    color: 'White and blue',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=10',
    imageAlt: 'Front of zip tote bag with white canvas, blue canvas straps and handle, and front zipper pocket.',
    price: 'Rp. 120.000',
  },
  {
    id: 3,
    name: 'Halfsize Tote',
    color: 'Clay',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=11',
    imageAlt: 'Front of tote with monochrome natural canvas body, straps, roll top, and handles.',
    price: 'Rp. 1.500.000',
  },
  {
    id: 4,
    name: 'High Wall Tote',
    color: 'Black and orange',
    href: '#',
    imageSrc: 'https://picsum.photos/500/500?random=12',
    imageAlt: 'Front of zip tote bag with black canvas, black handles, and orange drawstring top.',
    price: 'Rp. 1.500.000',
  },
]
</script>