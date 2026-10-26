import {entitlementService} from '../src/services/entitlementService';
import {UserProfileData, getUserProfile} from '../src/services/authService';
import {UserProfile} from '../src/profiles/types/Profile';
import {HomeContentItem} from '../src/data/home';

jest.mock('../src/services/authService');

describe('EntitlementService - Centralized Entitlement Model', () => {
  const adultProfile: UserProfile = {
    id: 'prof-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'prof-kids',
    name: 'Kids User',
    avatarId: 'avatar-kids-1',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const premiumUser: UserProfileData = {
    uid: 'user-premium',
    username: 'PremiumUser',
    email: 'prem@example.com',
    subscription: 'Premium',
    city: 'Hyderabad',
    country: 'India',
  };

  const standardUser: UserProfileData = {
    uid: 'user-standard',
    username: 'StandardUser',
    email: 'std@example.com',
    subscription: 'Standard',
    city: 'Mumbai',
    country: 'India',
  };

  const freeUser: UserProfileData = {
    uid: 'user-free',
    username: 'FreeUser',
    email: 'free@example.com',
    subscription: 'Free',
    city: 'Bangalore',
    country: 'India',
  };

  const expiredUser: UserProfileData = {
    uid: 'user-expired',
    username: 'ExpiredUser',
    email: 'exp@example.com',
    subscription: 'Premium',
    subscriptionStatus: 'expired',
    subscriptionExpiresAt: new Date(Date.now() - 86400000).toISOString(),
    city: 'Delhi',
    country: 'India',
  };

  const sampleHdMovie: HomeContentItem = {
    id: 'movie-hd',
    title: 'Standard HD Movie',
    image: {uri: 'http://example.com/hd.jpg'},
    maturityRating: '13_PLUS',
  };

  const sample4kMovie: HomeContentItem = {
    id: 'movie-4k',
    title: 'Ultra 4K Movie',
    image: {uri: 'http://example.com/4k.jpg'},
    badge: '4K UHD',
    maturityRating: '13_PLUS',
  };

  const sampleFreeContent: HomeContentItem = {
    id: 'movie-free',
    title: 'Free Trailer',
    image: {uri: 'http://example.com/free.jpg'},
    badge: 'FREE',
    maturityRating: 'ALL',
  };

  const sampleAdultMovie: HomeContentItem = {
    id: 'movie-adult',
    title: 'Adult Action Thriller',
    image: {uri: 'http://example.com/adult.jpg'},
    maturityRating: '18_PLUS',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    entitlementService.clearCache();
  });

  describe('Active Entitlement & Plan Tiers', () => {
    it('resolves active Premium entitlement with 4K max quality', () => {
      const entitlement = entitlementService.resolveEntitlementFromProfile(premiumUser);
      expect(entitlement.status).toBe('active');
      expect(entitlement.tier).toBe('premium');
      expect(entitlement.maxQuality).toBe('4K');
      expect(entitlement.planName).toBe('Premium');
    });

    it('resolves active Standard entitlement with HD max quality', () => {
      const entitlement = entitlementService.resolveEntitlementFromProfile(standardUser);
      expect(entitlement.status).toBe('active');
      expect(entitlement.tier).toBe('standard');
      expect(entitlement.maxQuality).toBe('HD');
    });

    it('resolves 4K Ultra string alias to premium tier with 4K quality', () => {
      const user4k: UserProfileData = {
        ...premiumUser,
        subscription: '4K Ultra',
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(user4k);
      expect(entitlement.status).toBe('active');
      expect(entitlement.tier).toBe('premium');
      expect(entitlement.maxQuality).toBe('4K');
    });
  });

  describe('No Subscription / Free Tier', () => {
    it('resolves null profile as free with none status', () => {
      const entitlement = entitlementService.resolveEntitlementFromProfile(null);
      expect(entitlement.status).toBe('none');
      expect(entitlement.tier).toBe('free');
      expect(entitlement.maxQuality).toBe('SD');
    });

    it('resolves Free subscription string as free with none status', () => {
      const entitlement = entitlementService.resolveEntitlementFromProfile(freeUser);
      expect(entitlement.status).toBe('none');
      expect(entitlement.tier).toBe('free');
    });
  });

  describe('Expired Subscription & Date Validation', () => {
    it('identifies expired subscription when status is explicitly expired', () => {
      const entitlement = entitlementService.resolveEntitlementFromProfile(expiredUser);
      expect(entitlement.status).toBe('expired');
    });

    it('identifies expired subscription when subscriptionExpiresAt is in the past', () => {
      const pastUser: UserProfileData = {
        ...premiumUser,
        subscriptionExpiresAt: '2020-01-01T00:00:00.000Z',
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(pastUser);
      expect(entitlement.status).toBe('expired');
    });

    it('handles future expiry date as active', () => {
      const futureUser: UserProfileData = {
        ...premiumUser,
        subscriptionExpiresAt: new Date(Date.now() + 864000000).toISOString(),
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(futureUser);
      expect(entitlement.status).toBe('active');
    });

    it('handles malformed / invalid expiry date string safely without crashing', () => {
      const invalidDateUser: UserProfileData = {
        ...premiumUser,
        subscriptionExpiresAt: 'invalid-date-format-xxx',
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(invalidDateUser);
      expect(entitlement.status).toBe('active');
    });
  });

  describe('Unknown or Malformed Status Values', () => {
    it('handles missing optional fields safely', () => {
      const minimalUser: UserProfileData = {
        uid: 'user-min',
        username: 'Min',
        email: 'min@example.com',
        subscription: '',
        city: '',
        country: '',
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(minimalUser);
      expect(entitlement.status).toBe('none');
      expect(entitlement.tier).toBe('free');
    });

    it('handles unknown status string by falling back safely', () => {
      const unknownUser: any = {
        ...premiumUser,
        subscriptionStatus: 'some_weird_unknown_status',
      };
      const entitlement = entitlementService.resolveEntitlementFromProfile(unknownUser);
      expect(entitlement.status).toBe('active');
    });
  });

  describe('Content-Level Entitlement Checks', () => {
    it('grants access to free content for any user including unauthenticated', () => {
      const check = entitlementService.checkContentAccess(
        null,
        adultProfile,
        sampleFreeContent,
      );
      expect(check.isEntitled).toBe(true);
      expect(check.reason).toBe('free_content');
    });

    it('grants access to Live TV channels without subscription', () => {
      const check = entitlementService.checkContentAccess(
        null,
        adultProfile,
        sampleHdMovie,
        {isLive: true},
      );
      expect(check.isEntitled).toBe(true);
      expect(check.reason).toBe('free_content');
    });

    it('blocks unauthenticated user from protected content with auth_required', () => {
      const check = entitlementService.checkContentAccess(
        null,
        adultProfile,
        sampleHdMovie,
      );
      expect(check.isEntitled).toBe(false);
      expect(check.reason).toBe('auth_required');
    });

    it('blocks free user from protected content with not_entitled', () => {
      const check = entitlementService.checkContentAccess(
        freeUser,
        adultProfile,
        sampleHdMovie,
      );
      expect(check.isEntitled).toBe(false);
      expect(check.reason).toBe('not_entitled');
      expect(check.requiredPlan).toBe('Standard');
    });

    it('blocks expired user from protected content with expired message', () => {
      const check = entitlementService.checkContentAccess(
        expiredUser,
        adultProfile,
        sampleHdMovie,
      );
      expect(check.isEntitled).toBe(false);
      expect(check.reason).toBe('expired');
      expect(check.message).toContain('expired');
    });

    it('grants Standard user access to Standard HD content', () => {
      const check = entitlementService.checkContentAccess(
        standardUser,
        adultProfile,
        sampleHdMovie,
      );
      expect(check.isEntitled).toBe(true);
      expect(check.reason).toBe('entitled');
    });

    it('blocks Standard user from 4K UHD content with upgrade_required', () => {
      const check = entitlementService.checkContentAccess(
        standardUser,
        adultProfile,
        sample4kMovie,
      );
      expect(check.isEntitled).toBe(false);
      expect(check.reason).toBe('upgrade_required');
      expect(check.requiredPlan).toBe('Premium');
    });

    it('grants Premium user access to 4K UHD content', () => {
      const check = entitlementService.checkContentAccess(
        premiumUser,
        adultProfile,
        sample4kMovie,
      );
      expect(check.isEntitled).toBe(true);
      expect(check.reason).toBe('entitled');
    });
  });

  describe('Parental Controls & Maturity Restrictions Integration', () => {
    it('blocks Kids profile from adult content even with active Premium 4K subscription', () => {
      const check = entitlementService.checkContentAccess(
        premiumUser,
        kidsProfile,
        sampleAdultMovie,
      );
      expect(check.isEntitled).toBe(false);
      expect(check.reason).toBe('parental_restricted');
    });

    it('allows Adult profile with Premium subscription to access adult content', () => {
      const check = entitlementService.checkContentAccess(
        premiumUser,
        adultProfile,
        sampleAdultMovie,
      );
      expect(check.isEntitled).toBe(true);
    });
  });

  describe('Caching, Invalidation, and Asynchronous Handling', () => {
    it('caches entitlement result and avoids redundant backend calls', async () => {
      (getUserProfile as jest.Mock).mockResolvedValue(premiumUser);

      const first = await entitlementService.getEntitlement('user-premium');
      expect(first.planName).toBe('Premium');
      expect(getUserProfile).toHaveBeenCalledTimes(1);

      const second = await entitlementService.getEntitlement('user-premium');
      expect(second.planName).toBe('Premium');
      expect(getUserProfile).toHaveBeenCalledTimes(1);
    });

    it('refreshEntitlement bypasses cache and queries backend', async () => {
      (getUserProfile as jest.Mock).mockResolvedValue(premiumUser);

      await entitlementService.getEntitlement('user-premium');
      expect(getUserProfile).toHaveBeenCalledTimes(1);

      await entitlementService.refreshEntitlement('user-premium');
      expect(getUserProfile).toHaveBeenCalledTimes(2);
    });

    it('clearCache resets cached entitlements across account switch or logout', async () => {
      (getUserProfile as jest.Mock).mockResolvedValue(premiumUser);

      await entitlementService.getEntitlement('user-premium');
      expect(getUserProfile).toHaveBeenCalledTimes(1);

      entitlementService.clearCache();

      await entitlementService.getEntitlement('user-premium');
      expect(getUserProfile).toHaveBeenCalledTimes(2);
    });

    it('deduplicates concurrent in-flight requests for the same user', async () => {
      let resolveFn: any;
      const delayedPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      (getUserProfile as jest.Mock).mockReturnValue(delayedPromise);

      const p1 = entitlementService.getEntitlement('user-1');
      const p2 = entitlementService.getEntitlement('user-1');

      resolveFn(premiumUser);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.planName).toBe('Premium');
      expect(r2.planName).toBe('Premium');
      expect(getUserProfile).toHaveBeenCalledTimes(1);
    });

    it('handles network failure without marking active subscription as expired', async () => {
      (getUserProfile as jest.Mock).mockRejectedValue(new Error('Network request failed'));

      const result = await entitlementService.getEntitlement('user-err', premiumUser);
      expect(result.status).toBe('active');
      expect(result.planName).toBe('Premium');
    });
  });
});
