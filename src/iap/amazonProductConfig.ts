import {BillingCycle, SubscriptionTier} from '../types/subscription';
import {IapProduct} from './types';
import {Product} from '@amazon-devices/keplerscript-appstore-iap-lib';

export interface AmazonProductDefinition {
  readonly amazonSku: string;
  readonly planId: string;
  readonly planName: string;
  readonly tier: SubscriptionTier;
  readonly billingCycle: BillingCycle;
  readonly defaultPriceAmount: number;
  readonly defaultPriceFormatted: string;
  readonly subscriptionParent: string;
  readonly aliases: readonly string[];
}

/**
 * Authoritative mapping of LogiXstream subscription plans to Amazon Appstore SKUs.
 * Canonical SKUs follow the 'logixstream_{tier}_{cycle}' format registered in the Developer Console.
 */
export const AMAZON_PRODUCT_DEFINITIONS: readonly AmazonProductDefinition[] = [
  {
    amazonSku: 'logixstream_premium_monthly',
    planId: 'premium',
    planName: 'Premium',
    tier: 'premium',
    billingCycle: 'monthly',
    defaultPriceAmount: 649,
    defaultPriceFormatted: '₹649',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['premium_monthly', 'premium'],
  },
  {
    amazonSku: 'logixstream_premium_annually',
    planId: 'premium',
    planName: 'Premium',
    tier: 'premium',
    billingCycle: 'annually',
    defaultPriceAmount: 5841,
    defaultPriceFormatted: '₹5,841',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['premium_annually'],
  },
  {
    amazonSku: 'logixstream_standard_monthly',
    planId: 'standard',
    planName: 'Standard',
    tier: 'standard',
    billingCycle: 'monthly',
    defaultPriceAmount: 499,
    defaultPriceFormatted: '₹499',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['standard_monthly', 'standard'],
  },
  {
    amazonSku: 'logixstream_standard_annually',
    planId: 'standard',
    planName: 'Standard',
    tier: 'standard',
    billingCycle: 'annually',
    defaultPriceAmount: 5089,
    defaultPriceFormatted: '₹5,089',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['standard_annually'],
  },
  {
    amazonSku: 'logixstream_basic_monthly',
    planId: 'basic',
    planName: 'Basic',
    tier: 'basic',
    billingCycle: 'monthly',
    defaultPriceAmount: 299,
    defaultPriceFormatted: '₹299',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['basic_monthly', 'basic'],
  },
  {
    amazonSku: 'logixstream_basic_annually',
    planId: 'basic',
    planName: 'Basic',
    tier: 'basic',
    billingCycle: 'annually',
    defaultPriceAmount: 3229,
    defaultPriceFormatted: '₹3,229',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['basic_annually'],
  },
  {
    amazonSku: 'logixstream_mobile_monthly',
    planId: 'mobile',
    planName: 'Mobile',
    tier: 'mobile',
    billingCycle: 'monthly',
    defaultPriceAmount: 149,
    defaultPriceFormatted: '₹149',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['mobile_monthly', 'mobile'],
  },
  {
    amazonSku: 'logixstream_mobile_annually',
    planId: 'mobile',
    planName: 'Mobile',
    tier: 'mobile',
    billingCycle: 'annually',
    defaultPriceAmount: 1699,
    defaultPriceFormatted: '₹1,699',
    subscriptionParent: 'logixstream_subscription_group',
    aliases: ['mobile_annually'],
  },
] as const;

/**
 * Returns all canonical Amazon SKUs configured for query against PurchasingService.getProductData.
 */
export const getAllAmazonSkus = (): string[] => {
  return AMAZON_PRODUCT_DEFINITIONS.map(def => def.amazonSku);
};

/**
 * Resolves an AmazonProductDefinition for a given plan ID and billing cycle.
 */
export const getDefinitionForPlan = (
  planId: string,
  billingCycle: BillingCycle = 'monthly',
): AmazonProductDefinition | undefined => {
  const cleanPlan = planId?.trim().toLowerCase();
  return AMAZON_PRODUCT_DEFINITIONS.find(
    def => def.planId.toLowerCase() === cleanPlan && def.billingCycle === billingCycle,
  );
};

/**
 * Resolves an AmazonProductDefinition by any SKU or alias.
 */
export const getDefinitionBySku = (
  skuOrAlias: string,
): AmazonProductDefinition | undefined => {
  if (!skuOrAlias) return undefined;
  const clean = skuOrAlias.trim().toLowerCase();

  // 1. Direct canonical SKU match
  const direct = AMAZON_PRODUCT_DEFINITIONS.find(
    def => def.amazonSku.toLowerCase() === clean,
  );
  if (direct) return direct;

  // 2. Alias match (e.g. 'premium_monthly')
  return AMAZON_PRODUCT_DEFINITIONS.find(def =>
    def.aliases.some(alias => alias.toLowerCase() === clean),
  );
};

/**
 * Maps an Amazon IAP Product object returned by PurchasingService.getProductData
 * into the standardized application IapProduct model.
 */
export const normalizeAmazonProduct = (product: Product): IapProduct => {
  const def = getDefinitionBySku(product.sku);

  let priceAmount = def ? def.defaultPriceAmount : 0;
  if (product.price?.valueInMicros) {
    try {
      priceAmount = Number(product.price.valueInMicros) / 1000000;
    } catch {
      priceAmount = def ? def.defaultPriceAmount : 0;
    }
  }

  const priceFormatted = product.price?.priceStr || def?.defaultPriceFormatted || `₹${priceAmount}`;
  const currency = product.price?.priceCurrencyCode || 'INR';
  const planId = def?.planId || product.sku.split('_')[1] || product.sku;
  const tier: SubscriptionTier = def?.tier || (planId as SubscriptionTier) || 'free';
  const billingCycle: BillingCycle =
    def?.billingCycle || (product.sku.endsWith('annually') ? 'annually' : 'monthly');

  return {
    productId: product.sku,
    planId,
    tier,
    title: product.title || def?.planName || product.sku,
    description: product.description || '',
    priceFormatted,
    priceAmount,
    billingCycle,
    currency,
  };
};
