import {
  FulfillmentResult,
  NotifyFulfillmentResponseCode,
  ProductType,
  PurchaseResponseCode,
  PurchaseUpdatesResponse,
  PurchaseUpdatesResponseCode,
  Receipt,
  UserData,
} from '@amazon-devices/keplerscript-appstore-iap-lib';
import {AppState} from 'react-native';
import {
  AmazonIapTransactionProvider,
  AmazonTransactionManager,
  amazonTransactionManager,
} from '../src/iap/AmazonTransactionManager';
import {AmazonVegaIapService} from '../src/iap/AmazonVegaIapService';

describe('Day 5 — Amazon Vega OS IAP Purchase Event Handling & Transaction Lifecycle', () => {
  let manager: AmazonTransactionManager;

  const createReceipt = (overrides: Partial<Receipt> = {}): Receipt => ({
    receiptId: 'amzn_rcpt_default_123',
    sku: 'logixstream_premium_monthly',
    termSku: 'logixstream_premium_term_1',
    productType: ProductType.SUBSCRIPTION,
    purchaseDate: new Date('2026-11-03T10:00:00Z'),
    cancelDate: null as any,
    deferredDate: null as any,
    deferredSku: '',
    isCancelled: false,
    isDeferred: false,
    ...overrides,
  });

  const createUserData = (overrides: Partial<UserData> = {}): UserData => ({
    userId: 'amzn_user_456',
    marketplace: 'US',
    countryCode: 'US',
    lwaConsentStatus: 2,
    userProfileAccessConsentStatus: 2,
    ...overrides,
  });

  beforeEach(() => {
    manager = AmazonTransactionManager.getInstance();
    manager.dispose();
  });

  afterEach(() => {
    manager.dispose();
    jest.clearAllMocks();
  });

  describe('1. Transaction Listener Registration & Teardown', () => {
    it('registers a transaction listener and receives notifications on transaction updates', () => {
      const received: string[] = [];
      const unsubscribe = manager.addTransactionListener(record => {
        received.push(record.transactionId);
      });

      const receipt = createReceipt({receiptId: 'rcpt_listener_1'});
      manager.processReceipt(receipt, createUserData());

      expect(received).toContain('rcpt_listener_1');
      unsubscribe();

      // After unsubscribe, no further notifications
      manager.processReceipt(createReceipt({receiptId: 'rcpt_listener_2'}), createUserData());
      expect(received).not.toContain('rcpt_listener_2');
    });

    it('prevents duplicate registration of the exact same listener function', () => {
      let callCount = 0;
      const listener = () => {
        callCount++;
      };

      manager.addTransactionListener(listener);
      manager.addTransactionListener(listener); // duplicate registration attempt

      manager.processReceipt(createReceipt({receiptId: 'rcpt_dup_listener'}), createUserData());
      expect(callCount).toBe(1);
    });

    it('safely suppresses exceptions thrown inside listeners without crashing', () => {
      const crashingListener = () => {
        throw new Error('Listener crash explosion');
      };
      manager.addTransactionListener(crashingListener);

      expect(() => {
        manager.processReceipt(createReceipt({receiptId: 'rcpt_crash_test'}), createUserData());
      }).not.toThrow();
    });
  });

  describe('2. Purchase Event Normalization & Lifecycle States', () => {
    it('normalizes an active subscription receipt into awaiting_verification state', () => {
      const receipt = createReceipt({
        receiptId: 'rcpt_active_1',
        sku: 'logixstream_premium_monthly',
        isCancelled: false,
        isDeferred: false,
      });

      const record = manager.processReceipt(receipt, createUserData(), 'app_user_1');

      expect(record.transactionId).toBe('rcpt_active_1');
      expect(record.receiptId).toBe('rcpt_active_1');
      expect(record.sku).toBe('logixstream_premium_monthly');
      expect(record.planId).toBe('premium');
      expect(record.lifecycleState).toBe('awaiting_verification');
      expect(record.appUserId).toBe('app_user_1');
      expect(record.amazonUserId).toBe('amzn_user_456');
      expect(record.fulfilled).toBe(false);
    });

    it('normalizes a deferred subscription update into pending state', () => {
      const receipt = createReceipt({
        receiptId: 'rcpt_deferred_1',
        isDeferred: true,
        isCancelled: false,
      });

      const record = manager.processReceipt(receipt, createUserData(), 'app_user_1');
      expect(record.lifecycleState).toBe('pending');
      expect(record.isDeferred).toBe(true);
    });

    it('normalizes a canceled subscription receipt into canceled state', () => {
      const receipt = createReceipt({
        receiptId: 'rcpt_canceled_1',
        isCancelled: true,
        cancelDate: new Date('2026-11-03T11:00:00Z'),
      });

      const record = manager.processReceipt(receipt, createUserData(), 'app_user_1');
      expect(record.lifecycleState).toBe('canceled');
      expect(record.isCancelled).toBe(true);
      expect(record.cancelDate).toBeDefined();
    });

    it('records an initiated transaction prior to purchase call', () => {
      manager.setCurrentAppUserId('app_user_init');
      const record = manager.recordInitiatedTransaction('logixstream_standard_monthly');

      expect(record.lifecycleState).toBe('initiated');
      expect(record.sku).toBe('logixstream_standard_monthly');
      expect(record.planId).toBe('standard');
      expect(record.appUserId).toBe('app_user_init');
    });

    it('records a failed or user-cancelled transaction attempt', () => {
      const failed = manager.recordFailedOrCancelledTransaction(
        'logixstream_basic_monthly',
        'failed',
        'PAYMENT_DECLINED',
        'Declined by issuer',
        'app_user_fail',
      );
      expect(failed.lifecycleState).toBe('failed');
      expect(failed.failureCode).toBe('PAYMENT_DECLINED');

      const cancelled = manager.recordFailedOrCancelledTransaction(
        'logixstream_basic_monthly',
        'cancelled',
        'USER_CANCELLED',
        'User pressed back',
        'app_user_cancel',
      );
      expect(cancelled.lifecycleState).toBe('canceled');
      expect(cancelled.isCancelled).toBe(true);
    });

    it('throws when receiving a malformed receipt without a receiptId', () => {
      expect(() => {
        manager.processReceipt({} as any, createUserData());
      }).toThrow(/MALFORMED_RECEIPT/);
    });
  });

  describe('3. Duplicate Event Protection & Idempotency', () => {
    it('returns existing record and skips listener dispatch when receiving duplicate identical event', () => {
      let listenerCalls = 0;
      manager.addTransactionListener(() => {
        listenerCalls++;
      });

      const receipt = createReceipt({receiptId: 'rcpt_idempotent_1'});

      // First delivery
      const record1 = manager.processReceipt(receipt, createUserData());
      expect(listenerCalls).toBe(1);

      // Duplicate delivery with identical state
      const record2 = manager.processReceipt(receipt, createUserData());
      expect(listenerCalls).toBe(1); // Listener NOT called again
      expect(record2).toBe(record1); // Same object reference returned
    });

    it('updates record and notifies listeners when receipt transitions state (e.g. active to canceled)', () => {
      const recordsDispatched: string[] = [];
      manager.addTransactionListener(r => {
        recordsDispatched.push(`${r.receiptId}:${r.lifecycleState}`);
      });

      // Initially active
      const activeReceipt = createReceipt({
        receiptId: 'rcpt_transition_1',
        isCancelled: false,
      });
      manager.processReceipt(activeReceipt, createUserData());
      expect(recordsDispatched).toEqual(['rcpt_transition_1:awaiting_verification']);

      // Updated to canceled
      const canceledReceipt = createReceipt({
        receiptId: 'rcpt_transition_1',
        isCancelled: true,
        cancelDate: new Date('2026-11-03T11:00:00Z'),
      });
      manager.processReceipt(canceledReceipt, createUserData());
      expect(recordsDispatched).toEqual([
        'rcpt_transition_1:awaiting_verification',
        'rcpt_transition_1:canceled',
      ]);
    });

    it('processes out-of-order events idempotently without state corruption', () => {
      const receipt1 = createReceipt({receiptId: 'rcpt_ooo_1'});
      const receipt2 = createReceipt({receiptId: 'rcpt_ooo_2'});

      manager.processReceipt(receipt2, createUserData());
      manager.processReceipt(receipt1, createUserData());

      expect(manager.getTransaction('rcpt_ooo_1')).toBeDefined();
      expect(manager.getTransaction('rcpt_ooo_2')).toBeDefined();
    });
  });

  describe('4. App Backgrounding (BG -> FG) Lifecycle Handling', () => {
    it('subscribes to AppState and reconciles purchase updates when app transitions to active', async () => {
      let registeredHandler: ((state: string) => void) | null = null;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'change') {
          registeredHandler = handler;
        }
        return {remove: jest.fn()} as any;
      });

      const mockProvider: AmazonIapTransactionProvider = {
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [createReceipt({receiptId: 'rcpt_bg_fg_recovered'})],
          responseCode: PurchaseUpdatesResponseCode.SUCCESSFUL,
          userData: createUserData(),
          hasMore: false,
        } as PurchaseUpdatesResponse),
      };

      manager.setProvider(mockProvider);
      const unsubscribe = manager.startListeningToAppState('app_user_bg');

      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(registeredHandler).not.toBeNull();

      // Simulate app state transition from background to active
      registeredHandler!('active');

      // Wait a microtick for the async call to complete
      await Promise.resolve();

      expect(mockProvider.getPurchaseUpdates).toHaveBeenCalledWith({reset: false});
      const recovered = manager.getTransaction('rcpt_bg_fg_recovered');
      expect(recovered).toBeDefined();
      expect(recovered?.lifecycleState).toBe('awaiting_verification');

      unsubscribe();
    });

    it('does NOT trigger reconciliation when app state transitions to background or inactive', () => {
      let registeredHandler: ((state: string) => void) | null = null;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'change') {
          registeredHandler = handler;
        }
        return {remove: jest.fn()} as any;
      });

      const mockProvider: AmazonIapTransactionProvider = {
        getPurchaseUpdates: jest.fn(),
      };

      manager.setProvider(mockProvider);
      manager.startListeningToAppState();

      registeredHandler!('background');
      registeredHandler!('inactive');

      expect(mockProvider.getPurchaseUpdates).not.toHaveBeenCalled();
    });
  });

  describe('5. Cold Restart / Interrupted Purchase Recovery', () => {
    it('reconciles outstanding purchases on startup via getPurchaseUpdates', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [
            createReceipt({receiptId: 'rcpt_cold_1', sku: 'logixstream_premium_monthly'}),
            createReceipt({receiptId: 'rcpt_cold_2', sku: 'logixstream_standard_annually'}),
          ],
          responseCode: PurchaseUpdatesResponseCode.SUCCESSFUL,
          userData: createUserData(),
          hasMore: false,
        } as PurchaseUpdatesResponse),
      };

      manager.setProvider(mockProvider);
      const records = await manager.reconcilePurchaseUpdates(false, 'user_cold_restart');

      expect(mockProvider.getPurchaseUpdates).toHaveBeenCalledWith({reset: false});
      expect(records).toHaveLength(2);
      expect(manager.getTransaction('rcpt_cold_1')?.lifecycleState).toBe('awaiting_verification');
      expect(manager.getTransaction('rcpt_cold_2')?.lifecycleState).toBe('awaiting_verification');
    });

    it('handles getPurchaseUpdates failure gracefully without throwing', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [],
          responseCode: PurchaseUpdatesResponseCode.FAILED,
          userData: createUserData(),
          hasMore: false,
        } as PurchaseUpdatesResponse),
      };

      manager.setProvider(mockProvider);
      const records = await manager.reconcilePurchaseUpdates(false);
      expect(records).toEqual([]);
    });

    it('handles getPurchaseUpdates provider exceptions safely', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        getPurchaseUpdates: jest.fn().mockRejectedValue(new Error('Network offline during recovery')),
      };

      manager.setProvider(mockProvider);
      const records = await manager.reconcilePurchaseUpdates(false);
      expect(records).toEqual([]);
    });
  });

  describe('6. Account-Switch Isolation', () => {
    it('isolates transactions strictly to the user ID owning the purchase', () => {
      manager.processReceipt(createReceipt({receiptId: 'rcpt_user_A_1'}), createUserData(), 'user_A');
      manager.processReceipt(createReceipt({receiptId: 'rcpt_user_A_2'}), createUserData(), 'user_A');
      manager.processReceipt(createReceipt({receiptId: 'rcpt_user_B_1'}), createUserData(), 'user_B');

      const userATxns = manager.getTransactionsForUser('user_A');
      expect(userATxns).toHaveLength(2);
      expect(userATxns.map(t => t.receiptId)).toEqual(['rcpt_user_A_1', 'rcpt_user_A_2']);

      const userBTxns = manager.getTransactionsForUser('user_B');
      expect(userBTxns).toHaveLength(1);
      expect(userBTxns[0].receiptId).toBe('rcpt_user_B_1');

      // User C has no transactions
      expect(manager.getTransactionsForUser('user_C')).toEqual([]);
    });

    it('filters awaiting-verification transactions by active user', () => {
      manager.processReceipt(createReceipt({receiptId: 'rcpt_user_X'}), createUserData(), 'user_X');
      manager.processReceipt(createReceipt({receiptId: 'rcpt_user_Y'}), createUserData(), 'user_Y');

      manager.setCurrentAppUserId('user_X');
      const awaitingX = manager.getAwaitingVerificationTransactions();
      expect(awaitingX).toHaveLength(1);
      expect(awaitingX[0].receiptId).toBe('rcpt_user_X');

      manager.setCurrentAppUserId('user_Y');
      const awaitingY = manager.getAwaitingVerificationTransactions();
      expect(awaitingY).toHaveLength(1);
      expect(awaitingY[0].receiptId).toBe('rcpt_user_Y');
    });
  });

  describe('7. Transaction Completion & Acknowledgement (notifyFulfillment)', () => {
    it('invokes notifyFulfillment on provider and marks record fulfilled', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        notifyFulfillment: jest.fn().mockResolvedValue({
          responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
        }),
      };

      manager.setProvider(mockProvider);
      manager.processReceipt(createReceipt({receiptId: 'rcpt_fulfill_1'}), createUserData());

      const success = await manager.notifyFulfillment('rcpt_fulfill_1', FulfillmentResult.FULFILLED);

      expect(success).toBe(true);
      expect(mockProvider.notifyFulfillment).toHaveBeenCalledWith({
        receiptId: 'rcpt_fulfill_1',
        fulfillmentResult: FulfillmentResult.FULFILLED,
      });

      const record = manager.getTransaction('rcpt_fulfill_1');
      expect(record?.fulfilled).toBe(true);
    });

    it('prevents duplicate fulfillment calls for already fulfilled receipts', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        notifyFulfillment: jest.fn().mockResolvedValue({
          responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
        }),
      };

      manager.setProvider(mockProvider);
      manager.processReceipt(createReceipt({receiptId: 'rcpt_fulfill_dup'}), createUserData());

      // First call
      await manager.notifyFulfillment('rcpt_fulfill_dup');
      expect(mockProvider.notifyFulfillment).toHaveBeenCalledTimes(1);

      // Second call (idempotent)
      const secondCall = await manager.notifyFulfillment('rcpt_fulfill_dup');
      expect(secondCall).toBe(true);
      expect(mockProvider.notifyFulfillment).toHaveBeenCalledTimes(1); // Not called again
    });

    it('handles notifyFulfillment failures safely', async () => {
      const mockProvider: AmazonIapTransactionProvider = {
        notifyFulfillment: jest.fn().mockResolvedValue({
          responseCode: NotifyFulfillmentResponseCode.FAILED,
        }),
      };

      manager.setProvider(mockProvider);
      const success = await manager.notifyFulfillment('rcpt_fulfill_fail');
      expect(success).toBe(false);
    });
  });

  describe('8. Day 6 Verification Handoff Payload', () => {
    it('constructs a complete, typed AmazonVerificationPayload for valid transactions', () => {
      const receipt = createReceipt({
        receiptId: 'rcpt_handoff_1',
        sku: 'logixstream_premium_monthly',
        termSku: 'logixstream_premium_term_1',
      });
      const userData = createUserData({
        userId: 'amzn_user_verified',
        marketplace: 'US',
      });

      manager.processReceipt(receipt, userData, 'logix_app_user_123');

      const handoff = manager.getVerificationHandoff('rcpt_handoff_1');
      expect(handoff).toBeDefined();
      expect(handoff?.appUserId).toBe('logix_app_user_123');
      expect(handoff?.amazonUserId).toBe('amzn_user_verified');
      expect(handoff?.receiptId).toBe('rcpt_handoff_1');
      expect(handoff?.sku).toBe('logixstream_premium_monthly');
      expect(handoff?.termSku).toBe('logixstream_premium_term_1');
      expect(handoff?.marketplace).toBe('US');
      expect(handoff?.currentStatus).toBe('awaiting_verification');
    });

    it('returns undefined for non-existent transactions', () => {
      expect(manager.getVerificationHandoff('non_existent_id')).toBeUndefined();
    });
  });

  describe('9. Real Amazon Vega OS Restore Purchases Integration', () => {
    it('restores active subscriptions and returns restored status with awaiting verification', async () => {
      const service = AmazonVegaIapService.getInstance();
      service.dispose();

      const mockProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn(),
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [
            createReceipt({
              receiptId: 'rcpt_restore_active',
              sku: 'logixstream_premium_monthly',
              isCancelled: false,
            }),
          ],
          responseCode: PurchaseUpdatesResponseCode.SUCCESSFUL,
          userData: createUserData(),
          hasMore: false,
        }),
      };

      service.setPurchasingProvider(mockProvider as any);

      const restoreResult = await service.restorePurchases('user_restore_1');

      expect(restoreResult.status).toBe('restored');
      expect(restoreResult.message).toContain('queued for verification');

      // Crucial: No mock entitlement granted on real restore
      expect(restoreResult.entitlement).toBeUndefined();

      service.dispose();
    });

    it('returns expired status when all recovered subscription receipts are canceled', async () => {
      const service = AmazonVegaIapService.getInstance();
      service.dispose();

      const mockProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn(),
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [
            createReceipt({
              receiptId: 'rcpt_restore_expired',
              sku: 'logixstream_premium_monthly',
              isCancelled: true,
              cancelDate: new Date('2026-11-01T10:00:00Z'),
            }),
          ],
          responseCode: PurchaseUpdatesResponseCode.SUCCESSFUL,
          userData: createUserData(),
          hasMore: false,
        }),
      };

      service.setPurchasingProvider(mockProvider as any);

      const restoreResult = await service.restorePurchases('user_restore_expired');

      expect(restoreResult.status).toBe('expired');
      expect(restoreResult.message).toContain('has expired or was canceled');

      service.dispose();
    });

    it('returns no_entitlement_found when Amazon returns an empty receipt list', async () => {
      const service = AmazonVegaIapService.getInstance();
      service.dispose();

      const mockProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn(),
        getPurchaseUpdates: jest.fn().mockResolvedValue({
          receiptList: [],
          responseCode: PurchaseUpdatesResponseCode.SUCCESSFUL,
          userData: createUserData(),
          hasMore: false,
        }),
      };

      service.setPurchasingProvider(mockProvider as any);

      const restoreResult = await service.restorePurchases('user_no_sub');

      expect(restoreResult.status).toBe('no_entitlement_found');
      expect(restoreResult.message).toContain('No previous Amazon subscription records');

      service.dispose();
    });
  });
});
