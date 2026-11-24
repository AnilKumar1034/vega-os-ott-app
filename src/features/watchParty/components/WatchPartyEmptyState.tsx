/**
 * Watch Party Empty State Component
 * TV-friendly empty state screen for Watch Party lobbies with no active participants or rooms.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const WatchPartyEmptyState: React.FC<WatchPartyEmptyStateProps> = ({
  title = 'No Watch Party Found',
  message = 'There is currently no active Watch Party room to display.',
  actionLabel = 'Create or Join Room',
  onAction,
  testID = WATCH_PARTY_TEST_IDS.emptyState,
}) => {
  const [isActionFocused, setIsActionFocused] = useState(false);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🍿</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {onAction ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isActionFocused && styles.actionButtonFocused,
            ]}
            onFocus={() => setIsActionFocused(true)}
            onBlur={() => setIsActionFocused(false)}
            onPress={onAction}
            hasTVPreferredFocus
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            testID={WATCH_PARTY_TEST_IDS.createButton}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
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
    minHeight: 280,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    maxWidth: 520,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
