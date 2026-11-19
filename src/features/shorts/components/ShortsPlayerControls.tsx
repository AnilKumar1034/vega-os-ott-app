import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ShortsPlaybackControlsProps} from '../types/shorts.types';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {fontSizes, fontWeights} from '../../../theme/fonts';
import {borderRadius, spacing} from '../../../theme/sizes';
import {isKeyDown, isPlayPauseEvent} from '../../../utils/inputUtils';

export const ShortsPlayerControls: React.FC<ShortsPlaybackControlsProps> = ({
  state,
  onPlayPause,
  onReplay,
  onRetry,
  disabled = false,
}) => {
  const [focusedButton, setFocusedButton] = useState<'play' | 'replay' | 'retry' | null>(null);

  // TV remote Play/Pause button event listener
  useTVEventHandler((evt) => {
    if (!evt || disabled) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    if (isPlayPauseEvent(evt.eventType)) {
      if (state === 'completed') {
        onReplay();
      } else if (state === 'error') {
        onRetry();
      } else {
        onPlayPause();
      }
    }
  });

  const isPlaying = state === 'playing';
  const isCompleted = state === 'completed';
  const isError = state === 'error';

  const handlePlayPausePress = useCallback(() => {
    if (disabled) return;
    onPlayPause();
  }, [disabled, onPlayPause]);

  const handleReplayPress = useCallback(() => {
    if (disabled) return;
    onReplay();
  }, [disabled, onReplay]);

  const handleRetryPress = useCallback(() => {
    if (disabled) return;
    onRetry();
  }, [disabled, onRetry]);

  return (
    <View style={styles.container} testID={SHORTS_TEST_IDS.playerControls}>
      {/* Replay Button shown when completed */}
      {isCompleted ? (
        <TouchableOpacity
          activeOpacity={0.8}
          hasTVPreferredFocus
          onFocus={() => setFocusedButton('replay')}
          onBlur={() => setFocusedButton(null)}
          onPress={handleReplayPress}
          testID={SHORTS_TEST_IDS.replayButton}
          style={[
            styles.button,
            styles.replayButton,
            focusedButton === 'replay' && styles.buttonFocused,
          ]}>
          <Text
            style={[
              styles.buttonText,
              focusedButton === 'replay' && styles.buttonTextFocused,
            ]}>
            ↺ Replay
          </Text>
        </TouchableOpacity>
      ) : isError ? (
        /* Retry Button shown when playback error */
        <TouchableOpacity
          activeOpacity={0.8}
          hasTVPreferredFocus
          onFocus={() => setFocusedButton('retry')}
          onBlur={() => setFocusedButton(null)}
          onPress={handleRetryPress}
          testID={SHORTS_TEST_IDS.playerErrorRetryButton}
          style={[
            styles.button,
            styles.retryButton,
            focusedButton === 'retry' && styles.buttonFocused,
          ]}>
          <Text
            style={[
              styles.buttonText,
              focusedButton === 'retry' && styles.buttonTextFocused,
            ]}>
            ↻ Retry Video
          </Text>
        </TouchableOpacity>
      ) : (
        /* Play / Pause Toggle Button */
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={disabled || state === 'loading'}
          onFocus={() => setFocusedButton('play')}
          onBlur={() => setFocusedButton(null)}
          onPress={handlePlayPausePress}
          testID={SHORTS_TEST_IDS.playPauseButton}
          style={[
            styles.button,
            isPlaying ? styles.pauseButton : styles.playButton,
            focusedButton === 'play' && styles.buttonFocused,
            state === 'loading' && styles.buttonDisabled,
          ]}>
          <Text
            style={[
              styles.buttonText,
              focusedButton === 'play' && styles.buttonTextFocused,
            ]}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  playButton: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.heroAccent,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  replayButton: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.heroAccent,
  },
  retryButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: '#EF4444',
  },
  buttonFocused: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    transform: [{scale: 1.05}],
    shadowColor: colors.white,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  buttonTextFocused: {
    color: colors.black,
  },
});
