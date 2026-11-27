/**
 * Watch Party Playback Synchronization Recovery Manager (Day 4)
 * Manages bounded retries, backoff strategies, and recovery flows for
 * transport disconnects, player buffering, and drift recovery.
 * LogiXstream Amazon Vega OS React Native Application
 */

export interface SyncRecoveryConfig {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

const DEFAULT_RECOVERY_CONFIG: SyncRecoveryConfig = {
  maxRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 8000,
};

export class WatchPartySyncRecovery {
  private retryCount: number = 0;
  private isRecovering: boolean = false;
  private config: SyncRecoveryConfig;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<SyncRecoveryConfig> = {}) {
    this.config = {...DEFAULT_RECOVERY_CONFIG, ...config};
  }

  public canAttemptRecovery(): boolean {
    return !this.isRecovering && this.retryCount < this.config.maxRetries;
  }

  public getRetryCount(): number {
    return this.retryCount;
  }

  public isInRecovery(): boolean {
    return this.isRecovering;
  }

  /**
   * Schedules a recovery attempt with exponential backoff.
   */
  public scheduleRecovery(
    action: () => Promise<boolean>,
    onExhausted?: () => void,
  ): Promise<boolean> {
    if (!this.canAttemptRecovery()) {
      onExhausted?.();
      return Promise.resolve(false);
    }

    this.isRecovering = true;
    const backoffMs = Math.min(
      this.config.initialBackoffMs * Math.pow(2, this.retryCount),
      this.config.maxBackoffMs,
    );
    this.retryCount += 1;

    return new Promise(resolve => {
      this.clearTimer();
      this.recoveryTimer = setTimeout(async () => {
        try {
          const success = await action();
          this.isRecovering = false;
          if (success) {
            this.reset();
          } else if (this.retryCount >= this.config.maxRetries) {
            onExhausted?.();
          }
          resolve(success);
        } catch (e) {
          this.isRecovering = false;
          if (this.retryCount >= this.config.maxRetries) {
            onExhausted?.();
          }
          resolve(false);
        }
      }, backoffMs);
    });
  }

  /**
   * Resets retry counters once successful synchronization is confirmed.
   */
  public reset(): void {
    this.clearTimer();
    this.retryCount = 0;
    this.isRecovering = false;
  }

  /**
   * Cleans up any scheduled recovery timers.
   */
  public destroy(): void {
    this.clearTimer();
    this.isRecovering = false;
  }

  private clearTimer(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
}
