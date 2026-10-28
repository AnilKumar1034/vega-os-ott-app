import {BillingCycle, SubscriptionTier} from '../types/subscription';

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
  | 'purchase_failed';

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
 * Successful purchase result.
 */
export interface PurchaseSuccessResult {
  status: 'success';
  productId: string;
  transactionId: string;
  purchaseTime: number;
  message: string;
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
 * Discriminated union of all possible purchase outcomes.
 */
export type PurchaseResult =
  | PurchaseSuccessResult
  | PurchaseCancelledResult
  | PurchaseFailedResult;
