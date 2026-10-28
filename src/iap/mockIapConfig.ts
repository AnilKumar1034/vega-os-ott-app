import {MockPurchaseScenario} from './types';

export const DEFAULT_SIMULATED_DELAY_MS = 800;

class MockIapConfigManager {
  private enabled: boolean;
  private simulatedDelayMs: number;
  private scenario: MockPurchaseScenario;

  constructor() {
    this.enabled = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false;
    this.simulatedDelayMs = DEFAULT_SIMULATED_DELAY_MS;
    this.scenario = 'success';
  }

  /**
   * Indicates whether mock IAP is active.
   * Safety boundary: Release builds can NEVER activate the mock purchase service.
   */
  public isEnabled(): boolean {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      return false;
    }
    return this.enabled;
  }

  /**
   * Sets mock IAP enabled flag in development. No-op in production release builds.
   */
  public setEnabled(enabled: boolean): void {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      return;
    }
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
   * Resets mock configuration to baseline development defaults.
   */
  public reset(): void {
    this.enabled = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false;
    this.simulatedDelayMs = DEFAULT_SIMULATED_DELAY_MS;
    this.scenario = 'success';
  }
}

export const mockIapConfig = new MockIapConfigManager();
