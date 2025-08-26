<template>
    <div>
        <footer aria-labelledby="footer-heading" class="bg-white">
      <h2 id="footer-heading" class="sr-only">Footer</h2>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="border-t border-gray-200 py-20">
          <div class="grid grid-cols-1 md:grid-flow-col md:auto-rows-min md:grid-cols-12 md:gap-x-8 md:gap-y-16">
            <!-- Image section -->
            <div class="col-span-1 md:col-span-2 lg:col-start-1 lg:row-start-1">
              <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" class="h-8 w-auto" />
            </div>

            <!-- Sitemap sections -->
            <div class="col-span-6 mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 md:col-start-3 md:row-start-1 md:mt-0 lg:col-span-6 lg:col-start-2">
              <div class="grid grid-cols-1 gap-y-12 sm:col-span-2 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Products</h3>
                  <ul role="list" class="mt-6 space-y-6">
                    <li v-for="item in footerNavigation.products" :key="item.name" class="text-sm">
                      <a :href="item.href" class="text-gray-500 hover:text-gray-600">{{ item.name }}</a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Company</h3>
                  <ul role="list" class="mt-6 space-y-6">
                    <li v-for="item in footerNavigation.company" :key="item.name" class="text-sm">
                      <a :href="item.href" class="text-gray-500 hover:text-gray-600">{{ item.name }}</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900">Customer Service</h3>
                <ul role="list" class="mt-6 space-y-6">
                  <li v-for="item in footerNavigation.customerService" :key="item.name" class="text-sm">
                    <a :href="item.href" class="text-gray-500 hover:text-gray-600">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Newsletter section -->
            <div class="mt-12 md:col-span-8 md:col-start-3 md:row-start-2 md:mt-0 lg:col-span-4 lg:col-start-9 lg:row-start-1">
              <h3 class="text-sm font-medium text-gray-900">Sign up for our newsletter</h3>
              <p class="mt-6 text-sm text-gray-500">The latest deals and savings, sent to your inbox weekly.</p>
              <form class="mt-2 flex sm:max-w-md">
                <input id="email-address" type="text" autocomplete="email" required="" aria-label="Email address" class="block w-full rounded-md bg-white px-4 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600" />
                <div class="ml-4 shrink-0">
                  <button type="submit" class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden">Sign up</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 py-10 text-center">
          <p class="text-sm text-gray-500">&copy; 2021 Your Company, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
    </div>
</template>

<script setup>
const navigation = {
  categories: [
    {
      id: 'women',
      name: 'Women',
      featured: [
        {
          name: 'New Arrivals',
          href: '#',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-01.jpg',
          imageAlt: 'Models sitting back to back, wearing Basic Tee in black and bone.',
        },
        {
          name: 'Basic Tees',
          href: '#',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-02.jpg',
          imageAlt: 'Close up of Basic Tee fall bundle with off-white, ochre, olive, and black tees.',
        },
        {
          name: 'Accessories',
          href: '#',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-03.jpg',
          imageAlt: 'Model wearing minimalist watch with black wristband and white watch face.',
        },
      ],
      sections: [
        [
          {
            id: 'shoes',
            name: 'Shoes & Accessories',
            items: [
              { name: 'Sneakers', href: '#' },
              { name: 'Boots', href: '#' },
              { name: 'Flats', href: '#' },
              { name: 'Sandals', href: '#' },
              { name: 'Heels', href: '#' },
              { name: 'Socks', href: '#' },
            ],
          },
          {
            id: 'collection',
            name: 'Shop Collection',
            items: [
              { name: 'Everything', href: '#' },
              { name: 'Core', href: '#' },
              { name: 'New Arrivals', href: '#' },
              { name: 'Sale', href: '#' },
              { name: 'Accessories', href: '#' },
            ],
          },
        ],
        [
          {
            id: 'clothing',
            name: 'All Clothing',
            items: [
              { name: 'Basic Tees', href: '#' },
              { name: 'Artwork Tees', href: '#' },
              { name: 'Tops', href: '#' },
              { name: 'Bottoms', href: '#' },
              { name: 'Swimwear', href: '#' },
              { name: 'Underwear', href: '#' },
            ],
          },
          {
            id: 'accessories',
            name: 'All Accessories',
            items: [
              { name: 'Watches', href: '#' },
              { name: 'Wallets', href: '#' },
              { name: 'Bags', href: '#' },
              { name: 'Sunglasses', href: '#' },
              { name: 'Hats', href: '#' },
              { name: 'Belts', href: '#' },
            ],
          },
        ],
        [
          {
            id: 'brands',
            name: 'Brands',
            items: [
              { name: 'Full Nelson', href: '#' },
              { name: 'My Way', href: '#' },
              { name: 'Re-Arranged', href: '#' },
              { name: 'Counterfeit', href: '#' },
              { name: 'Significant Other', href: '#' },
            ],
          },
        ],
      ],
    },
    {
      id: 'men',
      name: 'Men',
      featured: [
        {
          name: 'Accessories',
          href: '#',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-03-category-01.jpg',
          imageAlt:
            'Wooden shelf with gray and olive drab green baseball caps, next to wooden clothes hanger with sweaters.',
        },
        {
          name: 'New Arrivals',
          href: '#',
          imageSrc:
            'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-04-detail-product-shot-01.jpg',
          imageAlt: 'Drawstring top with elastic loop closure and textured interior padding.',
        },
        {
          name: 'Artwork Tees',
          href: '#',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-02-image-card-06.jpg',
          imageAlt:
            'Three shirts in gray, white, and blue arranged on table with same line drawing of hands and shapes overlapping on front of shirt.',
        },
      ],
      sections: [
        [
          {
            id: 'shoes',
            name: 'Shoes & Accessories',
            items: [
              { name: 'Sneakers', href: '#' },
              { name: 'Boots', href: '#' },
              { name: 'Sandals', href: '#' },
              { name: 'Socks', href: '#' },
            ],
          },
          {
            id: 'collection',
            name: 'Shop Collection',
            items: [
              { name: 'Everything', href: '#' },
              { name: 'Core', href: '#' },
              { name: 'New Arrivals', href: '#' },
              { name: 'Sale', href: '#' },
            ],
          },
        ],
        [
          {
            id: 'clothing',
            name: 'All Clothing',
            items: [
              { name: 'Basic Tees', href: '#' },
              { name: 'Artwork Tees', href: '#' },
              { name: 'Pants', href: '#' },
              { name: 'Hoodies', href: '#' },
              { name: 'Swimsuits', href: '#' },
            ],
          },
          {
            id: 'accessories',
            name: 'All Accessories',
            items: [
              { name: 'Watches', href: '#' },
              { name: 'Wallets', href: '#' },
              { name: 'Bags', href: '#' },
              { name: 'Sunglasses', href: '#' },
              { name: 'Hats', href: '#' },
              { name: 'Belts', href: '#' },
            ],
          },
        ],
        [
          {
            id: 'brands',
            name: 'Brands',
            items: [
              { name: 'Re-Arranged', href: '#' },
              { name: 'Counterfeit', href: '#' },
              { name: 'Full Nelson', href: '#' },
              { name: 'My Way', href: '#' },
            ],
          },
        ],
      ],
    },
  ],
  pages: [
    { name: 'Company', href: '#' },
    { name: 'Stores', href: '#' },
  ],
}
const product = {
  name: 'Zip Tote Basket',
  price: '$140',
  rating: 4,
  images: [
    {
      id: 1,
      name: 'Angled view',
      src: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-product-01.jpg',
      alt: 'Angled front view with bag zipped and handles upright.',
    },
    {
      id: 2,
      name: 'Front view',
      src: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-product-02.jpg',
      alt: 'Front view with bag zipped and handles upright.',
    },
    {
      id: 3,
      name: 'Back view',
      src: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-product-03.jpg',
      alt: 'Back view with bag zipped and straps hanging down.',
    },
    {
      id: 4,
      name: 'Back angle open view',
      src: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-product-04.jpg',
      alt: 'Back angled view with bag open and handles to the side.',
    },
  ],
  colors: [
    { id: 'washed-black', name: 'Washed Black', classes: 'bg-gray-700 checked:outline-gray-700' },
    { id: 'white', name: 'White', classes: 'bg-white checked:outline-gray-400' },
    { id: 'washed-gray', name: 'Washed Gray', classes: 'bg-gray-500 checked:outline-gray-500' },
  ],
  description: `
    <p>The Zip Tote Basket is the perfect midpoint between shopping tote and comfy backpack. With convertible straps, you can hand carry, should sling, or backpack this convenient and spacious bag. The zip top and durable canvas construction keeps your goods protected for all-day use.</p>
  `,
  details: [
    {
      name: 'Features',
      items: [
        'Multiple strap configurations',
        'Spacious interior with top zip',
        'Leather handle and tabs',
        'Interior dividers',
        'Stainless strap loops',
        'Double stitched construction',
        'Water-resistant',
      ],
    },
    {
      name: 'Care',
      items: [
        'Spot clean as needed',
        'Hand wash with mild soap',
        'Machine wash interior dividers',
        'Treat handle and tabs with leather conditioner',
      ],
    },
    {
      name: 'Shipping',
      items: [
        'Free shipping on orders over $300',
        'International shipping available',
        'Expedited shipping options',
        'Signature required upon delivery',
      ],
    },
    {
      name: 'Returns',
      items: [
        'Easy return requests',
        'Pre-paid shipping label included',
        '10% restocking fee for returns',
        '60 day return window',
      ],
    },
  ],
}
const relatedProducts = [
  {
    id: 1,
    name: 'Zip Tote Basket',
    color: 'White and black',
    href: '#',
    imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-related-product-01.jpg',
    imageAlt: 'Front of zip tote bag with white canvas, black canvas straps and handle, and black zipper pulls.',
    price: '$140',
  },
  {
    id: 2,
    name: 'Zip High Wall Tote',
    color: 'White and blue',
    href: '#',
    imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-related-product-02.jpg',
    imageAlt: 'Front of zip tote bag with white canvas, blue canvas straps and handle, and front zipper pocket.',
    price: '$150',
  },
  {
    id: 3,
    name: 'Halfsize Tote',
    color: 'Clay',
    href: '#',
    imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-related-product-03.jpg',
    imageAlt: 'Front of tote with monochrome natural canvas body, straps, roll top, and handles.',
    price: '$210',
  },
  {
    id: 4,
    name: 'High Wall Tote',
    color: 'Black and orange',
    href: '#',
    imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-03-related-product-04.jpg',
    imageAlt: 'Front of zip tote bag with black canvas, black handles, and orange drawstring top.',
    price: '$210',
  },
]
const footerNavigation = {
  products: [
    { name: 'Bags', href: '#' },
    { name: 'Tees', href: '#' },
    { name: 'Objects', href: '#' },
    { name: 'Home Goods', href: '#' },
    { name: 'Accessories', href: '#' },
  ],
  company: [
    { name: 'Who we are', href: '#' },
    { name: 'Sustainability', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Terms & Conditions', href: '#' },
    { name: 'Privacy', href: '#' },
  ],
  customerService: [
    { name: 'Contact', href: '#' },
    { name: 'Shipping', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Warranty', href: '#' },
    { name: 'Secure Payments', href: '#' },
    { name: 'FAQ', href: '#' },
    { name: 'Find a store', href: '#' },
  ],
}
</script>
