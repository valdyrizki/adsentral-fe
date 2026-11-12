# API Map

Peta endpoint BE → fungsi composable (`app/composables/api/`) → halaman/komponen yang memakainya. Gunakan ini untuk menemukan lokasi fitur tanpa grep.

Catatan umum:
- Path ditulis relatif ke `apiBase` (`/backend`, di-proxy ke `<BE>/api`). Method default GET.
- Semua lewat `useApi()` (header `X-API-TOKEN` + auto refresh), **kecuali** endpoint publik yang memakai `$fetch` mentah: `fetchLogin`, `fetchCategories` (category), `fetchPaymentMethod`, serta `/user/refresh` & `/user/logout` di `stores/auth.ts`.
- Respons dibungkus `WebResponse<T>`; list berpaginasi `PageResponse<T>` (page 0-based, default size 20).
- "Dipakai di" relatif ke `app/`. `—` = belum dipakai di UI.
- Nama fungsi bisa sama di dua composable (mis. `fetchCategories`, `fetchBalance`, `createCategory`) — periksa composable yang di-import.

- **Error berkode:** sebagian error membawa `data.code` (key di dalam `data` camelCase): `RATE_LIMITED` (429), `ACCOUNT_LOCKED` / `VERIFICATION_LOCKED` (403), dengan `retryAfterSeconds` (dan `lockedUntil`, WIB tanpa offset). Bedakan dengan `apiErrorDetail(err)?.code`, hitung mundur dari `apiErrorRetryAfter(err)` (`utils/apiError.ts`), jangan auto-retry. Composable yang membungkus error dengan `createError` wajib meneruskan `data: err.data`.
- **URL file presigned (1 jam):** `file.url` di diskusi & file pesanan, `file_url` di garansi, item stok seller, dan `auto_config` produk adalah presigned URL R2 yang kedaluwarsa 1 jam (lalu 403 XML). Buka hanya lewat `useSignedFileOpener()` / `provideSignedFileSource()` (`composables/useSignedFile.ts`); jangan simpan di storage awet atau buat tombol salin URL. Gambar produk, avatar, dan lampiran chat tetap URL publik.

Saat menambah/mengubah endpoint, perbarui tabel terkait di file ini.

---

## Auth & user

**`auth.ts` → `useAuthApi`** · types: `LoginResponse`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchLogin` | POST `/user/login` (429 `RATE_LIMITED` 20/5 menit per IP; 403 `ACCOUNT_LOCKED`) | `components/form/Login.vue`, `stores/auth.ts` |

`stores/auth.ts` juga memanggil langsung: POST `/user/refresh` (dipakai juga oleh `plugins/auth-init.client.ts`; single-flight + Web Locks antar-tab karena refresh token dirotasi), POST `/user/logout`.

`GET /user/validate-token` **tidak dipakai** FE: sesi dipulihkan lewat `/user/refresh`, dan token tidak sah ditangani dari 401 endpoint biasa di `useApi`.

**`user.ts` → `useUserApi`** · types: `UserResponse`, `UserRequest`, `RegisterRequest`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `registerUser` | POST `/user/register` (429 `RATE_LIMITED` 10/jam per IP) | `components/form/Register.vue` |
| `fetchMe` | `/user/profile` | `stores/auth.ts`, `pages/profile` |
| `updateProfile` | PATCH `/user/profile` (ganti password: 403 `ACCOUNT_LOCKED` bila password lama salah berulang; jangan logout) | `pages/profile` |
| `requestPasswordReset` | POST `/user/password/reset` (selalu 200; 429 `RATE_LIMITED` 5/15 menit) | `pages/forgot-password` |
| `confirmPasswordReset` | POST `/user/password/confirm` → `data.password` (400 satu pesan; 429 tanpa kode = 5 kali salah; 429 `RATE_LIMITED` 10/15 menit) | `pages/forgot-password` |

**`admin-user.ts` → `useAdminUserApi`** · types: `user/AdminUserResponse`, `user/ResetCodeResponse`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchUsers` | `/admin/users` (memuat `locked_until`) | `pages/admin/users` |
| `unlockLogin` | PATCH `/admin/users/{id}/unlock-login` body `{ notes }` 5–500 karakter (400 `LOGIN_NOT_LOCKED` bila sudah tidak terkunci → tutup modal & muat ulang) | `pages/admin/users` |
| `viewResetCode` | POST `/admin/users/{id}/reset-code` body `{ notes }` 5–500 karakter, **super admin** (tombol hanya bila `authStore.isSuperAdmin`); 404 `NO_ACTIVE_RESET_CODE` bila tidak ada kode yang masih bisa dipakai → petunjuk di modal. Kode dibuang saat modal ditutup | `pages/admin/users` |
| `payoutRefund` | POST `/admin/balance/{userId}/refund-payout` body `{ amount, notes }` (notes 5–500), **super admin**: potong saldo belanja sebelum transfer manual refund (EP04-16); 400 bila melebihi saldo | `pages/admin/users` (tombol Cairkan Refund + konfirmasi) |

Endpoint BE yang belum punya form di FE: POST `/user/email/confirm` (10/15 menit, 403 `VERIFICATION_LOCKED`). Saat dibuat, tangani error berkode yang sama dengan pola di `Login.vue`.

## Alerts (badge)

**`alerts.ts` → `useAlertsApi`** · types: `AlertsResponse.ts` · dipakai hanya oleh `stores/alerts.ts`

| Fungsi | Endpoint | Role |
|---|---|---|
| `fetchAdminAlerts` | `/admin/alerts` | ADMIN, SUPER_ADMIN |
| `fetchSellerAlerts` | `/seller/alerts` | SELLER |
| `fetchBuyerAlerts` | `/alerts` | semua user login |

## Produk & stok

**`product.ts` → `useProductsApi`** · types: `types/product/*`

Publik / buyer:

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `getProducts` | `/products` | `components/app/ProductList.vue`, `pages/search`, `pages/admin/dashboard` |
| `fetchProductById` | `/product/{id}` | `pages/product/[id].vue` |
| `fetchProductsByCategoryId` | `/product/category/{id}` | `pages/category/*` |
| `fetchProductsByMerchantId` | `/products/merchant/{merchantId}` | `pages/merchant/[id].vue`, halaman chat, `ChatProductModal` |
| `getProductsByIds` | POST `/products/ids` | `stores/cart.ts` (sinkron stok) |

Seller:

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchMyProduct` / `getMyProducts` | `/products/my` | `pages/seller/product`, `pages/seller/stock/add` |
| `fetchMyProductById` | `/product/my/{id}` | `pages/seller/product/edit`, `pages/seller/stock/add/[id].vue`, `pages/admin/product/edit` |
| `createProduct` | POST `/product/create` | `pages/seller/product/create`, `pages/admin/product/create` |
| `updateProduct` | PATCH `/product/update/{id}` | `pages/seller/product/edit`, `pages/admin/product/edit` |
| `activateProduct` / `deactivateProduct` | PATCH `/product/activate/{id}` · `/product/deactivate/{id}` | `pages/seller/product` |

Admin:

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `getAllProductsAdmin` | `/products/all` | `pages/admin/product`, `pages/admin/product/review` |
| `fetchProductByIdAdmin` | `/product/admin/{id}` | `pages/admin/product/view` |
| `adminActivateProduct` | PATCH `/product/admin/activate/{id}` | `pages/admin/product`, `.../review` |
| `rejectProduct` | PATCH `/product/reject/{id}` | `pages/admin/product`, `.../review` |
| `suspendProduct` | PATCH `/product/suspend/{id}` | `pages/admin/product`, `.../review` |

Stok (produk `STOCKING`):

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `getMyAllStockItems` | `/stock/my` | `pages/seller/stock` |
| `getAdminAllStockItems` | `/admin/stock` | `pages/admin/stock` |
| `getProductStockItems` | `/product/{productId}/stock/my` | — |
| `addProductStockItem` | POST `/product/{productId}/stock` | `components/stock/ItemForm.vue`, `FileBulkInput.vue` |
| `updateProductStockItem` | PATCH `/stock/{itemId}` | `components/stock/ItemForm.vue` |
| `checkProductStockAccountsBulk` / `addProductStockAccountsBulk` | POST `/product/{productId}/stock/accounts/bulk` (cek: query `dryRun=true`) | `components/stock/AccountBulkInput.vue` |
| `checkProductStockFilesBulk` / `addProductStockFilesBulk` | POST `/product/{productId}/stock/bulk` (FormData; cek: field `dryRun=true`) | `components/stock/FileBulkInput.vue` |
| `deleteProductStockItem` | DELETE `/stock/{itemId}` | `pages/seller/stock` |
| `bulkDeleteStockItems` | POST `/stock/bulk-delete` | `pages/seller/stock` |

**`account-type.ts` → `useAccountTypeApi`** · types: `types/account-type/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchAccountTypes` | `/account-types` | `composables/useAccountTypes.ts` |
| `fetchAccountTypesAdmin` | `/admin/account-types` | `pages/admin/account-type` |
| `createAccountType` | POST `/admin/account-types` | `pages/admin/account-type` |
| `updateAccountType` | PATCH `/admin/account-types/{id}` | `pages/admin/account-type` |

**`category.ts` → `useCategoryApi`** · types: `CategoryResponse`, `CategoryRequest`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchCategories` | `/categories` (publik, `$fetch`) | `stores/category.ts`, `components/app/CategoryPreview.vue`, `pages/category/*`, `pages/admin/dashboard` |
| `fetchCategoriesAdmin` | `/categories/all` | `pages/admin/category` |
| `createCategory` | POST `/category/create` | `pages/admin/category` |
| `updateCategory` | PATCH `/category/update/{id}` | `pages/admin/category` |
| `suspendCategory` | PATCH `/category/suspend/{id}` | `pages/admin/category` |

**`review.ts` → `useReviewApi`** · types: `types/review/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchReviewByProduct` | `/review/product/{productId}` | `pages/product/[id].vue` |
| `fetchReviewByTransaction` | `/review/transaction/{txId}` | halaman detail order (buyer/seller/admin) |
| `fetchCreateReview` | POST `/review/create` | `pages/transaction/[id].vue` (+ import di detail seller/admin) |
| `fetchUpdateReview` | PATCH `/review/update` | idem |
| `fetchReviewByUser` / `fetchReviewByMerchant` | `/review/user/{productId}` · `/review/merchant/{merchantId}` | — |

## Merchant

**`merchant.ts` → `useMerchantApi`** · types: `MerchantResponse`, `MerchantRequest` (dikirim sebagai FormData)

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `registerMerchant` | POST `/merchant/create` | `pages/merchant/create` |
| `updateMerchant` | PATCH `/merchant/update` multipart; field libur `isHoliday` (camelCase, opsional), respons `is_holiday` (sebelum EP03-06 BE membaca/mengirim `holiday`, toggle libur tidak tersimpan) | `pages/seller/profile` |
| `fetchMerchantById` | `/merchant/get/{id}` | `pages/merchant/[id].vue`, `pages/product/[id].vue` |
| `fetchMyMerchant` | `/merchant/my` | `stores/merchant.ts` |

## Transaksi & pesanan

**`transaction.ts` → `useTransactionApi`** · types: `TransactionResponse`, `TransactionRequest`, `CreateTransactionResponse`. Alur status: lihat `docs/domain-glossary.md`.

| Fungsi | Endpoint | Aktor | Dipakai di |
|---|---|---|---|
| `createTransaction` | POST `/tx/create` | buyer/seller; admin 403 (EP04-09) | `stores/cart.ts` (checkout) |
| `fetchBuyerTransactions` | `/tx/buyer` | buyer | `pages/transaction` |
| `fetchTransactionById` | `/tx/get/{txId}` | semua | detail order buyer/seller/admin |
| `fetchTxSeller` | `/tx/seller` | seller | `pages/seller/order`, `pages/seller/dashboard` |
| `fetchAllTx` | `/tx/all` | admin | `pages/admin/order`, `pages/admin/dashboard` |
| `fetchConfirmTx` | PATCH `/tx/confirm/{txId}` | seller/admin | `pages/seller/order/*`, `pages/admin/order` |
| `fetchRejectTx` | PATCH `/tx/reject/{txId}` | seller/admin | `pages/seller/order/*`, `pages/admin/order` |
| `fetchAcceptOrder` | PATCH `/tx/order/accept/{txId}` | buyer | `pages/transaction/[id].vue` |
| `fetchRejectOrder` | PATCH `/tx/order/reject/{txId}` | buyer | `pages/transaction/[id].vue` |
| `fetchCancelTxRequest` | PATCH `/tx/cancel/request/{txId}` | buyer | `pages/transaction/[id].vue` |
| `fetchAcceptCancelRequest` | PATCH `/tx/cancel/accept/{txId}` | seller | `pages/seller/order/[id].vue` |
| `fetchRejectCancelRequest` | PATCH `/tx/cancel/reject/{txId}` | seller pemilik (T-01) | `pages/seller/order/[id].vue` |
| `fetchWithdrawCancelRequest` | PATCH `/tx/cancel/withdraw/{txId}` | buyer menarik pengajuan batalnya | `pages/transaction/[id].vue` |
| `fetchArbitrageRequest` | PATCH `/tx/arbitrage/{txId}` | buyer/seller | `pages/transaction/[id].vue`, `pages/seller/order/[id].vue` |
| `fetchCancelArbitrage` | PATCH `/tx/cancel/arbitrage/{txId}` | admin | `pages/admin/order/[id].vue` |
| `fetchRefundTx` | PATCH `/tx/refund/{txId}` | admin, hanya `ARBITRAGE` (T-02) | `pages/admin/order/[id].vue` |
| `fetchCompleteTx` | PATCH `/tx/complete/{txId}` | admin, hanya `ARBITRAGE` (T-02) | `pages/admin/order/[id].vue` |

Filter list: hanya **satu** nilai `status` per request (`'ALL'` = tanpa parameter); opsi di `utils/txStatusFilter.ts`, state filter di `composables/useTxListFilters.ts`. Aksi mutasi memanggil `useAlertsStore().refresh()`.

**`order-discussion.ts` → `useOrderDiscussionApi`** · types: `types/order-discussion/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchOrderDiscussionByTxId` | `/order/discussion/transaction/{txId}` | detail order buyer/seller/admin |
| `fetchCreateOrderDiscussion` | POST `/order/discussion/create` (tipe `MESSAGE`/`ORDER_DELIVERY`; `ORDER_DELIVERY` hanya dari `PAID`/`IN_PROGRESS`/`REJECT`/`ARBITRAGE`, lainnya 403) | idem |
| `fetchFileOrderByTxId` | `/order/file/transaction/{txId}` | idem |

**`seller-summary.ts` → `useSellerSummaryApi`** · types: `types/seller-summary/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchOrderSummary` | `/seller/orders/summary` | `pages/seller/dashboard`, `pages/seller/order` |
| `fetchProductSummary` | `/seller/products/summary` | `pages/seller/dashboard`, `pages/seller/product` |
| `fetchFinanceSummary` | `/seller/finance/summary` | `pages/seller/dashboard` |

## Garansi

**`guarantee.ts` → `useGuaranteeApi`** · types: `types/guarantee/*`

| Fungsi | Endpoint | Aktor | Dipakai di |
|---|---|---|---|
| `fetchCreateGuarantee` | POST `/guarantee` | buyer | `pages/transaction/[id].vue` |
| `fetchMyGuarantees` | `/guarantee` | buyer | `pages/guarantee` |
| `fetchGuaranteeById` | `/guarantee/{guaranteeId}` | buyer/seller | `pages/guarantee/[id].vue`, `pages/seller/guarantee/[id].vue` |
| `fetchGuaranteeByTransaction` | `/guarantee/transaction/{transactionId}` | semua | detail order buyer/seller/admin |
| `fetchSellerGuarantees` | `/seller/guarantee` | seller | `pages/seller/guarantee` |
| `fetchReviewGuarantee` | POST `/seller/guarantee/{id}/review` | seller | `pages/seller/guarantee/[id].vue`, `pages/seller/order/[id].vue` |
| `fetchSendGuarantee` | POST `/seller/guarantee/{id}/send` | seller | idem |
| `sendGuaranteeViaStock` | POST `/seller/guarantee/{id}/send-via-stock` | seller | `pages/seller/guarantee/[id].vue` |

## Payment

**`payment.ts` → `usePaymentApi`** · types: `types/payment/PaymentResponse.ts`

| Fungsi | Endpoint | Aktor | Dipakai di |
|---|---|---|---|
| `fetchMyPayments` | `/payment` | buyer | `pages/payment` |
| `fetchPaymentById` | `/payment/{paymentId}` | buyer/admin | `pages/payment/[id].vue`, `pages/admin/payment/[id].vue` |
| `fetchTxByPaymentId` | `/tx/payment/{paymentId}` | buyer/admin | idem |
| `cancelPayment` | POST `/balance/deposit/cancel/{paymentId}` | buyer | `pages/payment/[id].vue` |
| `uploadPaymentProof` | POST `/payment/proof/{paymentId}` | buyer | — |
| `fetchAllPayments` | `/payment/all` | admin | `pages/admin/payment` |
| `fetchConfirmPayment` | POST `/payment/confirm/{paymentId}` | admin | `pages/admin/payment/*` |
| `fetchCancelPayment` | POST `/payment/cancel/{paymentId}` | admin | `pages/admin/payment/*` |
| `fetchRejectPayment` | POST `/payment/reject/{paymentId}` | admin | — |

**`payment-method.ts` → `usePaymentMethodApi`** · types: `types/payment-method/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchPaymentMethod` | `/payment/methods` (publik, `$fetch`) | `pages/cart`, `components/form/Deposit.vue` |
| `fetchAllPaymentMethods` | `/payment/method/all` | `pages/admin/payment-method`, `pages/admin/payment-channel` |
| `fetchPaymentMethodById` | `/payment/method/get/{id}` | — |
| `createPaymentMethod` | POST `/payment/method/create` | `pages/admin/payment-method` |
| `updatePaymentMethod` | PATCH `/payment/method/update/{id}` | idem |
| `suspendPaymentMethod` / `activatePaymentMethod` | PATCH `/payment/method/suspend/{id}` · `/activate/{id}` | idem |

**`payment-channel.ts` → `usePaymentChannelApi`** · types: `types/payment-channel/*` (channel gateway Tripay)

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchAllPaymentChannels` | `/payment/channel/all` | `pages/admin/payment-channel` |
| `fetchActiveChannelsByMethod` | `/payment/channel/{paymentMethodId}` | — |
| `updatePaymentChannel` | PATCH `/payment/channel/update/{code}` | `pages/admin/payment-channel` |
| `syncTripayChannels` | POST `/payment/channel/sync-tripay` | `pages/admin/payment-channel` |

**`unprocessed-payment.ts` → `useUnprocessedPaymentApi`** · types: `UnprocessedPaymentResponse`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchUnprocessedPayments` | `/admin/payments/unprocessed` | `pages/admin/payments/unprocessed` |
| `resolveUnprocessedPayment` | PATCH `/admin/payments/unprocessed/{id}/resolve` | idem |

**`voucher.ts` → `useVoucherApi`** · types: `types/voucher/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchPublicVouchers` | `/voucher/public` | `pages/cart` |
| `checkVoucher` | `/voucher/check` | `pages/cart` |
| `fetchAllVouchers` | `/admin/voucher` | `pages/admin/voucher` |
| `getVoucherByCode` | `/admin/voucher/{code}` | — |
| `createVoucher` | POST `/admin/voucher` | `pages/admin/voucher` |
| `updateVoucher` | PUT `/admin/voucher/{code}` | idem |
| `suspendVoucher` / `activateVoucher` | PATCH `/admin/voucher/{code}/suspend` · `/activate` | idem |

## Saldo, deposit & withdrawal

**`balance.ts` → `useBalanceApi`** · types: `types/balance/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchBalance` | `/balance` (+ rincian `sales_held_escrow` / `sales_held_withdrawal`, EP04-07) | `stores/balance.ts`, `pages/balance`, `pages/seller/balance`, `pages/seller/dashboard` |
| `fetchBalanceLog` | `/balance/log` | `pages/balance`, `pages/seller/balance` |
| `fetchDepositBalance` | POST `/balance/deposit` (admin 403, EP04-09) | `pages/balance` |
| `fetchDepositHistory` | `/balance/deposit/history` | `pages/balance` |
| `fetchDepositCancel` | POST `/balance/deposit/cancel/{id}` | `pages/balance` |
| `fetchBalanceTransfer` | POST `/balance/transfer` (saldo jualan → belanja) | `components/form/BalanceTransfer.vue` |
| `fetchWithdrawal` | POST `/seller/withdrawal` | `components/form/Withdrawal.vue` |
| `fetchWithdrawalHistory` | `/seller/withdrawal` | `pages/seller/balance`, `components/form/Withdrawal.vue` |
| `cancelWithdrawal` | PATCH `/seller/withdrawal/{id}/cancel` | `pages/seller/balance` |

**`bank-account.ts` → `useBankAccountApi`** · types: `types/bank-account/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchBankAccount` | `/seller/bank-account` | `pages/seller/bank-account`, `components/form/Withdrawal.vue` |
| `saveBankAccount` | POST `/seller/bank-account` | `pages/seller/bank-account` |

**`admin-withdrawal.ts` → `useAdminWithdrawalApi`** · types: `AdminWithdrawalResponse`, `*SumResponse`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchAllWithdrawals` | `/admin/withdrawal` | `pages/admin/withdrawal` |
| `fetchWithdrawalDetail` | `/admin/withdrawal/{id}` | `pages/admin/withdrawal/[id].vue` |
| `approveWithdrawal` | PATCH `/admin/withdrawal/{id}/complete` | `pages/admin/withdrawal/*` |
| `rejectWithdrawal` | PATCH `/admin/withdrawal/{id}/reject` | idem |
| `fetchSellerTransactionSum` | `/tx/admin/seller/{sellerId}/sum` | `pages/admin/withdrawal/[id].vue` |
| `fetchSellerDepositSum` | `/balance/admin/deposit/{userId}/sum` | idem |
| `fetchSellerWithdrawalSum` | `/admin/withdrawal/{userId}/sum` | idem |

## Keuangan (admin)

**`finance.ts` → `useFinanceApi`** · types: `types/finance/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchSummary` | `/admin/finance/summary` | `pages/admin/finance` |
| `fetchBalance` | `/admin/finance/balance` | `pages/admin/finance` |
| `fetchCategories` | `/admin/finance/category` | `pages/admin/finance/category`, `.../journal` |
| `createCategory` | POST `/admin/finance/category` | `pages/admin/finance/category` |
| `updateCategory` | PUT `/admin/finance/category/{id}` | idem |
| `toggleCategory` | PATCH `/admin/finance/category/{id}/toggle` | idem |
| `fetchCategoryTotals` | (agregasi FE: loop `fetchJournals` semua halaman, abaikan jurnal void) | idem |
| `fetchJournals` | `/admin/finance/journal` | `pages/admin/finance/journal` |
| `createJournal` | POST `/admin/finance/journal` | idem |
| `voidJournal` | PATCH `/admin/finance/journal/{id}/void` | idem |

**`failed-journal.ts` → `useFailedJournalApi`** · types: `FailedJournalResponse`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchFailedJournals` | `/admin/finance/failed-journals` | `pages/admin/finance/failed-journals` |
| `retryFailedJournal` | POST `/admin/finance/failed-journals/{id}/retry` | idem |
| `dismissFailedJournal` | PATCH `/admin/finance/failed-journals/{id}/dismiss` | idem |

## Penalty

**`penalty.ts` → `usePenaltyApi`** · types: `types/penalty/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchMyPenalties` | `/user/penalty` | `pages/penalty`, `pages/seller/penalty` |
| `fetchMyPenaltyStat` | `/user/penalty/stat` | `components/app/BuyerPenaltyBanner.vue`, `pages/seller/dashboard` |
| `fetchPenaltyUsers` | `/admin/penalty/stat` | `pages/admin/penalty`, `pages/admin/penalty-user` |
| `fetchUserPenaltyDetail` | `/admin/penalty/user/{userId}` | `pages/admin/penalty-user`, `PenaltyUserDetailSlideover` |
| `applyPenalty` | POST `/admin/penalty` | `components/form/ApplyPenaltyModal.vue` |
| `cancelPenalty` | DELETE `/admin/penalty/{penaltyId}` | `PenaltyUserDetailSlideover` |
| `fetchPenalty` | `/admin/penalty` | — |
| `searchUsers` | `/admin/users` (pencarian user umum; daftar lengkap ada di `useAdminUserApi.fetchUsers`) | `ApplyPenaltyModal`, `CreateNotificationModal` |

**`penalty-rule.ts` → `usePenaltyRuleApi`**

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchAllPenaltyRules` | `/admin/penalty/rules` | `pages/admin/penalty-rule`, `pages/admin/penalty` |
| `createPenaltyRule` | POST `/admin/penalty/rules` | `pages/admin/penalty-rule` |
| `updatePenaltyRule` | PATCH `/admin/penalty/rules/{id}` | idem |
| `fetchTogglePenaltyRule` | PATCH `/admin/penalty/rules/{id}/toggle` | idem |

## Verifikasi seller

**`verification.ts` → `useVerificationApi`** · types: `types/verification/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchVerificationStatus` | `/seller/verification/status` | `pages/seller/verification` |
| `submitVerification` | POST `/seller/verification` | idem |
| `fetchVerificationHistory` | `/seller/verification/history` | `pages/seller/verification/history.vue` |
| `fetchAdminVerificationList` | `/admin/verification` | `pages/admin/verification` |
| `fetchAdminVerificationDetail` | `/admin/verification/{requestId}` | `pages/admin/verification/[id].vue` |
| `approveVerification` / `rejectVerification` | PATCH `/admin/verification/{requestId}/approve` · `/reject` | idem |
| `editVerifiedUser` | PATCH `/admin/verification/user/{userId}` | idem |

## Chat & notifikasi

**`chat.ts` → `useChatApi`** · types: `types/chat/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchSendChat` | POST `/chat/send` | `pages/chat`, `pages/seller/chat`, `pages/admin/chat`, `ChatModalBuyer`/`ChatModalSeller`/`ChatProductModal` |
| `fetchBuyerConversation` | `/chat/buyer/conversation` | `pages/chat` |
| `fetchSellerConversation` | `/chat/seller/conversation` | `pages/seller/chat`, `pages/admin/chat` |
| `fetchChatByConversation` | `/chat/conversation/{id}` | semua halaman chat |

**`notification.ts` → `useNotificationApi`** · types: `types/notification/*`

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchNotifications` | `/notification` | `pages/notification` |
| `fetchSellerNotifications` | `/seller/notification` | `pages/seller/notification` |
| `fetchAdminNotifications` | `/admin/notification` | `pages/admin/notification` |
| `markAsRead` | PATCH `/notification/user/read/{id}` | semua halaman notifikasi |
| `markAllAsRead` | PATCH `/notification/user/read-all` | idem |
| `createNotification` | POST `/admin/notification` | `components/form/CreateNotificationModal.vue` |
| `broadcastNotification` | POST `/admin/notification/broadcast` | `components/form/BroadcastNotificationModal.vue` |

## System setting

**`system-setting.ts` → `useSystemSettingApi`** · types: `types/system-setting/*`. Key yang dipakai: lihat `docs/domain-glossary.md`.

| Fungsi | Endpoint | Dipakai di |
|---|---|---|
| `fetchPublicSystemSetting` | `/system/settings/public` | `plugins/auth-init.client.ts`, `pages/cart`, form produk, `components/form/Withdrawal.vue` |
| `fetchPublicSystemSettingByGroup` | `/system/settings/public/group` | `pages/hubungi-kami`, `pages/payment/[id].vue` |
| `fetchAllSystemSetting` | `/system/settings/all` | `pages/admin/settings/system`, `pages/admin/dashboard`, `pages/admin/withdrawal/*` |
| `createSystemSetting` | POST `/system/setting/create` | `pages/admin/settings/system` |
| `updateSystemSetting` | PATCH `/system/setting/update/{id}` | idem |
| `deleteSystemSetting` | DELETE `/system/setting/delete/{id}` | idem |
