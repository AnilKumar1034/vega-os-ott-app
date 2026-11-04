import {
  FulfillmentResult,
  NotifyFulfillmentRequest,
  NotifyFulfillmentResponse,
  NotifyFulfillmentResponseCode,
  PurchaseResponse,
  PurchaseResponseCode,
  PurchaseUpdatesRequest,
  PurchaseUpdatesResponse,
  PurchaseUpdatesResponseCode,
  PurchasingService,
  Receipt,
  UserData,
} from '@amazon-devices/keplerscript-appstore-iap-lib';
import {AppState, AppStateStatus} from 'react-native';
import {
  AmazonReceiptInfo,
  AmazonTransactionLifecycleState,
  AmazonTransactionRecord,
  AmazonVerificationPayload,
  PurchaseFailureCode,
} from './types';
import {getDefinitionBySku} from './amazonProductConfig';

export interface AmazonIapTransactionProvider {
  getPurchaseUpdates?(request: PurchaseUpdatesRequest): Promise<PurchaseUpdatesResponse>;
  notifyFulfillment?(request: NotifyFulfillmentRequest): Promise<NotifyFulfillmentResponse>;
  getUserData?(request?: {fetchUserProfileAccessConsentStatus?: boolean}): Promise<any>;
}

/**
 * Amazon Vega OS Transaction Lifecycle & Event Processing Manager.
 * Responsibilities:
 * - Manages asynchronous purchase events and lifecycle reconciliation.
 * - Enforces idempotency and duplicate-event suppression via deterministic Amazon receipt IDs.
 * - Handles app backgrounding (BG -> FG) and restart recovery using official getPurchaseUpdates API.
 * - Enforces account-switch isolation by scoping transactions to the active application user.
 * - Manages transaction completion / acknowledgement (notifyFulfillment) with duplicate prevention.
 * - Prepares structured transaction payloads for Day 6 trusted receipt verification (RVS).
 */
export class AmazonTransactionManager {
  private static instance: AmazonTransactionManager;

  private _transactions: Map<string, AmazonTransactionRecord> = new Map();
  private _fulfilledReceipts: Set<string> = new Set();
  private _listeners: Set<(record: AmazonTransactionRecord) => void> = new Set();
  private _appStateSubscription: any = null;
  private _isReconciling: boolean = false;
  private _provider: AmazonIapTransactionProvider = PurchasingService;
  private _currentAppUserId: string | null = null;

  private constructor() {}

  public static getInstance(): AmazonTransactionManager {
    if (!AmazonTransactionManager.instance) {
      AmazonTransactionManager.instance = new AmazonTransactionManager();
    }
    return AmazonTransactionManager.instance;
  }

  /**
   * Injects an alternate purchasing provider for testing and sandbox simulation.
   */
  public setProvider(provider: AmazonIapTransactionProvider): void {
    this._provider = provider;
  }

  public resetProvider(): void {
    this._provider = PurchasingService;
  }

  /**
   * Sets the current authenticated application user ID for transaction scoping.
   */
  public setCurrentAppUserId(userId: string | null): void {
    this._currentAppUserId = userId;
  }

  public getCurrentAppUserId(): string | null {
    return this._currentAppUserId;
  }

  /**
   * Registers a listener for transaction lifecycle state changes.
   * Duplicate listener instances are automatically prevented by Set semantics.
   * Returns an unsubscription callback.
   */
  public addTransactionListener(
    listener: (record: AmazonTransactionRecord) => void,
  ): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners(record: AmazonTransactionRecord): void {
    this._listeners.forEach(fn => {
      try {
        fn(record);
      } catch (err) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonTransactionManager] Transaction listener exception:', err);
        }
      }
    });
  }

  /**
   * Subscribes to application lifecycle events (AppState BG -> FG).
   * Automatically triggers getPurchaseUpdates reconciliation when the app transitions to 'active'.
   */
  public startListeningToAppState(appUserId?: string): () => void {
    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
      this._appStateSubscription = null;
    }

    const effectiveUserId = appUserId || this._currentAppUserId;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(
            '[AmazonTransactionManager] App became active (BG -> FG). Reconciling purchase updates...',
          );
        }
        this.reconcilePurchaseUpdates(false, effectiveUserId || undefined).catch(() => {});
      }
    };

    try {
      this._appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[AmazonTransactionManager] Failed to subscribe to AppState:', err);
      }
    }

    return () => {
      if (this._appStateSubscription) {
        try {
          this._appStateSubscription.remove();
        } catch {}
        this._appStateSubscription = null;
      }
    };
  }

  /**
   * Records an in-flight transaction attempt before calling Amazon PurchasingService.purchase.
   */
  public recordInitiatedTransaction(
    canonicalSku: string,
    appUserId?: string,
  ): AmazonTransactionRecord {
    const effectiveAppUserId = appUserId || this._currentAppUserId || undefined;
    const def = getDefinitionBySku(canonicalSku);
    const tempId = `init_${canonicalSku}_${Date.now()}`;

    const record: AmazonTransactionRecord = {
      transactionId: tempId,
      receiptId: tempId,
      sku: canonicalSku,
      planId: def?.planId,
      purchaseDate: Date.now(),
      cancelDate: null,
      isCancelled: false,
      isDeferred: false,
      appUserId: effectiveAppUserId,
      lifecycleState: 'initiated',
      lastUpdated: Date.now(),
      fulfilled: false,
    };

    this._transactions.set(tempId, record);
    this._notifyListeners(record);
    return record;
  }

  /**
   * Records a terminal failure or user cancellation for a purchase attempt.
   */
  public recordFailedOrCancelledTransaction(
    canonicalSku: string,
    status: 'failed' | 'cancelled',
    errorCode?: PurchaseFailureCode,
    message?: string,
    appUserId?: string,
  ): AmazonTransactionRecord {
    const effectiveAppUserId = appUserId || this._currentAppUserId || undefined;
    const def = getDefinitionBySku(canonicalSku);
    const tempId = `err_${canonicalSku}_${Date.now()}`;
    const lifecycleState: AmazonTransactionLifecycleState =
      status === 'cancelled' ? 'canceled' : 'failed';

    const record: AmazonTransactionRecord = {
      transactionId: tempId,
      receiptId: tempId,
      sku: canonicalSku,
      planId: def?.planId,
      purchaseDate: Date.now(),
      cancelDate: null,
      isCancelled: status === 'cancelled',
      isDeferred: false,
      appUserId: effectiveAppUserId,
      lifecycleState,
      failureCode: errorCode,
      message,
      lastUpdated: Date.now(),
      fulfilled: false,
    };

    this._transactions.set(tempId, record);
    this._notifyListeners(record);
    return record;
  }

  /**
   * Normalizes an Amazon Receipt into an internal AmazonTransactionRecord with duplicate protection.
   */
  public processReceipt(
    receipt: Receipt,
    userData?: UserData,
    appUserId?: string,
  ): AmazonTransactionRecord {
    if (!receipt || !receipt.receiptId) {
      throw new Error('MALFORMED_RECEIPT: Missing receiptId in Amazon receipt.');
    }

    const receiptId = receipt.receiptId;
    const existing = this._transactions.get(receiptId);
    const def = getDefinitionBySku(receipt.sku);
    const effectiveAppUserId = appUserId || existing?.appUserId || this._currentAppUserId || undefined;

    // Determine target lifecycle state from Amazon receipt flags
    let targetState: AmazonTransactionLifecycleState = 'awaiting_verification';
    if (receipt.isCancelled) {
      targetState = 'canceled';
    } else if (receipt.isDeferred) {
      targetState = 'pending';
    }

    const purchaseTime = receipt.purchaseDate
      ? new Date(receipt.purchaseDate).getTime()
      : Date.now();
    const cancelTime = receipt.cancelDate
      ? new Date(receipt.cancelDate).getTime()
      : null;

    // Idempotency: If receipt was already processed with identical state, return existing record
    if (existing && existing.lifecycleState === targetState) {
      return existing;
    }

    const record: AmazonTransactionRecord = {
      transactionId: receiptId,
      receiptId,
      sku: receipt.sku,
      termSku: receipt.termSku,
      planId: def?.planId || receipt.sku.split('_')[1],
      purchaseDate: purchaseTime,
      cancelDate: cancelTime,
      isCancelled: Boolean(receipt.isCancelled),
      isDeferred: Boolean(receipt.isDeferred),
      amazonUserId: userData?.userId || existing?.amazonUserId,
      marketplace: userData?.marketplace || existing?.marketplace,
      appUserId: effectiveAppUserId,
      lifecycleState: targetState,
      lastUpdated: Date.now(),
      fulfilled: existing ? existing.fulfilled : this._fulfilledReceipts.has(receiptId),
    };

    this._transactions.set(receiptId, record);
    this._notifyListeners(record);
    return record;
  }

  /**
   * Processes a direct PurchaseResponse from PurchasingService.purchase.
   */
  public processPurchaseResponse(
    response: PurchaseResponse,
    canonicalSku: string,
    appUserId?: string,
  ): AmazonTransactionRecord | null {
    if (!response) {
      return this.recordFailedOrCancelledTransaction(
        canonicalSku,
        'failed',
        'UNKNOWN',
        'Amazon Appstore returned an empty purchase response.',
        appUserId,
      );
    }

    switch (response.responseCode) {
      case PurchaseResponseCode.SUCCESSFUL: {
        if (!response.receipt) {
          return this.recordFailedOrCancelledTransaction(
            canonicalSku,
            'failed',
            'UNKNOWN',
            'Amazon Appstore returned SUCCESSFUL but receipt was missing.',
            appUserId,
          );
        }
        return this.processReceipt(response.receipt, response.userData, appUserId);
      }

      case PurchaseResponseCode.ALREADY_PURCHASED: {
        return this.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'UNKNOWN',
          'Item already purchased on Amazon account.',
          appUserId,
        );
      }

      case PurchaseResponseCode.INVALID_SKU: {
        return this.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'INVALID_PRODUCT',
          `Amazon Appstore rejected SKU '${canonicalSku}' as invalid.`,
          appUserId,
        );
      }

      case PurchaseResponseCode.NOT_SUPPORTED: {
        return this.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'PRODUCT_UNAVAILABLE',
          'Amazon In-App Purchasing is not supported on this device or runtime.',
          appUserId,
        );
      }

      case PurchaseResponseCode.FAILED:
      default: {
        return this.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'PAYMENT_DECLINED',
          'Purchase transaction failed or was declined by Amazon Appstore.',
          appUserId,
        );
      }
    }
  }

  /**
   * Reconciles purchase updates from Amazon Appstore using getPurchaseUpdates.
   * Used on app startup (cold recovery), app resume (BG -> FG), and manual restore.
   */
  public async reconcilePurchaseUpdates(
    reset: boolean = false,
    appUserId?: string,
  ): Promise<AmazonTransactionRecord[]> {
    if (this._isReconciling) {
      return this.getTransactionsForUser(appUserId || this._currentAppUserId || '');
    }

    if (typeof this._provider.getPurchaseUpdates !== 'function') {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[AmazonTransactionManager] PurchasingService.getPurchaseUpdates is not supported on this provider.',
        );
      }
      return [];
    }

    this._isReconciling = true;
    const effectiveAppUserId = appUserId || this._currentAppUserId || undefined;
    const updatedRecords: AmazonTransactionRecord[] = [];

    try {
      const response = await this._provider.getPurchaseUpdates({reset});

      if (!response) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonTransactionManager] getPurchaseUpdates returned empty response.');
        }
        return [];
      }

      if (response.responseCode === PurchaseUpdatesResponseCode.SUCCESSFUL) {
        const receiptList = Array.isArray(response.receiptList) ? response.receiptList : [];

        for (const receipt of receiptList) {
          if (receipt && receipt.receiptId) {
            try {
              const record = this.processReceipt(receipt, response.userData, effectiveAppUserId);
              updatedRecords.push(record);
            } catch (err) {
              if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('[AmazonTransactionManager] Failed to process receipt:', err);
              }
            }
          }
        }
      } else if (response.responseCode === PurchaseUpdatesResponseCode.NOT_SUPPORTED) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonTransactionManager] getPurchaseUpdates is NOT_SUPPORTED on runtime.');
        }
      } else if (response.responseCode === PurchaseUpdatesResponseCode.FAILED) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonTransactionManager] getPurchaseUpdates returned FAILED status.');
        }
      }
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[AmazonTransactionManager] Exception during reconcilePurchaseUpdates:', err);
      }
    } finally {
      this._isReconciling = false;
    }

    return updatedRecords;
  }

  /**
   * Notifies Amazon Appstore about purchase fulfillment (notifyFulfillment).
   * Guarded with duplicate prevention to avoid duplicate fulfillment calls.
   *
   * IMPORTANT: In accordance with zero-trust architecture, notifyFulfillment
   * MUST NOT be called until Day 6 trusted receipt verification succeeds.
   */
  public async notifyFulfillment(
    receiptId: string,
    result: FulfillmentResult = FulfillmentResult.FULFILLED,
  ): Promise<boolean> {
    if (!receiptId || typeof receiptId !== 'string') {
      return false;
    }

    // Idempotency check: prevent duplicate fulfillment requests
    if (this._fulfilledReceipts.has(receiptId)) {
      return true;
    }

    if (typeof this._provider.notifyFulfillment !== 'function') {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[AmazonTransactionManager] PurchasingService.notifyFulfillment is not supported on this provider.',
        );
      }
      return false;
    }

    try {
      const response = await this._provider.notifyFulfillment({
        receiptId,
        fulfillmentResult: result,
      });

      if (
        response &&
        response.responseCode === NotifyFulfillmentResponseCode.SUCCESSFUL
      ) {
        this._fulfilledReceipts.add(receiptId);
        const existing = this._transactions.get(receiptId);
        if (existing) {
          const updated: AmazonTransactionRecord = {
            ...existing,
            fulfilled: true,
            lastUpdated: Date.now(),
          };
          this._transactions.set(receiptId, updated);
          this._notifyListeners(updated);
        }
        return true;
      }
      return false;
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[AmazonTransactionManager] notifyFulfillment error:', err);
      }
      return false;
    }
  }

  /**
   * Retrieves all transaction records associated with a specific application user ID.
   * Enforces strict account-switch isolation.
   */
  public getTransactionsForUser(appUserId: string): AmazonTransactionRecord[] {
    if (!appUserId) return [];
    const results: AmazonTransactionRecord[] = [];
    this._transactions.forEach(record => {
      if (record.appUserId === appUserId) {
        results.push(record);
      }
    });
    return results;
  }

  /**
   * Retrieves all transactions across the registry.
   */
  public getAllTransactions(): AmazonTransactionRecord[] {
    return Array.from(this._transactions.values());
  }

  /**
   * Retrieves a specific transaction record by its receiptId / transactionId.
   */
  public getTransaction(receiptId: string): AmazonTransactionRecord | undefined {
    return this._transactions.get(receiptId);
  }

  /**
   * Returns all transactions currently in 'awaiting_verification' state.
   */
  public getAwaitingVerificationTransactions(
    appUserId?: string,
  ): AmazonTransactionRecord[] {
    const targetUserId = appUserId || this._currentAppUserId;
    return this.getAllTransactions().filter(record => {
      const stateMatch = record.lifecycleState === 'awaiting_verification';
      const userMatch = targetUserId ? record.appUserId === targetUserId : true;
      return stateMatch && userMatch;
    });
  }

  /**
   * Returns all transactions currently in 'pending' state.
   */
  public getPendingTransactions(appUserId?: string): AmazonTransactionRecord[] {
    const targetUserId = appUserId || this._currentAppUserId;
    return this.getAllTransactions().filter(record => {
      const stateMatch = record.lifecycleState === 'pending';
      const userMatch = targetUserId ? record.appUserId === targetUserId : true;
      return stateMatch && userMatch;
    });
  }

  /**
   * Prepares a typed handoff payload for the Day 6 Receipt Verification Service (RVS).
   * Returns undefined if required verification data is incomplete.
   */
  public getVerificationHandoff(
    transactionId: string,
  ): AmazonVerificationPayload | undefined {
    const record = this._transactions.get(transactionId);
    if (!record || !record.receiptId) {
      return undefined;
    }

    return {
      appUserId: record.appUserId || 'anonymous_user',
      amazonUserId: record.amazonUserId || 'unknown_amazon_user',
      receiptId: record.receiptId,
      sku: record.sku,
      termSku: record.termSku,
      purchaseDate: record.purchaseDate,
      marketplace: record.marketplace || 'US',
      currentStatus: record.lifecycleState,
    };
  }

  /**
   * Cleans up all listeners, active subscriptions, and in-memory caches.
   */
  public dispose(): void {
    if (this._appStateSubscription) {
      try {
        this._appStateSubscription.remove();
      } catch {}
      this._appStateSubscription = null;
    }
    this._transactions.clear();
    this._fulfilledReceipts.clear();
    this._listeners.clear();
    this._isReconciling = false;
    this._currentAppUserId = null;
    this.resetProvider();
  }
}

export const amazonTransactionManager = AmazonTransactionManager.getInstance();
