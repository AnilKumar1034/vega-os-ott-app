import {
  getAvailablePlans,
  getPlanById,
  getPlanByName,
  normalizeTier,
  getSubscriptionStatus,
  isTierSufficient,
  selectSubscriptionPlan,
} from '../src/services/subscriptionService';
import * as authService from '../src/services/authService';

jest.mock('../src/services/authService');

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailablePlans', () => {
    it('returns the 4 official subscription plans', () => {
      const plans = getAvailablePlans();
      expect(plans).toHaveLength(4);
      expect(plans.map((p) => p.id)).toEqual(['premium', 'standard', 'basic', 'mobile']);
    });

    it('contains valid pricing and features matching design specs', () => {
      const plans = getAvailablePlans();
      const premium = plans.find((p) => p.id === 'premium')!;
      expect(premium.monthlyPrice).toBe(649);
      expect(premium.savePercent).toBe(25);
      expect(premium.isMostRecommended).toBe(true);
      expect(premium.maxQuality).toBe('4K');
      expect(premium.features).toContain('Spatial audio added');

      const standard = plans.find((p) => p.id === 'standard')!;
      expect(standard.monthlyPrice).toBe(499);
      expect(standard.savePercent).toBe(15);
      expect(standard.maxQuality).toBe('HD');

      const basic = plans.find((p) => p.id === 'basic')!;
      expect(basic.monthlyPrice).toBe(299);
      expect(basic.savePercent).toBe(10);
      expect(basic.maxQuality).toBe('HD');

      const mobile = plans.find((p) => p.id === 'mobile')!;
      expect(mobile.monthlyPrice).toBe(149);
      expect(mobile.savePercent).toBe(5);
      expect(mobile.maxQuality).toBe('SD');
    });
  });

  describe('getPlanById', () => {
    it('finds plan by case-insensitive ID', () => {
      expect(getPlanById('PREMIUM')?.id).toBe('premium');
      expect(getPlanById('Standard')?.id).toBe('standard');
      expect(getPlanById('basic')?.id).toBe('basic');
      expect(getPlanById('MOBILE')?.id).toBe('mobile');
    });

    it('returns undefined for nonexistent or empty ID', () => {
      expect(getPlanById('non_existent')).toBeUndefined();
      expect(getPlanById('')).toBeUndefined();
    });
  });

  describe('getPlanByName', () => {
    it('finds plan by name or id case-insensitively', () => {
      expect(getPlanByName('Premium')?.id).toBe('premium');
      expect(getPlanByName('Basic')?.id).toBe('basic');
    });

    it('returns undefined when name is missing or invalid', () => {
      expect(getPlanByName('')).toBeUndefined();
      expect(getPlanByName('UnknownPlan')).toBeUndefined();
    });
  });

  describe('normalizeTier', () => {
    it('maps 4K and Ultra strings to premium tier', () => {
      expect(normalizeTier('4K Ultra HD')).toBe('premium');
      expect(normalizeTier('Ultra')).toBe('premium');
      expect(normalizeTier('Premium UHD')).toBe('premium');
    });

    it('maps standard, basic, mobile to their respective tiers', () => {
      expect(normalizeTier('Standard HD')).toBe('standard');
      expect(normalizeTier('Basic')).toBe('basic');
      expect(normalizeTier('Mobile')).toBe('mobile');
    });

    it('maps free, none or empty to free tier', () => {
      expect(normalizeTier('Free')).toBe('free');
      expect(normalizeTier('')).toBe('free');
      expect(normalizeTier(undefined)).toBe('free');
    });

    it('defaults unknown subscription strings to standard', () => {
      expect(normalizeTier('CustomTier')).toBe('standard');
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns none for null or undefined profile', () => {
      expect(getSubscriptionStatus(null)).toBe('none');
    });

    it('returns explicit status if active and not expired', () => {
      const profile: any = {
        subscriptionStatus: 'active',
        subscription: 'Premium',
        subscriptionExpiresAt: new Date(Date.now() + 100000).toISOString(),
      };
      expect(getSubscriptionStatus(profile)).toBe('active');
    });

    it('returns expired if expiry date is in the past even if status says active', () => {
      const profile: any = {
        subscriptionStatus: 'active',
        subscription: 'Premium',
        subscriptionExpiresAt: new Date(Date.now() - 100000).toISOString(),
      };
      expect(getSubscriptionStatus(profile)).toBe('expired');
    });

    it('returns none for Free or none subscription strings', () => {
      const profile: any = {
        subscription: 'Free',
      };
      expect(getSubscriptionStatus(profile)).toBe('none');

      const profile2: any = {
        subscription: 'none',
      };
      expect(getSubscriptionStatus(profile2)).toBe('none');
    });

    it('returns active for legacy profile with valid subscription name and no expiry date', () => {
      const profile: any = {
        subscription: 'Standard HD',
      };
      expect(getSubscriptionStatus(profile)).toBe('active');
    });
  });

  describe('isTierSufficient', () => {
    it('returns true when user tier meets or exceeds required tier', () => {
      expect(isTierSufficient('premium', 'basic')).toBe(true);
      expect(isTierSufficient('premium', 'premium')).toBe(true);
      expect(isTierSufficient('standard', 'basic')).toBe(true);
      expect(isTierSufficient('mobile', 'free')).toBe(true);
    });

    it('returns false when user tier is lower than required tier', () => {
      expect(isTierSufficient('basic', 'standard')).toBe(false);
      expect(isTierSufficient('basic', 'premium')).toBe(false);
      expect(isTierSufficient('free', 'mobile')).toBe(false);
    });
  });

  describe('selectSubscriptionPlan', () => {
    it('throws when plan ID is unknown', async () => {
      await expect(selectSubscriptionPlan('unknown_id')).rejects.toThrow('UNKNOWN_PLAN');
    });

    it('updates user profile in Firestore with monthly billing cycle', async () => {
      const mockUpdatedProfile: any = {
        username: 'Test User',
        subscription: 'Premium',
        subscriptionStatus: 'active',
      };
      (authService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const result = await selectSubscriptionPlan('premium', 'monthly');

      expect(authService.updateUserProfile).toHaveBeenCalledTimes(1);
      const updatePayload = (authService.updateUserProfile as jest.Mock).mock.calls[0][0];
      expect(updatePayload.subscription).toBe('Premium');
      expect(updatePayload.subscriptionStatus).toBe('active');
      expect(updatePayload.billingCycle).toBe('monthly');
      expect(updatePayload.subscriptionStartedAt).toBeDefined();
      expect(updatePayload.subscriptionExpiresAt).toBeDefined();

      const startTime = new Date(updatePayload.subscriptionStartedAt).getTime();
      const expiryTime = new Date(updatePayload.subscriptionExpiresAt).getTime();
      const diffDays = Math.round((expiryTime - startTime) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
      expect(result).toBe(mockUpdatedProfile);
    });

    it('updates user profile in Firestore with annual billing cycle', async () => {
      const mockUpdatedProfile: any = {
        username: 'Test User',
        subscription: 'Basic',
        subscriptionStatus: 'active',
      };
      (authService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      await selectSubscriptionPlan('basic', 'annually');

      expect(authService.updateUserProfile).toHaveBeenCalledTimes(1);
      const updatePayload = (authService.updateUserProfile as jest.Mock).mock.calls[0][0];
      expect(updatePayload.subscription).toBe('Basic');
      expect(updatePayload.billingCycle).toBe('annually');

      const startTime = new Date(updatePayload.subscriptionStartedAt);
      const expiryTime = new Date(updatePayload.subscriptionExpiresAt);
      expect(expiryTime.getFullYear()).toBe(startTime.getFullYear() + 1);
    });
  });
});
