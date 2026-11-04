# LogiXstream Vega OS Real IAP Architecture & Integration Plan

## 1. Executive Summary

This document specifies the production-oriented architecture, data contracts, purchase lifecycle, security design, and testing strategy for integrating **real Amazon Vega OS In-App Purchasing (IAP)** into the LogiXstream OTT application.

During earlier phases (Days 1–4), a development-only mock IAP system was designed and verified. This document builds upon those foundations, replacing client-side simulated transactions with the official Amazon Vega IAP native module (`@amazon-devices/keplerscript-appstore-iap-lib`), out-of-band **Receipt Verification Service (RVS)** validation, and backend-authoritative entitlement granting.

---

## 2. Verified API & Package Specifications

Based on official Amazon Developer documentation for Vega OS ([Vega IAP Overview](https://developer.amazon.com/docs/vega/latest/vega-iap-overview) and [Submit IAP Apps](https://developer.amazon.com/docs/vega/0.24/vega-submit-iap)):

| Specification | Value | Notes |
| :--- | :--- | :--- |
| **Official Package** | `@amazon-devices/keplerscript-appstore-iap-lib` | Target version: `~2.12.10` / `~2.13.0` |
| **Core API Class** | `PurchasingService` (static) | Imported from `@amazon-devices/keplerscript-appstore-iap-lib` |
| **React Helper Hooks** | `useIapProductData`, `useIapPurchaseUpdates`, `useIapUserData` | Built into the library |
| **Product Types** | `ProductType.SUBSCRIPTION`, `ProductType.ENTITLED`, `ProductType.CONSUMABLE` | Subscriptions use `ProductType.SUBSCRIPTION` |
| **Required Manifest Service** | `com.amazon.iap.core.service` | Declared in `manifest.toml` under `[wants.service]` |
| **Required Manifest Module (UI)** | `/com.amazon.iap.core@IIAPCoreUI` | Declared in `manifest.toml` under `[wants.module]` |
| **Required Core TurboModule** | `/com.amazon.kepler.appstore.iap.purchase.core@IAppstoreIAPPurchaseCoreService` | Declared in `manifest.toml` under `[needs.module]` |
| **Verification Service** | Amazon Receipt Verification Service (RVS) | Cloud Sandbox & Production REST endpoints |

---

## 3. Current Project Baseline & Compatibility Assessment

| Component | Installed in Project | Required / Documented | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **Application ID** | `com.anil.vegaott` | `com.anil.vegaott` | **Matches** (`manifest.toml`) |
| **Package Name** | `@amazon-devices/vegaottapp` | N/A | **Matches** (`package.json`) |
| **React Native** | `0.83.0` | `0.83.x` | **Compatible** |
| **React** | `19.2.0` (overridden) | `19.x` | **Compatible** |
| **Vega SDK** | `0.24.12044` | `0.24.x` (Vega OS 1.2 target) | **Compatible** |
| **Kepler Engine** | `4.0.0` (`react-native-kepler`) | `4.0.0` | **Compatible** |
| **Kepler CLI Platform** | `0.22.12` | `0.22.x+` | **Compatible** |
| **Vega IAP Package** | *Not yet installed* | `~2.12.10` or `~2.13.0` | **Pending Installation (Phase 2)** |
| **Manifest IAP Modules** | *Not yet declared* | See Section 2 | **Pending Declaration (Phase 2)** |

> [!NOTE]
> No upgrades to React Native, Vega SDK, Kepler, or media engines are needed. The integration requires only installing `@amazon-devices/keplerscript-appstore-iap-lib` and declaring the 3 manifest dependencies.

---

## 4. Architectural Boundaries & Component Responsibilities

The architecture decouples UI rendering, native billing calls, purchase verification, and playback authorization:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOGIXSTREAM OTT APPLICATION                     │
├────────────────────────────────────────────────────────────────────────┤
│  A. Subscription UI (SubscriptionScreen.tsx)                           │
│     - Plan cards & billing cycle switch (Monthly / Annual)             │
│     - Purchasing & Restoring loading indicators                        │
│     - User-facing toasts & status banner                               │
│     - TV Remote D-Pad focus & event handling                           │
├────────────────────────────────────────────────────────────────────────┤
│  B. Unified IAP Interface (IIapService)                                │
│     - getProducts(), purchase(sku), restorePurchases(userId)           │
│     - isPurchasing(), isRestoring(), getState(), addStateListener()    │
├────────────────────────────────────────┬───────────────────────────────┤
│  C. Mock IAP Adapter (MockIapService)  │ D. Amazon IAP Adapter         │
│     - Development-only simulation      │    (AmazonVegaIapService)     │
│     - Used in __DEV__ when configured  │    - Calls PurchasingService  │
│     - Never activates in release       │    - Translates Amazon models │
├────────────────────────────────────────┴───────────────────────────────┤
│  E. Purchase Verification Client (PurchaseVerificationService)         │
│     - Forwards receiptId + Amazon userId + account UID to backend      │
│     - Enforces idempotency locks                                       │
│     - Calls PurchasingService.notifyFulfillment('FULFILLED')           │
├────────────────────────────────────────────────────────────────────────┤
│  F. Entitlement Service (EntitlementService & Firestore)               │
│     - In-memory cache + session invalidation                           │
│     - Resolves verified subscription state from user profile           │
├────────────────────────────────────────────────────────────────────────┤
│  G. Playback Authorization (checkContentAccess & VideoPlayerScreen)     │
│     - Evaluates parental control maturity limits first                 │
│     - Authorizes free trailers without subscription                    │
│     - Validates active subscription & enforces 4K UHD tier rank        │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Component Roles:

1. **Subscription UI (`src/screens/SubscriptionScreen.tsx`)**:
   - Depends exclusively on `IIapService` and `useEntitlement()`.
   - Never directly writes to storage or grants entitlements.
   - Remains completely unchanged between mock mode and real Amazon IAP mode.

2. **IAP Service Factory (`src/iap/IapServiceFactory.ts`)**:
   - Returns `MockIapService` if `__DEV__` is true and `mockIapConfig.isEnabled()` is true.
   - Returns `AmazonVegaIapService` in production builds (`__DEV__ === false`) or when live billing is enabled in staging.

3. **Amazon Vega IAP Adapter (`src/iap/AmazonVegaIapService.ts`)**:
   - Implements `IIapService`.
   - Maps Amazon SKUs to internal `IapProduct` models.
   - Invokes `PurchasingService.getProductData()`, `PurchasingService.purchase()`, and `PurchasingService.getPurchaseUpdates()`.
   - On purchase completion, delegates verification to `PurchaseVerificationService`.

4. **Purchase Verification Service (`src/iap/PurchaseVerificationService.ts`)**:
   - Sends receipt metadata to the backend verification endpoint via authenticated HTTPS.
   - Upon receiving server confirmation, invokes `PurchasingService.notifyFulfillment({ receiptId, fulfillmentResult: 'FULFILLED' })`.

5. **Backend Verification Service (Serverless Cloud Function / Node.js API)**:
   - Holds the secret Amazon Developer Shared Secret in secure key management.
   - Queries Amazon RVS: `GET /version/1.0/verifyReceiptId/developer/{secret}/user/{userId}/receiptId/{receiptId}`.
   - Writes verified entitlement records into Firestore: `users/${accountUid}/subscription`.

6. **Entitlement Service (`src/services/entitlementService.ts`)**:
   - Resolves entitlements from the authenticated user profile in Firestore.
   - Caches active state with TTL to minimize redundant network calls.

7. **Playback Authorization (`src/services/entitlementService.ts:checkContentAccess`)**:
   - Gatekeeper for `VideoPlayerScreen.tsx`.
   - Requires verified subscription for premium content and `premium` tier rank for 4K UHD.

---

## 5. End-to-End Purchase Lifecycle

```
[User on TV]
     │
     ▼
1. Selects Plan (e.g. "Premium Monthly")
     │
     ▼
2. SubscriptionScreen calls IIapService.purchase('premium_monthly')
     │
     ▼
3. AmazonVegaIapService calls PurchasingService.purchase({ sku: 'premium_monthly' })
     │
     ▼
4. Amazon Vega Appstore displays native checkout dialog on TV
     │
     ├─► User cancels / presses Back ──► Returns PurchaseResponseCode.FAILED / USER_CANCELLED
     │                                   UI shows "Purchase cancelled"
     ▼
5. User confirms payment -> Amazon charges payment method
     │
     ▼
6. PurchasingService.purchase resolves with PurchaseResponse:
   - receiptId: "rcpt_live_9876543210"
   - userData.userId: "amzn_user_xyz123"
   - sku: "premium_monthly"
     │
     ▼
7. AmazonVegaIapService forwards to PurchaseVerificationService.verifyPurchase()
     │
     ▼
8. App sends HTTPS POST to LogiXstream Backend:
   Body: { receiptId, amazonUserId, accountUid: user.uid }
   Header: Authorization: Bearer <Firebase_ID_Token>
     │
     ▼
9. LogiXstream Backend calls Amazon RVS:
   GET https://appstore-sdk.amazon.com/version/1.0/verifyReceiptId/developer/{secret}/user/{userId}/receiptId/{receiptId}
     │
     ▼
10. Amazon RVS returns verification payload:
    - cancelDate: null (Active)
    - term: "1 Month"
    - purchaseDate: 1730200000000
    - renewalDate: 1732792000000
     │
     ▼
11. Backend writes verified entitlement to Firestore:
    Document: users/${accountUid}
    Data: { subscription: "Premium", subscriptionStatus: "active", expiresAt: "...", ... }
     │
     ▼
12. Backend returns { success: true, entitlement: {...} } to App
     │
     ▼
13. App calls PurchasingService.notifyFulfillment({ receiptId, fulfillmentResult: 'FULFILLED' })
     │
     ▼
14. App refreshes EntitlementService & useEntitlement hook
     │
     ▼
15. SubscriptionScreen shows: "[SUCCESS] Subscribed to Premium (Monthly)!"
     │
     ▼
16. User navigates to MovieDetailScreen / VideoPlayerScreen -> 4K UHD Playback Unlocked
```

### Handling Edge States & Asynchronous Lifecycle Events:

| State / Event | Cause / Behavior | Handling Strategy |
| :--- | :--- | :--- |
| **`PENDING`** | Payment requires parental approval, bank SMS OTP, or slow clearing. | App does not grant access. Sets status `'pending'`. On next app launch, `getPurchaseUpdates` re-checks status. |
| **`ALREADY_PURCHASED`** | User tries to buy a plan they already own on Amazon. | App automatically triggers `restorePurchases()` to re-verify the active receipt. |
| **`INVALID_SKU`** | SKU is not configured in Amazon Developer Console. | App catches error, logs diagnostic alert in dev, displays "Selected product is currently unavailable." |
| **`USER_CANCELLED`** | User exits native Amazon checkout modal. | App restores UI to `'ready_to_purchase'`, shows brief notification, no charges incurred. |
| **Auto-Renew Canceled** | User turned off renewal in Amazon Account Settings. | RVS reports `cancelDate` at future expiration timestamp. Access remains active until `expiresAt`. |
| **Subscription Expired** | Term elapsed without renewal (`now >= expiresAt`). | Next access check blocks playback with `reason: 'expired'`, prompting renewal. |
| **Refund / Revocation** | Amazon Customer Service issued a refund. | RVS reports `cancelDate <= now`. Backend marks status `'revoked'`; access revoked immediately. |
| **App Crash / Kill** | App terminated between Amazon charge and backend verification. | Unfulfilled receipt is stored by Amazon. On next launch, `useIapPurchaseUpdates` retrieves it and completes verification. |
| **Duplicate Verification** | Repeated network retries of the same receipt. | Backend enforces idempotency using `receiptId` as unique key; returns existing entitlement without double-granting. |

---

## 6. Subscription & Entitlement Data Contracts

### 6.1 Ephemeral Amazon Purchase Result (Client)
```typescript
export interface AmazonPurchaseReceipt {
  readonly receiptId: string;
  readonly sku: string;
  readonly productType: 'SUBSCRIPTION' | 'ENTITLED' | 'CONSUMABLE';
  readonly purchaseDate: number;
  readonly cancelDate: number | null;
  readonly isCanceled: boolean;
  readonly amazonUserId: string;
  readonly marketplace: string;
}
```

### 6.2 Amazon RVS Verification Response (Server-to-Server)
```typescript
export interface AmazonRvsVerificationResponse {
  readonly receiptId: string;
  readonly productType: string;
  readonly productId: string;
  readonly purchaseDate: number;
  readonly cancelDate: number | null;
  readonly renewalDate?: number;
  readonly freeTrialEndDate?: number;
  readonly term?: string;
  readonly termSku?: string;
  readonly testTransaction: boolean;
}
```

### 6.3 Authoritative Verified Entitlement Model (Firestore: `users/${uid}`)
```typescript
export interface VerifiedSubscriptionEntitlement {
  readonly uid: string;
  readonly subscription: string;                 // 'Premium' | 'Standard' | 'Basic' | 'Mobile' | 'Free'
  readonly subscriptionStatus: SubscriptionStatus;// 'active' | 'canceled' | 'expired' | 'none'
  readonly tier: SubscriptionTier;                // 'premium' | 'standard' | 'basic' | 'mobile' | 'free'
  readonly billingCycle: BillingCycle;            // 'monthly' | 'annually'
  readonly sku: string;                           // 'premium_monthly'
  readonly amazonUserId: string;                  // Opaque Amazon user ID
  readonly receiptId: string;                     // Amazon RVS verified receiptId
  readonly startedAt: string;                     // ISO-8601 string
  readonly expiresAt: string;                     // ISO-8601 string
  readonly cancelDate?: string | null;            // ISO-8601 string if canceled
  readonly isAutoRenew: boolean;                  // false if user opted out of renewal
  readonly lastVerifiedAt: number;                // Epoch timestamp
  readonly environment: 'sandbox' | 'production';
  readonly fulfillmentState: 'FULFILLED' | 'UNAVAILABLE';
}
```

### 6.4 Storage Separation Guarantee:
- **Mock Purchases**: Saved only to local `AsyncStorage` (`@vegaott/mock_entitlement_v1_${userId}`) with `isMock: true`.
- **Real Purchases**: Stored in Cloud Firestore under `users/${uid}` only after backend RVS verification.
- **Client Cache**: `EntitlementService` caches Firestore state in-memory during active sessions.

---

## 7. Security & Account Ownership Design

1. **Zero Client Trust**:
   - The React Native application never decides that a payment succeeded on its own.
   - `PurchaseResponseCode.SUCCESSFUL` is treated as a client notification to initiate verification.
2. **Secret Credential Isolation**:
   - The **Amazon Developer Shared Secret** is never stored in `package.json`, `.env`, or React Native bundle files.
   - It is stored strictly in Google Cloud Secret Manager / Cloud Functions environment variables.
3. **Account Association & Fraud Prevention**:
   - Verification requests must include a valid Firebase Auth ID Token in the `Authorization: Bearer <token>` header.
   - The backend validates the token, extracts the verified `uid`, and binds the Amazon receipt to that specific user document.
   - If a `receiptId` is already bound to a different `uid`, the backend flags the request as a potential duplicate/hijacking attempt and rejects it.
4. **Subscription Ownership vs Viewing Profiles**:
   - Subscriptions belong strictly to the **LogiXstream Account UID**, not to individual sub-profiles.
   - Switching between adult and kids profiles under the same account shares the account's subscription.
   - Parental controls (`canProfileAccessContent`) remain strictly enforced: an active subscription does not bypass age-rating restrictions on child profiles.
5. **Firestore Write Protection**:
   - Firestore security rules deny direct client updates to subscription fields:
     ```javascript
     match /users/{userId} {
       allow update: if request.auth.uid == userId
                     && !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['subscription', 'subscriptionStatus', 'subscriptionExpiresAt', 'receiptId']);
     }
     ```
   - Only backend Cloud Functions using the Firebase Admin SDK can mutate subscription entitlements.

---

## 8. Amazon Developer Console & Test Environment Setup Checklist

### A. Local Development Setup (Completed / Local Actions)
- [x] Audit existing mock IAP and verify compatibility with React Native 0.83 / Vega SDK 0.24.
- [ ] Install `@amazon-devices/keplerscript-appstore-iap-lib` (Planned for Day 3).
- [ ] Declare `com.amazon.iap.core.service`, `/com.amazon.iap.core@IIAPCoreUI`, and IAP TurboModule in `manifest.toml` (Planned for Day 3).
- [ ] Create `amazon.sdktester.json` product configuration file for App Tester.

### B. Amazon Developer Console Setup (Requires Amazon Console Access)
- [ ] **Developer Account**: Active Amazon Developer Account with approved In-App Purchasing agreement.
- [ ] **App Registration**: Register application with package name `com.anil.vegaott`.
- [ ] **In-App Items Configuration**: Under *In-App Items* -> *Add a Subscription*, configure the 8 project SKUs:
  1. `premium_monthly` (₹649 / $7.99)
  2. `premium_annually` (₹5,841 / $69.99)
  3. `standard_monthly` (₹499 / $5.99)
  4. `standard_annually` (₹5,089 / $59.99)
  5. `basic_monthly` (₹299 / $3.99)
  6. `basic_annually` (₹3,229 / $39.99)
  7. `mobile_monthly` (₹149 / $1.99)
  8. `mobile_annually` (₹1,699 / $19.99)
- [ ] **Export JSON**: Download the item configuration JSON from console for local App Tester use.
- [ ] **Developer Shared Secret**: Obtain the secret key under the *Shared Key* tab in Developer Console.

### C. Device & Testing Setup (Requires Vega Hardware / Simulator)
- [ ] **Install Vega App Tester**: Sideload or install Vega App Tester on the target Vega device or simulator.
- [ ] **Push Item JSON**: Push `amazon.sdktester.json` to the device storage path accessible by App Tester.
- [ ] **Configure Sandbox Mode**: Switch App Tester IAP mode to active.

### D. Backend & Security Configuration (Requires Cloud Infrastructure)
- [ ] Configure server endpoint (e.g. Firebase Cloud Functions `/verifyAmazonReceipt`).
- [ ] Store Amazon Developer Shared Secret in secure environment secret storage.
- [ ] Configure RVS Cloud Sandbox URL for staging/test builds.

---

## 9. Comprehensive Testing Strategy

### 9.1 Unit Testing (`test/` suites)
- **`MockIapService`**: Verify concurrency locking, simulated latency, error scenarios.
- **`IapServiceFactory`**: Verify clean switching between Mock (dev) and Amazon (prod).
- **`PurchaseVerificationService`**: Mock HTTPS backend responses (success, invalid receipt, timeout, network failure).
- **`EntitlementService`**: Dynamic expiration recalculation, parental control precedence, 4K UHD quality gating.

### 9.2 Integration Testing
- Verify that `SubscriptionScreen` triggers `IIapService.purchase(sku)` without UI exceptions.
- Verify TV remote D-Pad navigation across plan cards and restore buttons.
- Verify that canceling in native UI does not crash or leave the service locked in `isPurchasing()`.

### 9.3 Sandbox & App Tester Testing (Target Device)
- **Product Retrieval**: Verify `PurchasingService.getProductData()` returns all 8 SKUs with localized prices.
- **Successful Purchase**: Complete test purchase in App Tester; verify receipt acquisition.
- **Cancellation**: Dismiss native purchase dialog; verify graceful return to ready state.
- **Restoration**: Invoke `PurchasingService.getPurchaseUpdates({ reset: false })`; verify existing receipts are retrieved.
- **Immediate Expiry & Renewal**: Use App Tester subscription controls to fast-forward expiration and renewal cycles.

### 9.4 Device UX & Edge Case Testing
- **Network Drop During Checkout**: Disconnect network while purchase dialog is active; verify graceful error handling.
- **App Termination**: Terminate app during checkout; verify unfulfilled receipt recovery on next launch via `useIapPurchaseUpdates`.
- **Sign-Out Isolation**: Verify signing out of LogiXstream immediately clears in-memory entitlement cache.

---

## 10. Known Limitations & Unresolved Questions

1. **Amazon Appstore Console Access**: Registration of `com.anil.vegaott` and configuration of the 8 SKUs requires active Amazon Developer Console credentials.
2. **Vega App Tester Native Sideloading**: App Tester tool must be installed on the physical Vega device or simulator via Vega CLI tooling (`vega app install`).
3. **Backend RVS Endpoint Deployment**: Real server-to-server RVS verification requires a deployed Cloud Function or server endpoint with network egress to `appstore-sdk.amazon.com`.

---

## 11. Files Planned for Future Modification

```
Phase 2 (Configuration & Dependencies):
- package.json                              (Add @amazon-devices/keplerscript-appstore-iap-lib)
- manifest.toml                             (Add com.amazon.iap.core services & modules)
- amazon.sdktester.json                     (Create App Tester SKU definitions)

Phase 3 (Core Service Implementation):
- src/iap/types.ts                          (Add Amazon Receipt and Response models)
- src/iap/AmazonVegaIapService.ts           (New: concrete IIapService wrapping PurchasingService)
- src/iap/IapServiceFactory.ts              (New: factory returning Mock or Amazon adapter)
- src/iap/PurchaseVerificationService.ts    (New: client verification & notifyFulfillment handler)
- src/iap/index.ts                          (Export new services)

Phase 4 (UI Integration & Backend):
- src/screens/SubscriptionScreen.tsx        (Use IapServiceFactory for unified purchasing)
- src/services/entitlementService.ts        (Resolve server-verified Firestore subscriptions)
- backend/verifyAmazonReceipt.ts            (Server-side Amazon RVS caller)
```
