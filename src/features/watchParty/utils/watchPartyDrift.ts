/**
 * Watch Party Playback Drift Detection & Prediction Utilities (Day 4)
 * Calculates expected playback position, evaluates drift between local player
 * and authoritative room state, and determines correction recommendations.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {DEFAULT_WATCH_PARTY_SYNC_CONFIG} from '../constants/watchPartySync.constants';
import {WatchPartyPlaybackStatus} from '../types/watchParty.types';
import {
  WatchPartyAuthoritativeState,
  WatchPartyDriftResult,
  WatchPartySyncConfig,
} from '../types/watchPartySync.types';

/**
 * Predicts the expected authoritative playback position at a given wall-clock time.
 * For 'playing' state, projects forward based on elapsed time since updatedAt.
 * For non-playing states ('paused', 'buffering', 'completed'), returns the fixed position.
 */
export function calculateExpectedPosition(
  state: WatchPartyAuthoritativeState | null | undefined,
  now: number = Date.now(),
  durationMs?: number,
): number {
  if (!state) {
    return 0;
  }

  const effectiveDuration = durationMs ?? state.durationMs;

  if (state.playbackStatus !== 'playing') {
    const rawPos = Math.max(0, state.positionMs);
    return effectiveDuration && effectiveDuration > 0
      ? Math.min(rawPos, effectiveDuration)
      : rawPos;
  }

  // Calculate elapsed time since authoritative state was reported
  const elapsedMs = Math.max(0, now - (state.updatedAt || now));
  const projected = Math.max(0, state.positionMs + elapsedMs);

  return effectiveDuration && effectiveDuration > 0
    ? Math.min(projected, effectiveDuration)
    : projected;
}

export interface EvaluateDriftParams {
  expectedPositionMs: number;
  actualPositionMs: number;
  isBuffering?: boolean;
  isPlayerReady?: boolean;
  playbackStatus?: WatchPartyPlaybackStatus;
  config?: WatchPartySyncConfig;
}

/**
 * Evaluates the drift difference between local player position and expected position.
 * Returns a classification and recommended action.
 */
export function detectPlaybackDrift({
  expectedPositionMs,
  actualPositionMs,
  isBuffering = false,
  isPlayerReady = true,
  playbackStatus = 'playing',
  config = DEFAULT_WATCH_PARTY_SYNC_CONFIG,
}: EvaluateDriftParams): WatchPartyDriftResult {
  // If player is still preparing or buffering, do not trigger seeks
  if (!isPlayerReady || isBuffering) {
    return {
      driftMs: 0,
      classification: 'not_synchronizable',
      expectedPositionMs,
      actualPositionMs,
      recommendedAction: 'wait_for_player',
      reason: !isPlayerReady
        ? 'Player surface or stream is not ready'
        : 'Player is currently buffering',
    };
  }

  // If content has reached completion, no correction needed
  if (playbackStatus === 'completed') {
    return {
      driftMs: 0,
      classification: 'synchronized',
      expectedPositionMs,
      actualPositionMs,
      recommendedAction: 'none',
      reason: 'Playback is completed',
    };
  }

  // Drift = Actual - Expected.
  // Positive drift: Local player is ahead of host.
  // Negative drift: Local player is behind host.
  const driftMs = actualPositionMs - expectedPositionMs;
  const absDrift = Math.abs(driftMs);

  if (absDrift <= config.minorDriftThresholdMs) {
    return {
      driftMs,
      classification: 'synchronized',
      expectedPositionMs,
      actualPositionMs,
      recommendedAction: 'none',
      reason: `Drift (${absDrift}ms) is within synchronous threshold (${config.minorDriftThresholdMs}ms)`,
    };
  }

  if (absDrift <= config.moderateDriftThresholdMs) {
    return {
      driftMs,
      classification: 'minor_drift',
      expectedPositionMs,
      actualPositionMs,
      recommendedAction: 'none',
      reason: `Minor drift (${absDrift}ms) within smooth tolerance; uninterrupted playback preferred`,
    };
  }

  if (absDrift <= config.severeDriftThresholdMs) {
    return {
      driftMs,
      classification: 'moderate_drift',
      expectedPositionMs,
      actualPositionMs,
      recommendedAction: 'seek_correction',
      reason: `Moderate drift (${absDrift}ms) requires programmatic seek alignment`,
    };
  }

  return {
    driftMs,
    classification: 'severe_drift',
    expectedPositionMs,
    actualPositionMs,
    recommendedAction: 'seek_correction',
    reason: `Severe drift (${absDrift}ms) exceeding ${config.severeDriftThresholdMs}ms threshold`,
  };
}

export interface CanApplyCorrectionParams {
  lastCorrectionTime: number;
  now: number;
  attemptsInWindow: number;
  config?: WatchPartySyncConfig;
}

/**
 * Ensures programmatic seek corrections honor cooldown periods and bounded retry limits.
 */
export function isCorrectionAllowed({
  lastCorrectionTime,
  now,
  attemptsInWindow,
  config = DEFAULT_WATCH_PARTY_SYNC_CONFIG,
}: CanApplyCorrectionParams): boolean {
  if (attemptsInWindow >= config.maxCorrectionAttempts) {
    return false;
  }
  const timeSinceLast = now - lastCorrectionTime;
  return timeSinceLast >= config.correctionCooldownMs;
}
