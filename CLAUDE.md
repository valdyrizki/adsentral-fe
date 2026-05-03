# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (SSR)
npm run preview    # Preview production build
npm run generate   # Static site generation
```

No test or lint commands are configured.

## Environment Variables

Create a `.env` file (no `.env.example` exists yet):

```
API_BASE=http://localhost:8080/api
BACKEND_URL=http://localhost:8080
```

## Architecture Overview

Nuxt 4 (Vue 3) e-commerce frontend with multi-role support: **buyer**, **seller**, and **admin**. SSR enabled.

### Directory Layout (`app/`)

- `pages/` — File-based routing. Role-specific sections: `admin/`, `seller/`, `merchant/`, `cart/`, `transaction/`, `balance/`, `chat/`
- `layouts/` — Three layouts: `default.vue` (Header/Footer), `admin.vue`, `seller.vue`
- `stores/` — Pinia stores (all use `persist: true`): `auth`, `cart`, `balance`, `category`, `merchant`, `payment-method`, `system-setting`
- `composables/api/` — One composable per domain (auth, product, transaction, merchant, etc.). All HTTP calls live here.
- `types/` — TypeScript interfaces. `WebResponse<T>` and `PageResponse<T>` are the standard API response wrappers.
- `components/app/` — Layout components (Header, Footer, Sidebar). `components/form/` — Modal/form components. `components/u/` — Utility components.
- `helper/imageHelper.ts` — Image validation (max 5 MB, JPG/PNG, 1024×768 max resolution).
- `utils/slug.ts` — URL slug generation.

### API Layer (`composables/api/useApi.ts`)

All API calls go through `useApi.ts`, which:
- Injects `Authorization: Bearer <token>` automatically from the auth store
- Handles 401 errors by refreshing the token, queuing failed requests, and retrying
- Sends `credentials: 'include'` for HttpOnly cookie support

Individual API composables follow this pattern:
```typescript
export const useXxxxApi = () => {
  const fetchData = async () => { /* calls $fetch or useFetch */ }
  return { fetchData }
}
```

Use `useFetch()` for GET requests (SSR-friendly, with a `key` for deduplication) and `$fetch()` for mutations (POST/PATCH/DELETE).

### Authentication

- Auth state (user, token, merchant) lives in `stores/auth.ts`, persisted to a secure cookie
- Global middleware `middleware/auth-redirect.global.ts` redirects authenticated users away from `/login` and `/register`
- Token is stored in the `access_token` cookie; refresh logic is inside `useApi.ts`

### Cart (`stores/cart.ts`)

- Supports multi-merchant carts (items grouped by `merchant_id`)
- Performs real-time stock sync from the backend before checkout
- Checkout flow: stock validation → backend sync → transaction creation

### State Management

All Pinia stores use `persist: true` (via `pinia-plugin-persistedstate`). Store actions call API composables directly; mutations update state in-place.

### Dynamic Routes

- `pages/product/[id].vue`
- `pages/category/[[id]].vue` (optional segment)
- `pages/admin/order/[id].vue`

### UI & Styling

- Nuxt UI 4 components throughout
- TailwindCSS with custom primary color `#0ea5e9` (sky-500) configured in `tailwind.config.ts` and `app.config.ts`
- Global styles in `assets/css/main.css`
- Currency inputs use `v-money3`; masked inputs use `maska` / `vue-the-mask`; dates use `dayjs`
