/**
 * Watch Party Playback Synchronization Engine Test Suite (Day 4)
 * Comprehensive testing for protocol schema, mock transport, authoritative state,
 * drift detection, drift correction, late-join flows, recovery, and UI indicators.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {
  calculateExpectedPosition,
  detectPlaybackDrift,
  isCorrectionAllowed,
} from '../src/features/watchParty/utils/watchPartyDrift';
import {
  createEventDeduplicator,
  isEventStale,
  validateAuthoritativeState,
  validateSyncEvent,
} from '../src/features/watchParty/utils/watchPartySyncValidation';
import {
  WatchPartyMockSyncTransport,
} from '../src/features/watchParty/services/watchPartyMockSyncTransport';
import {WatchPartySyncRecovery} from '../src/features/watchParty/services/watchPartySyncRecovery';
import {WatchPartySyncEngine} from '../src/features/watchParty/services/watchPartySyncEngine';
import {WatchPartySyncStatus} from '../src/features/watchParty/components/WatchPartySyncStatus';
import {WatchPartySyncOverlay} from '../src/features/watchParty/components/WatchPartySyncOverlay';
import {WATCH_PARTY_SYNC_TEST_IDS} from '../src/features/watchParty/constants/watchPartySync.constants';
import {
  WatchPartyAuthoritativeState,
  WatchPartySyncConfig,
  WatchPartySyncEvent,
} from '../src/features/watchParty/types/watchPartySync.types';
import {WatchPartyRoom} from '../src/features/watchParty/types/watchParty.types';

describe('Watch Party Playback Synchronization Engine (Day 4)', () => {
  const testRoom: WatchPartyRoom = {
    id: 'room_sync_001',
    roomCode: 'SYNC99',
    hostId: 'user_host_1',
    hostProfileId: 'profile_host_1',
    contentId: 'content_movie_1',
    contentType: 'movie',
    contentTitle: 'Cosmic Horizon',
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    participantCount: 2,
    maxParticipants: 5,
    isPrivate: true,
  };

  const testConfig: WatchPartySyncConfig = {
    minorDriftThresholdMs: 500,
    moderateDriftThresholdMs: 2000,
    severeDriftThresholdMs: 5000,
    syncIntervalMs: 3000,
    maxCorrectionAttempts: 3,
    correctionCooldownMs: 2000,
    maxEventHistorySize: 50,
  };

  // ==========================================
  // Section A: Protocol & Validation Tests
  // ==========================================
  describe('Protocol & Validation (watchPartySyncValidation)', () => {
    it('validates compliant synchronization events', () => {
      const validEvent: WatchPartySyncEvent = {
        eventId: 'evt_001',
        roomId: 'room_sync_001',
        sessionId: 'session_001',
        contentId: 'content_movie_1',
        type: 'PLAY',
        participantId: 'user_host_1',
        sequenceNumber: 1,
        playbackPositionMs: 12000,
        playbackStatus: 'playing',
        clientTimestamp: Date.now(),
      };

      const result = validateSyncEvent(validEvent);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects events missing essential identifiers', () => {
      expect(validateSyncEvent(null).isValid).toBe(false);
      expect(validateSyncEvent({} as any).isValid).toBe(false);
      expect(
        validateSyncEvent({
          eventId: '',
          roomId: 'r1',
          sessionId: 's1',
          contentId: 'c1',
          type: 'PLAY',
          sequenceNumber: 1,
          playbackPositionMs: 0,
          clientTimestamp: Date.now(),
        }).isValid,
      ).toBe(false);
    });

    it('rejects events with invalid types or negative positions', () => {
      expect(
        validateSyncEvent({
          eventId: 'e1',
          roomId: 'r1',
          sessionId: 's1',
          contentId: 'c1',
          type: 'UNKNOWN_TYPE' as any,
          sequenceNumber: 1,
          playbackPositionMs: 0,
          clientTimestamp: Date.now(),
        }).isValid,
      ).toBe(false);

      expect(
        validateSyncEvent({
          eventId: 'e1',
          roomId: 'r1',
          sessionId: 's1',
          contentId: 'c1',
          type: 'PLAY',
          sequenceNumber: 1,
          playbackPositionMs: -50,
          clientTimestamp: Date.now(),
        }).isValid,
      ).toBe(false);
    });

    it('detects and rejects stale sequence numbers and mismatched sessions', () => {
      const event: WatchPartySyncEvent = {
        eventId: 'evt_002',
        roomId: 'r1',
        sessionId: 'session_old',
        contentId: 'c1',
        type: 'PAUSE',
        participantId: 'p1',
        sequenceNumber: 3,
        playbackPositionMs: 10000,
        playbackStatus: 'paused',
        clientTimestamp: Date.now(),
      };

      // Session mismatch is stale
      expect(isEventStale(event, 'session_new', 1)).toBe(true);
      // Older sequence number is stale
      expect(isEventStale(event, 'session_old', 5)).toBe(true);
      // Equal or higher sequence number is not stale
      expect(isEventStale(event, 'session_old', 3)).toBe(false);
      expect(isEventStale(event, 'session_old', 2)).toBe(false);
    });

    it('deduplicates events within a bounded history size', () => {
      const deduplicator = createEventDeduplicator(3);
      deduplicator.add('evt_1');
      deduplicator.add('evt_2');
      deduplicator.add('evt_3');

      expect(deduplicator.has('evt_1')).toBe(true);
      expect(deduplicator.has('evt_2')).toBe(true);

      // Adding 4th event evicts oldest ('evt_1')
      deduplicator.add('evt_4');
      expect(deduplicator.has('evt_1')).toBe(false);
      expect(deduplicator.has('evt_4')).toBe(true);
      expect(deduplicator.size()).toBe(3);
    });

    it('validates authoritative playback state objects', () => {
      expect(
        validateAuthoritativeState({
          roomId: 'r1',
          sessionId: 's1',
          contentId: 'c1',
          playbackStatus: 'playing',
          positionMs: 5000,
        }).isValid,
      ).toBe(true);

      expect(
        validateAuthoritativeState({
          roomId: '',
          sessionId: 's1',
          contentId: 'c1',
          positionMs: 5000,
        }).isValid,
      ).toBe(false);
    });
  });

  // ==========================================
  // Section B: Mock Transport Tests
  // ==========================================
  describe('Mock Synchronization Transport (WatchPartyMockSyncTransport)', () => {
    let transport: WatchPartyMockSyncTransport;

    beforeEach(() => {
      transport = new WatchPartyMockSyncTransport();
    });

    afterEach(() => {
      transport.reset();
    });

    it('connects, tracks connection state, and disconnects cleanly', async () => {
      expect(transport.getConnectionState('room_1')).toBe('disconnected');
      await transport.connect('room_1');
      expect(transport.getConnectionState('room_1')).toBe('connected');

      await transport.disconnect('room_1');
      expect(transport.getConnectionState('room_1')).toBe('disconnected');
    });

    it('delivers events only to subscribed room listeners and isolates other rooms', async () => {
      await transport.connect('room_A');
      await transport.connect('room_B');

      const roomAListener = jest.fn();
      const roomBListener = jest.fn();

      const unsubA = transport.subscribe('room_A', roomAListener);
      const unsubB = transport.subscribe('room_B', roomBListener);

      const eventA: WatchPartySyncEvent = {
        eventId: 'evt_a',
        roomId: 'room_A',
        sessionId: 'sess_1',
        contentId: 'c1',
        type: 'PLAY',
        participantId: 'h1',
        sequenceNumber: 1,
        playbackPositionMs: 5000,
        playbackStatus: 'playing',
        clientTimestamp: Date.now(),
      };

      await transport.publish(eventA);

      expect(roomAListener).toHaveBeenCalledTimes(1);
      expect(roomAListener).toHaveBeenCalledWith(eventA);
      expect(roomBListener).not.toHaveBeenCalled();

      // Unsubscribe cleanup
      unsubA();
      unsubB();
      expect(transport.getActiveListenerCount('room_A')).toBe(0);
    });

    it('simulates publish failure when configured', async () => {
      await transport.connect('room_fail');
      transport.setPublishFailure('room_fail', true);

      const event: WatchPartySyncEvent = {
        eventId: 'evt_err',
        roomId: 'room_fail',
        sessionId: 'sess_1',
        contentId: 'c1',
        type: 'PAUSE',
        participantId: 'h1',
        sequenceNumber: 1,
        playbackPositionMs: 0,
        playbackStatus: 'paused',
        clientTimestamp: Date.now(),
      };

      await expect(transport.publish(event)).rejects.toThrow(
        'Mock transport failed to publish event',
      );
    });

    it('notifies connection state change listeners', async () => {
      const stateListener = jest.fn();
      const unsub = transport.onConnectionStateChange('room_state', stateListener);

      transport.setConnectionState('room_state', 'reconnecting');
      expect(stateListener).toHaveBeenCalledWith('reconnecting');

      transport.setConnectionState('room_state', 'connected');
      expect(stateListener).toHaveBeenCalledWith('connected');

      unsub();
    });
  });

  // ==========================================
  // Section C: Drift Detection & Prediction
  // ==========================================
  describe('Drift Detection & Timeline Prediction (watchPartyDrift)', () => {
    it('predicts position forward when status is playing', () => {
      const now = Date.now();
      const state: WatchPartyAuthoritativeState = {
        roomId: 'r1',
        sessionId: 's1',
        contentId: 'c1',
        contentType: 'movie',
        playbackStatus: 'playing',
        positionMs: 10000,
        durationMs: 60000,
        sequenceNumber: 1,
        updatedAt: now - 3000, // 3 seconds ago
        updatedByParticipantId: 'h1',
        version: 1,
      };

      // 10000ms + 3000ms elapsed = 13000ms
      const predicted = calculateExpectedPosition(state, now);
      expect(predicted).toBe(13000);
    });

    it('does not extrapolate position when paused or ended', () => {
      const now = Date.now();
      const state: WatchPartyAuthoritativeState = {
        roomId: 'r1',
        sessionId: 's1',
        contentId: 'c1',
        contentType: 'movie',
        playbackStatus: 'paused',
        positionMs: 15000,
        sequenceNumber: 1,
        updatedAt: now - 5000,
        updatedByParticipantId: 'h1',
        version: 1,
      };

      expect(calculateExpectedPosition(state, now)).toBe(15000);
    });

    it('clamps predicted position to known duration', () => {
      const now = Date.now();
      const state: WatchPartyAuthoritativeState = {
        roomId: 'r1',
        sessionId: 's1',
        contentId: 'c1',
        contentType: 'movie',
        playbackStatus: 'playing',
        positionMs: 58000,
        durationMs: 60000,
        sequenceNumber: 1,
        updatedAt: now - 5000, // +5s would exceed duration
        updatedByParticipantId: 'h1',
        version: 1,
      };

      expect(calculateExpectedPosition(state, now)).toBe(60000);
    });

    it('classifies drift correctly across all threshold tiers', () => {
      // 1. Synchronized (< 500ms)
      const syncResult = detectPlaybackDrift({
        expectedPositionMs: 10000,
        actualPositionMs: 10200,
        config: testConfig,
      });
      expect(syncResult.classification).toBe('synchronized');
      expect(syncResult.recommendedAction).toBe('none');

      // 2. Minor Drift (500ms - 2000ms) -> uninterrupted
      const minorResult = detectPlaybackDrift({
        expectedPositionMs: 10000,
        actualPositionMs: 11200,
        config: testConfig,
      });
      expect(minorResult.classification).toBe('minor_drift');
      expect(minorResult.recommendedAction).toBe('none');

      // 3. Moderate Drift (2000ms - 5000ms) -> seek correction
      const modResult = detectPlaybackDrift({
        expectedPositionMs: 10000,
        actualPositionMs: 13500,
        config: testConfig,
      });
      expect(modResult.classification).toBe('moderate_drift');
      expect(modResult.recommendedAction).toBe('seek_correction');

      // 4. Severe Drift (> 5000ms) -> seek correction
      const severeResult = detectPlaybackDrift({
        expectedPositionMs: 10000,
        actualPositionMs: 18000,
        config: testConfig,
      });
      expect(severeResult.classification).toBe('severe_drift');
      expect(severeResult.recommendedAction).toBe('seek_correction');

      // 5. Player Buffering / Not Ready -> not synchronizable
      const bufferResult = detectPlaybackDrift({
        expectedPositionMs: 10000,
        actualPositionMs: 10000,
        isBuffering: true,
        config: testConfig,
      });
      expect(bufferResult.classification).toBe('not_synchronizable');
      expect(bufferResult.recommendedAction).toBe('wait_for_player');
    });

    it('enforces correction cooldown and max attempts', () => {
      const now = Date.now();
      // Within cooldown (< 2000ms since last correction)
      expect(
        isCorrectionAllowed({
          lastCorrectionTime: now - 500,
          now,
          attemptsInWindow: 0,
          config: testConfig,
        }),
      ).toBe(false);

      // Past cooldown and attempts available
      expect(
        isCorrectionAllowed({
          lastCorrectionTime: now - 3000,
          now,
          attemptsInWindow: 1,
          config: testConfig,
        }),
      ).toBe(true);

      // Max attempts exhausted (>= 3)
      expect(
        isCorrectionAllowed({
          lastCorrectionTime: now - 3000,
          now,
          attemptsInWindow: 3,
          config: testConfig,
        }),
      ).toBe(false);
    });
  });

  // ==========================================
  // Section D: Synchronization Engine Tests
  // ==========================================
  describe('Synchronization Engine (WatchPartySyncEngine)', () => {
    let engine: WatchPartySyncEngine;
    let transport: WatchPartyMockSyncTransport;

    beforeEach(async () => {
      transport = new WatchPartyMockSyncTransport();
      engine = new WatchPartySyncEngine();
    });

    afterEach(() => {
      engine.destroy();
      transport.reset();
    });

    it('initializes authoritative state and connects to transport', async () => {
      const onStatus = jest.fn();
      await engine.initialize({
        room: testRoom,
        sessionId: 'session_init_1',
        participantId: 'user_host_1',
        isHost: true,
        transport,
        callbacks: {onSyncStatusChanged: onStatus},
      });

      expect(engine.getSyncStatus()).toBe('synchronized');
      const state = engine.getAuthoritativeState();
      expect(state).not.toBeNull();
      expect(state?.roomId).toBe(testRoom.id);
      expect(state?.sessionId).toBe('session_init_1');
    });

    it('allows host to publish playback actions and increments sequence numbers', async () => {
      const onStateChanged = jest.fn();
      await engine.initialize({
        room: testRoom,
        sessionId: 'session_h1',
        participantId: 'user_host_1',
        isHost: true,
        transport,
        callbacks: {onAuthoritativeStateChanged: onStateChanged},
      });

      const published = await engine.publishHostAction('PLAY', 15, 120, 'play');
      expect(published).not.toBeNull();
      expect(published?.type).toBe('PLAY');
      expect(published?.sequenceNumber).toBe(1);
      expect(published?.playbackPositionMs).toBe(15000);

      const state = engine.getAuthoritativeState();
      expect(state?.playbackStatus).toBe('playing');
      expect(state?.sequenceNumber).toBe(1);
      expect(onStateChanged).toHaveBeenCalled();
    });

    it('dispatches playback commands to guests upon receiving host events', async () => {
      const onCommand = jest.fn();
      await engine.initialize({
        room: testRoom,
        sessionId: 'session_g1',
        participantId: 'user_guest_1',
        isHost: false,
        transport,
        callbacks: {onPlaybackCommand: onCommand},
      });

      // Deliver Host PAUSE event
      const pauseEvent: WatchPartySyncEvent = {
        eventId: 'evt_p1',
        roomId: testRoom.id,
        sessionId: 'session_g1',
        contentId: testRoom.contentId,
        type: 'PAUSE',
        participantId: 'user_host_1',
        sequenceNumber: 2,
        playbackPositionMs: 45000,
        playbackStatus: 'paused',
        clientTimestamp: Date.now(),
      };

      const decision = engine.handleIncomingEvent(pauseEvent);
      expect(decision.action).toBe('pause');
      expect(onCommand).toHaveBeenCalledWith({
        action: 'pause',
        positionSeconds: 45,
      });

      // Deliver Host SEEK event
      const seekEvent: WatchPartySyncEvent = {
        eventId: 'evt_s1',
        roomId: testRoom.id,
        sessionId: 'session_g1',
        contentId: testRoom.contentId,
        type: 'SEEK',
        participantId: 'user_host_1',
        sequenceNumber: 3,
        playbackPositionMs: 90000,
        playbackStatus: 'playing',
        clientTimestamp: Date.now(),
      };

      const seekDecision = engine.handleIncomingEvent(seekEvent);
      expect(seekDecision.action).toBe('seek_correction');
      expect(onCommand).toHaveBeenCalledWith({
        action: 'seek',
        positionSeconds: 90,
      });
    });

    it('calculates correct seek and play commands during Late Join', async () => {
      const now = Date.now();
      await engine.initialize({
        room: testRoom,
        sessionId: 'session_late',
        participantId: 'user_guest_late',
        isHost: false,
        initialPlaybackState: {
          roomId: testRoom.id,
          sessionId: 'session_late',
          contentId: testRoom.contentId,
          status: 'playing',
          positionSeconds: 30,
          positionMs: 30000,
          updatedAt: new Date(now).toISOString(),
          hostId: testRoom.hostId,
          sequenceNumber: 5,
        },
        transport,
      });

      // Guest starts at 0s, but host is at 30s
      const lateJoin = engine.handleLateJoin(0);
      expect(lateJoin.shouldSeek).toBe(true);
      expect(lateJoin.targetPositionMs).toBeGreaterThanOrEqual(30000);
      expect(lateJoin.shouldPlay).toBe(true);
      expect(lateJoin.isCompleted).toBe(false);
    });

    it('triggers drift correction callbacks when guest drifts beyond threshold', async () => {
      const onCorrection = jest.fn();
      await engine.initialize({
        room: testRoom,
        sessionId: 'session_drift',
        participantId: 'user_guest_drift',
        isHost: false,
        initialPlaybackState: {
          roomId: testRoom.id,
          sessionId: 'session_drift',
          contentId: testRoom.contentId,
          status: 'playing',
          positionSeconds: 100,
          positionMs: 100000,
          updatedAt: new Date().toISOString(),
          hostId: testRoom.hostId,
          sequenceNumber: 1,
        },
        transport,
        callbacks: {onCorrectionRequired: onCorrection},
      });

      // Guest is at 92s (8s drift -> severe drift)
      const result = engine.evaluateDrift(92, false, true);
      expect(result.classification).toBe('severe_drift');
      expect(onCorrection).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // Section E: Recovery Manager Tests
  // ==========================================
  describe('Synchronization Recovery Manager (WatchPartySyncRecovery)', () => {
    it('manages bounded retries and exponential backoff', async () => {
      const recovery = new WatchPartySyncRecovery({
        maxRetries: 2,
        initialBackoffMs: 10,
        maxBackoffMs: 50,
      });

      expect(recovery.canAttemptRecovery()).toBe(true);

      const action = jest.fn().mockResolvedValue(false);
      const onExhausted = jest.fn();

      // Attempt 1 (fails)
      await recovery.scheduleRecovery(action, onExhausted);
      expect(recovery.getRetryCount()).toBe(1);

      // Attempt 2 (fails and exhausts)
      await recovery.scheduleRecovery(action, onExhausted);
      expect(recovery.getRetryCount()).toBe(2);
      expect(recovery.canAttemptRecovery()).toBe(false);
      expect(onExhausted).toHaveBeenCalledTimes(1);

      recovery.destroy();
    });
  });

  // ==========================================
  // Section F: UI Components & Overlay Tests
  // ==========================================
  describe('Sync Status UI & Overlay (WatchPartySyncStatus / Overlay)', () => {
    it('renders sync status badge with appropriate labels and colors', () => {
      const {getByTestId, getByText, rerender} = render(
        <WatchPartySyncStatus status="synchronized" isHost={false} />,
      );
      expect(getByTestId(WATCH_PARTY_SYNC_TEST_IDS.syncStatusBadge)).toBeTruthy();
      expect(getByText('In Sync')).toBeTruthy();

      // Host view
      rerender(<WatchPartySyncStatus status="synchronized" isHost={true} />);
      expect(getByText('Host (Authoritative)')).toBeTruthy();

      // Adjusting view
      rerender(<WatchPartySyncStatus status="adjusting" isHost={false} />);
      expect(getByText('Aligning Playback...')).toBeTruthy();

      // Error view
      rerender(<WatchPartySyncStatus status="error" isHost={false} />);
      expect(getByText('Sync Offline')).toBeTruthy();
    });

    it('renders overlay with room code and error banner when present', () => {
      const {getByTestId, getByText} = render(
        <WatchPartySyncOverlay
          status="error"
          isHost={false}
          roomCode="PARTY1"
          errorMessage="Lost connection to Watch Party sync channel"
        />,
      );

      expect(getByTestId(WATCH_PARTY_SYNC_TEST_IDS.syncOverlay)).toBeTruthy();
      expect(getByText('#PARTY1')).toBeTruthy();
      expect(
        getByText('Lost connection to Watch Party sync channel'),
      ).toBeTruthy();
    });
  });
});
