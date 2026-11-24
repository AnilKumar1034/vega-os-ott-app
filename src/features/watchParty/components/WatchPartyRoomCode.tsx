/**
 * Watch Party Room Code Display Component
 * Large, TV-optimized display of the room code for easy reading across the room.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyRoomCodeProps {
  roomCode: string;
  subtitle?: string;
  expiresAt?: string;
}

export const WatchPartyRoomCode: React.FC<WatchPartyRoomCodeProps> = ({
  roomCode,
  subtitle = 'Share this code with friends to join this Watch Party',
  expiresAt,
}) => {
  // Format code with a space in the middle for easier reading (e.g. "AB7 89P")
  const formattedCode =
    roomCode.length === 6
      ? `${roomCode.slice(0, 3)} ${roomCode.slice(3)}`
      : roomCode;

  const formatExpiry = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } catch {
      return null;
    }
  };

  const expiryTimeStr = formatExpiry(expiresAt);

  return (
    <View
      style={styles.container}
      testID={WATCH_PARTY_TEST_IDS.roomCodeDisplay}>
      <Text style={styles.label}>ROOM CODE</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{formattedCode}</Text>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      {expiryTimeStr ? (
        <Text
          style={styles.expiryText}
          testID={WATCH_PARTY_TEST_IDS.roomExpiryText}>
          Expires at {expiryTimeStr}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorderSubtle,
    marginBottom: 8,
  },
  codeText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  expiryText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
