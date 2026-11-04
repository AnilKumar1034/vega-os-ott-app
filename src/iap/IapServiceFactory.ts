import {IIapService} from './IapService';
import {mockIapConfig} from './mockIapConfig';
import {mockIapService} from './MockIapService';
import {amazonVegaIapService} from './AmazonVegaIapService';

export type IapProviderType = 'mock' | 'amazon';

/**
 * Service factory that resolves the active IIapService implementation.
 * Ensures strict separation:
 * - Mock IAP is used ONLY in development builds when explicitly enabled.
 * - Release builds ALWAYS resolve AmazonVegaIapService.
 */
export class IapServiceFactory {
  /**
   * Returns active IAP provider type.
   */
  public static getActiveProviderType(): IapProviderType {
    if (typeof __DEV__ !== 'undefined' && __DEV__ && mockIapConfig.isEnabled()) {
      return 'mock';
    }
    return 'amazon';
  }

  /**
   * Returns the appropriate IIapService instance based on build environment and dev config.
   */
  public static getIapService(): IIapService {
    if (this.getActiveProviderType() === 'mock') {
      return mockIapService;
    }
    return amazonVegaIapService;
  }
}

export const getIapService = (): IIapService => IapServiceFactory.getIapService();
