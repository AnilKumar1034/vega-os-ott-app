/**
 * Watch Party Room Header
 * TV-friendly header displaying navigation, room title, code badge, and room status.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {WatchPartyRoomStatus} from '../types/watchParty.types';

export interface WatchPartyRoomHeaderProps {
  title: string;
  subtitle?: string;
  roomCode?: string;
  status?: WatchPartyRoomStatus;
  onBack?: () => void;
  hasPreferredFocus?: boolean;
}

export const WatchPartyRoomHeader: React.FC<WatchPartyRoomHeaderProps> = ({
  title,
  subtitle,
  roomCode,
  status,
  onBack,
  hasPreferredFocus = false,
}) => {
  const [isBackFocused, setIsBackFocused] = useState(false);

  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'paused':
        return styles.statusPaused;
      case 'ended':
      case 'expired':
        return styles.statusEnded;
      case 'waiting':
      default:
        return styles.statusWaiting;
    }
  };

  return (
    <View style={styles.headerContainer} testID={WATCH_PARTY_TEST_IDS.header}>
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity
            style={[
              styles.backButton,
              isBackFocused && styles.backButtonFocused,
            ]}
            onFocus={() => setIsBackFocused(true)}
            onBlur={() => setIsBackFocused(false)}
            onPress={onBack}
            hasTVPreferredFocus={hasPreferredFocus}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID={WATCH_PARTY_TEST_IDS.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {roomCode ? (
          <View
            style={styles.roomCodeBadge}
            testID={WATCH_PARTY_TEST_IDS.roomCodeDisplay}>
            <Text style={styles.roomCodeLabel}>CODE:</Text>
            <Text style={styles.roomCodeValue}>{roomCode}</Text>
          </View>
        ) : null}

        {status ? (
          <View
            style={[styles.statusBadge, getStatusBadgeStyle()]}
            testID={WATCH_PARTY_TEST_IDS.roomStatusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
    backgroundColor: colors.headerBackground,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.cardBackgroundSubtle,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 20,
  },
  backButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.cardHoverBackground,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  titleArea: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorderSubtle,
  },
  roomCodeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  roomCodeValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusWaiting: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusPaused: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  statusEnded: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
