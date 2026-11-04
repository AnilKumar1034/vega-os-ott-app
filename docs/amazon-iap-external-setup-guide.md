# Amazon Vega OS Real IAP: External Setup & Configuration Guide

This guide provides step-by-step instructions for all external setup prerequisites required for real **Amazon Vega OS In-App Purchasing (IAP)** in the LogiXstream OTT application (`com.anil.vegaott`).

---

## Overview of External Prerequisites

```
┌────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SETUP WORKFLOW                           │
├────────────────────────┬───────────────────────────────────────────────┤
│ 1. Amazon Developer    │ Register App (`com.anil.vegaott`), sign IAP   │
│    Console Setup       │ Agreement, set up Banking & Tax identity.     │
├────────────────────────┼───────────────────────────────────────────────┤
│ 2. In-App Subscription │ Create Subscription Group & 8 canonical SKUs. │
│    Catalog Config      │ Export and sync `amazon.sdktester.json`.      │
├────────────────────────┼───────────────────────────────────────────────┤
│ 3. Shared Key Secret   │ Retrieve 32-character Shared Secret for RVS.  │
│    Management          │ Store securely in Backend Secret Manager.     │
├────────────────────────┼───────────────────────────────────────────────┤
│ 4. Local Testbed       │ Sideload Amazon App Tester on Vega device.    │
│    (Vega App Tester)   │ Push `amazon.sdktester.json` to device tmp.   │
├────────────────────────┼───────────────────────────────────────────────┤
│ 5. Cloud Backend       │ Deploy `/verifyAmazonReceipt` endpoint.       │
│    RVS Endpoint        │ Verify receipts with Amazon RVS & update DB.  │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

## Step 1: Amazon Developer Console Registration

### 1.1 Developer Account & App Creation
1. Go to the [Amazon Developer Console](https://developer.amazon.com/dashboard) and sign in.
2. Under the top navigation, select **Amazon Appstore** > **My Apps**.
3. Click **Add New App** and select **Vega / Fire OS**.
4. Configure application details:
   - **App Title**: `LogiXstream`
   - **App SKU / Package Name**: `com.anil.vegaott` *(Must match the `id` declared in `manifest.toml` exactly)*
   - **Default Language**: English (United States) or English (India)
   - **Category**: `Movie & TV Streaming` / `Entertainment`
5. Click **Save**.

### 1.2 Financial & Tax Agreements
> [!IMPORTANT]
> Amazon Appstore blocks live subscription purchases until banking and tax details are submitted and approved.
1. In the top-right account menu, go to **Settings** > **Payment Information**.
2. Complete the **Banking Details** for receiving monthly subscription royalty disbursements.
3. Complete the **Tax Identity Interview** (W-8BEN for non-US entities or W-9 for US entities).
4. Review and accept the **Amazon Developer Services Agreement** and **In-App Purchasing Schedule**.

---

## Step 2: Configure In-App Subscription Items

The LogiXstream application defines 4 subscription tiers across 2 billing cycles (8 total SKUs) bundled into one parent subscription group.

### 2.1 Create the Subscription Group
1. From your app dashboard in Developer Console, open the **In-App Items** tab.
2. Click **Add a Subscription**.
3. Set the **Subscription Title**: `LogiXstream Subscriptions`
4. Set the **Subscription Group SKU**: `logixstream_subscription_group`
5. Click **Save**.

### 2.2 Add the 8 Subscription Terms
Under `logixstream_subscription_group`, click **Add a Subscription Term** for each plan:

| # | Plan Tier | Cycle | SKU | Term | Price (INR / USD) | Description |
|---|---|---|---|---|---|---|
| 1 | Premium | Monthly | `logixstream_premium_monthly` | 1 Month | ₹649.00 / $7.99 | 4K UHD + Spatial Audio, 4 devices |
| 2 | Premium | Annual | `logixstream_premium_annually` | 1 Year | ₹5,841.00 / $69.99 | 4K UHD + Spatial Audio, 25% annual savings |
| 3 | Standard | Monthly | `logixstream_standard_monthly` | 1 Month | ₹499.00 / $5.99 | 1080p Full HD, 2 devices |
| 4 | Standard | Annual | `logixstream_standard_annually` | 1 Year | ₹5,089.00 / $59.99 | 1080p Full HD, 15% annual savings |
| 5 | Basic | Monthly | `logixstream_basic_monthly` | 1 Month | ₹299.00 / $3.99 | 1080p Full HD, 1 device |
| 6 | Basic | Annual | `logixstream_basic_annually` | 1 Year | ₹3,229.00 / $39.99 | 1080p Full HD, 10% annual savings |
| 7 | Mobile | Monthly | `logixstream_mobile_monthly` | 1 Month | ₹149.00 / $1.99 | 480p SD, mobile & tablet only |
| 8 | Mobile | Annual | `logixstream_mobile_annually` | 1 Year | ₹1,699.00 / $19.99 | 480p SD, 5% annual savings |

*For each SKU, upload a 512x512 icon (or use the placeholder URL from `amazon.sdktester.json`).*

### 2.3 Export the Test JSON
1. On the **In-App Items** listing page, click **Export Multiple In-App Items**.
2. Download the generated JSON file.
3. Verify that the exported SKUs match your workspace's root `amazon.sdktester.json`.

---

## Step 3: Retrieve the Amazon Developer Shared Secret

The Developer Shared Secret is required by your backend server to authenticate against Amazon's **Receipt Verification Service (RVS)**.

### 3.1 Locate the Shared Secret
1. In the Amazon Developer Console, navigate to your app (`com.anil.vegaott`).
2. In the left navigation, click **Shared Key**.
3. Copy the **Developer Secret** (a 32-character hexadecimal string, e.g., `2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9`).

### 3.2 Security Rules
> [!CAUTION]
> **NEVER** place the Developer Secret in client code, React Native `.env` files, or commit it to version control. If compromised, an attacker can forge receipt verification requests.
- Store the secret in **Firebase Secret Manager**, **GCP Secret Manager**, or environment variables on your secure cloud backend server.
- Reference it securely inside backend cloud functions: `process.env.AMAZON_RVS_SHARED_SECRET`.

---

## Step 4: Set Up Local Vega App Tester on Device / Simulator

The Amazon App Tester allows you to simulate purchase flows, subscription renewals, cancellations, and product queries without creating live financial charges.

### 4.1 Install Vega App Tester
1. Download the Vega App Tester package (`AmazonAppTester.vpkg` or `.apk`) from the Amazon Developer Portal or internal Vega SDK tooling.
2. Install it onto your connected Vega device or emulator:
   ```bash
   vega app install AmazonAppTester.vpkg
   # Or using ADB if connected to an Android/Vega hybrid runtime:
   # adb install -r AmazonAppTester.apk
   ```

### 4.2 Push `amazon.sdktester.json` to the Device
The Vega App Tester reads product and subscription definitions from device storage:

```bash
# Push to the standard testing directory
vega device push ./amazon.sdktester.json /data/local/tmp/amazon.sdktester.json

# If testing on an emulator or external storage location:
# adb push ./amazon.sdktester.json /sdcard/amazon.sdktester.json
```

### 4.3 Configure App Tester Settings
1. Launch **Amazon App Tester** on the Vega device / TV.
2. Open **In-App Purchasing** settings:
   - Check that the status indicates **"Active"**.
   - Verify that all 8 SKUs appear under **Subscription Items**.
3. In **User Settings**:
   - Verify the simulated test user ID (e.g., `test_user_amzn_001`).
   - Marketplace can be set to `IN` (India) or `US`.

---

## Step 5: Backend Receipt Verification Service (RVS) Setup

Amazon requires a server-to-server call to verify that a purchase receipt is valid before granting user entitlements.

### 5.1 RVS API Endpoints

| Environment | Base URL | Shared Secret Requirement |
|---|---|---|
| **Sandbox / App Tester** | `https://appstore-sdk.amazon.com/sandbox/version/1.0/verifyReceiptId/developer/{sharedSecret}/user/{userId}/receiptId/{receiptId}` | Any non-empty string or test secret |
| **Production** | `https://appstore-sdk.amazon.com/version/1.0/verifyReceiptId/developer/{sharedSecret}/user/{userId}/receiptId/{receiptId}` | Official 32-character Shared Secret |

### 5.2 Serverless Endpoint Specification (`/verifyAmazonReceipt`)

**Request**:
```http
POST /verifyAmazonReceipt HTTP/1.1
Host: api.logixstream.com
Authorization: Bearer <Firebase_User_ID_Token>
Content-Type: application/json

{
  "receiptId": "rcpt_live_9876543210",
  "amazonUserId": "amzn_user_xyz123",
  "sku": "logixstream_premium_monthly",
  "isSandbox": false
}
```

**Backend Verification Logic (Node.js / Firebase Functions)**:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

export const verifyAmazonReceipt = functions.https.onCall(async (data, context) => {
  // 1. Authenticate user from Firebase Auth context
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }
  const uid = context.auth.uid;
  const { receiptId, amazonUserId, sku, isSandbox } = data;

  const sharedSecret = process.env.AMAZON_RVS_SHARED_SECRET || 'developerSecretPlaceholder';
  const baseUrl = isSandbox
    ? 'https://appstore-sdk.amazon.com/sandbox/version/1.0'
    : 'https://appstore-sdk.amazon.com/version/1.0';

  const rvsUrl = `${baseUrl}/verifyReceiptId/developer/${sharedSecret}/user/${amazonUserId}/receiptId/${receiptId}`;

  try {
    // 2. Call Amazon RVS
    const response = await axios.get(rvsUrl);
    const rvsData = response.data;

    // 3. Inspect receipt validity
    // For subscriptions: cancelDate === null or cancelDate in future indicates active status
    const isActive = !rvsData.cancelDate || rvsData.cancelDate > Date.now();

    if (!isActive) {
      return { success: false, reason: 'Subscription is canceled or expired' };
    }

    // 4. Update Firestore user entitlement idempotently
    const entitlementRef = db.collection('users').doc(uid);
    await entitlementRef.set({
      subscription: {
        planId: rvsData.productType === 'SUBSCRIPTION' ? sku : 'premium',
        status: 'active',
        receiptId: receiptId,
        amazonUserId: amazonUserId,
        purchaseDate: new Date(rvsData.purchaseDate).toISOString(),
        expiresAt: rvsData.renewalDate ? new Date(rvsData.renewalDate).toISOString() : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true });

    return {
      success: true,
      status: 'active',
      planId: sku,
      expiresAt: rvsData.renewalDate ? new Date(rvsData.renewalDate).toISOString() : null,
    };
  } catch (error: any) {
    console.error('RVS verification failed:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Receipt verification failed.');
  }
});
```

---

## Step 6: End-to-End Verification Checklist

Use this checklist to confirm all external components are operational before running purchases:

- [ ] **App Registration**: `com.anil.vegaott` created on Amazon Developer Console.
- [ ] **Tax & Banking**: Profile verified for royalty payouts.
- [ ] **Subscription Group**: `logixstream_subscription_group` configured with all 8 terms.
- [ ] **Shared Secret**: Developer Secret copied and configured in backend environment.
- [ ] **Test File on Device**: `amazon.sdktester.json` pushed to `/data/local/tmp/amazon.sdktester.json`.
- [ ] **App Tester Active**: Amazon App Tester launched and responding on target Vega hardware/emulator.
- [ ] **Backend Cloud Function**: `/verifyAmazonReceipt` deployed and able to resolve RVS sandbox responses.
