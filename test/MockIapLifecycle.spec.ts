import {mockEntitlementService} from '../src/iap/MockEntitlementService';
import {mockIapService} from '../src/iap/MockIapService';
import {mockIapConfig} from '../src/iap/mockIapConfig';
import {entitlementService} from '../src/services/entitlementService';
import {SUBSCRIPTION_PLANS} from '../src/types/subscription';
import {HomeContentItem} from '../src/data/home';
import {UserProfile} from '../src/profiles/types/Profile';
import {UserProfileData} from '../src/services/authService';

const getAsyncStorage = () =>
  require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native').default;

describe('Day 4 — Mock IAP Restore Purchases and Subscription Lifecycle', () => {
  let currentTime = 1700000000000;

  const mockAdultProfile1: UserProfile = {
    id: 'profile-adult-1',
    name: 'Profile 1',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: currentTime,
    updatedAt: currentTime,
  };

  const mockAdultProfile2: UserProfile = {
    id: 'profile-adult-2',
    name: 'Profile 2',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: currentTime,
    updatedAt: currentTime,
  };

  const mockAccountA: UserProfileData = {
    uid: 'account-alpha-123',
    username: 'Account Alpha',
    email: 'alpha@logixstream.com',
    subscription: 'Free',
    subscriptionStatus: 'none',
    city: 'Hyderabad',
    country: 'IN',
  };

  const mockAccountB: UserProfileData = {
    uid: 'account-beta-456',
    username: 'Account Beta',
    email: 'beta@logixstream.com',
    subscription: 'Free',
    subscriptionStatus: 'none',
    city: 'Bengaluru',
    country: 'IN',
  };

  const premiumContent: HomeContentItem = {
    id: 'premium-movie-interstellar',
    title: 'Interstellar',
    image: {uri: 'https://example.com/interstellar.png'},
    videoUrl: 'https://cdn.example.com/interstellar.mp4',
    badge: 'PREMIUM',
    genre: 'Sci-Fi',
  };

  const freeContent: HomeContentItem = {
    id: 'free-trailer-sintel',
    title: 'Sintel Trailer',
    image: {uri: 'https://example.com/sintel.png'},
    videoUrl: 'https://cdn.example.com/sintel/trailer.mp4',
    badge: 'FREE',
    genre: 'Animation',
  };

  const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium')!;

  beforeEach(async () => {
    jest.useFakeTimers();
    currentTime = 1700000000000;
    mockEntitlementService.setClock(() => currentTime);
    mockEntitlementService.setTestExpiryDurationMs(null);
    mockEntitlementService.clearMemoryCache();

    const storage = getAsyncStorage();
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

  // Scenario 1: Restore an active persisted mock subscription
  describe('Scenario 1: Restore an active persisted mock subscription', () => {
    it('restores an active persisted subscription from local storage after memory cache is cleared', async () => {
      // 1. Grant subscription for Account A (30 days duration)
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_restore_001',
      );

      // 2. Clear memory cache to simulate app restart or new cold launch
      mockEntitlementService.clearMemoryCache();
      expect(mockEntitlementService.getActiveEntitlementSync(mockAccountA.uid)).toBeNull();

      // 3. Initiate restore
      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('restored');
      expect(result.entitlement).toBeDefined();
      expect(result.entitlement?.planId).toBe('premium');
      expect(result.entitlement?.status).toBe('active');
      expect(result.entitlement?.mockTransactionId).toBe('mock_txn_restore_001');

      // 4. Memory cache and sync query should now reflect the restored entitlement
      const active = mockEntitlementService.getActiveEntitlementSync(mockAccountA.uid);
      expect(active).not.toBeNull();
      expect(active?.status).toBe('active');
    });
  });

  // Scenario 2: Restore when no previous subscription exists
  describe('Scenario 2: Restore when no previous subscription exists', () => {
    it('returns no_entitlement_found when the account has no persisted mock purchase', async () => {
      const restorePromise = mockIapService.restorePurchases('unsubscribed-account-999');
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('no_entitlement_found');
      expect(result.entitlement).toBeUndefined();
      expect(result.message).toContain('No previous mock subscription found');
      expect(mockEntitlementService.getActiveEntitlementSync('unsubscribed-account-999')).toBeNull();
    });
  });

  // Scenario 3: Restore an expired subscription
  describe('Scenario 3: Restore an expired subscription', () => {
    it('restores a subscription as expired when current time is past expiresAt', async () => {
      // 1. Grant subscription with custom 5-day duration
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_expired_001',
        fiveDaysMs,
      );

      // 2. Advance time past expiry (6 days later)
      currentTime += 6 * 24 * 60 * 60 * 1000;

      // 3. Clear memory cache to simulate restart
      mockEntitlementService.clearMemoryCache();

      // 4. Restore purchases
      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('expired');
      expect(result.entitlement).toBeDefined();
      expect(result.entitlement?.status).toBe('expired');
      expect(result.message).toContain('expired');

      // Sync access check confirms not entitled
      expect(mockEntitlementService.isEntitledSync(mockAccountA.uid)).toBe(false);
    });
  });

  // Scenario 4: Restore malformed or corrupt entitlement data
  describe('Scenario 4: Restore malformed or corrupt entitlement data', () => {
    it('safely handles corrupt non-JSON data in storage without throwing an unhandled exception', async () => {
      const storage = getAsyncStorage();
      await storage.setItem(`@vegaott/mock_entitlement_v1_${mockAccountA.uid}`, '{ corrupt json string %%%');

      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('failed');
      expect(result.message).toContain('corrupt');
      expect(mockEntitlementService.getActiveEntitlementSync(mockAccountA.uid)).toBeNull();
    });

    it('safely rejects stored objects missing mandatory fields (e.g. isMock !== true or missing planId)', async () => {
      const storage = getAsyncStorage();
      const fakeMalformed = JSON.stringify({
        isMock: false,
        userId: mockAccountA.uid,
        source: 'external_unauthorized',
      });
      await storage.setItem(`@vegaott/mock_entitlement_v1_${mockAccountA.uid}`, fakeMalformed);

      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('failed');
      expect(result.message).toContain('invalid or malformed');
      expect(mockEntitlementService.getActiveEntitlementSync(mockAccountA.uid)).toBeNull();
    });
  });

  // Scenario 5: Restore does not extend subscription expiry
  describe('Scenario 5: Restore does not extend subscription expiry', () => {
    it('guarantees that restoring an entitlement preserves original expiresAt and does not extend duration', async () => {
      const initialPurchasedAt = currentTime;
      const initialDurationMs = 30 * 24 * 60 * 60 * 1000;
      const expectedExpiresAt = initialPurchasedAt + initialDurationMs;

      // 1. Grant subscription at t0
      const original = await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_no_extend',
        initialDurationMs,
      );
      expect(original.expiresAt).toBe(expectedExpiresAt);

      // 2. Advance clock by 10 days
      currentTime += 10 * 24 * 60 * 60 * 1000;

      // 3. Clear memory cache
      mockEntitlementService.clearMemoryCache();

      // 4. Restore purchases at t0 + 10 days
      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('restored');
      expect(result.entitlement?.expiresAt).toBe(expectedExpiresAt);
      expect(result.entitlement?.expiresAt).not.toBe(currentTime + initialDurationMs);
    });
  });

  // Scenario 6: Repeated restoration does not create duplicate entitlements
  describe('Scenario 6: Repeated restoration does not create duplicate entitlements', () => {
    it('repeatedly restoring the same subscription returns idempotent data with unchanged transaction ID', async () => {
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_idempotent_123',
      );

      // Restore 1
      const p1 = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const res1 = await p1;

      // Restore 2
      const p2 = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const res2 = await p2;

      expect(res1.status).toBe('restored');
      expect(res2.status).toBe('restored');
      expect(res1.entitlement?.mockTransactionId).toBe('mock_txn_idempotent_123');
      expect(res2.entitlement?.mockTransactionId).toBe('mock_txn_idempotent_123');
      expect(res1.entitlement?.expiresAt).toBe(res2.entitlement?.expiresAt);
    });
  });

  // Scenario 7: Cancel an active subscription
  describe('Scenario 7: Cancel an active subscription', () => {
    it('marks active subscription as canceled while preserving its original expiry date', async () => {
      const initialPurchasedAt = currentTime;
      const durationMs = 30 * 24 * 60 * 60 * 1000;
      const originalExpiresAt = initialPurchasedAt + durationMs;

      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_cancel_test',
        durationMs,
      );

      // Simulate user turning off auto-renew / canceling renewal
      const canceled = await mockEntitlementService.cancelEntitlement(mockAccountA.uid);

      expect(canceled).not.toBeNull();
      expect(canceled?.status).toBe('canceled');
      expect(canceled?.expiresAt).toBe(originalExpiresAt);

      // Verify persisted state in storage is updated to 'canceled'
      const storage = getAsyncStorage();
      const raw = await storage.getItem(`@vegaott/mock_entitlement_v1_${mockAccountA.uid}`);
      const parsed = JSON.parse(raw);
      expect(parsed.status).toBe('canceled');
    });

    it('returns null if no active subscription exists to cancel', async () => {
      const canceled = await mockEntitlementService.cancelEntitlement('non-existent-user');
      expect(canceled).toBeNull();
    });
  });

  // Scenario 8: Canceled but still valid subscriptions retain access under the modeled policy
  describe('Scenario 8: Canceled but still valid subscriptions retain access under the modeled policy', () => {
    it('allows premium streaming when status is canceled but current time is before expiresAt', async () => {
      const initialPurchasedAt = currentTime;
      const durationMs = 30 * 24 * 60 * 60 * 1000;

      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_canceled_valid',
        durationMs,
      );

      await mockEntitlementService.cancelEntitlement(mockAccountA.uid);

      // Current time is 10 days after purchase (20 days before expiry)
      currentTime = initialPurchasedAt + 10 * 24 * 60 * 60 * 1000;

      // 1. Sync service check
      expect(mockEntitlementService.isEntitledSync(mockAccountA.uid, 'premium')).toBe(true);

      // 2. Authoritative checkContentAccess
      const accessResult = entitlementService.checkContentAccess(
        mockAccountA,
        mockAdultProfile1,
        premiumContent,
      );

      expect(accessResult.isEntitled).toBe(true);
      expect(accessResult.state).toBe('entitled');
      expect(accessResult.reason).toBe('entitled');
    });
  });

  // Scenario 9: Expired subscriptions lose premium access
  describe('Scenario 9: Expired subscriptions lose premium access', () => {
    it('blocks premium access when current time passes expiry timestamp', async () => {
      const initialPurchasedAt = currentTime;
      const durationMs = 30 * 24 * 60 * 60 * 1000;

      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_expire_policy',
        durationMs,
      );

      // Advance time by 31 days (past expiry)
      currentTime = initialPurchasedAt + 31 * 24 * 60 * 60 * 1000;

      // Sync service check
      expect(mockEntitlementService.isEntitledSync(mockAccountA.uid, 'premium')).toBe(false);

      // Authoritative access check
      const accessResult = entitlementService.checkContentAccess(
        mockAccountA,
        mockAdultProfile1,
        premiumContent,
      );

      expect(accessResult.isEntitled).toBe(false);
      expect(accessResult.state).toBe('expired');
      expect(accessResult.reason).toBe('expired');
    });
  });

  // Scenario 10: Free content remains accessible after expiry
  describe('Scenario 10: Free content remains accessible after expiry', () => {
    it('allows playing free trailers even when the account subscription is expired', async () => {
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_free_check',
        1000,
      );

      // Advance clock past expiry
      currentTime += 50000;

      const freeAccessResult = entitlementService.checkContentAccess(
        mockAccountA,
        mockAdultProfile1,
        freeContent,
      );

      expect(freeAccessResult.isEntitled).toBe(true);
      expect(freeAccessResult.state).toBe('entitled');
      expect(freeAccessResult.reason).toBe('free_content');
    });
  });

  // Scenario 11: Account switching does not leak entitlements
  describe('Scenario 11: Account switching does not leak entitlements', () => {
    it('clears session cache on account switch so Account B does not inherit Account A entitlement', async () => {
      // 1. Account A purchases premium
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_account_a',
      );
      expect(mockEntitlementService.isEntitledSync(mockAccountA.uid)).toBe(true);

      // 2. Account A logs out -> clearMemoryCache & entitlementService.clearCache()
      entitlementService.clearCache();
      expect(mockEntitlementService.getActiveEntitlementSync(mockAccountA.uid)).toBeNull();

      // 3. Account B (unsubscribed) logs in
      expect(mockEntitlementService.getActiveEntitlementSync(mockAccountB.uid)).toBeNull();
      expect(mockEntitlementService.isEntitledSync(mockAccountB.uid)).toBe(false);

      const accessResultB = entitlementService.checkContentAccess(
        mockAccountB,
        mockAdultProfile1,
        premiumContent,
      );

      expect(accessResultB.isEntitled).toBe(false);
      expect(accessResultB.state).toBe('not_entitled');
    });
  });

  // Scenario 12: Profile switching preserves account-level subscription access
  describe('Scenario 12: Profile switching preserves account-level subscription access', () => {
    it('allows both Profile 1 and Profile 2 on Account A to access premium content', async () => {
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_shared_profiles',
      );

      // Profile 1 checks access
      const accessProfile1 = entitlementService.checkContentAccess(
        mockAccountA,
        mockAdultProfile1,
        premiumContent,
      );
      expect(accessProfile1.isEntitled).toBe(true);

      // Switch to Profile 2 on same Account A
      const accessProfile2 = entitlementService.checkContentAccess(
        mockAccountA,
        mockAdultProfile2,
        premiumContent,
      );
      expect(accessProfile2.isEntitled).toBe(true);
    });
  });

  // Scenario 13: Reset removes only the intended mock data
  describe('Scenario 13: Reset removes only the intended mock data', () => {
    it('clearing mock data for Account A leaves Account B mock data intact', async () => {
      await mockEntitlementService.grantEntitlement(
        mockAccountA.uid,
        premiumPlan,
        'monthly',
        'mock_txn_a_reset',
      );
      await mockEntitlementService.grantEntitlement(
        mockAccountB.uid,
        premiumPlan,
        'monthly',
        'mock_txn_b_keep',
      );

      // Reset Account A
      await mockEntitlementService.clearEntitlement(mockAccountA.uid);

      // Account A is cleared
      const resA = await mockEntitlementService.getEntitlement(mockAccountA.uid);
      expect(resA).toBeNull();

      // Account B is completely intact
      const resB = await mockEntitlementService.getEntitlement(mockAccountB.uid);
      expect(resB).not.toBeNull();
      expect(resB?.mockTransactionId).toBe('mock_txn_b_keep');
    });
  });

  // Scenario 14: Restore or persistence errors do not falsely report success
  describe('Scenario 14: Restore or persistence errors do not falsely report success', () => {
    it('returns status failed when AsyncStorage throws an unrecoverable disk error', async () => {
      const storage = getAsyncStorage();
      const originalGetItem = storage.getItem;
      storage.getItem = jest.fn().mockRejectedValueOnce(new Error('Disk read failure'));

      const restorePromise = mockIapService.restorePurchases(mockAccountA.uid);
      jest.advanceTimersByTime(200);
      const result = await restorePromise;

      expect(result.status).toBe('failed');
      expect(result.message).toContain('Disk read failure');

      // Restore original method
      storage.getItem = originalGetItem;
    });

    it('prevents concurrent restore requests while one restore is already in progress', async () => {
      mockIapConfig.setSimulatedDelayMs(500);

      const restoreP1 = mockIapService.restorePurchases(mockAccountA.uid);
      expect(mockIapService.isRestoring()).toBe(true);

      const restoreP2 = await mockIapService.restorePurchases(mockAccountA.uid);
      expect(restoreP2.status).toBe('failed');
      expect(restoreP2.message).toContain('already in progress');

      jest.advanceTimersByTime(500);
      await restoreP1;
      expect(mockIapService.isRestoring()).toBe(false);
    });
  });

  // Scenario 15: Production configuration cannot enable mock lifecycle controls
  describe('Scenario 15: Production configuration cannot enable mock lifecycle controls', () => {
    it('blocks mock purchase and mock restore when mockIapConfig is disabled', async () => {
      mockIapConfig.setEnabled(false);
      expect(mockIapConfig.isEnabled()).toBe(false);

      // Purchase fails
      const purchaseResult = await mockIapService.purchase('premium_monthly');
      expect(purchaseResult.status).toBe('failed');
      expect(purchaseResult.message).toContain('disabled in production');

      // Restore fails
      const restoreResult = await mockIapService.restorePurchases(mockAccountA.uid);
      expect(restoreResult.status).toBe('failed');
      expect(restoreResult.message).toContain('disabled in production');

      // Reset for future tests
      mockIapConfig.setEnabled(true);
    });
  });
});
