/**
 * Watch Party Lobby Screen
 * TV-optimized waiting lobby displaying room details, participant roster, and leave controls.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../../constants/routes';
import {useAuth} from '../../../context/authContext';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {analyticsService} from '../../../analytics';
import {useWatchParty} from '../hooks/useWatchParty';
import {useWatchPartyRoom} from '../hooks/useWatchPartyRoom';
import {WatchPartyRoomHeader} from '../components/WatchPartyRoomHeader';
import {WatchPartyContentInfo} from '../components/WatchPartyContentInfo';
import {WatchPartyParticipantList} from '../components/WatchPartyParticipantList';
import {WatchPartyRoomCode} from '../components/WatchPartyRoomCode';
import {WatchPartyLoading} from '../components/WatchPartyLoading';
import {WatchPartyErrorState} from '../components/WatchPartyErrorState';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {styles} from './WatchPartyLobbyScreen.styles';

export const WatchPartyLobbyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const {leaveRoom} = useWatchParty();

  const routeRoomId = route.params?.roomId;
  const initialRoom = route.params?.room;

  const {
    room,
    participants,
    isLoading,
    error,
    isExpired,
    isEnded,
    refreshRoom,
  } = useWatchPartyRoom({
    roomId: routeRoomId || initialRoom?.id,
    initialRoom,
    autoFetch: true,
  });

  const [focusedAction, setFocusedAction] = useState<string | null>(null);

  // Track room view
  useEffect(() => {
    if (room?.id) {
      analyticsService
        .track('watch_party_room_viewed' as any, {
          roomId: room.id,
          contentId: room.contentId,
          participantCount: participants.length,
          status: room.status,
        })
        .catch(() => {});
    }
  }, [room?.contentId, room?.id, room?.status, participants.length]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Home);
    }
  }, [navigation]);

  const handleLeave = useCallback(async () => {
    const targetRoomId = room?.id || routeRoomId;
    if (!targetRoomId) {
      handleBack();
      return;
    }

    const userId = user?.uid || 'user_guest';
    const profileId = activeProfile?.id || 'profile_default';

    try {
      const result = await leaveRoom({
        roomId: targetRoomId,
        userId,
        profileId,
      });

      analyticsService
        .track('watch_party_left' as any, {
          roomId: targetRoomId,
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
  }, [activeProfile?.id, handleBack, leaveRoom, room?.id, routeRoomId, user?.uid]);

  if (isLoading && !room) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Lobby"
          subtitle="Loading room details..."
          onBack={handleBack}
        />
        <WatchPartyLoading message="Connecting to Watch Party..." />
      </View>
    );
  }

  if (isExpired || room?.status === 'expired') {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Expired"
          status="expired"
          onBack={handleBack}
        />
        <WatchPartyErrorState
          title="Room Expired"
          message="This Watch Party viewing room has expired and is no longer active."
          onBack={handleBack}
        />
      </View>
    );
  }

  if (isEnded || room?.status === 'ended') {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Ended"
          status="ended"
          onBack={handleBack}
        />
        <WatchPartyErrorState
          title="Room Ended"
          message="The host has left or closed this Watch Party viewing room."
          onBack={handleBack}
        />
      </View>
    );
  }

  if (error && !room) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Unavailable"
          onBack={handleBack}
        />
        <WatchPartyErrorState
          title="Unable to Load Room"
          message={error.message}
          onRetry={refreshRoom}
          onBack={handleBack}
        />
      </View>
    );
  }

  const effectiveTitle = room?.contentTitle || 'Selected Content';

  return (
    <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
      <WatchPartyRoomHeader
        title="Watch Party Lobby"
        subtitle="Waiting for all participants before starting playback"
        roomCode={room?.roomCode}
        status={room?.status || 'waiting'}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <View style={styles.mainRow}>
            {/* Left Column: Content Information & Code */}
            <View style={styles.leftColumn}>
              <WatchPartyContentInfo
                title={effectiveTitle}
                contentType={room?.contentType || 'movie'}
                thumbnailUrl={room?.contentThumbnail}
                badge="PARTY SYNC READY"
                metadata={['Synchronized Viewing Room', 'Host Controls']}
              />

              {room?.roomCode ? (
                <WatchPartyRoomCode
                  roomCode={room.roomCode}
                  expiresAt={room.expiresAt}
                />
              ) : null}

              {/* Waiting Notice */}
              <View style={styles.waitingBanner}>
                <View style={styles.waitingDot} />
                <Text style={styles.waitingText}>
                  Party is currently waiting for participants. Host can start synchronized playback once everyone is ready.
                </Text>
              </View>
            </View>

            {/* Right Column: Participant List & Controls */}
            <View style={styles.rightColumn}>
              <WatchPartyParticipantList
                participants={participants}
                maxParticipants={room?.maxParticipants}
                enableItemFocus={true}
              />

              <View style={styles.actionRow}>
                {/* Refresh Room Action */}
                <TouchableOpacity
                  style={[
                    styles.refreshButton,
                    focusedAction === 'refresh' && styles.refreshButtonFocused,
                  ]}
                  onFocus={() => setFocusedAction('refresh')}
                  onBlur={() => setFocusedAction(null)}
                  onPress={refreshRoom}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh Room Status"
                  testID={WATCH_PARTY_TEST_IDS.retryButton}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>

                {/* Leave Room Action */}
                <TouchableOpacity
                  style={[
                    styles.leaveButton,
                    focusedAction === 'leave' && styles.leaveButtonFocused,
                  ]}
                  onFocus={() => setFocusedAction('leave')}
                  onBlur={() => setFocusedAction(null)}
                  onPress={handleLeave}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Leave Watch Party"
                  testID={WATCH_PARTY_TEST_IDS.leaveButton}>
                  <Text style={styles.leaveButtonText}>Leave Party</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TVFocusGuideView>
      </ScrollView>
    </View>
  );
};
