/**
 * Watch Party Lobby Actions Component
 * Action buttons for refreshing room state and leaving the lobby.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyLobbyActionsProps {
  onRefresh: () => void;
  onLeave: () => void;
  onStartPlayback?: () => void;
  onJoinPlayback?: () => void;
  onSimulateJoin?: () => void;
  isRefreshing?: boolean;
  isLeaving?: boolean;
  isStartingPlayback?: boolean;
  isJoiningPlayback?: boolean;
  isHost?: boolean;
  roomStatus?: string;
  playbackStatus?: string;
}

export const WatchPartyLobbyActions: React.FC<WatchPartyLobbyActionsProps> = ({
  onRefresh,
  onLeave,
  onStartPlayback,
  onJoinPlayback,
  onSimulateJoin,
  isRefreshing = false,
  isLeaving = false,
  isStartingPlayback = false,
  isJoiningPlayback = false,
  isHost = false,
  roomStatus = 'waiting',
  playbackStatus = 'idle',
}) => {
  const [focusedAction, setFocusedAction] = useState<
    'start' | 'join' | 'refresh' | 'simulate' | 'leave' | null
  >(null);

  const isPlaybackActive =
    playbackStatus === 'playing' ||
    playbackStatus === 'paused' ||
    roomStatus === 'active';

  return (
    <View
      style={styles.actionRow}
      testID={WATCH_PARTY_TEST_IDS.lobbyActions}>
      {/* Host Action: Start Watching */}
      {isHost ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.startButton,
            focusedAction === 'start' && styles.startButtonFocused,
            isStartingPlayback && styles.actionButtonDisabled,
          ]}
          onFocus={() => setFocusedAction('start')}
          onBlur={() => setFocusedAction(null)}
          onPress={onStartPlayback}
          disabled={isStartingPlayback || isLeaving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start Watch Party playback"
          testID={WATCH_PARTY_TEST_IDS.startPlaybackButton}>
          {isStartingPlayback ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.startButtonText}>Starting...</Text>
            </View>
          ) : (
            <Text style={styles.startButtonText}>▶ Start Watching</Text>
          )}
        </TouchableOpacity>
      ) : isPlaybackActive ? (
        /* Participant Action: Join Watching (if host has started) */
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.joinPlaybackButton,
            focusedAction === 'join' && styles.startButtonFocused,
            isJoiningPlayback && styles.actionButtonDisabled,
          ]}
          onFocus={() => setFocusedAction('join')}
          onBlur={() => setFocusedAction(null)}
          onPress={onJoinPlayback}
          disabled={isJoiningPlayback || isLeaving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Join Watch Party playback"
          testID={WATCH_PARTY_TEST_IDS.joinPlaybackButton}>
          {isJoiningPlayback ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.joinPlaybackButtonText}>Joining...</Text>
            </View>
          ) : (
            <Text style={styles.joinPlaybackButtonText}>▶ Join Watching</Text>
          )}
        </TouchableOpacity>
      ) : (
        /* Participant Informational Tag: Waiting for Host */
        <View
          style={styles.waitingForHostBadge}
          testID={WATCH_PARTY_TEST_IDS.waitingForHostIndicator}>
          <Text style={styles.waitingForHostText}>
            ⏳ Waiting for host to start playback...
          </Text>
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.refreshButton,
          focusedAction === 'refresh' && styles.actionButtonFocused,
          isRefreshing && styles.actionButtonDisabled,
        ]}
        onFocus={() => setFocusedAction('refresh')}
        onBlur={() => setFocusedAction(null)}
        onPress={onRefresh}
        disabled={isRefreshing || isLeaving || isStartingPlayback}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Refresh Watch Party room details"
        testID={WATCH_PARTY_TEST_IDS.retryButton}>
        {isRefreshing ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={colors.textPrimary} />
            <Text style={styles.refreshButtonText}>Refreshing...</Text>
          </View>
        ) : (
          <Text style={styles.refreshButtonText}>↻ Refresh</Text>
        )}
      </TouchableOpacity>

      {/* Dev / Host Simulation Action: Simulate Friend Joining */}
      {isHost && onSimulateJoin ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.simulateButton,
            focusedAction === 'simulate' && styles.simulateButtonFocused,
          ]}
          onFocus={() => setFocusedAction('simulate')}
          onBlur={() => setFocusedAction(null)}
          onPress={onSimulateJoin}
          disabled={isRefreshing || isLeaving || isStartingPlayback}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Simulate a friend joining the party"
          testID="watch-party-simulate-friend-button">
          <Text style={styles.simulateButtonText}>+ Add Friend</Text>
        </TouchableOpacity>
      ) : null}

      {/* Leave Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.leaveButton,
          focusedAction === 'leave' && styles.leaveButtonFocused,
          isLeaving && styles.actionButtonDisabled,
        ]}
        onFocus={() => setFocusedAction('leave')}
        onBlur={() => setFocusedAction(null)}
        onPress={onLeave}
        disabled={isLeaving || isStartingPlayback}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={isHost ? 'End Watch Party and leave' : 'Leave Watch Party'}
        testID={WATCH_PARTY_TEST_IDS.leaveButton}>
        <Text style={styles.leaveButtonText}>
          {isHost ? 'End & Leave Party' : 'Leave Party'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  startButton: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  startButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: '#26C6DA',
    transform: [{scale: 1.05}],
  },
  startButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  joinPlaybackButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderColor: '#00E5FF',
  },
  joinPlaybackButtonText: {
    color: '#00E5FF',
    fontSize: 15,
    fontWeight: '800',
  },
  waitingForHostBadge: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingForHostText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: colors.cardBackgroundSubtle,
    borderColor: colors.cardBorderSubtle,
  },
  refreshButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  simulateButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#818CF8',
  },
  simulateButtonFocused: {
    backgroundColor: '#6366F1',
    borderColor: '#C7D2FE',
    transform: [{scale: 1.05}],
  },
  simulateButtonText: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  leaveButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
  actionButtonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  leaveButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: '#EF4444',
    transform: [{scale: 1.05}],
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});
