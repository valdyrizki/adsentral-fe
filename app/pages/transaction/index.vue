<template>
  <div>
    <div class="mx-auto max-w-7xl py-4">
      <div class="px-4 sm:px-0">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Order history</h1>
        <p class="mt-2 text-sm text-gray-500">Check the status of recent orders, manage returns, and download invoices.</p>
      </div>

      <div class="mt-16">
        <h2 class="sr-only">Recent orders</h2>

        <div class="space-y-16 sm:space-y-24">
          <div v-for="order in orders" :key="order.number">
            <h3 class="sr-only">
              Order placed on <time :datetime="order.datetime">{{ order.date }}</time>
            </h3>

            <div class="bg-gray-100">
              <div v-for="product in order.products" :key="product.id" class="flex border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
                <div class="flex flex-row gap-4 w-full">
                  <div class="basis-auto">
                    <div class=" sm:order-first">
                      <img :src="product.imageSrc" :alt="product.imageAlt" class="col-start-2 col-end-3 size-20 rounded-lg object-cover sm:col-start-1 sm:row-span-2 sm:row-start-1 sm:size-40 lg:size-52" />
                    </div>
                  </div>
                    <div class="basis-auto flex flex-col">
                      <!-- Konten atas yang akan memenuhi ruang -->
                      <div>
                        <h4 class="text-sm text-gray-900">#INV202505200001</h4>
                        <h4 class="font-medium">{{ product.name }}</h4>
                      </div>

                      <!-- Konten bawah yang akan didorong ke bawah -->
                      <div class="mt-auto grid grid-cols-4 gap-2"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                        <div class="">
                          Rp. {{ product.price }}
                        </div>
                        <div class="col-span-3">
                          {{ product.date }}, {{ product.datetime }}
                        </div>
                      </div>
                  </div>
                  <div class="ml-auto basis-auto">  LUNAS </div>

                  </div>
              </div>
            </div>

            <div class="mt-6 flow-root px-4 sm:mt-10 sm:px-0">
              <div class="-my-6 divide-y divide-gray-200 sm:-my-10">
                <div v-for="product in order.products" :key="product.id" class="flex py-6 sm:py-10">
                  <div class="min-w-0 flex-1 lg:flex lg:flex-col">
                    <div class="lg:flex-1">
                      <div class="flex">
                        <div>
                          <h4 class="font-medium text-gray-900">#INV202505200001</h4>
                          <p class="mt-2 hidden text-sm text-gray-500 block">{{ product.name }}</p>
                        </div>
                        <p class="mt-1 font-medium text-gray-900 sm:mt-0 sm:ml-6">{{ product.price }}</p>
                      </div>
                      <div class="mt-2 flex text-sm font-medium sm:mt-4">
                        <a :href="product.href" class="text-indigo-600 hover:text-indigo-500">View Product</a>
                        <div class="ml-4 border-l border-gray-200 pl-4 sm:ml-6 sm:pl-6">
                          <a href="#" class="text-indigo-600 hover:text-indigo-500">Buy Again</a>
                        </div>
                      </div>
                    </div>
                    <div class="mt-6 font-medium">
                      <div v-if="product.status === 'delivered'" class="flex space-x-2">
                        <CheckIcon class="size-6 flex-none text-green-500" aria-hidden="true" />
                        <p>
                          Delivered<span class="hidden sm:inline">
                            on <time :datetime="product.datetime">{{ product.date }}</time></span
                          >
                        </p>
                      </div>
                      <p v-else-if="product.status === 'out-for-delivery'">Out for delivery</p>
                      <p v-else-if="product.status === 'cancelled'" class="text-gray-500">Cancelled</p>
                    </div>
                  </div>
                  <div class="ml-4 shrink-0 sm:order-first sm:m-0 sm:mr-6">
                    <img :src="product.imageSrc" :alt="product.imageAlt" class="col-start-2 col-end-3 size-20 rounded-lg object-cover sm:col-start-1 sm:row-span-2 sm:row-start-1 sm:size-40 lg:size-52" />
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

const orders = [
  {
    number: 'WU88191111',
    date: 'January 22, 2021',
    datetime: '2021-01-22',
    href: '#',
    invoiceHref: '#',
    total: '$302.00',
    products: [
      {
        id: 1,
        name: 'Nomad Tumbler',
        description:
          "This durable double-walled insulated tumbler keeps your beverages at the perfect temperature all day long. Hot, cold, or even lukewarm if you're weird like that, this bottle is ready for your next adventure.",
        href: '#',
        price: '$35.00',
        status: 'out-for-delivery',
        date: 'January 5, 2021',
        datetime: '2021-01-05',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/order-history-page-06-product-01.jpg',
        imageAlt: 'Olive drab green insulated bottle with flared screw lid and flat top.',
      },
      {
        id: 2,
        name: 'Leather Long Wallet',
        description:
          "We're not sure who carries cash anymore, but this leather long wallet will keep those bills nice and fold-free. The cashier hasn't seen print money in years, but you'll make a damn fine impression with your pristine cash monies.",
        href: '#',
        price: '$118.00',
        status: 'delivered',
        date: 'January 25, 2021',
        datetime: '2021-01-25',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/order-history-page-06-product-02.jpg',
        imageAlt:
          'Leather long wallet held open with hand-stitched card dividers, full-length bill pocket, and simple tab closure.',
      },
      {
        id: 3,
        name: 'Minimalist Wristwatch',
        description:
          "This contemporary wristwatch has a clean, minimalist look and high quality components. Everyone knows you'll never use it to check the time, but wow, does that wrist look good with this timepiece on it.",
        href: '#',
        price: '$149.00',
        status: 'delivered',
        date: 'January 25, 2021',
        datetime: '2021-01-25',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/order-history-page-06-product-03.jpg',
        imageAlt:
          'Wristwatch with black leather band, brass ring-3, white watch face, thin watch hands, and fine time markings.',
      },
    ],
  },
  {
    number: 'WU88191009',
    date: 'January 5, 2021',
    datetime: '2021-01-05',
    href: '#',
    invoiceHref: '#',
    total: '$27.00',
    products: [
      {
        id: 1,
        name: 'Mini Sketchbook Set',
        description:
          'These pocket-sized sketchbooks feature recycled paper covers and screen printed designs from our top-selling poster collection. You have ideas, doodles, and notes, but nowhere to write them down. We have paper, wrapped in sturdier paper.',
        href: '#',
        price: '$27.00',
        status: 'cancelled',
        date: 'January 7, 2021',
        datetime: '2021-01-07',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/order-history-page-06-product-04.jpg',
        imageAlt: 'Set of three light and dark brown mini sketch books.',
      },
    ],
  },
]
</script>