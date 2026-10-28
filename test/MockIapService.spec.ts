import {mockIapService} from '../src/iap/MockIapService';
import {mockIapConfig} from '../src/iap/mockIapConfig';
import {PurchaseFlowState} from '../src/iap/types';

describe('MockIapService Unit Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIapConfig.reset();
    mockIapConfig.setEnabled(true);
    mockIapConfig.setSimulatedDelayMs(500);
    mockIapService.resetState();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('1. Mock Product Loading', () => {
    it('loads 8 predictable mock products matching SUBSCRIPTION_PLANS across monthly and annual cycles', async () => {
      await mockIapService.initialize();
      const products = await mockIapService.getProducts();

      expect(products.length).toBe(8);

      const premiumMonthly = products.find(p => p.productId === 'premium_monthly');
      expect(premiumMonthly).toBeDefined();
      expect(premiumMonthly?.tier).toBe('premium');
      expect(premiumMonthly?.billingCycle).toBe('monthly');
      expect(premiumMonthly?.priceAmount).toBe(649);
      expect(premiumMonthly?.priceFormatted).toBe('₹649');

      const premiumAnnually = products.find(p => p.productId === 'premium_annually');
      expect(premiumAnnually).toBeDefined();
      expect(premiumAnnually?.tier).toBe('premium');
      expect(premiumAnnually?.billingCycle).toBe('annually');
      expect(premiumAnnually?.priceAmount).toBe(5841);
      expect(premiumAnnually?.priceFormatted).toBe('₹5,841');
    });

    it('looks up product by exact SKU or planId fallback', async () => {
      const bySku = await mockIapService.getProductById('standard_annually');
      expect(bySku?.productId).toBe('standard_annually');
      expect(bySku?.billingCycle).toBe('annually');

      // Fallback lookup: 'basic' defaults to 'basic_monthly'
      const byPlanId = await mockIapService.getProductById('basic');
      expect(byPlanId?.productId).toBe('basic_monthly');
      expect(byPlanId?.billingCycle).toBe('monthly');

      // Helper lookup
      const viaHelper = mockIapService.getProductForPlan('mobile', 'annually');
      expect(viaHelper?.productId).toBe('mobile_annually');
    });
  });

  describe('2. Successful Purchase', () => {
    it('returns a successful purchase result with a distinct mock transaction ID', async () => {
      mockIapConfig.setScenario('success');

      const purchasePromise = mockIapService.purchase('premium_monthly');

      expect(mockIapService.isPurchasing()).toBe(true);
      expect(mockIapService.getState()).toBe('purchasing');

      // Fast-forward delay
      jest.advanceTimersByTime(500);
      const result = await purchasePromise;

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.productId).toBe('premium_monthly');
        expect(result.transactionId).toMatch(/^mock_dev_txn_\d+_[a-z0-9]+$/);
        expect(result.purchaseTime).toBeGreaterThan(0);
        expect(result.message).toContain('successful');
      }

      expect(mockIapService.isPurchasing()).toBe(false);
      expect(mockIapService.getState()).toBe('purchase_successful');
    });
  });

  describe('3. User Cancellation', () => {
    it('returns a distinct cancellation result when scenario is set to cancel', async () => {
      mockIapConfig.setScenario('cancel');

      const purchasePromise = mockIapService.purchase('basic_monthly');
      jest.advanceTimersByTime(500);
      const result = await purchasePromise;

      expect(result.status).toBe('cancelled');
      if (result.status === 'cancelled') {
        expect(result.productId).toBe('basic_monthly');
        expect(result.message).toContain('cancelled by user');
      }

      expect(mockIapService.isPurchasing()).toBe(false);
      expect(mockIapService.getState()).toBe('user_cancelled');
    });
  });

  describe('4. Simulated Purchase Failure', () => {
    it('returns a distinct failure result when scenario is set to failure', async () => {
      mockIapConfig.setScenario('failure');

      const purchasePromise = mockIapService.purchase('standard_monthly');
      jest.advanceTimersByTime(500);
      const result = await purchasePromise;

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.productId).toBe('standard_monthly');
        expect(result.errorCode).toBe('PAYMENT_DECLINED');
        expect(result.message).toContain('declined');
      }

      expect(mockIapService.isPurchasing()).toBe(false);
      expect(mockIapService.getState()).toBe('purchase_failed');
    });
  });

  describe('5. Invalid Product ID', () => {
    it('fails immediately when an invalid product ID is requested', async () => {
      const result = await mockIapService.purchase('invalid_plan_123');

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorCode).toBe('INVALID_PRODUCT');
        expect(result.message).toContain('not found in mock catalog');
      }

      expect(mockIapService.isPurchasing()).toBe(false);
      expect(mockIapService.getState()).toBe('purchase_failed');
    });
  });

  describe('6. Duplicate Concurrent Purchase Prevention', () => {
    it('prevents concurrent purchases while an active purchase is in flight', async () => {
      mockIapConfig.setScenario('success');

      // Dispatch first purchase
      const firstPurchase = mockIapService.purchase('premium_monthly');
      expect(mockIapService.isPurchasing()).toBe(true);

      // Attempt duplicate purchase while first is still processing
      const secondPurchase = await mockIapService.purchase('standard_monthly');

      expect(secondPurchase.status).toBe('failed');
      if (secondPurchase.status === 'failed') {
        expect(secondPurchase.errorCode).toBe('SERVICE_BUSY');
        expect(secondPurchase.message).toContain('already in progress');
      }

      // Finish first purchase
      jest.advanceTimersByTime(500);
      const firstResult = await firstPurchase;
      expect(firstResult.status).toBe('success');
      expect(mockIapService.isPurchasing()).toBe(false);
    });
  });

  describe('7. Processing State and Completion', () => {
    it('emits state transitions to registered listeners', async () => {
      const stateHistory: PurchaseFlowState[] = [];
      const unsubscribe = mockIapService.addStateListener(state => {
        stateHistory.push(state);
      });

      mockIapConfig.setScenario('success');
      const purchasePromise = mockIapService.purchase('basic_annually');

      expect(stateHistory).toContain('purchasing');

      jest.advanceTimersByTime(500);
      await purchasePromise;

      expect(stateHistory).toContain('purchase_successful');
      expect(mockIapService.isPurchasing()).toBe(false);

      unsubscribe();
    });
  });

  describe('8. Service Recovery After a Failed Purchase', () => {
    it('recovers cleanly and allows subsequent purchases after a failure', async () => {
      // First attempt fails
      mockIapConfig.setScenario('failure');
      const failedPromise = mockIapService.purchase('standard_monthly');
      jest.advanceTimersByTime(500);
      const failResult = await failedPromise;

      expect(failResult.status).toBe('failed');
      expect(mockIapService.isPurchasing()).toBe(false);

      // Second attempt with success scenario should proceed smoothly without getting stuck
      mockIapConfig.setScenario('success');
      const retryPromise = mockIapService.purchase('standard_monthly');
      expect(mockIapService.isPurchasing()).toBe(true);

      jest.advanceTimersByTime(500);
      const successResult = await retryPromise;

      expect(successResult.status).toBe('success');
      expect(mockIapService.isPurchasing()).toBe(false);
      expect(mockIapService.getState()).toBe('purchase_successful');
    });
  });
});
