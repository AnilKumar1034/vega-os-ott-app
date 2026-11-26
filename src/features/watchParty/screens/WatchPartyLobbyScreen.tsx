/**
 * Watch Party Lobby Screen
 * TV-optimized waiting lobby displaying room details, participant roster, and leave controls.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {useWatchPartyLobby} from '../hooks/useWatchPartyLobby';
import {WatchPartyRoomHeader} from '../components/WatchPartyRoomHeader';
import {WatchPartyContentInfo} from '../components/WatchPartyContentInfo';
import {WatchPartyParticipantList} from '../components/WatchPartyParticipantList';
import {WatchPartyRoomCode} from '../components/WatchPartyRoomCode';
import {WatchPartyRoomStatus} from '../components/WatchPartyRoomStatus';
import {WatchPartyLobbyActions} from '../components/WatchPartyLobbyActions';
import {WatchPartyLeaveConfirmation} from '../components/WatchPartyLeaveConfirmation';
import {WatchPartyLobbyLoading} from '../components/WatchPartyLobbyLoading';
import {WatchPartyLobbyError} from '../components/WatchPartyLobbyError';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {styles} from './WatchPartyLobbyScreen.styles';

export const WatchPartyLobbyScreen: React.FC = () => {
  const route = useRoute<any>();

  const routeRoomId = route.params?.roomId;
  const initialRoom = route.params?.room;

  const {
    room,
    participants,
    playbackState,
    resolvedContent,
    isLoading,
    isRefreshing,
    isLeaving,
    isStartingPlayback,
    isJoiningPlayback,
    playbackLaunchError,
    error,
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
    handleStartPlayback,
    handleJoinPlayback,
  } = useWatchPartyLobby({
    roomId: routeRoomId || initialRoom?.id,
    initialRoom,
  });

  // 1. Initial Loading State
  if (isLoading && !room) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Lobby"
          subtitle="Loading room details..."
          onBack={handleBack}
        />
        <WatchPartyLobbyLoading message="Connecting to Watch Party..." />
      </View>
    );
  }

  // 2. Room Expired State
  if (isExpired || room?.status === 'expired') {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Expired"
          status="expired"
          onBack={handleBack}
        />
        <WatchPartyLobbyError
          title="Room Expired"
          message="This Watch Party viewing room has expired and is no longer active."
          onBack={handleBack}
        />
      </View>
    );
  }

  // 3. Room Ended State
  if (isEnded || room?.status === 'ended') {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Ended"
          status="ended"
          onBack={handleBack}
        />
        <WatchPartyLobbyError
          title="Room Ended"
          message="The host has left or closed this Watch Party viewing room."
          onBack={handleBack}
        />
      </View>
    );
  }

  // 4. Initial Load Error State
  if (error && !room) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
        <WatchPartyRoomHeader
          title="Watch Party Unavailable"
          onBack={handleBack}
        />
        <WatchPartyLobbyError
          title="Unable to Load Room"
          message={error.message}
          onRetry={handleManualRefresh}
          onBack={handleBack}
        />
      </View>
    );
  }

  const effectiveTitle =
    resolvedContent?.title || room?.contentTitle || 'Selected Content';
  const effectiveThumbnail =
    resolvedContent?.image?.uri ||
    (typeof resolvedContent?.image === 'string'
      ? resolvedContent.image
      : undefined) ||
    room?.contentThumbnail;

  const effectiveMetadata = resolvedContent?.meta || [
    'Synchronized Viewing Room',
    isHost ? 'Host Controls' : 'Guest Member',
  ];

  return (
    <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.lobbyScreen}>
      <WatchPartyRoomHeader
        title="Watch Party Lobby"
        subtitle={
          isHost
            ? 'You are the host. Share the room code so friends can join.'
            : 'Waiting for the host before starting synchronized playback.'
        }
        roomCode={room?.roomCode}
        status={room?.status || 'waiting'}
        onBack={handleOpenLeaveModal}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <View style={styles.mainRow}>
            {/* Left Column: Content Information, Status & Room Code */}
            <View style={styles.leftColumn}>
              <WatchPartyContentInfo
                title={effectiveTitle}
                contentType={room?.contentType || 'movie'}
                thumbnailUrl={effectiveThumbnail}
                description={resolvedContent?.description}
                metadata={effectiveMetadata}
                releaseYear={resolvedContent?.releaseYear}
                duration={resolvedContent?.duration}
                badge="PARTY SYNC READY"
              />

              {/* Room Status Indicator */}
              <WatchPartyRoomStatus
                status={room?.status || 'waiting'}
                participantCount={participants.length}
                maxParticipants={room?.maxParticipants}
                isHost={isHost}
              />

              {/* Large Visible Room Code with TV-Friendly Share Action */}
              {room?.roomCode ? (
                <WatchPartyRoomCode
                  roomCode={room.roomCode}
                  expiresAt={room.expiresAt}
                  onSharePress={handleShareCodeAction}
                  showFeedback={showCodeFeedback}
                />
              ) : null}
            </View>

            {/* Right Column: Participant List & Lobby Actions */}
            <View style={styles.rightColumn}>
              <WatchPartyParticipantList
                participants={participants}
                maxParticipants={room?.maxParticipants}
                currentUserId={currentUserParticipant?.userId}
                currentProfileId={currentUserParticipant?.profileId}
                roomCode={room?.roomCode}
                isHost={isHost}
                enableItemFocus={true}
              />

              {playbackLaunchError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{playbackLaunchError}</Text>
                </View>
              ) : null}

              <WatchPartyLobbyActions
                onRefresh={handleManualRefresh}
                onLeave={handleOpenLeaveModal}
                onStartPlayback={handleStartPlayback}
                onJoinPlayback={handleJoinPlayback}
                isRefreshing={isRefreshing}
                isLeaving={isLeaving}
                isStartingPlayback={isStartingPlayback}
                isJoiningPlayback={isJoiningPlayback}
                isHost={isHost}
                roomStatus={room?.status}
                playbackStatus={playbackState?.status}
              />
            </View>
          </View>
        </TVFocusGuideView>
      </ScrollView>

      {/* TV-Friendly Leave Confirmation Modal */}
      <WatchPartyLeaveConfirmation
        visible={isLeaveModalVisible}
        isHost={isHost}
        isLeaving={isLeaving}
        onStay={handleCancelLeaveModal}
        onLeave={handleConfirmLeave}
      />
    </View>
  );
};
