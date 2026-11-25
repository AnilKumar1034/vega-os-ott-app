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
  isRefreshing?: boolean;
  isLeaving?: boolean;
  isHost?: boolean;
}

export const WatchPartyLobbyActions: React.FC<WatchPartyLobbyActionsProps> = ({
  onRefresh,
  onLeave,
  isRefreshing = false,
  isLeaving = false,
  isHost = false,
}) => {
  const [focusedAction, setFocusedAction] = useState<'refresh' | 'leave' | null>(
    null,
  );

  return (
    <View
      style={styles.actionRow}
      testID={WATCH_PARTY_TEST_IDS.lobbyActions}>
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
        disabled={isRefreshing || isLeaving}
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
        disabled={isLeaving}
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
  refreshButton: {
    backgroundColor: colors.cardBackgroundSubtle,
    borderColor: colors.cardBorderSubtle,
  },
  refreshButtonText: {
    color: colors.textPrimary,
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
