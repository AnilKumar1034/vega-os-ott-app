/**
 * Watch Party Error State Component
 * TV-optimized error card with retry and back navigation actions.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  testID?: string;
}

export const WatchPartyErrorState: React.FC<WatchPartyErrorStateProps> = ({
  title = 'Watch Party Unavailable',
  message = 'An unexpected error occurred while accessing the Watch Party.',
  onRetry,
  onBack,
  testID = WATCH_PARTY_TEST_IDS.errorState,
}) => {
  const [focusedButton, setFocusedButton] = useState<'retry' | 'back' | null>(
    null,
  );

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonRow}>
          {onRetry ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                focusedButton === 'retry' && styles.buttonFocused,
              ]}
              onFocus={() => setFocusedButton('retry')}
              onBlur={() => setFocusedButton(null)}
              onPress={onRetry}
              hasTVPreferredFocus
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Retry"
              testID={WATCH_PARTY_TEST_IDS.retryButton}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          ) : null}

          {onBack ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                focusedButton === 'back' && styles.buttonFocused,
              ]}
              onFocus={() => setFocusedButton('back')}
              onBlur={() => setFocusedButton(null)}
              onPress={onBack}
              hasTVPreferredFocus={!onRetry}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID={WATCH_PARTY_TEST_IDS.backButton}>
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    maxWidth: 560,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.errorBackground,
    borderWidth: 2,
    borderColor: colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    color: colors.errorText,
    fontSize: 28,
    fontWeight: '900',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: colors.cardBackgroundSubtle,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.cardBorderSubtle,
  },
  buttonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
