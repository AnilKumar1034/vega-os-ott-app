/**
 * useWatchPartyPlayback Hook
 * Coordinates Watch Party room playback state updates, host authorization,
 * and analytics reporting during video playback sessions.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {
  WatchPartyPlaybackAction,
  WatchPartyPlaybackState,
  WatchPartyPlaybackStatus,
} from '../types/watchParty.types';
import {watchPartyApi} from '../services/watchPartyApi';
import {analyticsService} from '../../../analytics';

export interface UseWatchPartyPlaybackOptions {
  roomId?: string;
  isHost?: boolean;
  participantId?: string;
  initialState?: WatchPartyPlaybackState;
  onStateChanged?: (state: WatchPartyPlaybackState) => void;
}

export const useWatchPartyPlayback = ({
  roomId,
  isHost = false,
  participantId,
  initialState,
  onStateChanged,
}: UseWatchPartyPlaybackOptions) => {
  const [playbackState, setPlaybackState] =
    useState<WatchPartyPlaybackState | null>(initialState || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const lastReportedStatusRef = useRef<WatchPartyPlaybackStatus | null>(null);
  const lastReportedPositionRef = useRef<number | null>(null);
  const isUpdatingRef = useRef<boolean>(false);

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

      if (isUpdatingRef.current) {
        // Prevent concurrent overlapping updates
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
    [sendPlaybackUpdate],
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
    [sendPlaybackUpdate],
  );

  const reportSeek = useCallback(
    (targetSeconds: number, durationSeconds?: number) => {
      const validPosition = Math.max(0, targetSeconds);
      lastReportedPositionRef.current = validPosition;

      sendPlaybackUpdate(
        {
          positionSeconds: validPosition,
          durationSeconds,
          lastAction: 'seek',
        },
        'watch_party_playback_seeked',
      ).catch(() => {});
    },
    [sendPlaybackUpdate],
  );

  const reportComplete = useCallback(
    (durationSeconds?: number) => {
      if (lastReportedStatusRef.current === 'ended') {
        return;
      }
      lastReportedStatusRef.current = 'ended';

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
    [sendPlaybackUpdate],
  );

  const reportError = useCallback(
    (errorMessage?: string) => {
      sendPlaybackUpdate(
        {
          status: 'error',
        },
        'watch_party_playback_error',
      ).catch(() => {});
    },
    [sendPlaybackUpdate],
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
  };
};
