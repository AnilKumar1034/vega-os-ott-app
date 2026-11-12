import {MockPurchaseScenario} from './types';

export const DEFAULT_SIMULATED_DELAY_MS = 800;

/**
 * POC Mode Toggle:
 * Set to `true` to enable mock subscriptions in both development and production release builds.
 * Flip to `false` when upgrading to real Amazon Appstore In-App Purchasing.
 */
export const USE_MOCK_IAP_POC = true;

class MockIapConfigManager {
  private enabled: boolean;
  private simulatedDelayMs: number;
  private scenario: MockPurchaseScenario;

  constructor() {
    this.enabled = USE_MOCK_IAP_POC || (typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false);
    this.simulatedDelayMs = DEFAULT_SIMULATED_DELAY_MS;
    this.scenario = 'success';
  }

  /**
   * Indicates whether mock IAP is active.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sets mock IAP enabled flag.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Returns current test simulation scenario ('success' | 'cancel' | 'failure').
   */
  public getScenario(): MockPurchaseScenario {
    return this.scenario;
  }

  /**
   * Sets the test simulation scenario for testing different purchase outcomes.
   */
  public setScenario(scenario: MockPurchaseScenario): void {
    this.scenario = scenario;
  }

  /**
   * Returns configured simulated network/gateway delay in milliseconds.
   */
  public getSimulatedDelayMs(): number {
    return this.simulatedDelayMs;
  }

  /**
   * Configures simulated network/gateway latency.
   */
  public setSimulatedDelayMs(delayMs: number): void {
    this.simulatedDelayMs = Math.max(0, delayMs);
  }

  /**
   * Resets mock configuration to baseline defaults.
   */
  public reset(): void {
    this.enabled = USE_MOCK_IAP_POC || (typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false);
    this.simulatedDelayMs = DEFAULT_SIMULATED_DELAY_MS;
    this.scenario = 'success';
  }
}

export const mockIapConfig = new MockIapConfigManager();
