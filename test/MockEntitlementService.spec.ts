import {mockEntitlementService} from '../src/iap/MockEntitlementService';
import {mockIapService} from '../src/iap/MockIapService';
import {mockIapConfig} from '../src/iap/mockIapConfig';
import {entitlementService} from '../src/services/entitlementService';
import {SUBSCRIPTION_PLANS} from '../src/types/subscription';
import {HomeContentItem} from '../src/data/home';
import {UserProfile} from '../src/profiles/types/Profile';
import {UserProfileData} from '../src/services/authService';

describe('MockEntitlementService & Premium Access Integration (Day 3)', () => {
  let currentTime = 1700000000000;

  const mockAdultProfile: UserProfile = {
    id: 'profile-adult-1',
    name: 'Adult Profile',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: currentTime,
    updatedAt: currentTime,
  };

  const mockAdultProfile2: UserProfile = {
    id: 'profile-adult-2',
    name: 'Adult Profile 2',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: currentTime,
    updatedAt: currentTime,
  };

  const mockUserAccount: UserProfileData = {
    uid: 'account-user-123',
    username: 'Test User',
    email: 'test@logixstream.com',
    subscription: 'Free',
    subscriptionStatus: 'none',
    city: 'Hyderabad',
    country: 'IN',
  };

  const mockSecondUserAccount: UserProfileData = {
    uid: 'account-user-456',
    username: 'Other User',
    email: 'other@logixstream.com',
    subscription: 'Free',
    subscriptionStatus: 'none',
    city: 'Mumbai',
    country: 'IN',
  };

  const premiumMovie: HomeContentItem = {
    id: 'inception',
    title: 'Inception',
    image: {uri: 'https://example.com/inception.png'},
    videoUrl: 'https://cdn.example.com/inception.mp4',
    badge: 'PREMIUM',
    genre: 'Sci-Fi',
  };

  const uhd4kMovie: HomeContentItem = {
    id: 'global-blockbusters-avatar',
    title: 'Avatar',
    image: {uri: 'https://example.com/avatar.png'},
    videoUrl: 'https://cdn.example.com/avatar.mp4',
    badge: '4K UHD',
    genre: 'Sci-Fi',
  };

  const freeMovie: HomeContentItem = {
    id: 'bunny-trailer',
    title: 'Big Buck Bunny Trailer',
    image: {uri: 'https://example.com/bunny.png'},
    videoUrl: 'https://cdn.example.com/bunny/trailer.mp4',
    badge: 'FREE',
    genre: 'Animation',
  };

  const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium')!;
  const standardPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'standard')!;

  beforeEach(async () => {
    jest.useFakeTimers();
    currentTime = 1700000000000;
    mockEntitlementService.setClock(() => currentTime);
    mockEntitlementService.setTestExpiryDurationMs(null);
    mockEntitlementService.clearMemoryCache();
    const storage = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native').default;
    if (storage?.clear) {
      await storage.clear();
    }
    entitlementService.clearCache();
    mockIapConfig.reset();
    mockIapConfig.setEnabled(true);
    mockIapConfig.setSimulatedDelayMs(200);
    mockIapService.resetState();
  });

  afterEach(() => {
    mockEntitlementService.resetClock();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('1. Successful Mock Purchase Grants Entitlement', () => {
    it('grants an active local mock entitlement after a successful simulated purchase', async () => {
      mockIapConfig.setScenario('success');

      const purchasePromise = mockIapService.purchase('premium_monthly');
      jest.advanceTimersByTime(200);
      const purchaseResult = await purchasePromise;

      expect(purchaseResult.status).toBe('success');

      if (purchaseResult.status === 'success') {
        const entitlement = await mockEntitlementService.grantEntitlement(
          mockUserAccount.uid,
          premiumPlan,
          'monthly',
          purchaseResult.transactionId,
        );

        expect(entitlement.isMock).toBe(true);
        expect(entitlement.source).toBe('local_mock');
        expect(entitlement.userId).toBe(mockUserAccount.uid);
        expect(entitlement.planId).toBe('premium');
        expect(entitlement.tier).toBe('premium');
        expect(entitlement.status).toBe('active');
        expect(entitlement.mockTransactionId).toBe(purchaseResult.transactionId);

        // Verify active sync check
        expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(true);
      }
    });
  });

  describe('2. Cancellation Does Not Grant Entitlement', () => {
    it('does not grant an entitlement when the simulated purchase is cancelled', async () => {
      mockIapConfig.setScenario('cancel');

      const purchasePromise = mockIapService.purchase('premium_monthly');
      jest.advanceTimersByTime(200);
      const purchaseResult = await purchasePromise;

      expect(purchaseResult.status).toBe('cancelled');

      // No entitlement should exist for user
      const existing = await mockEntitlementService.getEntitlement(mockUserAccount.uid);
      expect(existing).toBeNull();
      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(false);
    });
  });

  describe('3. Failure Does Not Grant Entitlement', () => {
    it('does not grant an entitlement when the simulated purchase fails', async () => {
      mockIapConfig.setScenario('failure');

      const purchasePromise = mockIapService.purchase('standard_monthly');
      jest.advanceTimersByTime(200);
      const purchaseResult = await purchasePromise;

      expect(purchaseResult.status).toBe('failed');

      const existing = await mockEntitlementService.getEntitlement(mockUserAccount.uid);
      expect(existing).toBeNull();
      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(false);
    });
  });

  describe('4. Unknown Product IDs Cannot Grant Entitlement', () => {
    it('rejects purchase for unknown product and rejects grant without valid plan', async () => {
      const purchaseResult = await mockIapService.purchase('unknown_plan_xyz');
      expect(purchaseResult.status).toBe('failed');

      await expect(
        mockEntitlementService.grantEntitlement(mockUserAccount.uid, null as any),
      ).rejects.toThrow('INVALID_PLAN');
    });
  });

  describe('5. Active Entitlement Permits Premium-Content Access', () => {
    it('unlocks premium content when a valid active mock entitlement exists', async () => {
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        premiumPlan,
        'monthly',
      );

      const access = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        premiumMovie,
      );

      expect(access.isEntitled).toBe(true);
      expect(access.state).toBe('entitled');
      expect(access.reason).toBe('entitled');
      expect(access.message).toBe('Access granted.');

      // Also verifies 4K UHD content since tier is Premium
      const uhdAccess = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        uhd4kMovie,
      );
      expect(uhdAccess.isEntitled).toBe(true);
      expect(uhdAccess.state).toBe('entitled');
    });
  });

  describe('6. Missing Entitlement Blocks Premium-Content Access', () => {
    it('blocks access to protected content when user has no active entitlement', () => {
      const access = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        premiumMovie,
      );

      expect(access.isEntitled).toBe(false);
      expect(access.state).toBe('not_entitled');
      expect(access.reason).toBe('not_entitled');
      expect(access.message).toContain('subscription is required');
    });
  });

  describe('7. Expired Entitlement Blocks Premium-Content Access', () => {
    it('blocks access and prompts renewal when the entitlement has expired', async () => {
      const durationMs = 10000; // 10 seconds
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        standardPlan,
        'monthly',
        undefined,
        durationMs,
      );

      // Verify active at t = 0
      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(true);

      // Advance clock past expiration
      currentTime += 15000;

      const access = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        premiumMovie,
      );

      expect(access.isEntitled).toBe(false);
      expect(access.state).toBe('expired');
      expect(access.reason).toBe('expired');
      expect(access.message).toContain('subscription has expired');
    });
  });

  describe('8. Free Content Remains Accessible Without a Subscription', () => {
    it('allows access to free content even without an active subscription', () => {
      const access = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        freeMovie,
      );

      expect(access.isEntitled).toBe(true);
      expect(access.state).toBe('entitled');
      expect(access.reason).toBe('free_content');
    });
  });

  describe('9. Switching Profiles Does Not Remove Account-Level Access', () => {
    it('shares account-level mock entitlement across different profiles of the same account', async () => {
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        standardPlan,
        'monthly',
      );

      // Access from Profile 1
      const accessProfile1 = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        premiumMovie,
      );
      expect(accessProfile1.isEntitled).toBe(true);

      // Switch to Profile 2 on same account
      const accessProfile2 = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile2,
        premiumMovie,
      );
      expect(accessProfile2.isEntitled).toBe(true);
    });
  });

  describe('10. Switching Accounts Does Not Leak Entitlements', () => {
    it('ensures signing out and switching accounts does not leak entitlement data', async () => {
      // Account 1 subscribes to Premium
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        premiumPlan,
        'monthly',
      );
      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(true);

      // Account 1 signs out: memory cache is cleared
      mockEntitlementService.clearMemoryCache();
      entitlementService.clearCache();

      // Account 2 signs in without a subscription
      expect(mockEntitlementService.isEntitledSync(mockSecondUserAccount.uid)).toBe(false);

      const accessAccount2 = entitlementService.checkContentAccess(
        mockSecondUserAccount,
        mockAdultProfile,
        premiumMovie,
      );
      expect(accessAccount2.isEntitled).toBe(false);
      expect(accessAccount2.state).toBe('not_entitled');
    });
  });

  describe('11. Malformed Persisted Data Is Handled Safely', () => {
    it('handles malformed JSON or invalid persisted records gracefully', async () => {
      const storage = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native').default;
      await storage.setItem(`@vegaott/mock_entitlement_v1_${mockUserAccount.uid}`, '{"garbage": true}');

      mockEntitlementService.clearMemoryCache();
      const entitlement = await mockEntitlementService.getEntitlement(mockUserAccount.uid);

      expect(entitlement).toBeNull();
      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(false);
    });
  });

  describe('12. Persistence Failure Does Not Falsely Report Durable Entitlement', () => {
    it('handles persistence write rejection gracefully', async () => {
      const storage = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native').default;
      const setItemSpy = jest.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('Disk Full'));

      // Grant still completes in-memory for the session without throwing unhandled rejection
      const entitlement = await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        standardPlan,
        'monthly',
      );
      expect(entitlement.status).toBe('active');

      // Clear memory cache to simulate app restart after failed persistence
      mockEntitlementService.clearMemoryCache();
      const reloaded = await mockEntitlementService.getEntitlement(mockUserAccount.uid);
      expect(reloaded).toBeNull();

      setItemSpy.mockRestore();
    });
  });

  describe('13. Entitlement Expiry Is Reflected When Access Is Checked', () => {
    it('dynamically flips status to expired during access check without manual trigger', async () => {
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        standardPlan,
        'monthly',
        undefined,
        60000, // 60 seconds
      );

      // t = 10s: still active
      currentTime += 10000;
      expect(
        entitlementService.checkContentAccess(mockUserAccount, mockAdultProfile, premiumMovie).isEntitled,
      ).toBe(true);

      // t = 70s: passed expiry
      currentTime += 60000;
      const accessAfterExpiry = entitlementService.checkContentAccess(
        mockUserAccount,
        mockAdultProfile,
        premiumMovie,
      );

      expect(accessAfterExpiry.isEntitled).toBe(false);
      expect(accessAfterExpiry.state).toBe('expired');
    });
  });

  describe('14. Resetting Test Data Clears Only the Intended Mock Entitlement', () => {
    it('clears target user entitlement while leaving other accounts intact', async () => {
      await mockEntitlementService.grantEntitlement(
        mockUserAccount.uid,
        premiumPlan,
        'monthly',
      );
      await mockEntitlementService.grantEntitlement(
        mockSecondUserAccount.uid,
        standardPlan,
        'monthly',
      );

      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(true);
      expect(mockEntitlementService.isEntitledSync(mockSecondUserAccount.uid)).toBe(true);

      // Clear only User 1
      await mockEntitlementService.clearEntitlement(mockUserAccount.uid);

      expect(mockEntitlementService.isEntitledSync(mockUserAccount.uid)).toBe(false);
      expect(mockEntitlementService.isEntitledSync(mockSecondUserAccount.uid)).toBe(true);
    });
  });
});
