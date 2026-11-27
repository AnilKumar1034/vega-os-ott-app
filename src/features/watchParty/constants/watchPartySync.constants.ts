/**
 * Watch Party Playback Synchronization Constants (Day 4)
 * Thresholds, test IDs, default configuration and error codes.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {WatchPartySyncConfig} from '../types/watchPartySync.types';

export const DEFAULT_WATCH_PARTY_SYNC_CONFIG: WatchPartySyncConfig = {
  minorDriftThresholdMs: 500, // < 500ms is considered in-sync
  moderateDriftThresholdMs: 2000, // 500ms - 2000ms: tolerable / mild drift
  severeDriftThresholdMs: 5000, // > 5000ms: severe drift, triggers seek correction
  syncIntervalMs: 3000, // Periodic drift evaluation every 3s
  maxCorrectionAttempts: 3, // Bounded retries per interval window
  correctionCooldownMs: 2500, // Cooldown between programmatic sync seeks
  maxEventHistorySize: 100, // Bounded LRU/history size for event deduplication
};

export const WATCH_PARTY_SYNC_TEST_IDS = {
  syncStatusBadge: 'watch-party-sync-status-badge',
  syncOverlay: 'watch-party-sync-overlay',
  syncDriftIndicator: 'watch-party-sync-drift-indicator',
  syncErrorMessage: 'watch-party-sync-error-message',
  syncRetryButton: 'watch-party-sync-retry-button',
} as const;

export const SYNC_ERROR_CODES = {
  ROOM_CLOSED: 'ROOM_CLOSED',
  SESSION_MISMATCH: 'SESSION_MISMATCH',
  CONTENT_MISMATCH: 'CONTENT_MISMATCH',
  UNAUTHORIZED: 'UNAUTHORIZED',
  STALE_EVENT: 'STALE_EVENT',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
  PLAYER_NOT_READY: 'PLAYER_NOT_READY',
  DRIFT_LIMIT_EXCEEDED: 'DRIFT_LIMIT_EXCEEDED',
} as const;

export const SYNC_STATUS_LABELS: Record<string, string> = {
  idle: 'Sync Idle',
  connecting: 'Connecting...',
  synchronizing: 'Synchronizing...',
  synchronized: 'In Sync',
  adjusting: 'Adjusting...',
  reconnecting: 'Reconnecting...',
  error: 'Sync Offline',
  room_closed: 'Party Ended',
};
