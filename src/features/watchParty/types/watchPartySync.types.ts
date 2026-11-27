/**
 * Watch Party Playback Synchronization Types & Protocol (Day 4)
 * Strongly typed definitions for authoritative room playback state,
 * synchronization events, drift classification, and transport abstractions.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartyContentType,
  WatchPartyPlaybackAction,
  WatchPartyPlaybackStatus,
} from './watchParty.types';

export type WatchPartySyncEventType =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'STATE_SNAPSHOT'
  | 'BUFFERING'
  | 'PLAYBACK_READY'
  | 'PLAYBACK_ENDED'
  | 'PLAYER_RECOVERED'
  | 'SYNC_REQUEST'
  | 'ROOM_CLOSED';

export interface WatchPartySyncEvent {
  eventId: string;
  roomId: string;
  sessionId: string;
  contentId: string;
  type: WatchPartySyncEventType;
  participantId: string;
  sequenceNumber: number;
  playbackPositionMs: number;
  playbackStatus: WatchPartyPlaybackStatus;
  serverTimestamp?: number;
  clientTimestamp: number;
  payload?: Record<string, unknown>;
}

export interface WatchPartyAuthoritativeState {
  roomId: string;
  sessionId: string;
  contentId: string;
  contentType: WatchPartyContentType;
  playbackStatus: WatchPartyPlaybackStatus;
  positionMs: number;
  durationMs?: number;
  sequenceNumber: number;
  updatedAt: number; // UTC millisecond epoch
  updatedByParticipantId: string;
  version: number;
  lastAction?: WatchPartyPlaybackAction;
}

export type WatchPartyDriftClassification =
  | 'synchronized'
  | 'minor_drift'
  | 'moderate_drift'
  | 'severe_drift'
  | 'not_synchronizable';

export interface WatchPartyDriftResult {
  driftMs: number;
  classification: WatchPartyDriftClassification;
  expectedPositionMs: number;
  actualPositionMs: number;
  recommendedAction:
    | 'none'
    | 'seek_correction'
    | 'adjust_tempo'
    | 'reconnect'
    | 'wait_for_player';
  reason?: string;
}

export interface WatchPartySyncConfig {
  minorDriftThresholdMs: number;
  moderateDriftThresholdMs: number;
  severeDriftThresholdMs: number;
  syncIntervalMs: number;
  maxCorrectionAttempts: number;
  correctionCooldownMs: number;
  maxEventHistorySize: number;
}

export type WatchPartyTransportConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export type WatchPartySyncStatusState =
  | 'idle'
  | 'connecting'
  | 'synchronizing'
  | 'synchronized'
  | 'adjusting'
  | 'reconnecting'
  | 'error'
  | 'room_closed';

export interface WatchPartySyncDecision {
  action: 'apply_state' | 'seek_correction' | 'ignore' | 'pause' | 'play' | 'stop';
  targetPositionMs?: number;
  reason?: string;
  event?: WatchPartySyncEvent;
}

export interface WatchPartySeekOrigin {
  type: 'user_seek' | 'host_seek' | 'sync_correction';
  targetSeconds: number;
  timestamp: number;
}
