/**
 * useWatchPartySync Hook (Day 4)
 * React Hook managing the Watch Party Synchronization Engine lifecycle,
 * host event broadcasting, participant drift observation, and programmatic correction seeks.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {analyticsService} from '../../../analytics';
import {AnalyticsEvents} from '../../../analytics/analyticsEvents';
import {DEFAULT_WATCH_PARTY_SYNC_CONFIG} from '../constants/watchPartySync.constants';
import {WatchPartySyncEngine} from '../services/watchPartySyncEngine';
import {WatchPartySyncTransport} from '../services/watchPartySyncTransport';
import {mockSyncTransport} from '../services/watchPartyMockSyncTransport';
import {
  WatchPartyPlaybackAction,
  WatchPartyPlaybackState,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {
  WatchPartyAuthoritativeState,
  WatchPartyDriftResult,
  WatchPartySeekOrigin,
  WatchPartySyncConfig,
  WatchPartySyncEvent,
  WatchPartySyncEventType,
  WatchPartySyncStatusState,
} from '../types/watchPartySync.types';

export interface UseWatchPartySyncOptions {
  room?: WatchPartyRoom | null;
  roomId?: string;
  isHost?: boolean;
  participantId?: string;
  sessionId?: string;
  initialPlaybackState?: WatchPartyPlaybackState | null;
  isPlayerReady?: boolean;
  isBuffering?: boolean;
  currentPositionSeconds?: number;
  transport?: WatchPartySyncTransport;
  config?: Partial<WatchPartySyncConfig>;
  onSeekRequested?: (targetSeconds: number) => void;
  onPlayRequested?: (targetSeconds?: number) => void;
  onPauseRequested?: (targetSeconds?: number) => void;
  onStopRequested?: () => void;
}

export const useWatchPartySync = ({
  room,
  roomId,
  isHost = false,
  participantId,
  sessionId,
  initialPlaybackState,
  isPlayerReady = false,
  isBuffering = false,
  currentPositionSeconds = 0,
  transport = mockSyncTransport,
  config,
  onSeekRequested,
  onPlayRequested,
  onPauseRequested,
  onStopRequested,
}: UseWatchPartySyncOptions) => {
  const [syncStatus, setSyncStatus] =
    useState<WatchPartySyncStatusState>('idle');
  const [authoritativeState, setAuthoritativeState] =
    useState<WatchPartyAuthoritativeState | null>(null);
  const [lastDriftResult, setLastDriftResult] =
    useState<WatchPartyDriftResult | null>(null);

  const engineRef = useRef<WatchPartySyncEngine | null>(null);
  const monitorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekOriginRef = useRef<WatchPartySeekOrigin | null>(null);
  const isLateJoinHandledRef = useRef<boolean>(false);
  const activeSessionId = sessionId || initialPlaybackState?.sessionId || 'default-session';

  const recordSeekOrigin = useCallback(
    (type: 'user_seek' | 'host_seek' | 'sync_correction', targetSeconds: number) => {
      seekOriginRef.current = {
        type,
        targetSeconds,
        timestamp: Date.now(),
      };
    },
    [],
  );

  // Initialize Synchronization Engine
  useEffect(() => {
    const effectiveRoom = room || (roomId ? ({id: roomId, contentId: 'current'} as any) : null);
    if (!effectiveRoom || !participantId) {
      return;
    }

    const engine = new WatchPartySyncEngine();
    engineRef.current = engine;
    isLateJoinHandledRef.current = false;

    analyticsService
      .track(AnalyticsEvents.WATCH_PARTY_SYNC_STARTED as any, {
        roomId: effectiveRoom.id,
        sessionId: activeSessionId,
        isHost,
        role: isHost ? 'host' : 'guest',
      })
      .catch(() => {});

    engine
      .initialize({
        room: effectiveRoom,
        sessionId: activeSessionId,
        participantId,
        isHost,
        initialPlaybackState,
        transport,
        config,
        callbacks: {
          onAuthoritativeStateChanged: state => {
            setAuthoritativeState(state);
          },
          onSyncStatusChanged: (status, message) => {
            setSyncStatus(status);
            if (status === 'error') {
              analyticsService
                .track(AnalyticsEvents.WATCH_PARTY_SYNC_FAILED as any, {
                  roomId: effectiveRoom.id,
                  reason: message,
                })
                .catch(() => {});
            }
          },
          onCorrectionRequired: ({targetPositionSeconds, reason}) => {
            recordSeekOrigin('sync_correction', targetPositionSeconds);
            analyticsService
              .track(AnalyticsEvents.WATCH_PARTY_SYNC_CORRECTION as any, {
                roomId: effectiveRoom.id,
                targetPositionSeconds,
                reason,
              })
              .catch(() => {});
            onSeekRequested?.(targetPositionSeconds);
          },
          onPlaybackCommand: ({action, positionSeconds}) => {
            if (action === 'play') {
              onPlayRequested?.(positionSeconds);
            } else if (action === 'pause') {
              onPauseRequested?.(positionSeconds);
            } else if (action === 'seek' && positionSeconds !== undefined) {
              recordSeekOrigin('sync_correction', positionSeconds);
              onSeekRequested?.(positionSeconds);
            } else if (action === 'stop') {
              onStopRequested?.();
            }
          },
        },
      })
      .then(() => {
        setAuthoritativeState(engine.getAuthoritativeState());
      })
      .catch(err => {
        setSyncStatus('error');
        console.warn('[useWatchPartySync] Init error:', err);
      });

    return () => {
      if (monitorTimerRef.current) {
        clearInterval(monitorTimerRef.current);
        monitorTimerRef.current = null;
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, [
    activeSessionId,
    config,
    initialPlaybackState,
    isHost,
    onPauseRequested,
    onPlayRequested,
    onSeekRequested,
    onStopRequested,
    participantId,
    recordSeekOrigin,
    room,
    roomId,
    transport,
  ]);

  // Handle Late Join when player first becomes ready
  useEffect(() => {
    if (
      isPlayerReady &&
      !isHost &&
      !isLateJoinHandledRef.current &&
      engineRef.current &&
      authoritativeState
    ) {
      isLateJoinHandledRef.current = true;
      const lateJoin = engineRef.current.handleLateJoin(currentPositionSeconds);

      analyticsService
        .track(AnalyticsEvents.WATCH_PARTY_SYNC_LATE_JOIN as any, {
          roomId: room?.id || roomId,
          shouldSeek: lateJoin.shouldSeek,
          targetPositionSeconds: lateJoin.targetPositionMs / 1000,
          shouldPlay: lateJoin.shouldPlay,
        })
        .catch(() => {});

      if (lateJoin.shouldSeek) {
        const targetSec = lateJoin.targetPositionMs / 1000;
        recordSeekOrigin('sync_correction', targetSec);
        onSeekRequested?.(targetSec);
      }
      if (lateJoin.shouldPlay) {
        onPlayRequested?.(lateJoin.targetPositionMs / 1000);
      }
    }
  }, [
    authoritativeState,
    currentPositionSeconds,
    isHost,
    isPlayerReady,
    onPlayRequested,
    onSeekRequested,
    recordSeekOrigin,
    room?.id,
    roomId,
  ]);

  // Periodic drift monitoring for guests while playing
  useEffect(() => {
    if (
      !isHost &&
      isPlayerReady &&
      !isBuffering &&
      authoritativeState?.playbackStatus === 'playing'
    ) {
      const intervalMs =
        config?.syncIntervalMs || DEFAULT_WATCH_PARTY_SYNC_CONFIG.syncIntervalMs;

      monitorTimerRef.current = setInterval(() => {
        if (engineRef.current) {
          const result = engineRef.current.evaluateDrift(
            currentPositionSeconds,
            isBuffering,
            isPlayerReady,
          );
          setLastDriftResult(result);
        }
      }, intervalMs);
    } else {
      if (monitorTimerRef.current) {
        clearInterval(monitorTimerRef.current);
        monitorTimerRef.current = null;
      }
    }

    return () => {
      if (monitorTimerRef.current) {
        clearInterval(monitorTimerRef.current);
        monitorTimerRef.current = null;
      }
    };
  }, [
    authoritativeState?.playbackStatus,
    config?.syncIntervalMs,
    currentPositionSeconds,
    isBuffering,
    isHost,
    isPlayerReady,
  ]);

  // Host action publisher
  const publishHostAction = useCallback(
    async (
      type: WatchPartySyncEventType,
      positionSeconds: number,
      durationSeconds?: number,
      action?: WatchPartyPlaybackAction,
    ): Promise<WatchPartySyncEvent | null> => {
      if (!isHost || !engineRef.current) {
        return null;
      }
      return engineRef.current.publishHostAction(
        type,
        positionSeconds,
        durationSeconds,
        action,
      );
    },
    [isHost],
  );

  const evaluateDrift = useCallback(
    (actualPosSeconds: number): WatchPartyDriftResult | null => {
      if (!engineRef.current) return null;
      const res = engineRef.current.evaluateDrift(
        actualPosSeconds,
        isBuffering,
        isPlayerReady,
      );
      setLastDriftResult(res);
      return res;
    },
    [isBuffering, isPlayerReady],
  );

  const retrySync = useCallback(async () => {
    if (!engineRef.current || !room) return;
    setSyncStatus('synchronizing');
    try {
      await transport.connect(room.id);
      setSyncStatus('synchronized');
      analyticsService
        .track(AnalyticsEvents.WATCH_PARTY_SYNC_RECONNECTED as any, {
          roomId: room.id,
        })
        .catch(() => {});
    } catch {
      setSyncStatus('error');
    }
  }, [room, transport]);

  return {
    syncStatus,
    authoritativeState,
    lastDriftResult,
    publishHostAction,
    evaluateDrift,
    retrySync,
    seekOriginRef,
    recordSeekOrigin,
    engine: engineRef.current,
  };
};
