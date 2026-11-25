/**
 * useWatchPartyLobby Hook
 * Coordinates Watch Party Lobby state, leave confirmation, content resolution, and analytics.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {useCallback, useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Routes} from '../../../constants/routes';
import {useAuth} from '../../../context/authContext';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {analyticsService} from '../../../analytics';
import {useWatchPartyRoom} from './useWatchPartyRoom';
import {findContentById} from '../../../utils/deeplink';
import {WatchPartyRoom} from '../types/watchParty.types';

export interface UseWatchPartyLobbyOptions {
  roomId?: string;
  initialRoom?: WatchPartyRoom;
  onNavigateBack?: () => void;
}

export const useWatchPartyLobby = ({
  roomId,
  initialRoom,
  onNavigateBack,
}: UseWatchPartyLobbyOptions) => {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {activeProfile} = useProfile();

  const userId = user?.uid || 'user_guest';
  const profileId = activeProfile?.id || 'profile_default';

  const {
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
  } = useWatchPartyRoom({
    roomId: roomId || initialRoom?.id,
    initialRoom,
    autoFetch: true,
    userId,
    profileId,
  });

  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState<boolean>(false);
  const [showCodeFeedback, setShowCodeFeedback] = useState<boolean>(false);
  const [resolvedContent, setResolvedContent] = useState<any>(null);

  // Resolve content details from catalog when room loads
  useEffect(() => {
    if (room?.contentId) {
      const content = findContentById(room.contentId);
      if (content) {
        setResolvedContent(content);
      }
    }
  }, [room?.contentId]);

  // Track lobby viewed
  useEffect(() => {
    if (room?.id) {
      analyticsService
        .track('watch_party_lobby_viewed' as any, {
          roomId: room.id,
          contentId: room.contentId,
          participantCount: participants.length,
          status: room.status,
          isHost,
        })
        .catch(() => {});
    }
  }, [room?.id, room?.contentId, room?.status, participants.length, isHost]);

  // Track room expired
  useEffect(() => {
    if (isExpired && room?.id) {
      analyticsService
        .track('watch_party_room_expired' as any, {
          roomId: room.id,
          contentId: room.contentId,
        })
        .catch(() => {});
    }
  }, [isExpired, room?.id, room?.contentId]);

  const handleBack = useCallback(() => {
    if (onNavigateBack) {
      onNavigateBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Home);
    }
  }, [navigation, onNavigateBack]);

  const handleOpenLeaveModal = useCallback(() => {
    setIsLeaveModalVisible(true);
    analyticsService
      .track('watch_party_leave_confirmation_opened' as any, {
        roomId: room?.id,
        isHost,
      })
      .catch(() => {});
  }, [isHost, room?.id]);

  const handleCancelLeaveModal = useCallback(() => {
    setIsLeaveModalVisible(false);
    analyticsService
      .track('watch_party_leave_cancelled' as any, {
        roomId: room?.id,
        isHost,
      })
      .catch(() => {});
  }, [isHost, room?.id]);

  const handleConfirmLeave = useCallback(async () => {
    setIsLeaveModalVisible(false);

    analyticsService
      .track('watch_party_leave_confirmed' as any, {
        roomId: room?.id,
        isHost,
      })
      .catch(() => {});

    try {
      const result = await leaveRoom();
      analyticsService
        .track('watch_party_left' as any, {
          roomId: room?.id,
          roomEnded: result.roomEnded,
        })
        .catch(() => {});
    } catch (err: any) {
      analyticsService
        .track('watch_party_error' as any, {
          operation: 'leave_room',
          code: err.code || 'SERVER_ERROR',
        })
        .catch(() => {});
    } finally {
      handleBack();
    }
  }, [handleBack, isHost, leaveRoom, room?.id]);

  const handleManualRefresh = useCallback(async () => {
    analyticsService
      .track('watch_party_room_refresh' as any, {
        roomId: room?.id,
        participantCount: participants.length,
      })
      .catch(() => {});

    await refreshRoom();
  }, [participants.length, refreshRoom, room?.id]);

  const handleShareCodeAction = useCallback(() => {
    setShowCodeFeedback((prev) => !prev);
    analyticsService
      .track('watch_party_share_code_pressed' as any, {
        roomId: room?.id,
        roomCode: room?.roomCode,
      })
      .catch(() => {});
  }, [room?.id, room?.roomCode]);

  return {
    room,
    participants,
    playbackState,
    resolvedContent,
    isLoading,
    isRefreshing,
    isLeaving,
    error,
    refreshError,
    isExpired,
    isEnded,
    isHost,
    currentUserParticipant,
    isLeaveModalVisible,
    showCodeFeedback,
    handleBack,
    handleOpenLeaveModal,
    handleCancelLeaveModal,
    handleConfirmLeave,
    handleManualRefresh,
    handleShareCodeAction,
  };
};
