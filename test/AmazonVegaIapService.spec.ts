import {
  Product,
  ProductDataResponse,
  ProductDataResponseCode,
  ProductType,
  PurchaseResponse,
  PurchaseResponseCode,
  Receipt,
  UserData,
} from '@amazon-devices/keplerscript-appstore-iap-lib';
import {
  amazonVegaIapService,
  PurchasingServiceProvider,
} from '../src/iap/AmazonVegaIapService';
import {
  getAllAmazonSkus,
  getDefinitionBySku,
  getDefinitionForPlan,
  normalizeAmazonProduct,
} from '../src/iap/amazonProductConfig';
import {IapServiceFactory} from '../src/iap/IapServiceFactory';
import {mockIapConfig} from '../src/iap/mockIapConfig';
import {mockIapService} from '../src/iap/MockIapService';

describe('Day 3 — Amazon Vega IAP Package Integration & Product Configuration', () => {
  beforeEach(() => {
    amazonVegaIapService.dispose();
    mockIapConfig.reset();
    mockIapConfig.setEnabled(true);
  });

  afterEach(() => {
    amazonVegaIapService.dispose();
    amazonVegaIapService.resetPurchasingProvider();
  });

  describe('1. Amazon Product Configurations and SKU Mappings', () => {
    it('defines all 8 canonical SKUs for monthly and annual tiers', () => {
      const skus = getAllAmazonSkus();
      expect(skus).toHaveLength(8);
      expect(skus).toEqual([
        'logixstream_premium_monthly',
        'logixstream_premium_annually',
        'logixstream_standard_monthly',
        'logixstream_standard_annually',
        'logixstream_basic_monthly',
        'logixstream_basic_annually',
        'logixstream_mobile_monthly',
        'logixstream_mobile_annually',
      ]);
    });

    it('resolves product definitions for each plan and billing cycle', () => {
      const premiumMonthly = getDefinitionForPlan('premium', 'monthly');
      expect(premiumMonthly).toBeDefined();
      expect(premiumMonthly?.amazonSku).toBe('logixstream_premium_monthly');
      expect(premiumMonthly?.tier).toBe('premium');
      expect(premiumMonthly?.defaultPriceAmount).toBe(649);

      const premiumAnnual = getDefinitionForPlan('premium', 'annually');
      expect(premiumAnnual).toBeDefined();
      expect(premiumAnnual?.amazonSku).toBe('logixstream_premium_annually');
      expect(premiumAnnual?.defaultPriceAmount).toBe(5841);

      const standardMonthly = getDefinitionForPlan('standard', 'monthly');
      expect(standardMonthly?.defaultPriceAmount).toBe(499);

      const basicMonthly = getDefinitionForPlan('basic', 'monthly');
      expect(basicMonthly?.defaultPriceAmount).toBe(299);

      const mobileMonthly = getDefinitionForPlan('mobile', 'monthly');
      expect(mobileMonthly?.defaultPriceAmount).toBe(149);
    });

    it('resolves product definitions by canonical SKU and aliases', () => {
      // Direct canonical SKU match
      expect(getDefinitionBySku('logixstream_premium_monthly')?.planId).toBe('premium');
      // Direct alias match
      expect(getDefinitionBySku('premium_monthly')?.planId).toBe('premium');
      expect(getDefinitionBySku('premium')?.planId).toBe('premium');
      expect(getDefinitionBySku('standard_annually')?.planId).toBe('standard');
      // Case insensitive match
      expect(getDefinitionBySku('LOGIXSTREAM_BASIC_MONTHLY')?.planId).toBe('basic');
      // Non-existent SKU
      expect(getDefinitionBySku('unknown_sku_xyz')).toBeUndefined();
    });

    it('normalizes Amazon Product model into application IapProduct', () => {
      const mockAmazonProduct: Product = {
        sku: 'logixstream_premium_monthly',
        title: 'LogiXstream Premium (Monthly)',
        description: '4K Ultra HD + (UHD) streaming on 4 devices',
        productType: ProductType.SUBSCRIPTION,
        price: {
          priceStr: '₹649.00',
          priceCurrencyCode: 'INR',
          valueInMicros: BigInt(649000000),
        },
        smallIconUrl: 'https://example.com/icon.png',
        coinsReward: {amount: 0},
        promotions: [],
      };

      const normalized = normalizeAmazonProduct(mockAmazonProduct);

      expect(normalized.productId).toBe('logixstream_premium_monthly');
      expect(normalized.planId).toBe('premium');
      expect(normalized.tier).toBe('premium');
      expect(normalized.title).toBe('LogiXstream Premium (Monthly)');
      expect(normalized.priceFormatted).toBe('₹649.00');
      expect(normalized.priceAmount).toBe(649);
      expect(normalized.currency).toBe('INR');
      expect(normalized.billingCycle).toBe('monthly');
    });
  });

  describe('2. AmazonVegaIapService Product Retrieval', () => {
    it('initializes and loads products successfully when provider returns SUCCESSFUL', async () => {
      const productMap = new Map<string, Product>();
      productMap.set('logixstream_premium_monthly', {
        sku: 'logixstream_premium_monthly',
        title: 'Premium Monthly',
        description: 'Premium streaming',
        productType: ProductType.SUBSCRIPTION,
        price: {
          priceStr: '₹649.00',
          priceCurrencyCode: 'INR',
          valueInMicros: BigInt(649000000),
        },
        smallIconUrl: '',
        coinsReward: {amount: 0},
        promotions: [],
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockResolvedValue({
          productData: productMap,
          responseCode: ProductDataResponseCode.SUCCESSFUL,
          unavailableSkus: [],
        } as ProductDataResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      await amazonVegaIapService.initialize();

      expect(amazonVegaIapService.isInitialized()).toBe(true);
      expect(amazonVegaIapService.getState()).toBe('ready_to_purchase');

      const products = await amazonVegaIapService.getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].productId).toBe('logixstream_premium_monthly');
      expect(products[0].planId).toBe('premium');
      expect(products[0].priceAmount).toBe(649);
    });

    it('handles empty product list from Amazon Appstore gracefully', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockResolvedValue({
          productData: new Map(),
          responseCode: ProductDataResponseCode.SUCCESSFUL,
          unavailableSkus: ['logixstream_premium_monthly'],
        } as ProductDataResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.initialize();

      expect(amazonVegaIapService.isInitialized()).toBe(true);
      const products = await amazonVegaIapService.getProducts();
      expect(products).toHaveLength(0);
      expect(amazonVegaIapService.getUnavailableSkus()).toContain('logixstream_premium_monthly');
    });

    it('handles ProductDataResponseCode.FAILED without throwing an exception', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockResolvedValue({
          productData: new Map(),
          responseCode: ProductDataResponseCode.FAILED,
          unavailableSkus: [],
        } as ProductDataResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.initialize();

      expect(amazonVegaIapService.isInitialized()).toBe(false);
      expect(amazonVegaIapService.getState()).toBe('idle');
      const products = await amazonVegaIapService.getProducts();
      expect(products).toHaveLength(0);
    });

    it('handles provider thrown errors safely without unhandled promise rejections', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockRejectedValue(new Error('Network connection timeout')),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.initialize();

      expect(amazonVegaIapService.isInitialized()).toBe(false);
      expect(amazonVegaIapService.getState()).toBe('idle');
    });

    it('avoids duplicate concurrent initialization requests', async () => {
      let resolver: (val: any) => void = () => {};
      const delayedPromise = new Promise(resolve => {
        resolver = resolve;
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockReturnValue(delayedPromise),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const p1 = amazonVegaIapService.initialize();
      const p2 = amazonVegaIapService.initialize();

      expect(mockProvider.getProductData).toHaveBeenCalledTimes(1);

      resolver({
        productData: new Map(),
        responseCode: ProductDataResponseCode.SUCCESSFUL,
        unavailableSkus: [],
      });

      await Promise.all([p1, p2]);
    });

    it('retrieves products by exact SKU or planId fallback', async () => {
      const productMap = new Map<string, Product>();
      productMap.set('logixstream_premium_monthly', {
        sku: 'logixstream_premium_monthly',
        title: 'Premium Monthly',
        description: '',
        productType: ProductType.SUBSCRIPTION,
        price: {
          priceStr: '₹649',
          priceCurrencyCode: 'INR',
          valueInMicros: BigInt(649000000),
        },
        smallIconUrl: '',
        coinsReward: {amount: 0},
        promotions: [],
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockResolvedValue({
          productData: productMap,
          responseCode: ProductDataResponseCode.SUCCESSFUL,
          unavailableSkus: [],
        } as ProductDataResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.initialize();

      // Lookup by exact SKU
      const bySku = await amazonVegaIapService.getProductById('logixstream_premium_monthly');
      expect(bySku).toBeDefined();
      expect(bySku?.productId).toBe('logixstream_premium_monthly');

      // Lookup by alias
      const byAlias = await amazonVegaIapService.getProductById('premium_monthly');
      expect(byAlias).toBeDefined();
      expect(byAlias?.productId).toBe('logixstream_premium_monthly');

      // Lookup by planId
      const byPlan = await amazonVegaIapService.getProductById('premium');
      expect(byPlan).toBeDefined();
      expect(byPlan?.planId).toBe('premium');

      // Unknown product
      const unknown = await amazonVegaIapService.getProductById('unknown_plan');
      expect(unknown).toBeUndefined();
    });

    it('notifies state listeners when state transitions occur', async () => {
      const states: string[] = [];
      const unsubscribe = amazonVegaIapService.addStateListener(state => {
        states.push(state);
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn().mockResolvedValue({
          productData: new Map(),
          responseCode: ProductDataResponseCode.SUCCESSFUL,
          unavailableSkus: [],
        } as ProductDataResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.initialize();

      expect(states).toContain('loading_products');
      expect(states).toContain('ready_to_purchase');

      unsubscribe();
    });
  });

  describe('3. IapServiceFactory & Mock vs Real Separation', () => {
    it('returns MockIapService in development when mock is enabled', () => {
      mockIapConfig.setEnabled(true);
      expect(IapServiceFactory.getActiveProviderType()).toBe('mock');
      expect(IapServiceFactory.getIapService()).toBe(mockIapService);
    });

    it('returns AmazonVegaIapService when mock is disabled', () => {
      mockIapConfig.setEnabled(false);
      expect(IapServiceFactory.getActiveProviderType()).toBe('amazon');
      expect(IapServiceFactory.getIapService()).toBe(amazonVegaIapService);
    });

    it('ensures MockIapService remains completely intact and operational', async () => {
      const mockProducts = await mockIapService.getProducts();
      expect(mockProducts.length).toBeGreaterThan(0);
      expect(mockProducts[0].productId).toBe('premium_monthly');
    });
  });

  describe('4. Amazon Vega Purchase Initiation & Lifecycle Handling (Day 4)', () => {
    const createMockReceipt = (sku: string = 'logixstream_premium_monthly'): Receipt => ({
      receiptId: 'amzn_rcpt_test_987654321',
      sku,
      termSku: 'logixstream_premium_term_1',
      productType: ProductType.SUBSCRIPTION,
      purchaseDate: new Date('2026-11-02T12:00:00Z'),
      cancelDate: null as any,
      deferredDate: null as any,
      deferredSku: '',
      isCancelled: false,
      isDeferred: false,
    });

    const createMockUserData = (): UserData => ({
      userId: 'amzn_user_test_456',
      marketplace: 'US',
      countryCode: 'US',
      lwaConsentStatus: 2,
      userProfileAccessConsentStatus: 2,
    });

    it('initiates purchase successfully with canonical SKU and provides verification handoff', async () => {
      const mockReceipt = createMockReceipt('logixstream_premium_monthly');
      const mockUserData = createMockUserData();

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: mockReceipt,
          requestId: {requestIdStr: 'req_123'},
          responseCode: PurchaseResponseCode.SUCCESSFUL,
          userData: mockUserData,
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(mockProvider.purchase).toHaveBeenCalledWith({
        sku: 'logixstream_premium_monthly',
      });
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.productId).toBe('logixstream_premium_monthly');
        expect(result.transactionId).toBe('amzn_rcpt_test_987654321');
        expect(result.awaitingVerification).toBe(true);
        expect(result.receiptInfo).toBeDefined();
        expect(result.receiptInfo?.receiptId).toBe('amzn_rcpt_test_987654321');
        expect(result.receiptInfo?.amazonUserId).toBe('amzn_user_test_456');
        expect(result.receiptInfo?.marketplace).toBe('US');
        expect(result.receiptInfo?.termSku).toBe('logixstream_premium_term_1');
      }

      expect(amazonVegaIapService.getState()).toBe('purchase_successful');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
      expect(amazonVegaIapService.getLastPurchaseResult()).toBe(result);
      expect(amazonVegaIapService.getLastReceiptInfo()?.receiptId).toBe('amzn_rcpt_test_987654321');
    });

    it('initiates purchase with alias (e.g. premium_monthly) and maps to canonical SKU', async () => {
      const mockReceipt = createMockReceipt('logixstream_premium_monthly');
      const mockUserData = createMockUserData();

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: mockReceipt,
          requestId: {requestIdStr: 'req_124'},
          responseCode: PurchaseResponseCode.SUCCESSFUL,
          userData: mockUserData,
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('premium_monthly');

      expect(mockProvider.purchase).toHaveBeenCalledWith({
        sku: 'logixstream_premium_monthly',
      });
      expect(result.status).toBe('success');
    });

    it('rejects empty or invalid product IDs immediately with INVALID_PRODUCT', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn(),
      };
      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const emptyResult = await amazonVegaIapService.purchase('');
      expect(emptyResult.status).toBe('failed');
      if (emptyResult.status === 'failed') {
        expect(emptyResult.errorCode).toBe('INVALID_PRODUCT');
      }
      expect(mockProvider.purchase).not.toHaveBeenCalled();

      const unconfiguredResult = await amazonVegaIapService.purchase('non_existent_tier_xyz');
      expect(unconfiguredResult.status).toBe('failed');
      if (unconfiguredResult.status === 'failed') {
        expect(unconfiguredResult.errorCode).toBe('INVALID_PRODUCT');
      }
      expect(mockProvider.purchase).not.toHaveBeenCalled();
    });

    it('prevents concurrent/duplicate purchase requests with SERVICE_BUSY', async () => {
      let resolveFirstPurchase: (value: PurchaseResponse) => void;
      const firstPurchasePromise = new Promise<PurchaseResponse>(resolve => {
        resolveFirstPurchase = resolve;
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockImplementation(() => firstPurchasePromise),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      // Start first purchase
      const p1 = amazonVegaIapService.purchase('logixstream_premium_monthly');
      expect(amazonVegaIapService.isPurchasing()).toBe(true);

      // Immediately attempt second purchase while first is in flight
      const p2 = amazonVegaIapService.purchase('logixstream_standard_monthly');

      const result2 = await p2;
      expect(result2.status).toBe('failed');
      if (result2.status === 'failed') {
        expect(result2.errorCode).toBe('SERVICE_BUSY');
        expect(result2.message).toContain('already in progress');
      }

      // Finish first purchase
      resolveFirstPurchase!({
        receipt: createMockReceipt('logixstream_premium_monthly'),
        requestId: {requestIdStr: 'req_1'},
        responseCode: PurchaseResponseCode.SUCCESSFUL,
        userData: createMockUserData(),
      });

      const result1 = await p1;
      expect(result1.status).toBe('success');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
    });

    it('handles ALREADY_PURCHASED response code and resets state to ready_to_purchase', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: null as any,
          requestId: {requestIdStr: 'req_already'},
          responseCode: PurchaseResponseCode.ALREADY_PURCHASED,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('already_purchased');
      expect(result.message).toContain('already own');
      expect(amazonVegaIapService.getState()).toBe('ready_to_purchase');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
    });

    it('handles INVALID_SKU response code with INVALID_PRODUCT error', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: null as any,
          requestId: {requestIdStr: 'req_invalid'},
          responseCode: PurchaseResponseCode.INVALID_SKU,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorCode).toBe('INVALID_PRODUCT');
        expect(result.message).toContain('rejected SKU');
      }
      expect(amazonVegaIapService.getState()).toBe('purchase_failed');
    });

    it('handles NOT_SUPPORTED response code with PRODUCT_UNAVAILABLE error', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: null as any,
          requestId: {requestIdStr: 'req_not_supported'},
          responseCode: PurchaseResponseCode.NOT_SUPPORTED,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorCode).toBe('PRODUCT_UNAVAILABLE');
      }
      expect(amazonVegaIapService.getState()).toBe('purchase_failed');
    });

    it('handles FAILED response code with PAYMENT_DECLINED error', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: null as any,
          requestId: {requestIdStr: 'req_failed'},
          responseCode: PurchaseResponseCode.FAILED,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorCode).toBe('PAYMENT_DECLINED');
      }
      expect(amazonVegaIapService.getState()).toBe('purchase_failed');
    });

    it('handles user cancellation error safely and transitions to user_cancelled', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockRejectedValue(new Error('User cancelled purchase flow')),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('cancelled');
      expect(amazonVegaIapService.getState()).toBe('user_cancelled');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
    });

    it('handles provider thrown runtime exceptions safely and resets purchasing state', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockRejectedValue(new Error('Device IPC connection broken')),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorCode).toBe('UNKNOWN');
        expect(result.message).toContain('IPC connection broken');
      }
      expect(amazonVegaIapService.getState()).toBe('purchase_failed');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
    });

    it('handles empty/null provider response safely', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue(null as any),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      const result = await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(result.status).toBe('failed');
      expect(amazonVegaIapService.getState()).toBe('purchase_failed');
    });

    it('notifies state listeners across full purchase lifecycle', async () => {
      const stateHistory: string[] = [];
      const unsubscribe = amazonVegaIapService.addStateListener(state => {
        stateHistory.push(state);
      });

      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: createMockReceipt('logixstream_premium_monthly'),
          requestId: {requestIdStr: 'req_listener'},
          responseCode: PurchaseResponseCode.SUCCESSFUL,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);

      await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(stateHistory).toContain('purchasing');
      expect(stateHistory).toContain('purchase_successful');

      unsubscribe();
    });

    it('clears last purchase and receipt metadata on dispose()', async () => {
      const mockProvider: PurchasingServiceProvider = {
        getProductData: jest.fn(),
        purchase: jest.fn().mockResolvedValue({
          receipt: createMockReceipt('logixstream_premium_monthly'),
          requestId: {requestIdStr: 'req_disp'},
          responseCode: PurchaseResponseCode.SUCCESSFUL,
          userData: createMockUserData(),
        } as PurchaseResponse),
      };

      amazonVegaIapService.setPurchasingProvider(mockProvider);
      await amazonVegaIapService.purchase('logixstream_premium_monthly');

      expect(amazonVegaIapService.getLastPurchaseResult()).not.toBeNull();
      expect(amazonVegaIapService.getLastReceiptInfo()).not.toBeNull();

      amazonVegaIapService.dispose();

      expect(amazonVegaIapService.getLastPurchaseResult()).toBeNull();
      expect(amazonVegaIapService.getLastReceiptInfo()).toBeNull();
      expect(amazonVegaIapService.getState()).toBe('idle');
      expect(amazonVegaIapService.isPurchasing()).toBe(false);
    });
  });
});
