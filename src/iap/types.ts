import {BillingCycle, SubscriptionTier} from '../types/subscription';
import {MockEntitlement} from './mockEntitlementModel';

/**
 * Transient states of the purchase transaction flow.
 */
export type PurchaseFlowState =
  | 'idle'
  | 'loading_products'
  | 'ready_to_purchase'
  | 'purchasing'
  | 'purchase_successful'
  | 'user_cancelled'
  | 'purchase_failed'
  | 'restoring';

/**
 * Status of a restore purchases operation.
 */
export type RestoreStatus =
  | 'restored'
  | 'no_entitlement_found'
  | 'expired'
  | 'failed';

/**
 * Result returned by a restore purchases operation.
 */
export interface RestoreResult {
  status: RestoreStatus;
  entitlement?: MockEntitlement;
  message: string;
}

/**
 * Supported mock simulation outcomes for development testing.
 */
export type MockPurchaseScenario = 'success' | 'cancel' | 'failure';

/**
 * Failure error codes for simulated IAP transactions.
 */
export type PurchaseFailureCode =
  | 'PAYMENT_DECLINED'
  | 'USER_CANCELLED'
  | 'NETWORK_ERROR'
  | 'PRODUCT_UNAVAILABLE'
  | 'SERVICE_BUSY'
  | 'INVALID_PRODUCT'
  | 'UNKNOWN';

/**
 * Standardized purchasable product model.
 * Maps 1:1 with existing SubscriptionPlan definitions.
 */
export interface IapProduct {
  productId: string;
  planId: string;
  tier: SubscriptionTier;
  title: string;
  description: string;
  priceFormatted: string;
  priceAmount: number;
  billingCycle: BillingCycle;
  currency: string;
}

/**
 * Structured receipt and user information returned upon successful purchase from Amazon Appstore.
 * Preserved for backend Receipt Verification Service (RVS) validation during Day 5/6.
 */
export interface AmazonReceiptInfo {
  receiptId: string;
  sku: string;
  termSku?: string;
  purchaseDate: number;
  cancelDate?: number | null;
  amazonUserId?: string;
  marketplace?: string;
}

/**
 * Successful purchase result.
 */
export interface PurchaseSuccessResult {
  status: 'success';
  productId: string;
  transactionId: string;
  purchaseTime: number;
  message: string;
  receiptInfo?: AmazonReceiptInfo;
  awaitingVerification?: boolean;
}

/**
 * Explicit user cancellation result.
 */
export interface PurchaseCancelledResult {
  status: 'cancelled';
  productId: string;
  message: string;
}

/**
 * Explicit transaction failure result.
 */
export interface PurchaseFailedResult {
  status: 'failed';
  productId: string;
  errorCode: PurchaseFailureCode;
  message: string;
}

/**
 * Result when Amazon Appstore indicates the customer already owns this SKU.
 */
export interface PurchaseAlreadyPurchasedResult {
  status: 'already_purchased';
  productId: string;
  message: string;
}

/**
 * Result when transaction is pending external completion or deferred update.
 */
export interface PurchasePendingResult {
  status: 'pending';
  productId: string;
  message: string;
}

/**
 * Discriminated union of all possible purchase outcomes.
 */
export type PurchaseResult =
  | PurchaseSuccessResult
  | PurchaseCancelledResult
  | PurchaseFailedResult
  | PurchaseAlreadyPurchasedResult
  | PurchasePendingResult;

/**
 * Detailed lifecycle states for an Amazon IAP transaction.
 * Tracks the complete path from initial purchase attempt to verified entitlement.
 */
export type AmazonTransactionLifecycleState =
  | 'initiated'                // Purchase flow started, sent to Amazon Appstore
  | 'pending'                  // Transaction is pending (e.g. deferred billing update, parental approval)
  | 'awaiting_verification'   // Completed by Amazon Appstore with valid receipt, awaiting Day 6 RVS validation
  | 'verification_in_progress' // Reserved for Day 6: RVS verification currently in flight
  | 'verified'                 // Reserved for Day 6: Receipt verified via Amazon RVS
  | 'canceled'                 // Canceled by user or revoked
  | 'failed'                   // Transaction failed, rejected, or payment declined
  | 'interrupted'              // Interrupted by app termination or background transition
  | 'unknown';                 // Unrecognized or unexpected state

/**
 * Normalized transaction record tracking an Amazon IAP purchase through its full lifecycle.
 */
export interface AmazonTransactionRecord {
  /** Deterministic transaction ID: identical to Amazon receiptId */
  readonly transactionId: string;
  readonly receiptId: string;
  readonly sku: string;
  readonly termSku?: string;
  readonly planId?: string;
  readonly purchaseDate: number;
  readonly cancelDate?: number | null;
  readonly isCancelled: boolean;
  readonly isDeferred: boolean;
  readonly amazonUserId?: string;
  readonly marketplace?: string;
  /** Application account ID owning this transaction */
  readonly appUserId?: string;
  readonly lifecycleState: AmazonTransactionLifecycleState;
  readonly failureCode?: PurchaseFailureCode;
  readonly message?: string;
  readonly lastUpdated: number;
  readonly fulfilled?: boolean;
}

/**
 * Structured transaction data prepared for Day 6 Receipt Verification Service (RVS) handoff.
 */
export interface AmazonVerificationPayload {
  readonly appUserId: string;
  readonly amazonUserId: string;
  readonly receiptId: string;
  readonly sku: string;
  readonly termSku?: string;
  readonly purchaseDate: number;
  readonly marketplace: string;
  readonly currentStatus: AmazonTransactionLifecycleState;
}
