import {SUBSCRIPTION_PLANS, SubscriptionPlan} from '../types/subscription';
import {IIapService} from './IapService';
import {mockIapConfig} from './mockIapConfig';
import {
  IapProduct,
  PurchaseFlowState,
  PurchaseResult,
} from './types';

export class MockIapService implements IIapService {
  private static instance: MockIapService;

  private _isPurchasing: boolean = false;
  private _state: PurchaseFlowState = 'idle';
  private _products: IapProduct[] = [];
  private _listeners: Set<(state: PurchaseFlowState) => void> = new Set();

  private constructor() {
    this._loadProducts();
  }

  public static getInstance(): MockIapService {
    if (!MockIapService.instance) {
      MockIapService.instance = new MockIapService();
    }
    return MockIapService.instance;
  }

  /**
   * Generates mock IAP products by transforming existing SUBSCRIPTION_PLANS.
   * Produces separate SKUs for monthly and annual billing cycles.
   */
  private _loadProducts(): void {
    const products: IapProduct[] = [];
    SUBSCRIPTION_PLANS.forEach((plan: SubscriptionPlan) => {
      // Monthly product
      products.push({
        productId: `${plan.id}_monthly`,
        planId: plan.id,
        tier: plan.tier,
        title: `${plan.name} (Monthly)`,
        description: `${plan.qualityLabel} - ${plan.resolution}`,
        priceFormatted: plan.monthlyPriceFormatted,
        priceAmount: plan.monthlyPrice,
        billingCycle: 'monthly',
        currency: 'INR',
      });

      // Annual product
      products.push({
        productId: `${plan.id}_annually`,
        planId: plan.id,
        tier: plan.tier,
        title: `${plan.name} (Annually)`,
        description: `${plan.qualityLabel} - ${plan.resolution} (Save ${plan.savePercent}%)`,
        priceFormatted: plan.annualPriceFormatted,
        priceAmount: plan.annualPrice,
        billingCycle: 'annually',
        currency: 'INR',
      });
    });
    this._products = products;
  }

  /**
   * Initializes the service and marks it ready to purchase.
   */
  public async initialize(): Promise<void> {
    this._setState('loading_products');
    this._loadProducts();
    this._setState('ready_to_purchase');
  }

  /**
   * Returns copy of all loaded products.
   */
  public async getProducts(): Promise<IapProduct[]> {
    if (this._products.length === 0) {
      this._loadProducts();
    }
    return [...this._products];
  }

  /**
   * Internal synchronous lookup for a product.
   */
  private _findProduct(productId: string): IapProduct | undefined {
    if (!productId) return undefined;
    const cleanId = productId.trim().toLowerCase();

    // 1. Direct SKU match (e.g. 'premium_monthly' or 'basic_annually')
    const directMatch = this._products.find(p => p.productId.toLowerCase() === cleanId);
    if (directMatch) return directMatch;

    // 2. PlanId fallback matching monthly default (e.g. 'premium')
    return this._products.find(
      p => p.planId.toLowerCase() === cleanId && p.billingCycle === 'monthly',
    );
  }

  /**
   * Retrieves a product by its ID (e.g., 'premium_monthly')
   * or plan ID fallback (e.g., 'premium', defaulting to monthly).
   */
  public async getProductById(productId: string): Promise<IapProduct | undefined> {
    return this._findProduct(productId);
  }

  /**
   * Helper to retrieve a product for a specific plan and billing cycle.
   */
  public getProductForPlan(
    planId: string,
    billingCycle: 'monthly' | 'annually' = 'monthly',
  ): IapProduct | undefined {
    const cleanPlanId = planId?.trim().toLowerCase();
    return this._products.find(
      p => p.planId.toLowerCase() === cleanPlanId && p.billingCycle === billingCycle,
    );
  }

  public isPurchasing(): boolean {
    return this._isPurchasing;
  }

  public getState(): PurchaseFlowState {
    return this._state;
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
        // Guard against listener error propagation
      }
    });
  }

  /**
   * Simulates an in-app purchase flow with configurable delay and outcome.
   * Never generates real Amazon receipts or processes actual payments.
   */
  public async purchase(productId: string): Promise<PurchaseResult> {
    // Safety check: Dev only
    if (!mockIapConfig.isEnabled()) {
      return {
        status: 'failed',
        productId,
        errorCode: 'UNKNOWN',
        message: 'Mock IAP is disabled in production builds.',
      };
    }

    // 1. Concurrency Check: Prevent duplicate concurrent purchases
    if (this._isPurchasing) {
      return {
        status: 'failed',
        productId,
        errorCode: 'SERVICE_BUSY',
        message: 'A purchase transaction is already in progress. Please wait.',
      };
    }

    // 2. Validate product ID synchronously
    const product = this._findProduct(productId);
    if (!product) {
      this._setState('purchase_failed');
      return {
        status: 'failed',
        productId,
        errorCode: 'INVALID_PRODUCT',
        message: `Product '${productId}' not found in mock catalog.`,
      };
    }

    // 3. Acquire lock and set state synchronously
    this._isPurchasing = true;
    this._setState('purchasing');

    try {
      // 4. Simulate network / payment gateway latency
      const delay = mockIapConfig.getSimulatedDelayMs();
      if (delay > 0) {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), delay);
        });
      }

      // 5. Evaluate configured test scenario
      const scenario = mockIapConfig.getScenario();

      switch (scenario) {
        case 'cancel': {
          this._setState('user_cancelled');
          return {
            status: 'cancelled',
            productId: product.productId,
            message: 'Purchase was cancelled by user.',
          };
        }
        case 'failure': {
          this._setState('purchase_failed');
          return {
            status: 'failed',
            productId: product.productId,
            errorCode: 'PAYMENT_DECLINED',
            message: 'Simulated payment was declined. Please verify your payment details.',
          };
        }
        case 'success':
        default: {
          const timestamp = Date.now();
          // Explicitly distinguishable mock transaction ID
          const mockTxnId = `mock_dev_txn_${timestamp}_${Math.random()
            .toString(36)
            .substring(2, 8)}`;

          this._setState('purchase_successful');
          return {
            status: 'success',
            productId: product.productId,
            transactionId: mockTxnId,
            purchaseTime: timestamp,
            message: `Simulated purchase of ${product.title} successful.`,
          };
        }
      }
    } catch (err: any) {
      this._setState('purchase_failed');
      return {
        status: 'failed',
        productId: product.productId,
        errorCode: 'UNKNOWN',
        message: err?.message || 'An unexpected mock purchase error occurred.',
      };
    } finally {
      // 6. Release lock - Ensures service is never left permanently busy
      this._isPurchasing = false;
    }
  }

  /**
   * Resets internal state to idle (used in tests and teardowns).
   */
  public resetState(): void {
    this._isPurchasing = false;
    this._setState('idle');
  }
}

export const mockIapService = MockIapService.getInstance();
