export type SubscriptionTier =
  | 'mobile'
  | 'basic'
  | 'standard'
  | 'premium'
  | 'ultra4k'
  | 'free';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'canceled'
  | 'none'
  | 'trial'
  | 'unknown';

export type BillingCycle = 'monthly' | 'annually';

export type EntitlementAccessState =
  | 'loading'
  | 'entitled'
  | 'not_entitled'
  | 'expired'
  | 'verification_required'
  | 'unavailable';

export interface SubscriptionPlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceFormatted: string;
  annualPriceFormatted: string;
  savePercent: number;
  qualityLabel: string;
  resolution: string;
  maxQuality: 'SD' | 'HD' | '4K';
  features: string[];
  isMostRecommended?: boolean;
  accentColor: string;
  badgeColor: string;
}

export interface SubscriptionEntitlement {
  userId: string;
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  maxQuality: 'SD' | 'HD' | '4K';
  startedAt?: string;
  expiresAt?: string;
  isAutoRenew?: boolean;
  isCanceled?: boolean;
  billingCycle?: BillingCycle;
  lastVerifiedAt: number;
}

export interface ContentAccessCheckResult {
  state: EntitlementAccessState;
  isEntitled: boolean;
  reason?:
    | 'entitled'
    | 'free_content'
    | 'not_entitled'
    | 'expired'
    | 'upgrade_required'
    | 'auth_required'
    | 'parental_restricted'
    | 'verification_failed';
  message: string;
  requiredPlan?: string;
  requiredTier?: SubscriptionTier;
}

/**
 * Plans matching the Netflix-style UI reference screenshot:
 * 1. Premium - 4K Ultra HD + UHD, Spatial audio, 4 devices, 6 downloads, Most recommended
 * 2. Standard - 1080p, 2 devices, 2 downloads
 * 3. Basic - 1080p, 1 device, 1 download
 * 4. Mobile - 480p, mobile/tablet, 1 device, 1 download
 */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    monthlyPrice: 649,
    annualPrice: 5841,
    monthlyPriceFormatted: '₹649',
    annualPriceFormatted: '₹5,841',
    savePercent: 25,
    qualityLabel: 'Great Video & sound quality',
    resolution: '4k Ultra HD + (UHD)',
    maxQuality: '4K',
    features: [
      '4k Ultra HD + (UHD) Resolution',
      'Spatial audio added',
      'TV, computer, mobile phone, tablet',
      '4 Devices can watch at same time',
      '6 Devices allowed to download',
    ],
    isMostRecommended: true,
    accentColor: '#E50914',
    badgeColor: '#E50914',
  },
  {
    id: 'standard',
    name: 'Standard',
    tier: 'standard',
    monthlyPrice: 499,
    annualPrice: 5089,
    monthlyPriceFormatted: '₹499',
    annualPriceFormatted: '₹5,089',
    savePercent: 15,
    qualityLabel: 'Good Video & sound quality',
    resolution: '1080p',
    maxQuality: 'HD',
    features: [
      '1080p Resolution',
      'TV, computer, mobile phone, tablet',
      '2 Devices can watch at same time',
      '2 Devices allowed to download',
    ],
    accentColor: '#1E40AF',
    badgeColor: '#2563EB',
  },
  {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    monthlyPrice: 299,
    annualPrice: 3229,
    monthlyPriceFormatted: '₹299',
    annualPriceFormatted: '₹3,229',
    savePercent: 10,
    qualityLabel: 'Best Video & sound quality',
    resolution: '1080p',
    maxQuality: 'HD',
    features: [
      '1080p Resolution',
      'TV, computer, mobile phone, tablet',
      '1 Device can watch at same time',
      '1 Device allowed to download',
    ],
    accentColor: '#312E81',
    badgeColor: '#4338CA',
  },
  {
    id: 'mobile',
    name: 'Mobile',
    tier: 'mobile',
    monthlyPrice: 149,
    annualPrice: 1699,
    monthlyPriceFormatted: '₹149',
    annualPriceFormatted: '₹1,699',
    savePercent: 5,
    qualityLabel: 'Fair Video & sound quality',
    resolution: '480p',
    maxQuality: 'SD',
    features: [
      '480p Resolution',
      'Mobile phone, tablet',
      '1 Device can watch at same time',
      '1 Device allowed to download',
    ],
    accentColor: '#374151',
    badgeColor: '#4B5563',
  },
] as const;

export const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  mobile: 1,
  basic: 2,
  standard: 3,
  premium: 4,
  ultra4k: 4,
};
