import {
  BillingCycle,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionTier,
  TIER_RANK,
} from '../types/subscription';
import {
  UserProfileData,
  updateUserProfile,
} from './authService';

export const getAvailablePlans = (): SubscriptionPlan[] => {
  return [...SUBSCRIPTION_PLANS];
};

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  const normalizedId = planId?.trim().toLowerCase();
  return SUBSCRIPTION_PLANS.find(
    (plan) => plan.id.toLowerCase() === normalizedId,
  );
};

export const getPlanByName = (name: string): SubscriptionPlan | undefined => {
  if (!name) return undefined;
  const normalizedName = name.trim().toLowerCase();
  return SUBSCRIPTION_PLANS.find(
    (plan) =>
      plan.name.toLowerCase() === normalizedName ||
      plan.id.toLowerCase() === normalizedName,
  );
};

export const normalizeTier = (subscriptionName?: string): SubscriptionTier => {
  if (!subscriptionName) {
    return 'free';
  }
  const clean = subscriptionName.trim().toLowerCase();
  if (/4k|ultra/i.test(clean)) {
    return 'premium';
  }
  if (/premium/i.test(clean)) {
    return 'premium';
  }
  if (/standard/i.test(clean)) {
    return 'standard';
  }
  if (/basic/i.test(clean)) {
    return 'basic';
  }
  if (/mobile/i.test(clean)) {
    return 'mobile';
  }
  if (/free/i.test(clean)) {
    return 'free';
  }
  return 'standard';
};

export const getSubscriptionStatus = (
  userProfile: UserProfileData | null,
): SubscriptionStatus => {
  if (!userProfile) {
    return 'none';
  }

  // If explicit subscriptionStatus is set on the document
  const rawStatus = (userProfile as any).subscriptionStatus;
  if (rawStatus) {
    const cleanStatus = String(rawStatus).toLowerCase().trim();
    if (
      cleanStatus === 'active' ||
      cleanStatus === 'expired' ||
      cleanStatus === 'canceled' ||
      cleanStatus === 'trial' ||
      cleanStatus === 'none'
    ) {
      // Check expiry date if available
      const expiry = (userProfile as any).subscriptionExpiresAt;
      if (expiry) {
        const expiryTime = new Date(expiry).getTime();
        if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
          return 'expired';
        }
      }
      return cleanStatus as SubscriptionStatus;
    }
  }

  // Check expiry date if available on profile
  const expiry = (userProfile as any).subscriptionExpiresAt;
  if (expiry) {
    const expiryTime = new Date(expiry).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return 'expired';
    }
  }

  const sub = userProfile.subscription?.trim();
  if (!sub || sub.toLowerCase() === 'free' || sub.toLowerCase() === 'none') {
    return 'none';
  }

  return 'active';
};

export const isTierSufficient = (
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier,
): boolean => {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
};

/**
 * Updates the user's subscription record in the backend (Firestore).
 * Note: Payment gateway/checkout (e.g. Amazon IAP / Google Play Billing) is not
 * yet integrated into the backend API; this updates the authoritative Firestore record.
 */
export const selectSubscriptionPlan = async (
  planId: string,
  billingCycle: BillingCycle = 'monthly',
): Promise<UserProfileData> => {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`UNKNOWN_PLAN: Plan with ID '${planId}' not found.`);
  }

  const now = new Date();
  const expires = new Date(now);
  if (billingCycle === 'annually') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setDate(expires.getDate() + 30);
  }

  const updates: any = {
    subscription: plan.name,
    subscriptionStatus: 'active',
    subscriptionStartedAt: now.toISOString(),
    subscriptionExpiresAt: expires.toISOString(),
    billingCycle,
  };

  return await updateUserProfile(updates);
};
