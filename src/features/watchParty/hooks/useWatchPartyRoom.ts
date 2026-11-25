/**
 * useWatchPartyRoom Hook
 * Manages active Watch Party room details, participant list, playback state, and refresh cycles.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {watchPartyApi} from '../services/watchPartyApi';
import {
  LeaveWatchPartyRequest,
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
  userId?: string;
  profileId?: string;
}

export interface UseWatchPartyRoomReturn {
  room: WatchPartyRoom | null;
  participants: WatchPartyParticipant[];
  playbackState: WatchPartyPlaybackState | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLeaving: boolean;
  error: WatchPartyApiError | null;
  refreshError: WatchPartyApiError | null;
  isExpired: boolean;
  isEnded: boolean;
  isHost: boolean;
  currentUserParticipant: WatchPartyParticipant | null;
  refreshRoom: () => Promise<void>;
  leaveRoom: (customRequest?: Partial<LeaveWatchPartyRequest>) => Promise<{
    roomEnded: boolean;
    message: string;
  }>;
  clearRoom: () => void;
  setRoom: (room: WatchPartyRoom | null) => void;
}

export const useWatchPartyRoom = ({
  roomId,
  initialRoom,
  autoFetch = true,
  userId,
  profileId,
}: UseWatchPartyRoomOptions = {}): UseWatchPartyRoomReturn => {
  const [room, setRoomState] = useState<WatchPartyRoom | null>(
    initialRoom ?? null,
  );
  const [participants, setParticipants] = useState<WatchPartyParticipant[]>([]);
  const [playbackState, setPlaybackState] =
    useState<WatchPartyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean((roomId || initialRoom?.id) && autoFetch && !initialRoom),
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);
  const [error, setError] = useState<WatchPartyApiError | null>(null);
  const [refreshError, setRefreshError] = useState<WatchPartyApiError | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const isRefreshingRef = useRef<boolean>(false);
  const isLeavingRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isExpired = room?.status === 'expired';
  const isEnded = room?.status === 'ended';

  const isHost = Boolean(
    room &&
      ((profileId && room.hostProfileId === profileId) ||
        (userId && room.hostId === userId)),
  );

  const currentUserParticipant =
    participants.find(
      (p) =>
        (profileId && p.profileId === profileId) ||
        (userId && p.userId === userId),
    ) || null;

  const clearRoom = useCallback(() => {
    if (!isMountedRef.current) return;
    setRoomState(null);
    setParticipants([]);
    setPlaybackState(null);
    setError(null);
    setRefreshError(null);
  }, []);

  const setRoom = useCallback((newRoom: WatchPartyRoom | null) => {
    if (!isMountedRef.current) return;
    setRoomState(newRoom);
  }, []);

  const refreshRoom = useCallback(async () => {
    const targetRoomId = roomId || room?.id || initialRoom?.id;
    if (!targetRoomId) {
      return;
    }

    // Duplicate simultaneous refresh prevention
    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;

    const hasExistingData = Boolean(room);
    if (!hasExistingData) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsRefreshing(true);
      setRefreshError(null);
    }

    try {
      // 1. Fetch Room Details
      const roomRes = await watchPartyApi.getRoomDetails(targetRoomId);
      if (isMountedRef.current) {
        setRoomState(roomRes.data);
      }

      // 2. Fetch Participants
      const partRes = await watchPartyApi.getParticipants(targetRoomId);
      if (isMountedRef.current) {
        setParticipants(partRes.data);
      }

      // 3. Fetch Playback State
      try {
        const playRes = await watchPartyApi.getPlaybackState(targetRoomId);
        if (isMountedRef.current) {
          setPlaybackState(playRes.data);
        }
      } catch {
        // Playback state is non-blocking for lobby view
      }

      if (isMountedRef.current) {
        setError(null);
        setRefreshError(null);
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

      if (isMountedRef.current) {
        if (!hasExistingData) {
          setError(apiError);
        } else {
          setRefreshError(apiError);
          // If room expired or ended during refresh, update status on existing room
          if (err.code === 'ROOM_EXPIRED') {
            setRoomState((prev) => (prev ? {...prev, status: 'expired'} : null));
          } else if (err.code === 'ROOM_ENDED') {
            setRoomState((prev) => (prev ? {...prev, status: 'ended'} : null));
          }
        }
      }
    } finally {
      isRefreshingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [roomId, room, initialRoom?.id]);

  const leaveRoom = useCallback(
    async (customRequest?: Partial<LeaveWatchPartyRequest>) => {
      const targetRoomId = customRequest?.roomId || roomId || room?.id;
      const targetUserId = customRequest?.userId || userId || 'user_guest';
      const targetProfileId = customRequest?.profileId || profileId || 'profile_default';

      if (!targetRoomId) {
        throw {
          code: 'ROOM_NOT_FOUND',
          message: 'Cannot leave: Room ID is missing.',
        };
      }

      // Duplicate leave prevention
      if (isLeavingRef.current) {
        return {
          roomEnded: false,
          message: 'Leave request already in progress.',
        };
      }
      isLeavingRef.current = true;
      setIsLeaving(true);

      try {
        const response = await watchPartyApi.leaveRoom({
          roomId: targetRoomId,
          userId: targetUserId,
          profileId: targetProfileId,
        });

        if (isMountedRef.current) {
          if (response.data.roomEnded && room) {
            setRoomState((prev) => (prev ? {...prev, status: 'ended'} : null));
          }
        }
        return response.data;
      } finally {
        isLeavingRef.current = false;
        if (isMountedRef.current) {
          setIsLeaving(false);
        }
      }
    },
    [profileId, room, roomId, userId],
  );

  useEffect(() => {
    if (autoFetch && (roomId || initialRoom?.id)) {
      refreshRoom();
    }
  }, [roomId, initialRoom?.id, autoFetch]); // Note: omit refreshRoom from deps to avoid re-triggering on room updates

  return {
    room,
    participants,
    playbackState,
    isLoading,
    isRefreshing,
    isLeaving,
    error,
    refreshError,
    isExpired,
    isEnded,
    isHost,
    currentUserParticipant,
    refreshRoom,
    leaveRoom,
    clearRoom,
    setRoom,
  };
};
