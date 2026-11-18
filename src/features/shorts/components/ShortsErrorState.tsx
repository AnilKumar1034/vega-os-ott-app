import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ShortsApiError} from '../types/shorts.types';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';
import {isKeyDown, isSelectEvent} from '../../../utils/inputUtils';

export interface ShortsErrorStateProps {
  error: ShortsApiError | null;
  onRetry: () => void;
  testID?: string;
}

export const ShortsErrorState = ({
  error,
  onRetry,
  testID = SHORTS_TEST_IDS.error,
}: ShortsErrorStateProps) => {
  const [isFocused, setIsFocused] = useState(false);

  useTVEventHandler((evt) => {
    if (!isFocused || !evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();
    if (isSelectEvent(type)) {
      onRetry();
    }
  });

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <Text style={styles.title}>Unable to Load Shorts</Text>
      <Text style={styles.message}>
        {error?.message || 'A network error occurred. Please try again.'}
      </Text>
      {error?.code ? (
        <Text style={styles.code}>Error code: {error.code}</Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.8}
        hasTVPreferredFocus={true}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={onRetry}
        testID={SHORTS_TEST_IDS.retryButton}
        style={[styles.button, isFocused && styles.buttonFocused]}>
        <Text style={[styles.buttonText, isFocused && styles.buttonTextFocused]}>
          ↻ Retry
        </Text>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.huge,
  },
  iconText: {
    fontSize: 26,
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
    maxWidth: 380,
    lineHeight: 18,
    marginBottom: 6,
  },
  code: {
    color: colors.errorText,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: spacing.huge,
  },
  button: {
    backgroundColor: colors.activeTint,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonFocused: {
    borderColor: colors.white,
    backgroundColor: colors.white,
    transform: [{scale: 1.05}],
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonTextFocused: {
    color: colors.black,
  },
});
