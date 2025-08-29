<template>
  <div class=" w-full border bg-amber-200">
    <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-7xl lg:px-8 border rounded-2xl bg-amber-600">
      <!-- PRODUCT HEADER -->
       <div class="border border-amber-300">
        <AppHeaderSection title="Product" description="Cari produk yang kamu cari disini!" to="/product" icon="material-symbols:shopping-bag-sharp"   />
      </div>

    <div>
      <!-- PRODUCT LIST -->
       <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-7xl lg:px-8">
      <div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div v-for="product in products" :key="product.id">
          <div class="relative border">
            <div class="relative h-50 w-full overflow-hidden rounded-lg">
              <img :src="product.imageSrc" :alt="product.imageAlt" class="size-full object-cover" />
            </div>
            <div class="relative mt-4">
              <h3 class="text-sm font-medium text-gray-900">{{ product.name }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ product.color }}</p>
            </div>
            <div class="absolute inset-x-0 top-0 flex h-53 items-end justify-end overflow-hidden rounded-lg">
              <p class="relative text-lg font-semibold text-white bg-warning">{{ product.price }}</p>
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
    name: 'Zip Tote Basket',
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
    price: 'Rp. 1.500.000',
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
    name: 'Zip Tote Basket',
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
    name: 'Zip Tote Basket',
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