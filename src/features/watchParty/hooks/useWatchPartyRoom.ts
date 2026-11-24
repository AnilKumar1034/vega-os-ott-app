/**
 * useWatchPartyRoom Hook
 * Manages active Watch Party room details, participant list, playback state, and refresh cycles.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useState} from 'react';
import {watchPartyApi} from '../services/watchPartyApi';
import {
  WatchPartyApiError,
  WatchPartyParticipant,
  WatchPartyPlaybackState,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {WATCH_PARTY_ERROR_MESSAGES} from '../constants/watchParty.constants';

export interface UseWatchPartyRoomOptions {
  roomId?: string;
  initialRoom?: WatchPartyRoom;
  autoFetch?: boolean;
}

export interface UseWatchPartyRoomReturn {
  room: WatchPartyRoom | null;
  participants: WatchPartyParticipant[];
  playbackState: WatchPartyPlaybackState | null;
  isLoading: boolean;
  error: WatchPartyApiError | null;
  isExpired: boolean;
  isEnded: boolean;
  refreshRoom: () => Promise<void>;
  clearRoom: () => void;
  setRoom: (room: WatchPartyRoom | null) => void;
}

export const useWatchPartyRoom = ({
  roomId,
  initialRoom,
  autoFetch = true,
}: UseWatchPartyRoomOptions = {}): UseWatchPartyRoomReturn => {
  const [room, setRoomState] = useState<WatchPartyRoom | null>(
    initialRoom ?? null,
  );
  const [participants, setParticipants] = useState<WatchPartyParticipant[]>([]);
  const [playbackState, setPlaybackState] =
    useState<WatchPartyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(roomId && autoFetch));
  const [error, setError] = useState<WatchPartyApiError | null>(null);

  const isExpired = room?.status === 'expired';
  const isEnded = room?.status === 'ended';

  const clearRoom = useCallback(() => {
    setRoomState(null);
    setParticipants([]);
    setPlaybackState(null);
    setError(null);
  }, []);

  const setRoom = useCallback((newRoom: WatchPartyRoom | null) => {
    setRoomState(newRoom);
  }, []);

  const refreshRoom = useCallback(async () => {
    const targetRoomId = roomId || room?.id;
    if (!targetRoomId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Room Details
      const roomRes = await watchPartyApi.getRoomDetails(targetRoomId);
      setRoomState(roomRes.data);

      // 2. Fetch Participants
      const partRes = await watchPartyApi.getParticipants(targetRoomId);
      setParticipants(partRes.data);

      // 3. Fetch Playback State
      try {
        const playRes = await watchPartyApi.getPlaybackState(targetRoomId);
        setPlaybackState(playRes.data);
      } catch {
        // Fallback if playback state isn't critical for room viewing
      }
    } catch (err: any) {
      const apiError: WatchPartyApiError = {
        code: err.code || 'SERVER_ERROR',
        message:
          err.message ||
          WATCH_PARTY_ERROR_MESSAGES[err.code as keyof typeof WATCH_PARTY_ERROR_MESSAGES] ||
          'Failed to retrieve Watch Party room details.',
        details: err.details,
      };
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, room?.id]);

  useEffect(() => {
    if (autoFetch && (roomId || initialRoom?.id)) {
      refreshRoom();
    }
  }, [roomId, initialRoom?.id, autoFetch, refreshRoom]);

  return {
    room,
    participants,
    playbackState,
    isLoading,
    error,
    isExpired,
    isEnded,
    refreshRoom,
    clearRoom,
    setRoom,
  };
};
