/**
 * Watch Party Room Code Display Component
 * Large, TV-optimized display of the room code for easy reading across the room.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyRoomCodeProps {
  roomCode: string;
  subtitle?: string;
  expiresAt?: string;
  onSharePress?: () => void;
  showFeedback?: boolean;
}

export const WatchPartyRoomCode: React.FC<WatchPartyRoomCodeProps> = ({
  roomCode,
  subtitle = 'Share this code with friends to join this Watch Party',
  expiresAt,
  onSharePress,
  showFeedback: controlledFeedback,
}) => {
  const [internalFeedback, setInternalFeedback] = useState(false);
  const [isButtonFocused, setIsButtonFocused] = useState(false);

  const isFeedbackVisible = controlledFeedback ?? internalFeedback;

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

  const handlePressShare = () => {
    if (onSharePress) {
      onSharePress();
    } else {
      setInternalFeedback((prev) => !prev);
    }
  };

  return (
    <View
      style={styles.container}
      testID={WATCH_PARTY_TEST_IDS.roomCodeDisplay}>
      <Text style={styles.label}>ROOM CODE</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{formattedCode}</Text>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* TV Friendly Share / Invite Action */}
      <TouchableOpacity
        style={[
          styles.shareButton,
          isButtonFocused && styles.shareButtonFocused,
        ]}
        onFocus={() => setIsButtonFocused(true)}
        onBlur={() => setIsButtonFocused(false)}
        onPress={handlePressShare}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Share room code ${roomCode}`}
        testID={WATCH_PARTY_TEST_IDS.shareCodeButton}>
        <Text style={styles.shareButtonText}>
          {isFeedbackVisible ? 'Hide Invite Instructions' : 'How Friends Join'}
        </Text>
      </TouchableOpacity>

      {isFeedbackVisible ? (
        <View
          style={styles.feedbackBox}
          testID={WATCH_PARTY_TEST_IDS.shareCodeFeedback}>
          <Text style={styles.feedbackTitle}>How to Join:</Text>
          <Text style={styles.feedbackText}>
            1. Open LogiXstream on TV{'\n'}
            2. Select "Watch Party" in the menu{'\n'}
            3. Enter room code: <Text style={styles.boldCode}>{roomCode}</Text>
          </Text>
        </View>
      ) : null}

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
  shareButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: colors.cardBorderSubtle,
  },
  shareButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.cardHoverBackground,
    transform: [{scale: 1.05}],
  },
  shareButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackBox: {
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    width: '100%',
  },
  feedbackTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  feedbackText: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 18,
  },
  boldCode: {
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  expiryText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
