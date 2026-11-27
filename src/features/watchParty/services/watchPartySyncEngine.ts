/**
 * Watch Party Playback Synchronization Engine (Day 4)
 * Coordinates room-scoped event delivery, maintains authoritative playback state,
 * predicts playback timeline, detects drift, and triggers safe programmatic corrections.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {DEFAULT_WATCH_PARTY_SYNC_CONFIG} from '../constants/watchPartySync.constants';
import {
  WatchPartyContentType,
  WatchPartyPlaybackAction,
  WatchPartyPlaybackState,
  WatchPartyPlaybackStatus,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {
  WatchPartyAuthoritativeState,
  WatchPartyDriftResult,
  WatchPartySyncConfig,
  WatchPartySyncDecision,
  WatchPartySyncEvent,
  WatchPartySyncEventType,
  WatchPartySyncStatusState,
  WatchPartyTransportConnectionState,
} from '../types/watchPartySync.types';
import {
  calculateExpectedPosition,
  detectPlaybackDrift,
  isCorrectionAllowed,
} from '../utils/watchPartyDrift';
import {
  createEventDeduplicator,
  isEventStale,
  validateSyncEvent,
} from '../utils/watchPartySyncValidation';
import {mockSyncTransport} from './watchPartyMockSyncTransport';
import {WatchPartySyncRecovery} from './watchPartySyncRecovery';
import {WatchPartySyncTransport} from './watchPartySyncTransport';

export interface WatchPartySyncEngineCallbacks {
  onAuthoritativeStateChanged?: (state: WatchPartyAuthoritativeState) => void;
  onCorrectionRequired?: (action: {
    type: 'seek';
    targetPositionSeconds: number;
    reason: string;
  }) => void;
  onSyncStatusChanged?: (
    status: WatchPartySyncStatusState,
    message?: string,
  ) => void;
  onPlaybackCommand?: (command: {
    action: 'play' | 'pause' | 'seek' | 'stop';
    positionSeconds?: number;
  }) => void;
}

export interface SyncEngineInitParams {
  room: WatchPartyRoom;
  sessionId: string;
  participantId: string;
  isHost: boolean;
  initialPlaybackState?: WatchPartyPlaybackState | null;
  transport?: WatchPartySyncTransport;
  config?: Partial<WatchPartySyncConfig>;
  callbacks?: WatchPartySyncEngineCallbacks;
}

export class WatchPartySyncEngine {
  private room: WatchPartyRoom | null = null;
  private sessionId: string = '';
  private participantId: string = '';
  private isHost: boolean = false;
  private transport: WatchPartySyncTransport = mockSyncTransport;
  private config: WatchPartySyncConfig = DEFAULT_WATCH_PARTY_SYNC_CONFIG;
  private callbacks: WatchPartySyncEngineCallbacks = {};

  private authoritativeState: WatchPartyAuthoritativeState | null = null;
  private deduplicator = createEventDeduplicator(100);
  private recovery: WatchPartySyncRecovery = new WatchPartySyncRecovery();

  private unsubscribeTransport: (() => void) | null = null;
  private unsubscribeConnectionState: (() => void) | null = null;

  private syncStatus: WatchPartySyncStatusState = 'idle';
  private lastCorrectionTime: number = 0;
  private correctionAttemptsInWindow: number = 0;
  private highestSequenceNumber: number = 0;
  private isDestroyed: boolean = false;

  constructor() {}

  public async initialize({
    room,
    sessionId,
    participantId,
    isHost,
    initialPlaybackState,
    transport = mockSyncTransport,
    config,
    callbacks = {},
  }: SyncEngineInitParams): Promise<void> {
    this.isDestroyed = false;
    this.room = room;
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.isHost = isHost;
    this.transport = transport;
    this.callbacks = callbacks;
    this.config = {...DEFAULT_WATCH_PARTY_SYNC_CONFIG, ...config};
    this.deduplicator = createEventDeduplicator(this.config.maxEventHistorySize);
    this.recovery = new WatchPartySyncRecovery();

    // Establish initial authoritative state
    if (initialPlaybackState) {
      this.authoritativeState = {
        roomId: room.id,
        sessionId: initialPlaybackState.sessionId || sessionId,
        contentId: room.contentId,
        contentType: room.contentType,
        playbackStatus: initialPlaybackState.status,
        positionMs:
          initialPlaybackState.positionMs ??
          Math.round((initialPlaybackState.positionSeconds || 0) * 1000),
        durationMs:
          initialPlaybackState.durationMs ??
          (initialPlaybackState.durationSeconds
            ? Math.round(initialPlaybackState.durationSeconds * 1000)
            : undefined),
        sequenceNumber: initialPlaybackState.sequenceNumber || 0,
        updatedAt: initialPlaybackState.updatedAt
          ? new Date(initialPlaybackState.updatedAt).getTime()
          : Date.now(),
        updatedByParticipantId:
          initialPlaybackState.updatedByParticipantId || room.hostId,
        version: initialPlaybackState.version || 1,
        lastAction: initialPlaybackState.lastAction,
      };
      this.highestSequenceNumber = this.authoritativeState.sequenceNumber;
    } else {
      this.authoritativeState = {
        roomId: room.id,
        sessionId,
        contentId: room.contentId,
        contentType: room.contentType,
        playbackStatus: 'idle',
        positionMs: 0,
        sequenceNumber: 0,
        updatedAt: Date.now(),
        updatedByParticipantId: room.hostId,
        version: 1,
      };
      this.highestSequenceNumber = 0;
    }

    this.setSyncStatus('connecting');

    try {
      await this.transport.connect(room.id);
      this.setSyncStatus('synchronizing');

      // Subscribe to room sync events
      this.unsubscribeTransport = this.transport.subscribe(
        room.id,
        this.handleIncomingEvent.bind(this),
      );

      // Subscribe to connection state changes
      if (this.transport.onConnectionStateChange) {
        this.unsubscribeConnectionState =
          this.transport.onConnectionStateChange(
            room.id,
            this.handleConnectionStateChange.bind(this),
          );
      }

      this.setSyncStatus(isHost ? 'synchronized' : 'synchronizing');
    } catch (err: any) {
      this.setSyncStatus('error', err.message || 'Failed to connect transport');
    }
  }

  /**
   * Publishes an authoritative playback event from the Host to all room participants.
   */
  public async publishHostAction(
    type: WatchPartySyncEventType,
    positionSeconds: number,
    durationSeconds?: number,
    action?: WatchPartyPlaybackAction,
  ): Promise<WatchPartySyncEvent | null> {
    if (!this.isHost || !this.room) {
      return null;
    }

    this.highestSequenceNumber += 1;
    const now = Date.now();
    const positionMs = Math.round(Math.max(0, positionSeconds) * 1000);
    const durationMs = durationSeconds
      ? Math.round(Math.max(0, durationSeconds) * 1000)
      : undefined;

    let playbackStatus: WatchPartyPlaybackStatus = 'playing';
    if (type === 'PAUSE') playbackStatus = 'paused';
    else if (type === 'BUFFERING') playbackStatus = 'buffering';
    else if (type === 'PLAYBACK_ENDED') playbackStatus = 'completed';

    const event: WatchPartySyncEvent = {
      eventId: `evt_${now}_${Math.random().toString(36).substring(2, 7)}`,
      roomId: this.room.id,
      sessionId: this.sessionId,
      contentId: this.room.contentId,
      type,
      participantId: this.participantId,
      sequenceNumber: this.highestSequenceNumber,
      playbackPositionMs: positionMs,
      playbackStatus,
      clientTimestamp: now,
      serverTimestamp: now,
      payload: {action, durationMs},
    };

    // Update local authoritative state
    this.authoritativeState = {
      roomId: this.room.id,
      sessionId: this.sessionId,
      contentId: this.room.contentId,
      contentType: this.room.contentType,
      playbackStatus,
      positionMs,
      durationMs,
      sequenceNumber: this.highestSequenceNumber,
      updatedAt: now,
      updatedByParticipantId: this.participantId,
      version: (this.authoritativeState?.version || 0) + 1,
      lastAction: action,
    };

    // Mark as processed locally
    this.deduplicator.add(event.eventId);
    this.callbacks.onAuthoritativeStateChanged?.(this.authoritativeState);

    try {
      await this.transport.publish(event);
      return event;
    } catch (err) {
      console.warn('[SyncEngine] Failed to publish host action:', err);
      return null;
    }
  }

  /**
   * Processes incoming sync events from the transport channel.
   */
  public handleIncomingEvent(event: WatchPartySyncEvent): WatchPartySyncDecision {
    if (this.isDestroyed || !this.room) {
      return {action: 'ignore', reason: 'Engine destroyed or uninitialized'};
    }

    // 1. Schema Validation
    const validation = validateSyncEvent(event);
    if (!validation.isValid) {
      return {action: 'ignore', reason: validation.error};
    }

    // 2. Room & Session Scoping
    if (event.roomId !== this.room.id) {
      return {action: 'ignore', reason: 'Mismatched roomId'};
    }
    if (event.contentId !== this.room.contentId) {
      return {action: 'ignore', reason: 'Mismatched contentId'};
    }

    // 3. Duplicate Protection
    if (this.deduplicator.has(event.eventId)) {
      return {action: 'ignore', reason: 'Duplicate event received'};
    }
    this.deduplicator.add(event.eventId);

    // 4. Stale Event Protection
    if (
      isEventStale(
        event,
        this.sessionId,
        this.highestSequenceNumber,
      )
    ) {
      return {action: 'ignore', reason: 'Stale sequence number received'};
    }

    // Record highest sequence
    this.highestSequenceNumber = Math.max(
      this.highestSequenceNumber,
      event.sequenceNumber,
    );

    // 5. Update Authoritative State
    this.authoritativeState = {
      roomId: event.roomId,
      sessionId: event.sessionId,
      contentId: event.contentId,
      contentType: this.room.contentType,
      playbackStatus: event.playbackStatus,
      positionMs: event.playbackPositionMs,
      durationMs: event.payload?.durationMs as number | undefined,
      sequenceNumber: event.sequenceNumber,
      updatedAt: event.serverTimestamp || event.clientTimestamp || Date.now(),
      updatedByParticipantId: event.participantId,
      version: (this.authoritativeState?.version || 0) + 1,
      lastAction: event.payload?.action as WatchPartyPlaybackAction | undefined,
    };

    this.callbacks.onAuthoritativeStateChanged?.(this.authoritativeState);

    // Hosts do not apply guest commands to their local player
    if (this.isHost) {
      return {action: 'apply_state', event};
    }

    // 6. Map Event Type to Player Command for Guests
    switch (event.type) {
      case 'PLAY': {
        const expected = calculateExpectedPosition(
          this.authoritativeState,
          Date.now(),
        );
        this.callbacks.onPlaybackCommand?.({
          action: 'play',
          positionSeconds: expected / 1000,
        });
        this.setSyncStatus('synchronized');
        return {action: 'play', targetPositionMs: expected, event};
      }
      case 'PAUSE': {
        this.callbacks.onPlaybackCommand?.({
          action: 'pause',
          positionSeconds: event.playbackPositionMs / 1000,
        });
        this.setSyncStatus('synchronized');
        return {
          action: 'pause',
          targetPositionMs: event.playbackPositionMs,
          event,
        };
      }
      case 'SEEK': {
        this.callbacks.onPlaybackCommand?.({
          action: 'seek',
          positionSeconds: event.playbackPositionMs / 1000,
        });
        this.setSyncStatus('synchronized');
        return {
          action: 'seek_correction',
          targetPositionMs: event.playbackPositionMs,
          event,
        };
      }
      case 'PLAYBACK_ENDED': {
        this.callbacks.onPlaybackCommand?.({action: 'stop'});
        this.setSyncStatus('synchronized');
        return {action: 'stop', event};
      }
      case 'ROOM_CLOSED': {
        this.setSyncStatus('room_closed');
        return {action: 'stop', reason: 'Room was closed by host', event};
      }
      default:
        return {action: 'apply_state', event};
    }
  }

  /**
   * Computes the initial sync action required when a participant joins late.
   */
  public handleLateJoin(currentPositionSeconds: number): {
    shouldSeek: boolean;
    targetPositionMs: number;
    shouldPlay: boolean;
    isCompleted: boolean;
  } {
    if (!this.authoritativeState) {
      return {
        shouldSeek: false,
        targetPositionMs: 0,
        shouldPlay: false,
        isCompleted: false,
      };
    }

    if (this.authoritativeState.playbackStatus === 'completed') {
      return {
        shouldSeek: false,
        targetPositionMs: this.authoritativeState.positionMs,
        shouldPlay: false,
        isCompleted: true,
      };
    }

    const expectedPositionMs = calculateExpectedPosition(
      this.authoritativeState,
      Date.now(),
    );
    const actualPositionMs = Math.round(currentPositionSeconds * 1000);
    const driftMs = Math.abs(actualPositionMs - expectedPositionMs);

    const shouldSeek = driftMs > this.config.minorDriftThresholdMs;
    const shouldPlay = this.authoritativeState.playbackStatus === 'playing';

    return {
      shouldSeek,
      targetPositionMs: expectedPositionMs,
      shouldPlay,
      isCompleted: false,
    };
  }

  /**
   * Evaluates drift between local player position and authoritative timeline.
   */
  public evaluateDrift(
    actualPositionSeconds: number,
    isBuffering: boolean = false,
    isPlayerReady: boolean = true,
  ): WatchPartyDriftResult {
    const actualPositionMs = Math.round(actualPositionSeconds * 1000);
    const now = Date.now();
    const expectedPositionMs = calculateExpectedPosition(
      this.authoritativeState,
      now,
    );

    const result = detectPlaybackDrift({
      expectedPositionMs,
      actualPositionMs,
      isBuffering,
      isPlayerReady,
      playbackStatus: this.authoritativeState?.playbackStatus,
      config: this.config,
    });

    if (this.isHost) {
      return result;
    }

    // For Guests: apply programmatic seek correction if recommended
    if (result.recommendedAction === 'seek_correction') {
      const allowed = isCorrectionAllowed({
        lastCorrectionTime: this.lastCorrectionTime,
        now,
        attemptsInWindow: this.correctionAttemptsInWindow,
        config: this.config,
      });

      if (allowed) {
        this.lastCorrectionTime = now;
        this.correctionAttemptsInWindow += 1;
        this.setSyncStatus('adjusting');

        const targetSeconds = expectedPositionMs / 1000;
        this.callbacks.onCorrectionRequired?.({
          type: 'seek',
          targetPositionSeconds: targetSeconds,
          reason: result.reason || 'Drift correction',
        });
      } else {
        // Cooldown or attempt limit reached
        this.setSyncStatus('synchronizing', 'Awaiting sync window cooldown');
      }
    } else if (result.classification === 'synchronized') {
      this.setSyncStatus('synchronized');
      this.correctionAttemptsInWindow = 0;
    }

    return result;
  }

  public getAuthoritativeState(): WatchPartyAuthoritativeState | null {
    return this.authoritativeState;
  }

  public getSyncStatus(): WatchPartySyncStatusState {
    return this.syncStatus;
  }

  public resetCorrectionWindow(): void {
    this.correctionAttemptsInWindow = 0;
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.unsubscribeTransport) {
      this.unsubscribeTransport();
      this.unsubscribeTransport = null;
    }
    if (this.unsubscribeConnectionState) {
      this.unsubscribeConnectionState();
      this.unsubscribeConnectionState = null;
    }
    if (this.room) {
      this.transport.disconnect(this.room.id).catch(() => {});
    }
    this.recovery.destroy();
    this.deduplicator.clear();
    this.syncStatus = 'idle';
  }

  private setSyncStatus(
    status: WatchPartySyncStatusState,
    message?: string,
  ): void {
    if (this.syncStatus !== status) {
      this.syncStatus = status;
      this.callbacks.onSyncStatusChanged?.(status, message);
    }
  }

  private handleConnectionStateChange(
    state: WatchPartyTransportConnectionState,
  ): void {
    if (state === 'connected') {
      this.recovery.reset();
      this.setSyncStatus('synchronized');
    } else if (state === 'reconnecting') {
      this.setSyncStatus('reconnecting');
    } else if (state === 'disconnected') {
      this.setSyncStatus('idle');
    } else if (state === 'failed') {
      this.setSyncStatus('error', 'Transport connection failed');
      // Trigger bounded recovery
      if (this.room && this.recovery.canAttemptRecovery()) {
        this.recovery.scheduleRecovery(async () => {
          if (!this.room) return false;
          try {
            await this.transport.connect(this.room.id);
            return true;
          } catch {
            return false;
          }
        });
      }
    }
  }
}
