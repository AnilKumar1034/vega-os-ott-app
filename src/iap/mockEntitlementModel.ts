import {
  BillingCycle,
  SubscriptionEntitlement,
  SubscriptionTier,
} from '../types/subscription';

export type MockEntitlementStatus = 'active' | 'expired' | 'canceled' | 'none';

/**
 * Strongly typed development-only mock entitlement model.
 * Clearly identified as local mock data to prevent confusion with real store transactions.
 */
export interface MockEntitlement {
  readonly isMock: true;
  readonly source: 'local_mock';
  readonly userId: string;
  readonly productId: string;
  readonly planId: string;
  readonly planName: string;
  readonly tier: SubscriptionTier;
  readonly billingCycle: BillingCycle;
  readonly status: MockEntitlementStatus;
  readonly purchasedAt: number;
  readonly expiresAt: number;
  readonly mockTransactionId: string;
  readonly lastVerifiedAt: number;
}

/**
 * Converts a MockEntitlement into the standard app-wide SubscriptionEntitlement.
 */
export const mockEntitlementToSubscriptionEntitlement = (
  mock: MockEntitlement,
): SubscriptionEntitlement => {
  let maxQuality: 'SD' | 'HD' | '4K' = 'HD';
  if (mock.tier === 'premium' || mock.tier === 'ultra4k') {
    maxQuality = '4K';
  } else if (mock.tier === 'mobile' || mock.tier === 'free') {
    maxQuality = 'SD';
  }

  return {
    userId: mock.userId,
    status: mock.status,
    planId: mock.planId,
    planName: mock.planName,
    tier: mock.tier,
    maxQuality,
    startedAt: new Date(mock.purchasedAt).toISOString(),
    expiresAt: new Date(mock.expiresAt).toISOString(),
    billingCycle: mock.billingCycle,
    isAutoRenew: false,
    isCanceled: mock.status === 'canceled',
    lastVerifiedAt: mock.lastVerifiedAt,
  };
};
