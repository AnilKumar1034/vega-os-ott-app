# Amazon Vega OS IAP Setup and Product Configuration Guide

This guide documents the installation, application configuration, product SKU mapping, test environment setup, and product retrieval implementation for **Amazon Vega OS In-App Purchasing (IAP)** in the LogiXstream OTT application.

---

## 1. Installed Package & Compatibility

### 1.1 Verified Package Details
- **Package Name**: `@amazon-devices/keplerscript-appstore-iap-lib`
- **Installed Version**: `2.13.0`
- **npm Registry**: `https://registry.npmjs.org/@amazon-devices/keplerscript-appstore-iap-lib`
- **Package Integrity**: `sha512-It0xpLrdWhgoTjk/e4H8hpr7JN1yMVcAv/HHF628yOhyUyRiPRAMusEORs41yLwh63Pqg2aX8pOG+ZsfdvyFAA==`
- **Autolink Shared Library**: `libkeplerscript-appstore-iap-lib.so`
- **Autolink TurboModule**: `AppstoreIAPRequestHandlerModule`
- **Kepler Native Contract**: `/com.amazon.kepler.appstore_iap_lib_2@IAppstoreIapLib_12`

### 1.2 Platform Compatibility Matrix
| Platform Component | Installed Version | Supported / Required | Status |
| :--- | :--- | :--- | :--- |
| **Vega SDK** | `0.24.12044` | `0.24.x` (Target Vega OS 1.2) | **Compatible** |
| **React Native** | `0.83.0` | `0.83.x` | **Compatible** |
| **Kepler Engine** | `4.0.0` (`@amazon-devices/react-native-kepler`) | `4.0.0` | **Compatible** |
| **Kepler CLI Platform** | `0.22.12` | `0.22.x+` | **Compatible** |
| **Hermes Bytecode** | Bundled with Vega SDK 0.24 | Supported | **Compatible** |
| **Native Architecture** | `aarch64`, `armv7`, `x86_64` | `aarch64`, `armv7`, `x86_64` | **Builds Cleanly** |

---

## 2. Required Application Configuration

### 2.1 Manifest Declarations (`manifest.toml`)
The application manifest was updated to declare the required Amazon Appstore IAP services and native modules:

```toml
[wants]
# Required for Amazon Vega OS In-App Purchasing (IAP)
[[wants.service]]
id = "com.amazon.iap.core.service"

[[wants.module]]
id = "/com.amazon.iap.core@IIAPCoreUI"

[needs]
# Core Appstore IAP Purchase Service TurboModule
[[needs.module]]
id = "/com.amazon.kepler.appstore.iap.purchase.core@IAppstoreIAPPurchaseCoreService"
```

During build packaging (`react-native build-vega`), Kepler CLI re-maps and binds the contract `/com.amazon.kepler.appstore_iap_lib_2@IAppstoreIapLib_12` automatically.

---

## 3. Product ID & SKU Mapping

The application maps internal subscription plans (`premium`, `standard`, `basic`, `mobile`) to canonical Amazon Appstore SKUs following the `logixstream_{tier}_{cycle}` format:

| Canonical Amazon SKU | Internal Plan ID | Tier | Billing Cycle | Monthly Price | Annual Price | Features |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `logixstream_premium_monthly` | `premium` | `premium` | `monthly` | ₹649 / $7.99 | — | 4K UHD + Spatial Audio, 4 streams |
| `logixstream_premium_annually` | `premium` | `premium` | `annually` | — | ₹5,841 / $69.99 | 4K UHD + Spatial Audio, 25% savings |
| `logixstream_standard_monthly` | `standard` | `standard` | `monthly` | ₹499 / $5.99 | — | 1080p Full HD, 2 streams |
| `logixstream_standard_annually` | `standard` | `standard` | `annually` | — | ₹5,089 / $59.99 | 1080p Full HD, 15% savings |
| `logixstream_basic_monthly` | `basic` | `basic` | `monthly` | ₹299 / $3.99 | — | 1080p Full HD, 1 stream |
| `logixstream_basic_annually` | `basic` | `basic` | `annually` | — | ₹3,229 / $39.99 | 1080p Full HD, 10% savings |
| `logixstream_mobile_monthly` | `mobile` | `mobile` | `monthly` | ₹149 / $1.99 | — | 480p SD, mobile & tablet only |
| `logixstream_mobile_annually` | `mobile` | `mobile` | `annually` | — | ₹1,699 / $19.99 | 480p SD, 5% savings |

*Aliases supported for backward compatibility*: `premium_monthly`, `premium_annually`, `standard_monthly`, `standard_annually`, `basic_monthly`, `basic_annually`, `mobile_monthly`, `mobile_annually`.

---

## 4. Amazon Developer Console Setup

To configure live in-app items in the Amazon Appstore Developer Console:

1. **Sign In**: Navigate to [Amazon Developer Console](https://developer.amazon.com/dashboard).
2. **Select Application**: Locate app listing registered with package name `com.anil.vegaott`.
3. **In-App Items**:
   - Go to **In-App Items** -> **Add a Subscription**.
   - Enter **Subscription Title**: e.g., `LogiXstream Premium`.
   - Enter **Subscription SKU**: `logixstream_subscription_group`.
   - Add Terms:
     - Term 1: Monthly (SKU: `logixstream_premium_monthly`), Price: ₹649.00 / $7.99.
     - Term 2: Annually (SKU: `logixstream_premium_annually`), Price: ₹5,841.00 / $69.99.
   - Repeat for `standard`, `basic`, and `mobile` tiers.
4. **Export Configuration**:
   - Click **Export Multiple In-App Items** -> download JSON configuration file (`amazon.sdktester.json`).
5. **Obtain Shared Key**:
   - Navigate to **Shared Key** tab and copy the developer secret for Receipt Verification Service (RVS) validation.

---

## 5. Test Environment Setup (Vega App Tester)

For local offline and sandbox testing without live credit card transactions:

1. **Product Definition File**:
   - The repository includes a local `amazon.sdktester.json` at the root with all 8 subscription SKUs configured.
2. **Push to Device**:
   - Connect the Vega OS physical device or simulator via ADB / Vega CLI:
     ```bash
     vega device push amazon.sdktester.json /data/local/tmp/amazon.sdktester.json
     ```
3. **Vega App Tester**:
   - Ensure Vega App Tester is installed and set to active IAP mode.
   - App Tester intercepts `PurchasingService.getProductData()` and serves the mock definitions from `amazon.sdktester.json`.

---

## 6. Product Retrieval Implementation (`AmazonVegaIapService`)

The product retrieval flow is implemented in `src/iap/AmazonVegaIapService.ts`:

```typescript
import {
  PurchasingService,
  ProductDataResponseCode,
} from '@amazon-devices/keplerscript-appstore-iap-lib';
import {getAllAmazonSkus, normalizeAmazonProduct} from './amazonProductConfig';

// Query product metadata for all configured subscription SKUs
const response = await PurchasingService.getProductData({
  skus: getAllAmazonSkus(),
});

if (response.responseCode === ProductDataResponseCode.SUCCESSFUL) {
  // Normalize and cache product models
  response.productData.forEach(product => {
    products.push(normalizeAmazonProduct(product));
  });
}
```

### Safety & Error Handling:
- **`ProductDataResponseCode.NOT_SUPPORTED`**: Logged gracefully; transitions state to `idle`.
- **`ProductDataResponseCode.FAILED`**: Logged gracefully; transitions state to `idle`.
- **Network / Runtime Exceptions**: Caught cleanly without crashing or leaving unresolved promises.
- **Unavailable SKUs**: Tracked via `getUnavailableSkus()`.
- **Concurrency**: Concurrent calls to `initialize()` are deduplicated into a single in-flight promise.

---

## 7. Purchase Initiation & Lifecycle Handling (`AmazonVegaIapService`)

The real purchase initiation flow is implemented in `src/iap/AmazonVegaIapService.ts` via the official `PurchasingService.purchase({ sku })` API.

### 7.1 Purchase Request Flow
1. **Plan & SKU Resolution**:
   - The user selects a plan and billing cycle on `SubscriptionScreen`.
   - `getDefinitionBySku` resolves canonical SKUs (e.g. `logixstream_premium_monthly`) or aliases (`premium_monthly`).
   - The service rejects invalid or unconfigured SKUs immediately with `errorCode: 'INVALID_PRODUCT'`.
2. **Concurrency Guard**:
   - `_isPurchasing` lock and `_state === 'purchasing'` guard prevent duplicate or simultaneous purchase requests.
   - If an in-flight purchase is detected, the request immediately returns `errorCode: 'SERVICE_BUSY'` without invoking the Amazon API.
   - Lock is safely released in `finally` under all code paths.
3. **Lifecycle State Transitions**:
   - Transitions from `ready_to_purchase` -> `purchasing` -> `purchase_successful` / `purchase_failed` / `user_cancelled`.
   - Observers subscribed via `addStateListener` receive real-time notifications for UI reactivity and D-pad focus management.

### 7.2 Amazon PurchasingService Response Codes Mapping
| Amazon Response Code | Numeric | Application Status | Error Code | Behavior |
| :--- | :---: | :--- | :--- | :--- |
| `PurchaseResponseCode.SUCCESSFUL` | `0` | `success` | — | Extracts `Receipt` and `UserData`, transitions to `purchase_successful`, marks `awaitingVerification: true`. **Does NOT grant unverified entitlements.** |
| `PurchaseResponseCode.ALREADY_PURCHASED` | `1` | `already_purchased` | — | Notifies user they already own the subscription; directs user to Restore Purchases; resets state to `ready_to_purchase`. |
| `PurchaseResponseCode.INVALID_SKU` | `2` | `failed` | `INVALID_PRODUCT` | SKU rejected by Amazon Appstore; transitions state to `purchase_failed`. |
| `PurchaseResponseCode.NOT_SUPPORTED` | `3` | `failed` | `PRODUCT_UNAVAILABLE` | In-app purchasing unsupported on device runtime; transitions state to `purchase_failed`. |
| `PurchaseResponseCode.FAILED` | `4` | `failed` | `PAYMENT_DECLINED` | Payment declined or purchase dialog dismissed; transitions state to `purchase_failed`. |

### 7.3 Error & Interruption Handling
- **User Cancellation**: If the user backs out of the Amazon purchase dialog or dismisses payment, caught cancellations transition to `user_cancelled` with `status: 'cancelled'`.
- **Unexpected Exceptions & Crashes**: Network timeouts, IPC broken pipes, or bridge exceptions are caught safely in `try/catch/finally`. The `_isPurchasing` lock is cleared, and state transitions safely to `purchase_failed` without unhandled promise rejections.

---

## 8. Purchase Event Handling & Transaction Lifecycle (`AmazonTransactionManager`)

Day 5 introduces the dedicated transaction lifecycle and event processing layer: `src/iap/AmazonTransactionManager.ts`.

### 8.1 Official Amazon Purchase Event & Update Mechanism
Amazon Vega OS utilizes the official `@amazon-devices/keplerscript-appstore-iap-lib` framework:
1. **Asynchronous Purchase Updates (`PurchasingService.getPurchaseUpdates`)**:
   - `getPurchaseUpdates({ reset: false })`: Queries the Amazon Appstore for new, unfulfilled, or modified subscription receipts since the previous invocation.
   - `getPurchaseUpdates({ reset: true })`: Fetches full receipt history for account reconciliation.
   - Response includes `receiptList: Receipt[]`, `userData: UserData`, `responseCode: PurchaseUpdatesResponseCode`, and `hasMore: boolean`.
2. **Application Lifecycle Transitions (AppState BG -> FG)**:
   - The manager subscribes to `AppState.addEventListener('change', ...)` from `@amazon-devices/react-native-kepler` / `react-native`.
   - When `nextAppState === 'active'` (app transitions from background to foreground), `reconcilePurchaseUpdates(false)` is automatically invoked to detect any out-of-band purchases or subscription modifications made in the Amazon Appstore.
3. **Cold Restart / Interrupted Purchase Recovery**:
   - On application startup and service initialization, `reconcilePurchaseUpdates(false)` automatically executes. Any transaction interrupted by process termination or device reboot is recovered into local memory as `awaiting_verification`.

### 8.2 Purchase Lifecycle State Machine
Internal transaction records track one of 9 documented lifecycle states:
| Lifecycle State | Description | Entitlement Access |
| :--- | :--- | :---: |
| `initiated` | Purchase flow initiated; sent to Amazon Appstore checkout dialog. | Locked |
| `pending` | Deferred billing update (e.g. `isDeferred: true` for next billing cycle) or parental control delay. | Locked |
| `awaiting_verification` | Successfully charged on Amazon Appstore with valid receipt ID; queued for Day 6 server-side RVS validation. | **Locked** (Zero-trust) |
| `verification_in_progress` | Reserved for Day 6: Backend Cloud Function actively querying Amazon RVS. | Locked |
| `verified` | Reserved for Day 6: Receipt verified by Amazon RVS; entitlement granted in Firestore. | **Unlocked** |
| `canceled` | Subscription canceled by user, revoked, or expired (`isCancelled: true`). | Locked |
| `failed` | Payment declined, dialog dismissed, or billing failure (`PurchaseResponseCode.FAILED`). | Locked |
| `interrupted` | Process killed or IPC connection dropped while checkout was in progress. | Locked |
| `unknown` | Unrecognized or malformed Amazon response. | Locked |

### 8.3 Duplicate Event Protection & Idempotency
1. **Deterministic Identity**: Amazon `receiptId` serves as the immutable, unique transaction identifier across devices.
2. **Idempotent Registry**: `AmazonTransactionManager` maintains an in-memory map of processed receipts (`Map<string, AmazonTransactionRecord>`).
3. **Repeated Callback Handling**:
   - If an event arrives with an existing `receiptId` and identical state, the existing record is returned without re-dispatching to listeners or creating duplicate records.
   - If a receipt state changes (e.g. from active to canceled), the existing record is updated and listeners are notified of the transition.
4. **Order Independence**: Events arriving out of order are resolved deterministically without corrupting earlier state.

### 8.4 Pending & Interrupted Transaction Handling
- **Deferred Subscriptions**: Receipts with `isDeferred === true` are recorded as `pending`. They do not unlock access until a subsequent `getPurchaseUpdates` returns an active receipt.
- **Process Crash / App Backgrounding**: Transactions interrupted mid-flight are safely recovered on restart via `getPurchaseUpdates`. The app does not assume missing local state means failure, nor does it grant unverified access.

### 8.5 Account-Switch Isolation (`appUserId`)
- Every transaction record stores `appUserId`, binding the purchase to the active LogiXstream user UID (`user.uid`).
- `getTransactionsForUser(appUserId)` filters transactions strictly for that account.
- When User A logs out and User B logs in, User A's transactions cannot be queried or claimed by User B.

### 8.6 Transaction Completion & Acknowledgement (`PurchasingService.notifyFulfillment`)
- **API Contract**: `PurchasingService.notifyFulfillment({ receiptId, fulfillmentResult })`.
- **Fulfillment States**: `FulfillmentResult.FULFILLED = 1`, `FulfillmentResult.UNAVAILABLE = 2`.
- **Duplicate Prevention**: `_fulfilledReceipts` set prevents redundant fulfillment requests to Amazon Appstore.
- **Architectural Rule**: In accordance with zero-trust principles, **`notifyFulfillment(..., FULFILLED)` MUST NOT be called prematurely** during client-side receipt capture. It is reserved for Day 6 after trusted RVS verification succeeds.

---

## 9. Day 6 Backend Receipt Verification (RVS) Handoff Contract

To ensure zero trust and prevent client-side entitlement fraud, **real Amazon purchases do NOT grant entitlements directly on the client**.

### 9.1 Typed Verification Handoff Model (`AmazonVerificationPayload`)
Upon receipt capture, `AmazonTransactionManager` constructs a complete verification payload for Day 6 RVS validation:

```typescript
export interface AmazonVerificationPayload {
  readonly appUserId: string;       // LogiXstream application account ID (user.uid)
  readonly amazonUserId: string;    // Amazon Appstore customer ID
  readonly receiptId: string;       // Unique Amazon receipt ID (e.g. 'amzn_rcpt_...')
  readonly sku: string;             // Canonical SKU purchased (e.g. 'logixstream_premium_monthly')
  readonly termSku?: string;        // Subscription term SKU
  readonly purchaseDate: number;    // Epoch millisecond timestamp
  readonly marketplace: string;     // Marketplace code (e.g. 'US', 'IN')
  readonly currentStatus: AmazonTransactionLifecycleState;
}
```

### 9.2 Handoff Accessors
- `amazonTransactionManager.getVerificationHandoff(receiptId)`: Supplies typed payload for Day 6 backend RVS validation.
- `amazonTransactionManager.getAwaitingVerificationTransactions(appUserId)`: Returns all unverified transactions awaiting validation for the user.
- `amazonVegaIapService.restorePurchases(userId)`: Reconciles updates from Amazon Appstore and returns `status: 'restored'` with awaiting verification status without granting unverified entitlements.

---

## 10. Factory Separation: Mock vs Real IAP

`src/iap/IapServiceFactory.ts` manages runtime separation:
- **Development Mode (`__DEV__ === true` and `mockIapConfig.isEnabled() === true`)**:
  - Resolves `MockIapService`.
  - Development scenarios (`success`, `cancel`, `failure`) and local mock entitlement simulation remain 100% operational.
  - Grants local mock entitlement on purchase success for rapid UI and feature development.
- **Production Mode (`__DEV__ === false` or `mockIapConfig.isEnabled() === false`)**:
  - Resolves `AmazonVegaIapService` + `AmazonTransactionManager`.
  - Connects `SubscriptionScreen` directly to Amazon Appstore APIs.
  - Tracks complete transaction lifecycle without granting unverified local entitlements.

---

## 11. Verification Results

- **Unit Tests**:
  - `test/AmazonTransactionManager.spec.ts`: 27 passing tests (covering listener registration, lifecycle state normalization, idempotency, AppState backgrounding/resume, cold restart recovery, account-switch isolation, notifyFulfillment, and Day 6 handoff).
  - `test/AmazonVegaIapService.spec.ts`: 27 passing tests (covering product retrieval, purchase initiation, canonical/alias SKU mapping, concurrency locks, and response code mapping).
  - `test/SubscriptionScreen.spec.tsx`: 18 passing tests (covering UI rendering, TV remote navigation, mock scenario toggles, and real Amazon purchase submission).
  - Full IAP test suite: 159 passing tests across 8 suites.
- **Static Analysis**: TypeScript (`npx tsc --noEmit`) -> 0 errors.
- **Vega Build**: `react-native build-vega --build-type Debug` completed with exit code 0, successfully compiling JavaScript bundles, Hermes bytecode, and creating `.vpkg` packages for `aarch64`, `armv7`, and `x86_64`.

---

## 12. Official Amazon Documentation References

- [Vega In-App Purchasing Overview](https://developer.amazon.com/docs/vega/latest/vega-iap-overview)
- [Submit In-App Items for Vega](https://developer.amazon.com/docs/vega/0.24/vega-submit-iap)
- [Receipt Verification Service (RVS) Overview](https://developer.amazon.com/docs/in-app-purchasing/iap-rvs-examples.html)
- [Amazon App Tester User Guide](https://developer.amazon.com/docs/in-app-purchasing/iap-install-and-configure-app-tester.html)
