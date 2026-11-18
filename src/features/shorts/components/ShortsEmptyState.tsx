import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';
import {isKeyDown, isSelectEvent} from '../../../utils/inputUtils';

export interface ShortsEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const ShortsEmptyState = ({
  title = 'No Shorts Found',
  message = 'There are no Shorts available matching your current category filter or profile settings.',
  actionLabel = 'Browse All Shorts',
  onAction,
  testID = SHORTS_TEST_IDS.empty,
}: ShortsEmptyStateProps) => {
  const [isFocused, setIsFocused] = useState(false);

  useTVEventHandler((evt) => {
    if (!isFocused || !evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();
    if (isSelectEvent(type) && onAction) {
      onAction();
    }
  });

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>🎬</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          hasTVPreferredFocus={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPress={onAction}
          testID={SHORTS_TEST_IDS.resetFilterButton}
          style={[styles.button, isFocused && styles.buttonFocused]}>
          <Text style={[styles.buttonText, isFocused && styles.buttonTextFocused]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.extraHuge,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.huge,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 18,
    marginBottom: spacing.huge,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonFocused: {
    borderColor: colors.focusedTint,
    backgroundColor: colors.focusedTint,
    transform: [{scale: 1.05}],
  },
  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonTextFocused: {
    color: colors.black,
  },
});
