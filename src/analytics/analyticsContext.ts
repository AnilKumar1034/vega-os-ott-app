import {Platform} from 'react-native';
import {AppDetails} from '../constants/appDetails';
import {
  AnalyticsContext,
  AnalyticsProfileContext,
  AnalyticsUserContext,
} from './analyticsTypes';

/**
 * List of sensitive key substrings that must NEVER be logged or attached
 * to analytics events (PII, credentials, and token protection).
 */
const SENSITIVE_KEY_PATTERNS = [
  'email',
  'password',
  'token',
  'idtoken',
  'refreshtoken',
  'accesstoken',
  'authtoken',
  'secret',
  'credential',
  'creditcard',
  'cardnumber',
  'cvv',
  'pin',
  'ssn',
  'phone',
  'profilename',
];

export class AnalyticsContextManager {
  private context: AnalyticsContext;

  constructor() {
    this.context = this.getDefaultContext();
  }

  /**
   * Builds the initial non-sensitive device & application context.
   */
  private getDefaultContext(): AnalyticsContext {
    return {
      platform: Platform.OS || 'vega',
      deviceType: Platform.isTV ? 'tv' : 'device',
      appVersion: AppDetails.version || '1.0.0',
    };
  }

  /**
   * Retrieves a snapshot of the current analytics context.
   */
  public getContext(): AnalyticsContext {
    return {...this.context};
  }

  /**
   * Updates authenticated user context (user ID only).
   */
  public setUser(user: AnalyticsUserContext | null): void {
    if (user && typeof user.userId === 'string' && user.userId.trim().length > 0) {
      this.context.userId = user.userId;
    } else {
      delete this.context.userId;
    }
  }

  /**
   * Updates active profile context (profileId & profileType only).
   */
  public setProfile(profile: AnalyticsProfileContext | null): void {
    if (
      profile &&
      typeof profile.profileId === 'string' &&
      profile.profileId.trim().length > 0
    ) {
      this.context.profileId = profile.profileId;
      this.context.profileType = profile.profileType;
    } else {
      delete this.context.profileId;
      delete this.context.profileType;
    }
  }

  /**
   * Safely merges additional non-sensitive context.
   */
  public setContext(partial: Partial<AnalyticsContext>): void {
    if (!partial || typeof partial !== 'object') {
      return;
    }

    const sanitized: Partial<AnalyticsContext> = {};

    if (typeof partial.userId === 'string') {
      sanitized.userId = partial.userId;
    }
    if (typeof partial.profileId === 'string') {
      sanitized.profileId = partial.profileId;
    }
    if (partial.profileType === 'adult' || partial.profileType === 'kids') {
      sanitized.profileType = partial.profileType;
    }
    if (typeof partial.platform === 'string') {
      sanitized.platform = partial.platform;
    }
    if (typeof partial.deviceType === 'string') {
      sanitized.deviceType = partial.deviceType;
    }
    if (typeof partial.appVersion === 'string') {
      sanitized.appVersion = partial.appVersion;
    }

    this.context = {
      ...this.context,
      ...sanitized,
    };
  }

  /**
   * Resets session/user context while preserving device/app metadata.
   */
  public reset(): void {
    const defaults = this.getDefaultContext();
    this.context = {
      platform: defaults.platform,
      deviceType: defaults.deviceType,
      appVersion: defaults.appVersion,
    };
  }

  /**
   * Checks whether a parameter key name violates privacy rules.
   */
  public isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return SENSITIVE_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern));
  }

  /**
   * Merges global context with event parameters, filtering out undefined values,
   * duplicate keys, and any sensitive PII.
   */
  public buildEventPayload(
    params?: Record<string, unknown>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // 1. Add non-empty global context fields
    if (this.context.platform) {
      payload.platform = this.context.platform;
    }
    if (this.context.deviceType) {
      payload.deviceType = this.context.deviceType;
    }
    if (this.context.appVersion) {
      payload.appVersion = this.context.appVersion;
    }
    if (this.context.userId) {
      payload.userId = this.context.userId;
    }
    if (this.context.profileId) {
      payload.profileId = this.context.profileId;
    }
    if (this.context.profileType) {
      payload.profileType = this.context.profileType;
    }

    // 2. Merge event-specific parameters (safely sanitized)
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
          continue;
        }
        if (this.isSensitiveKey(key)) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(
              `[Analytics] Omitted sensitive parameter "${key}" from analytics payload.`,
            );
          }
          continue;
        }
        payload[key] = value;
      }
    }

    return payload;
  }
}

export const analyticsContextManager = new AnalyticsContextManager();
