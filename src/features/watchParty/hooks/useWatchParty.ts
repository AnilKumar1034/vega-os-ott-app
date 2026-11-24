/**
 * useWatchParty Hook
 * Handles Watch Party room operations (create, join, leave), loading states, and error handling.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useState} from 'react';
import {watchPartyApi} from '../services/watchPartyApi';
import {
  CreateWatchPartyRequest,
  JoinWatchPartyRequest,
  LeaveWatchPartyRequest,
  WatchPartyApiError,
  WatchPartyParticipant,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {WATCH_PARTY_ERROR_MESSAGES} from '../constants/watchParty.constants';

export interface UseWatchPartyReturn {
  isLoading: boolean;
  error: WatchPartyApiError | null;
  clearError: () => void;
  createRoom: (
    request: CreateWatchPartyRequest,
  ) => Promise<{room: WatchPartyRoom; host: WatchPartyParticipant}>;
  joinRoom: (
    request: JoinWatchPartyRequest,
  ) => Promise<{room: WatchPartyRoom; participant: WatchPartyParticipant}>;
  leaveRoom: (
    request: LeaveWatchPartyRequest,
  ) => Promise<{roomEnded: boolean; message: string}>;
}

export const useWatchParty = (): UseWatchPartyReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WatchPartyApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createRoom = useCallback(
    async (
      request: CreateWatchPartyRequest,
    ): Promise<{room: WatchPartyRoom; host: WatchPartyParticipant}> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await watchPartyApi.createRoom(request);
        return response.data;
      } catch (err: any) {
        const apiError: WatchPartyApiError = {
          code: err.code || 'SERVER_ERROR',
          message:
            err.message ||
            WATCH_PARTY_ERROR_MESSAGES[err.code as keyof typeof WATCH_PARTY_ERROR_MESSAGES] ||
            'Failed to create Watch Party room.',
          details: err.details,
        };
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const joinRoom = useCallback(
    async (
      request: JoinWatchPartyRequest,
    ): Promise<{room: WatchPartyRoom; participant: WatchPartyParticipant}> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await watchPartyApi.joinRoom(request);
        return response.data;
      } catch (err: any) {
        const apiError: WatchPartyApiError = {
          code: err.code || 'SERVER_ERROR',
          message:
            err.message ||
            WATCH_PARTY_ERROR_MESSAGES[err.code as keyof typeof WATCH_PARTY_ERROR_MESSAGES] ||
            'Failed to join Watch Party room.',
          details: err.details,
        };
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const leaveRoom = useCallback(
    async (
      request: LeaveWatchPartyRequest,
    ): Promise<{roomEnded: boolean; message: string}> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await watchPartyApi.leaveRoom(request);
        return response.data;
      } catch (err: any) {
        const apiError: WatchPartyApiError = {
          code: err.code || 'SERVER_ERROR',
          message:
            err.message ||
            WATCH_PARTY_ERROR_MESSAGES[err.code as keyof typeof WATCH_PARTY_ERROR_MESSAGES] ||
            'Failed to leave Watch Party room.',
          details: err.details,
        };
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
  };
};
