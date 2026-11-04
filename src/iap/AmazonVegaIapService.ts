import {
  FulfillmentResult,
  NotifyFulfillmentResponse,
  Product,
  ProductDataResponse,
  ProductDataResponseCode,
  PurchaseRequest,
  PurchaseResponse,
  PurchaseResponseCode,
  PurchaseUpdatesResponse,
  PurchaseUpdatesResponseCode,
  PurchasingService,
  Receipt,
  UserData,
  UserDataResponse,
} from '@amazon-devices/keplerscript-appstore-iap-lib';
import {IIapService} from './IapService';
import {
  getAllAmazonSkus,
  getDefinitionBySku,
  normalizeAmazonProduct,
} from './amazonProductConfig';
import {
  AmazonReceiptInfo,
  IapProduct,
  PurchaseFlowState,
  PurchaseResult,
  RestoreResult,
} from './types';
import {
  AmazonTransactionManager,
  amazonTransactionManager,
} from './AmazonTransactionManager';

export interface PurchasingServiceProvider {
  getProductData(request: {skus: string[]}): Promise<ProductDataResponse>;
  purchase?(request: {sku: string}): Promise<PurchaseResponse>;
  getUserData?(request?: {fetchUserProfileAccessConsentStatus?: boolean}): Promise<UserDataResponse>;
  getPurchaseUpdates?(request: {reset: boolean}): Promise<PurchaseUpdatesResponse>;
  notifyFulfillment?(request: {receiptId: string; fulfillmentResult: FulfillmentResult}): Promise<NotifyFulfillmentResponse>;
}

/**
 * Amazon Vega OS In-App Purchasing service implementation.
 * Communicates directly with the official Amazon Appstore PurchasingService API.
 */
export class AmazonVegaIapService implements IIapService {
  private static instance: AmazonVegaIapService;

  private _isInitialized: boolean = false;
  private _isInitializing: boolean = false;
  private _isPurchasing: boolean = false;
  private _state: PurchaseFlowState = 'idle';
  private _products: IapProduct[] = [];
  private _unavailableSkus: string[] = [];
  private _lastPurchaseResult: PurchaseResult | null = null;
  private _lastReceiptInfo: AmazonReceiptInfo | null = null;
  private _listeners: Set<(state: PurchaseFlowState) => void> = new Set();
  private _purchasingProvider: PurchasingServiceProvider = PurchasingService;
  private _transactionManager: AmazonTransactionManager = amazonTransactionManager;

  private constructor() {}

  public static getInstance(): AmazonVegaIapService {
    if (!AmazonVegaIapService.instance) {
      AmazonVegaIapService.instance = new AmazonVegaIapService();
    }
    return AmazonVegaIapService.instance;
  }

  /**
   * Injectable purchasing provider for testing and sandbox environments.
   */
  public setPurchasingProvider(provider: PurchasingServiceProvider): void {
    this._purchasingProvider = provider;
    this._transactionManager.setProvider(provider as any);
  }

  public resetPurchasingProvider(): void {
    this._purchasingProvider = PurchasingService;
    this._transactionManager.resetProvider();
  }

  public getTransactionManager(): AmazonTransactionManager {
    return this._transactionManager;
  }

  public setActiveAppUserId(userId: string | null): void {
    this._transactionManager.setCurrentAppUserId(userId);
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public getUnavailableSkus(): string[] {
    return [...this._unavailableSkus];
  }

  public getState(): PurchaseFlowState {
    return this._state;
  }

  public isPurchasing(): boolean {
    return this._isPurchasing || this._state === 'purchasing';
  }

  public isRestoring(): boolean {
    return this._state === 'restoring';
  }

  public getLastPurchaseResult(): PurchaseResult | null {
    return this._lastPurchaseResult;
  }

  public getLastReceiptInfo(): AmazonReceiptInfo | null {
    return this._lastReceiptInfo;
  }

  public addStateListener(listener: (state: PurchaseFlowState) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _setState(newState: PurchaseFlowState): void {
    this._state = newState;
    this._listeners.forEach(fn => {
      try {
        fn(newState);
      } catch {
        // Safe listener error suppression
      }
    });
  }

  /**
   * Initializes the Amazon IAP integration and queries available subscription product data.
   */
  public async initialize(): Promise<void> {
    if (this._isInitializing) {
      return;
    }
    if (this._isInitialized && this._products.length > 0) {
      return;
    }

    this._isInitializing = true;
    this._setState('loading_products');

    const requestedSkus = getAllAmazonSkus();

    try {
      const response = await this._purchasingProvider.getProductData({
        skus: requestedSkus,
      });

      if (!response) {
        throw new Error('NULL_RESPONSE: Amazon Appstore returned empty product data response.');
      }

      if (response.responseCode === ProductDataResponseCode.NOT_SUPPORTED) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonVegaIapService] PurchasingService is NOT_SUPPORTED on this runtime.');
        }
        this._setState('idle');
        return;
      }

      if (response.responseCode === ProductDataResponseCode.FAILED) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[AmazonVegaIapService] Failed to retrieve product data from Amazon Appstore.');
        }
        this._setState('idle');
        return;
      }

      // Record unavailable SKUs
      this._unavailableSkus = Array.isArray(response.unavailableSkus)
        ? [...response.unavailableSkus]
        : [];

      // Extract and normalize product items
      const normalizedList: IapProduct[] = [];
      const rawProductData = response.productData;

      if (rawProductData instanceof Map) {
        rawProductData.forEach((product: Product) => {
          if (product && product.sku) {
            normalizedList.push(normalizeAmazonProduct(product));
          }
        });
      } else if (rawProductData && typeof rawProductData === 'object') {
        Object.values(rawProductData).forEach((product: any) => {
          if (product && product.sku) {
            normalizedList.push(normalizeAmazonProduct(product as Product));
          }
        });
      }

      this._products = normalizedList;
      this._isInitialized = true;
      this._setState('ready_to_purchase');

      this._transactionManager.startListeningToAppState();
      try {
        await this._transactionManager.reconcilePurchaseUpdates(false);
      } catch {}
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[AmazonVegaIapService] Initialization error:', err);
      }
      this._setState('idle');
    } finally {
      this._isInitializing = false;
    }
  }

  /**
   * Returns list of loaded Amazon subscription products.
   */
  public async getProducts(): Promise<IapProduct[]> {
    if (!this._isInitialized) {
      await this.initialize();
    }
    return [...this._products];
  }

  /**
   * Finds product by Amazon SKU or internal planId.
   */
  public async getProductById(productId: string): Promise<IapProduct | undefined> {
    if (!productId) return undefined;
    if (!this._isInitialized) {
      await this.initialize();
    }

    const clean = productId.trim().toLowerCase();

    // 1. Exact SKU match
    const exact = this._products.find(p => p.productId.toLowerCase() === clean);
    if (exact) return exact;

    // 2. Definition lookup by alias
    const def = getDefinitionBySku(clean);
    if (def) {
      return this._products.find(p => p.productId.toLowerCase() === def.amazonSku.toLowerCase());
    }

    // 3. Fallback by planId (defaults to monthly)
    return this._products.find(
      p => p.planId.toLowerCase() === clean && p.billingCycle === 'monthly',
    );
  }

  /**
   * Initiates a real Amazon Vega OS In-App Purchase flow for the specified product.
   * Maps plan or alias identifiers to the canonical Amazon SKU, guards against
   * concurrent/duplicate requests, handles Amazon PurchasingService response codes,
   * updates the lifecycle state machine, and stores structured receipt metadata for
   * Day 5 backend RVS verification without granting unverified production entitlements.
   */
  public async purchase(productId: string): Promise<PurchaseResult> {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      const invalidResult: PurchaseResult = {
        status: 'failed',
        productId: productId || '',
        errorCode: 'INVALID_PRODUCT',
        message: 'Product identifier must be a non-empty string.',
      };
      this._lastPurchaseResult = invalidResult;
      return invalidResult;
    }

    // Concurrency guard: prevent multiple in-flight purchase requests
    if (this._isPurchasing || this._state === 'purchasing') {
      const busyResult: PurchaseResult = {
        status: 'failed',
        productId,
        errorCode: 'SERVICE_BUSY',
        message: 'A purchase transaction is already in progress. Please wait.',
      };
      this._lastPurchaseResult = busyResult;
      return busyResult;
    }

    // Resolve definition by canonical SKU or alias
    const definition = getDefinitionBySku(productId);
    if (!definition) {
      const invalidProductResult: PurchaseResult = {
        status: 'failed',
        productId,
        errorCode: 'INVALID_PRODUCT',
        message: `Invalid or unrecognized product identifier: '${productId}'. Product is not configured in Amazon Appstore catalog.`,
      };
      this._lastPurchaseResult = invalidProductResult;
      return invalidProductResult;
    }

    const canonicalSku = definition.amazonSku;
    this._isPurchasing = true;
    this._setState('purchasing');
    this._transactionManager.recordInitiatedTransaction(canonicalSku);

    try {
      if (typeof this._purchasingProvider.purchase !== 'function') {
        this._setState('purchase_failed');
        const notSupportedResult: PurchaseResult = {
          status: 'failed',
          productId: canonicalSku,
          errorCode: 'PRODUCT_UNAVAILABLE',
          message: 'PurchasingService.purchase is not available on this provider.',
        };
        this._lastPurchaseResult = notSupportedResult;
        this._transactionManager.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'PRODUCT_UNAVAILABLE',
          notSupportedResult.message,
        );
        return notSupportedResult;
      }

      const response = await this._purchasingProvider.purchase({
        sku: canonicalSku,
      });

      if (!response) {
        this._setState('purchase_failed');
        const emptyResult: PurchaseResult = {
          status: 'failed',
          productId: canonicalSku,
          errorCode: 'UNKNOWN',
          message: 'Amazon Appstore returned an empty purchase response.',
        };
        this._lastPurchaseResult = emptyResult;
        this._transactionManager.recordFailedOrCancelledTransaction(
          canonicalSku,
          'failed',
          'UNKNOWN',
          emptyResult.message,
        );
        return emptyResult;
      }

      switch (response.responseCode) {
        case PurchaseResponseCode.SUCCESSFUL: {
          const receipt = response.receipt;
          const userData = response.userData;

          const receiptId = receipt?.receiptId || `amzn_rcpt_${Date.now()}`;
          const purchaseTime = receipt?.purchaseDate
            ? new Date(receipt.purchaseDate).getTime()
            : Date.now();
          const cancelDate = receipt?.cancelDate
            ? new Date(receipt.cancelDate).getTime()
            : null;

          const receiptInfo: AmazonReceiptInfo = {
            receiptId,
            sku: receipt?.sku || canonicalSku,
            termSku: receipt?.termSku,
            purchaseDate: purchaseTime,
            cancelDate,
            amazonUserId: userData?.userId,
            marketplace: userData?.marketplace,
          };

          this._lastReceiptInfo = receiptInfo;
          this._setState('purchase_successful');

          // Process transaction record in transaction manager
          this._transactionManager.processPurchaseResponse(response, canonicalSku);

          const successResult: PurchaseResult = {
            status: 'success',
            productId: canonicalSku,
            transactionId: receiptId,
            purchaseTime,
            message: 'Amazon purchase completed successfully. Awaiting receipt verification.',
            awaitingVerification: true,
            receiptInfo,
          };
          this._lastPurchaseResult = successResult;
          return successResult;
        }

        case PurchaseResponseCode.ALREADY_PURCHASED: {
          this._setState('ready_to_purchase');
          this._transactionManager.processPurchaseResponse(response, canonicalSku);
          const alreadyResult: PurchaseResult = {
            status: 'already_purchased',
            productId: canonicalSku,
            message: `You already own ${definition.planName} (${definition.billingCycle}) on your Amazon account. Use Restore Purchases to synchronize entitlements.`,
          };
          this._lastPurchaseResult = alreadyResult;
          return alreadyResult;
        }

        case PurchaseResponseCode.INVALID_SKU: {
          this._setState('purchase_failed');
          this._transactionManager.processPurchaseResponse(response, canonicalSku);
          const invalidSkuResult: PurchaseResult = {
            status: 'failed',
            productId: canonicalSku,
            errorCode: 'INVALID_PRODUCT',
            message: `Amazon Appstore rejected SKU '${canonicalSku}' as invalid.`,
          };
          this._lastPurchaseResult = invalidSkuResult;
          return invalidSkuResult;
        }

        case PurchaseResponseCode.NOT_SUPPORTED: {
          this._setState('purchase_failed');
          this._transactionManager.processPurchaseResponse(response, canonicalSku);
          const notSupportedResult: PurchaseResult = {
            status: 'failed',
            productId: canonicalSku,
            errorCode: 'PRODUCT_UNAVAILABLE',
            message: 'Amazon In-App Purchasing is not supported on this device or runtime.',
          };
          this._lastPurchaseResult = notSupportedResult;
          return notSupportedResult;
        }

        case PurchaseResponseCode.FAILED:
        default: {
          this._setState('purchase_failed');
          this._transactionManager.processPurchaseResponse(response, canonicalSku);
          const failedResult: PurchaseResult = {
            status: 'failed',
            productId: canonicalSku,
            errorCode: 'PAYMENT_DECLINED',
            message: 'Purchase transaction failed or was declined by Amazon Appstore.',
          };
          this._lastPurchaseResult = failedResult;
          return failedResult;
        }
      }
    } catch (err: any) {
      const errMessage = String(err?.message || err || '');
      const isCancelled =
        errMessage.toLowerCase().includes('cancel') ||
        errMessage.toLowerCase().includes('user_cancelled');

      if (isCancelled) {
        this._setState('user_cancelled');
        const cancelResult: PurchaseResult = {
          status: 'cancelled',
          productId: canonicalSku,
          message: 'Purchase flow was cancelled by the user.',
        };
        this._lastPurchaseResult = cancelResult;
        this._transactionManager.recordFailedOrCancelledTransaction(
          canonicalSku,
          'cancelled',
          'USER_CANCELLED',
          cancelResult.message,
        );
        return cancelResult;
      }

      this._setState('purchase_failed');
      const exceptionResult: PurchaseResult = {
        status: 'failed',
        productId: canonicalSku,
        errorCode: 'UNKNOWN',
        message: errMessage || 'An unexpected error occurred during purchase initiation.',
      };
      this._lastPurchaseResult = exceptionResult;
      this._transactionManager.recordFailedOrCancelledTransaction(
        canonicalSku,
        'failed',
        'UNKNOWN',
        exceptionResult.message,
      );
      return exceptionResult;
    } finally {
      this._isPurchasing = false;
    }
  }

  /**
   * Reconciles purchase updates from Amazon Appstore and recovers active subscription receipts.
   */
  public async restorePurchases(userId?: string): Promise<RestoreResult> {
    if (this._isPurchasing || this._state === 'purchasing') {
      return {
        status: 'failed',
        message: 'A purchase transaction is currently in progress. Please wait before restoring.',
      };
    }

    this._setState('restoring');

    try {
      const records = await this._transactionManager.reconcilePurchaseUpdates(true, userId);
      const awaiting = records.filter(r => r.lifecycleState === 'awaiting_verification');
      const expired = records.filter(r => r.lifecycleState === 'canceled');

      this._setState('ready_to_purchase');

      if (awaiting.length > 0) {
        return {
          status: 'restored',
          message: 'Amazon purchase updates reconciled. Active subscription receipt found and queued for verification.',
        };
      } else if (expired.length > 0) {
        return {
          status: 'expired',
          message: 'Restored previous Amazon subscription records, but the subscription has expired or was canceled.',
        };
      } else {
        return {
          status: 'no_entitlement_found',
          message: 'No previous Amazon subscription records found on this account.',
        };
      }
    } catch (err: any) {
      this._setState('ready_to_purchase');
      return {
        status: 'failed',
        message: err?.message || 'Failed to reconcile Amazon purchase updates.',
      };
    }
  }

  /**
   * Cleans up internal state, cache, transaction manager, and listeners.
   */
  public dispose(): void {
    this._isInitialized = false;
    this._isInitializing = false;
    this._isPurchasing = false;
    this._products = [];
    this._unavailableSkus = [];
    this._lastPurchaseResult = null;
    this._lastReceiptInfo = null;
    this._listeners.clear();
    this._transactionManager.dispose();
    this._setState('idle');
  }
}

export const amazonVegaIapService = AmazonVegaIapService.getInstance();
