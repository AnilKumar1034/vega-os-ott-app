import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {KeplerVideoViewComponent} from '../services/shortsPlaybackService';
import {useShortsPlayback} from '../hooks/useShortsPlayback';
import {ShortsPlayerControls} from './ShortsPlayerControls';
import {ShortsItem} from '../types/shorts.types';
import {
  DEFAULT_SHORTS_FALLBACK_THUMBNAIL,
  SHORTS_TEST_IDS,
} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {fontSizes, fontWeights} from '../../../theme/fonts';
import {spacing} from '../../../theme/sizes';

export interface ShortsPlayerProps {
  short: ShortsItem | null;
  isActive?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  onCompleted?: (short: ShortsItem) => void;
  onError?: (short: ShortsItem, error: string) => void;
  style?: ViewStyle;
  testID?: string;
  playbackInstance?: ReturnType<typeof useShortsPlayback>;
}

export const ShortsPlayer: React.FC<ShortsPlayerProps> = ({
  short,
  isActive = true,
  autoPlay = true,
  showControls = true,
  onCompleted,
  onError,
  style,
  testID = SHORTS_TEST_IDS.player,
  playbackInstance,
}) => {
  // Use passed playback instance if supplied, otherwise run the hook internally
  const internalPlayback = useShortsPlayback({
    short,
    isActive,
    autoPlay,
    onCompleted,
    onError,
  });

  const {
    player,
    playbackState,
    errorMessage,
    togglePlayPause,
    replay,
    retry,
  } = playbackInstance || internalPlayback;

  const isPlaying = playbackState === 'playing';
  const isBuffering = playbackState === 'buffering';
  const isLoading = playbackState === 'loading';
  const isPaused = playbackState === 'paused';
  const isCompleted = playbackState === 'completed';
  const isError = playbackState === 'error';

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Background Thumbnail Poster (prevents black flash during load / pause) */}
      {!isPlaying && (
        <Image
          source={{
            uri: short?.thumbnailUrl || DEFAULT_SHORTS_FALLBACK_THUMBNAIL,
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Native Kepler W3C Media Video Surface */}
      {player && (
        <KeplerVideoViewComponent
          videoPlayer={player}
          style={StyleSheet.absoluteFill}
          testID={SHORTS_TEST_IDS.playerSurface}
        />
      )}

      {/* Top Overlay Badges */}
      <View style={styles.topBadgeRow} pointerEvents="none">
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>
            {short?.durationSeconds ? `${short.durationSeconds}s` : '9:16'}
          </Text>
        </View>

        {short?.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>★ PREMIUM</Text>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.centerOverlay} testID={SHORTS_TEST_IDS.loading}>
          <ActivityIndicator size="large" color={colors.heroAccent} />
          <Text style={styles.overlayText}>Loading Video...</Text>
        </View>
      )}

      {/* Buffering Overlay */}
      {isBuffering && (
        <View
          style={styles.centerOverlay}
          testID={SHORTS_TEST_IDS.playerBuffering}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.overlayText}>Buffering...</Text>
        </View>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.statusCircle}>
            <Text style={styles.statusIcon}>⏸</Text>
          </View>
          <Text style={styles.overlayText}>Paused</Text>
        </View>
      )}

      {/* Completed Overlay */}
      {isCompleted && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={[styles.statusCircle, styles.completedCircle]}>
            <Text style={styles.statusIcon}>↺</Text>
          </View>
          <Text style={styles.overlayText}>Replay Available</Text>
        </View>
      )}

      {/* Error Overlay */}
      {isError && (
        <View style={styles.centerOverlay} testID={SHORTS_TEST_IDS.error}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorSubtitle}>
            {errorMessage || 'Unable to play this Short'}
          </Text>
        </View>
      )}

      {/* Signature Red Progress Bar along bottom edge */}
      <View style={styles.progressBarTrack} pointerEvents="none">
        <View
          style={[
            styles.progressBarFill,
            {
              width: isPlaying
                ? '60%'
                : isCompleted
                ? '100%'
                : isPaused
                ? '35%'
                : '10%',
            },
          ]}
        />
      </View>

      {/* Bottom Controls Overlay */}
      {showControls && (
        <View style={styles.bottomControlsContainer}>
          <ShortsPlayerControls
            state={playbackState}
            onPlayPause={togglePlayPause}
            onReplay={replay}
            onRetry={retry}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 300,
    borderRadius: 24, // Distinctive white rounded frame matching reference image
    overflow: 'hidden',
    backgroundColor: '#0F141C',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 14,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    zIndex: 10,
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationBadgeText: {
    color: colors.white,
    fontSize: fontSizes.portraitBadge,
    fontWeight: fontWeights.bold,
  },
  premiumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: colors.black,
    fontSize: fontSizes.portraitBadge,
    fontWeight: fontWeights.bold,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    zIndex: 5,
  },
  statusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completedCircle: {
    borderColor: colors.heroAccent,
  },
  statusIcon: {
    fontSize: 22,
    color: colors.white,
  },
  overlayText: {
    color: colors.white,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  errorSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
  progressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  bottomControlsContainer: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
});
