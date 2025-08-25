<!-- components/HeaderInfo.vue -->
<template>
<!-- Header Info -->
    <div class="bg-blue-700 text-white text-sm">
      <div class="max-w-7xl mx-auto flex justify-between items-center px-6 py-2">
        <!-- Trustpilot -->
        <div>
          ⭐⭐⭐⭐⭐ Rated Excellent on Trustpilot
        </div>

        <!-- Language + App -->
        <div class="flex items-center space-x-6">
          <!-- Language -->
          <div class="flex items-center space-x-2 cursor-pointer hover:opacity-80">
            <img
              src="https://flagcdn.com/w20/id.png"
              alt="Indonesia"
              class="w-5 h-5 rounded-full"
            />
            <span>ID - IDR</span>
          </div>

          <!-- Download App -->
          <div class="flex items-center space-x-2 cursor-pointer hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
              viewBox="0 0 24 24">
              <path
                d="M17 1H7a2 2 0 00-2 2v18a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2zM17 19H7V5h10v14z"
              />
            </svg>
            <span>Download App</span>
          </div>
        </div>
      </div>
    </div>
</template>
