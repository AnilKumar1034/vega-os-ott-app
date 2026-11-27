/**
 * useWatchPartyPlayback Hook
 * Coordinates Watch Party room playback state updates, host authorization,
 * synchronization engine broadcasting/observation, and analytics reporting.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {analyticsService} from '../../../analytics';
import {watchPartyApi} from '../services/watchPartyApi';
import {WatchPartySyncTransport} from '../services/watchPartySyncTransport';
import {
  WatchPartyPlaybackAction,
  WatchPartyPlaybackState,
  WatchPartyPlaybackStatus,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {
  WatchPartySyncConfig,
  WatchPartySyncEvent,
  WatchPartySyncEventType,
} from '../types/watchPartySync.types';
import {useWatchPartySync} from './useWatchPartySync';

export interface UseWatchPartyPlaybackOptions {
  roomId?: string;
  room?: WatchPartyRoom | null;
  isHost?: boolean;
  participantId?: string;
  sessionId?: string;
  initialState?: WatchPartyPlaybackState;
  isPlayerReady?: boolean;
  isBuffering?: boolean;
  currentPositionSeconds?: number;
  transport?: WatchPartySyncTransport;
  syncConfig?: Partial<WatchPartySyncConfig>;
  onStateChanged?: (state: WatchPartyPlaybackState) => void;
  onSeekRequested?: (targetSeconds: number) => void;
  onPlayRequested?: (targetSeconds?: number) => void;
  onPauseRequested?: (targetSeconds?: number) => void;
  onStopRequested?: () => void;
}

export const useWatchPartyPlayback = ({
  roomId,
  room,
  isHost = false,
  participantId,
  sessionId,
  initialState,
  isPlayerReady = false,
  isBuffering = false,
  currentPositionSeconds = 0,
  transport,
  syncConfig,
  onStateChanged,
  onSeekRequested,
  onPlayRequested,
  onPauseRequested,
  onStopRequested,
}: UseWatchPartyPlaybackOptions) => {
  const [playbackState, setPlaybackState] =
    useState<WatchPartyPlaybackState | null>(initialState || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const lastReportedStatusRef = useRef<WatchPartyPlaybackStatus | null>(null);
  const lastReportedPositionRef = useRef<number | null>(null);
  const isUpdatingRef = useRef<boolean>(false);

  // Integrate Day 4 Synchronization Engine Hook
  const sync = useWatchPartySync({
    room,
    roomId,
    isHost,
    participantId,
    sessionId: sessionId || playbackState?.sessionId,
    initialPlaybackState: playbackState || initialState,
    isPlayerReady,
    isBuffering,
    currentPositionSeconds,
    transport,
    config: syncConfig,
    onSeekRequested,
    onPlayRequested,
    onPauseRequested,
    onStopRequested,
  });

  // Fetch initial room playback state
  const fetchPlaybackState = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await watchPartyApi.getPlaybackState(roomId);
      if (response.success && response.data) {
        setPlaybackState(response.data);
        onStateChanged?.(response.data);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [onStateChanged, roomId]);

  useEffect(() => {
    if (roomId && !initialState) {
      fetchPlaybackState().catch(() => {});
    }
  }, [fetchPlaybackState, initialState, roomId]);

  // Dispatch state updates to the mock API (Host only)
  const sendPlaybackUpdate = useCallback(
    async (
      update: {
        status?: WatchPartyPlaybackStatus;
        positionSeconds?: number;
        durationSeconds?: number;
        lastAction?: WatchPartyPlaybackAction;
      },
      analyticsEventName?: string,
    ) => {
      if (!roomId || !participantId) {
        return;
      }
      // Non-host participants cannot mutate shared playback state
      if (!isHost) {
        return;
      }

      try {
        isUpdatingRef.current = true;
        const response = await watchPartyApi.updatePlaybackState({
          roomId,
          participantId,
          update: {
            ...update,
            positionMs:
              update.positionSeconds !== undefined
                ? Math.round(update.positionSeconds * 1000)
                : undefined,
            durationMs:
              update.durationSeconds !== undefined
                ? Math.round(update.durationSeconds * 1000)
                : undefined,
          },
        });

        if (response.success && response.data) {
          setPlaybackState(response.data);
          onStateChanged?.(response.data);

          if (analyticsEventName) {
            analyticsService
              .track(analyticsEventName as any, {
                roomId,
                action: update.lastAction,
                positionSeconds: update.positionSeconds,
                status: update.status,
                role: 'host',
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        console.log('[WatchParty] Failed to update playback state:', err);
        setError(err);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [isHost, onStateChanged, participantId, roomId],
  );

  const reportPlay = useCallback(
    (positionSeconds: number, durationSeconds?: number) => {
      if (
        lastReportedStatusRef.current === 'playing' &&
        lastReportedPositionRef.current !== null &&
        Math.abs(lastReportedPositionRef.current - positionSeconds) < 1
      ) {
        return;
      }
      lastReportedStatusRef.current = 'playing';
      lastReportedPositionRef.current = positionSeconds;

      // Broadcast to synchronization channel
      sync
        .publishHostAction('PLAY', positionSeconds, durationSeconds, 'play')
        .catch(() => {});

      sendPlaybackUpdate(
        {
          status: 'playing',
          positionSeconds: Math.max(0, positionSeconds),
          durationSeconds,
          lastAction: 'play',
        },
        'watch_party_playback_resumed',
      ).catch(() => {});
    },
    [sendPlaybackUpdate, sync],
  );

  const reportPause = useCallback(
    (positionSeconds: number, durationSeconds?: number) => {
      if (
        lastReportedStatusRef.current === 'paused' &&
        lastReportedPositionRef.current !== null &&
        Math.abs(lastReportedPositionRef.current - positionSeconds) < 1
      ) {
        return;
      }
      lastReportedStatusRef.current = 'paused';
      lastReportedPositionRef.current = positionSeconds;

      // Broadcast to synchronization channel
      sync
        .publishHostAction('PAUSE', positionSeconds, durationSeconds, 'pause')
        .catch(() => {});

      sendPlaybackUpdate(
        {
          status: 'paused',
          positionSeconds: Math.max(0, positionSeconds),
          durationSeconds,
          lastAction: 'pause',
        },
        'watch_party_playback_paused',
      ).catch(() => {});
    },
    [sendPlaybackUpdate, sync],
  );

  const reportSeek = useCallback(
    (targetSeconds: number, durationSeconds?: number) => {
      const validPosition = Math.max(0, targetSeconds);
      lastReportedPositionRef.current = validPosition;

      // Broadcast to synchronization channel
      sync
        .publishHostAction('SEEK', validPosition, durationSeconds, 'seek')
        .catch(() => {});

      sendPlaybackUpdate(
        {
          positionSeconds: validPosition,
          durationSeconds,
          lastAction: 'seek',
        },
        'watch_party_playback_seeked',
      ).catch(() => {});
    },
    [sendPlaybackUpdate, sync],
  );

  const reportComplete = useCallback(
    (durationSeconds?: number) => {
      if (lastReportedStatusRef.current === 'ended') {
        return;
      }
      lastReportedStatusRef.current = 'ended';

      // Broadcast to synchronization channel
      sync
        .publishHostAction(
          'PLAYBACK_ENDED',
          durationSeconds || 0,
          durationSeconds,
          'stop',
        )
        .catch(() => {});

      sendPlaybackUpdate(
        {
          status: 'ended',
          positionSeconds: durationSeconds || 0,
          durationSeconds,
          lastAction: 'stop',
        },
        'watch_party_playback_completed',
      ).catch(() => {});
    },
    [sendPlaybackUpdate, sync],
  );

  const reportError = useCallback(
    (_errorMessage?: string) => {
      sendPlaybackUpdate(
        {
          status: 'error',
        },
        'watch_party_playback_error',
      ).catch(() => {});
    },
    [sendPlaybackUpdate],
  );

  const publishHostAction = useCallback(
    (
      type: WatchPartySyncEventType,
      posSec: number,
      durSec?: number,
      act?: WatchPartyPlaybackAction,
    ): Promise<WatchPartySyncEvent | null> => {
      return sync.publishHostAction(type, posSec, durSec, act);
    },
    [sync],
  );

  return {
    playbackState,
    isLoading,
    error,
    isHost,
    canControlPlayback: isHost,
    fetchPlaybackState,
    reportPlay,
    reportPause,
    reportSeek,
    reportComplete,
    reportError,
    // Day 4 Sync Engine additions:
    syncStatus: sync.syncStatus,
    authoritativeState: sync.authoritativeState,
    lastDriftResult: sync.lastDriftResult,
    evaluateDrift: sync.evaluateDrift,
    retrySync: sync.retrySync,
    seekOriginRef: sync.seekOriginRef,
    recordSeekOrigin: sync.recordSeekOrigin,
    publishHostAction,
  };
};
