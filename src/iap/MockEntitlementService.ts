import {BillingCycle, SubscriptionPlan, SubscriptionTier, TIER_RANK} from '../types/subscription';
import {MockEntitlement, MockEntitlementStatus} from './mockEntitlementModel';

const STORAGE_KEY_PREFIX = '@vegaott/mock_entitlement_v1_';

const DEFAULT_MONTHLY_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_ANNUAL_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

const getAsyncStorage = () => {
  try {
    const mod = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native');
    return mod?.default || mod;
  } catch {
    try {
      const mod = require('@react-native-async-storage/async-storage');
      return mod?.default || mod;
    } catch {
      return null;
    }
  }
};

export class MockEntitlementService {
  private static instance: MockEntitlementService;

  // In-memory cache keyed by account userId
  private _memoryCache: Map<string, MockEntitlement> = new Map();
  private _listeners: Set<(entitlement: MockEntitlement | null) => void> = new Set();

  // Injectable clock for deterministic testing
  private _clock: () => number = () => Date.now();

  // Configurable test duration override in ms (null uses standard monthly/annual duration)
  private _testExpiryDurationMs: number | null = null;

  private constructor() {}

  public static getInstance(): MockEntitlementService {
    if (!MockEntitlementService.instance) {
      MockEntitlementService.instance = new MockEntitlementService();
    }
    return MockEntitlementService.instance;
  }

  /**
   * Injectable clock provider.
   */
  public setClock(clock: () => number): void {
    this._clock = clock;
  }

  public resetClock(): void {
    this._clock = () => Date.now();
  }

  public now(): number {
    return this._clock();
  }

  /**
   * Configurable duration override for testing expiry.
   */
  public setTestExpiryDurationMs(durationMs: number | null): void {
    this._testExpiryDurationMs = durationMs;
  }

  public getTestExpiryDurationMs(): number | null {
    return this._testExpiryDurationMs;
  }

  private _getStorageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}`;
  }

  /**
   * Dynamically evaluates whether the given entitlement is active based on current time.
   * Never trusts a stale status flag.
   */
  private _evaluateDynamicStatus(entitlement: MockEntitlement): MockEntitlement {
    const now = this.now();
    const isExpired = now >= entitlement.expiresAt;

    let dynamicStatus: MockEntitlementStatus = entitlement.status;
    if (isExpired) {
      dynamicStatus = 'expired';
    } else if (entitlement.status !== 'canceled') {
      dynamicStatus = 'active';
    }

    if (dynamicStatus !== entitlement.status || entitlement.lastVerifiedAt !== now) {
      return {
        ...entitlement,
        status: dynamicStatus,
        lastVerifiedAt: now,
      };
    }

    return entitlement;
  }

  /**
   * Grants a local mock subscription entitlement after a confirmed mock purchase.
   * Never calls Firestore or external payment gateways.
   */
  public async grantEntitlement(
    userId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle = 'monthly',
    transactionId?: string,
    customDurationMs?: number,
  ): Promise<MockEntitlement> {
    if (!userId || !userId.trim()) {
      throw new Error('INVALID_USER: Account userId is required to grant an entitlement.');
    }
    if (!plan || !plan.id) {
      throw new Error('INVALID_PLAN: A valid subscription plan is required.');
    }

    const purchasedAt = this.now();
    let duration = customDurationMs ?? this._testExpiryDurationMs;

    if (duration == null) {
      duration = billingCycle === 'annually' ? DEFAULT_ANNUAL_DURATION_MS : DEFAULT_MONTHLY_DURATION_MS;
    }

    const expiresAt = purchasedAt + duration;
    const mockTxnId =
      transactionId ||
      `mock_dev_txn_${purchasedAt}_${Math.random().toString(36).substring(2, 8)}`;

    const entitlement: MockEntitlement = {
      isMock: true,
      source: 'local_mock',
      userId: userId.trim(),
      productId: `${plan.id}_${billingCycle}`,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      billingCycle,
      status: 'active',
      purchasedAt,
      expiresAt,
      mockTransactionId: mockTxnId,
      lastVerifiedAt: purchasedAt,
    };

    // 1. Update memory cache
    this._memoryCache.set(userId, entitlement);

    // 2. Persist to local AsyncStorage safely
    try {
      const storage = getAsyncStorage();
      if (storage) {
        await storage.setItem(this._getStorageKey(userId), JSON.stringify(entitlement));
      }
    } catch (err) {
      // Log persistence warning; memory cache remains available for the session
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[MockEntitlementService] Persistence failed:', err);
      }
    }

    // 3. Notify listeners
    this._notifyListeners(entitlement);

    return entitlement;
  }

  /**
   * Retrieves the mock entitlement for a given account.
   * Reads from AsyncStorage if not cached or checks dynamic expiry.
   */
  public async getEntitlement(userId: string): Promise<MockEntitlement | null> {
    if (!userId || !userId.trim()) {
      return null;
    }

    // Check memory cache first
    let cached = this._memoryCache.get(userId);
    if (cached) {
      cached = this._evaluateDynamicStatus(cached);
      this._memoryCache.set(userId, cached);
      return cached;
    }

    // Read from AsyncStorage
    try {
      const storage = getAsyncStorage();
      if (!storage) {
        return null;
      }

      const raw = await storage.getItem(this._getStorageKey(userId));
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      // Validate structure to guard against malformed data
      if (
        !parsed ||
        parsed.isMock !== true ||
        parsed.source !== 'local_mock' ||
        parsed.userId !== userId ||
        !parsed.planId ||
        !parsed.tier ||
        typeof parsed.expiresAt !== 'number'
      ) {
        return null;
      }

      const evaluated = this._evaluateDynamicStatus(parsed as MockEntitlement);
      this._memoryCache.set(userId, evaluated);
      return evaluated;
    } catch {
      // Gracefully handle read/parse errors
      return null;
    }
  }

  /**
   * Synchronous check used during playback access verification.
   * Returns current evaluated entitlement from in-memory cache.
   */
  public getActiveEntitlementSync(userId: string): MockEntitlement | null {
    if (!userId || !userId.trim()) {
      return null;
    }
    const cached = this._memoryCache.get(userId);
    if (!cached) {
      return null;
    }

    const evaluated = this._evaluateDynamicStatus(cached);
    this._memoryCache.set(userId, evaluated);
    return evaluated;
  }

  /**
   * Evaluates if the user currently holds an active, unexpired entitlement
   * meeting or exceeding the required tier.
   */
  public isEntitledSync(userId: string, requiredTier?: SubscriptionTier): boolean {
    const entitlement = this.getActiveEntitlementSync(userId);
    if (!entitlement || entitlement.status !== 'active') {
      return false;
    }

    if (requiredTier) {
      return (TIER_RANK[entitlement.tier] || 0) >= (TIER_RANK[requiredTier] || 0);
    }

    return entitlement.tier !== 'free';
  }

  /**
   * Clears the mock entitlement for a given account.
   */
  public async clearEntitlement(userId: string): Promise<void> {
    if (!userId) return;

    this._memoryCache.delete(userId);

    try {
      const storage = getAsyncStorage();
      if (storage) {
        await storage.removeItem(this._getStorageKey(userId));
      }
    } catch {
      // ignore
    }

    this._notifyListeners(null);
  }

  /**
   * Clears all in-memory cache upon user sign-out to prevent entitlement leakage.
   */
  public clearMemoryCache(): void {
    this._memoryCache.clear();
    this._notifyListeners(null);
  }

  /**
   * Development utility to simulate subscription expiration immediately.
   */
  public async expireEntitlement(userId: string): Promise<MockEntitlement | null> {
    const entitlement = await this.getEntitlement(userId);
    if (!entitlement) return null;

    const expired: MockEntitlement = {
      ...entitlement,
      status: 'expired',
      expiresAt: this.now() - 1000,
      lastVerifiedAt: this.now(),
    };

    this._memoryCache.set(userId, expired);

    try {
      const storage = getAsyncStorage();
      if (storage) {
        await storage.setItem(this._getStorageKey(userId), JSON.stringify(expired));
      }
    } catch {
      // ignore
    }

    this._notifyListeners(expired);
    return expired;
  }

  public addListener(listener: (entitlement: MockEntitlement | null) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners(entitlement: MockEntitlement | null): void {
    this._listeners.forEach(fn => {
      try {
        fn(entitlement);
      } catch {
        // safe guard
      }
    });
  }
}

export const mockEntitlementService = MockEntitlementService.getInstance();
