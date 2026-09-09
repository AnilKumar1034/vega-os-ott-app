import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {
  SeekBar,
  SegmentColorsConfig,
  DisplayAboveThumbProps,
  InteractionEventPayload,
} from '@amazon-devices/kepler-ui-components/dist/src/components/SeekBar';
import {BreakMarker} from '@amazon-devices/kepler-ui-components/dist/src/components/ProgressBar';
import {SEEKBAR_COLORS} from '../../constants/seekbarColors';
import {getSeekbarThumbnailSource} from '../../constants/thumbnails';
import {
  getExactVideoThumbnail,
  prefetchDynamicVideoThumbnails,
} from '../../constants/videoThumbnails';
import {colors} from '../../theme/colors';
import {circleStyle, styles} from './PlayerSeekBar.styles';
import {strings} from '../../constants/strings';

export type SeekbarType =
  | 'markers'
  | 'break-markers'
  | 'limits'
  | 'long-press'
  | 'fast-forward-rewind'
  | 'thumbnail-images'
  | 'thumbnails';

export interface PlayerSeekBarProps {
  type: SeekbarType;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  isLive?: boolean;
  onSeek: (timeInSeconds: number) => void;
  onTogglePlayPause?: () => void;
  onTypeChange?: (newType: SeekbarType) => void;
  onInteraction?: () => void;
  onFastForwardPress?: () => void;
  onRewindPress?: () => void;
  testID?: string;
  enableThumbnails?: boolean;
  thumbnailImageSource?: ((thumbValue: number) => any) | any;
  thumbnailLabel?: ((thumbValue: number) => string) | string;
  videoUrl?: string;
  movie?: any;
  player?: any;
}

const ARROW_IMG = require('../../assets/arrow_up.png');
const FAST_FORWARD_IMG = require('../../assets/fast_forward.png');
const REWIND_IMG = require('../../assets/rewind.png');

/**
 * Display component showing acceleration feedback during D-pad long press.
 * Referenced from AmazonAppDev/vega-seekbar-sample (src/screens/LongPress.tsx).
 */
export const LongPressAboveThumb = ({
  mode,
  multiplier,
}: DisplayAboveThumbProps) => {
  const isFastMode = mode === 'fast_rewind' || mode === 'fast_forward';

  const calculateSpeedLabel = (multiplierValue: number) => {
    const speedMap: Record<number, string> = {
      1: '1x',
      2: '2x',
      4: '3x',
      6: '4x',
      8: '5x',
    };
    return speedMap[multiplierValue] || `${multiplierValue}x`;
  };

  const getLabelText = () => {
    if (multiplier === 1) {
      if (mode === 'rewind') {
        return '-10';
      }
      if (mode === 'forward') {
        return '+10';
      }
    }
    if (isFastMode) {
      return calculateSpeedLabel(multiplier);
    }
    return '';
  };

  const showRewindImage = isFastMode && mode === 'fast_rewind';
  const showForwardImage = isFastMode && mode === 'fast_forward';

  return (
    <View style={styles.aboveThumb} testID="above-thumb-long-press">
      {showRewindImage && (
        <Image
          source={REWIND_IMG}
          style={styles.fastForwardRewindImage}
          testID="long-press-rewind-img"
        />
      )}
      <Text
        style={styles.fastForwardRewindLabel}
        testID="long-press-speed-label">
        {getLabelText()}
      </Text>
      {showForwardImage && (
        <Image
          source={FAST_FORWARD_IMG}
          style={styles.fastForwardRewindImage}
          testID="long-press-forward-img"
        />
      )}
    </View>
  );
};

/**
 * Display component showing skip forward/backward feedback with speed indicators.
 * Referenced from AmazonAppDev/vega-seekbar-sample (src/screens/FastForwardRewind.tsx).
 */
export const FastForwardRewindAboveThumb = ({
  mode,
  multiplier,
}: DisplayAboveThumbProps) => {
  const isFastMode = mode === 'fast_rewind' || mode === 'fast_forward';

  const getLabelText = () => {
    if (multiplier === 1) {
      if (mode === 'rewind') {
        return '-10';
      }
      if (mode === 'forward') {
        return '+10';
      }
      if (isFastMode) {
        return '1x';
      }
    }
    if (isFastMode) {
      return `${multiplier}x`;
    }
    return '';
  };

  const showRewindImage = isFastMode && mode === 'fast_rewind';
  const showForwardImage = isFastMode && mode === 'fast_forward';

  return (
    <View style={styles.aboveThumb} testID="above-thumb-fast-forward-rewind">
      {showRewindImage && (
        <Image
          source={REWIND_IMG}
          style={styles.fastForwardRewindImage}
          testID="fast-forward-rewind-rew-img"
        />
      )}
      <Text
        style={styles.fastForwardRewindLabel}
        testID="fast-forward-rewind-speed-label">
        {getLabelText()}
      </Text>
      {showForwardImage && (
        <Image
          source={FAST_FORWARD_IMG}
          style={styles.fastForwardRewindImage}
          testID="fast-forward-rewind-ff-img"
        />
      )}
    </View>
  );
};

/**
 * Display component showing seeking feedback above the thumbnail preview.
 * Referenced from AmazonAppDev/vega-seekbar-sample (src/screens/Thumbnail.tsx).
 */
export const ThumbnailAboveThumb = ({
  mode,
  multiplier,
}: DisplayAboveThumbProps) => {
  const isFastMode = mode === 'fast_rewind' || mode === 'fast_forward';

  const getLabelText = () => {
    if (multiplier === 1) {
      if (mode === 'rewind') {
        return '-10';
      }
      if (mode === 'forward') {
        return '+10';
      }
      if (isFastMode) {
        return '1x';
      }
    }
    if (isFastMode) {
      return `${multiplier}x`;
    }
    return '';
  };

  const showRewindImage = isFastMode && mode === 'fast_rewind';
  const showForwardImage = isFastMode && mode === 'fast_forward';

  return (
    <View style={styles.aboveThumb} testID="above-thumb-thumbnail">
      {showRewindImage && (
        <Image
          source={REWIND_IMG}
          style={styles.fastForwardRewindImage}
          testID="thumbnail-rewind-img"
        />
      )}
      <Text
        style={styles.fastForwardRewindLabel}
        testID="thumbnail-speed-label">
        {getLabelText()}
      </Text>
      {showForwardImage && (
        <Image
          source={FAST_FORWARD_IMG}
          style={styles.fastForwardRewindImage}
          testID="thumbnail-forward-img"
        />
      )}
    </View>
  );
};

/**
 * Display component showing preview metadata below the thumbnail preview.
 * Referenced from AmazonAppDev/vega-seekbar-sample (src/screens/Thumbnail.tsx).
 */
export const ThumbnailBelowThumb = () => (
  <View style={styles.belowLabel} testID="below-thumb-thumbnail">
    <Text style={styles.belowLabelText} testID="thumbnail-below-label-text">
      {strings.playerControls.thumbnailPreview || 'Preview'}
    </Text>
  </View>
);

const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const s = Math.floor(totalSeconds);
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const m = minutes % 60;
    return `${hours}:${m < 10 ? '0' : ''}${m}:${
      seconds < 10 ? '0' : ''
    }${seconds}`;
  }
  return `${minutes < 10 ? '0' : ''}${minutes}:${
    seconds < 10 ? '0' : ''
  }${seconds}`;
};

const ThumbIcon = ({focused}: {focused: boolean}) => (
  <View style={focused ? styles.focusedThumb : styles.unfocusedThumb} />
);

const LiveThumbIcon = () => (
  <View style={styles.liveThumb} testID="player-live-thumb" />
);

const BelowMarker = (
  <View style={styles.belowMarker}>
    <Text style={styles.belowMarkerText}>Ad</Text>
  </View>
);

const LimitMarkerBar = () => (
  <View style={styles.limitMarker} key="limit-bar" />
);
const LimitMarkerArrow = () => (
  <Image
    source={ARROW_IMG}
    resizeMode="contain"
    style={styles.savedDelayArrow}
    key="limit-arrow"
  />
);

export const PlayerSeekBar: React.FC<PlayerSeekBarProps> = ({
  type,
  currentTime,
  duration,
  isPaused,
  isLive = false,
  onSeek,
  onTogglePlayPause,
  onTypeChange,
  onInteraction,
  onFastForwardPress,
  onRewindPress,
  testID = 'player-seekbar-container',
  enableThumbnails = true,
  thumbnailImageSource,
  thumbnailLabel,
  videoUrl,
  movie,
  player,
}) => {
  const safeDuration = Math.max(
    10,
    Math.floor(Number.isFinite(duration) && duration > 0 ? duration : 300),
  );
  const safeCurrentTime = Math.min(
    safeDuration,
    Math.max(0, Math.floor(currentTime || 0)),
  );

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState<number>(safeCurrentTime);
  const currentScrubPositionRef = useRef<number>(safeCurrentTime);
  const [focusedButton, setFocusedButton] = useState<string | null>(null);

  // 1. Markers State: Dynamic arrow position indicator
  const [selectedProgress, setSelectedProgress] = useState<number>(
    safeCurrentTime + 0.001,
  );

  useEffect(() => {
    if (!isScrubbing) {
      setScrubPosition(safeCurrentTime);
      currentScrubPositionRef.current = safeCurrentTime;
    }
  }, [isScrubbing, safeCurrentTime]);

  const effectiveCurrentTime = isScrubbing ? scrubPosition : safeCurrentTime;

  // Generate tick markers across total value for "markers" type
  const tickStep = Math.max(2, Math.round(safeDuration / 32));
  const ticks = useMemo(() => {
    const list: any[] = [];
    for (let i = 0; i <= safeDuration; i += tickStep) {
      list.push({
        position: i,
        node: (
          <View style={[circleStyle(8), styles.tickStyle]} key={`tick-${i}`} />
        ),
      });
    }
    return list;
  }, [safeDuration, tickStep]);

  // 2. Break Markers & Segments State
  const initialBreakMarkers = useMemo<BreakMarker[]>(() => {
    return [
      {position: Math.round(safeDuration * 0.08), type: 'break'},
      {
        position: Math.round(safeDuration * 0.22),
        pointColor: SEEKBAR_COLORS.PRIMARY_BLUE,
      },
      {position: Math.round(safeDuration * 0.4), type: 'break'},
      {
        position: Math.round(safeDuration * 0.6),
        pointColor: SEEKBAR_COLORS.PRIMARY_BLUE,
      },
      {position: Math.round(safeDuration * 0.78), type: 'break'},
      {
        position: Math.round(safeDuration * 0.9),
        pointColor: SEEKBAR_COLORS.PRIMARY_BLUE,
      },
    ];
  }, [safeDuration]);

  const [breakMarkersList, setBreakMarkersList] =
    useState<BreakMarker[]>(initialBreakMarkers);

  // Sync initial markers when duration changes
  useEffect(() => {
    setBreakMarkersList(initialBreakMarkers);
  }, [initialBreakMarkers]);

  const handleOnRemoveMarker = useCallback(() => {
    onInteraction?.();
    setBreakMarkersList((prev) => (prev.length > 0 ? prev.slice(1) : []));
  }, [onInteraction]);

  const handleOnAddMarker = useCallback(() => {
    onInteraction?.();
    setBreakMarkersList((prev) => {
      if (prev.length >= initialBreakMarkers.length) {
        const newMarker: BreakMarker =
          prev.length % 2 === 0
            ? {
                position: Math.min(
                  safeDuration - 5,
                  Math.max(5, scrubPosition),
                ),
                type: 'break',
              }
            : {
                position: Math.min(
                  safeDuration - 5,
                  Math.max(5, scrubPosition),
                ),
                pointColor: SEEKBAR_COLORS.PRIMARY_BLUE,
              };
        return [...prev, newMarker].sort((a, b) => a.position - b.position);
      }
      const nextMissing = initialBreakMarkers.find(
        (im) => !prev.some((pm) => pm.position === im.position),
      );
      if (!nextMissing) {
        return prev;
      }
      return [...prev, nextMissing].sort((a, b) => a.position - b.position);
    });
  }, [initialBreakMarkers, onInteraction, safeDuration, scrubPosition]);

  const dynamicPointMarkers = useMemo(() => {
    let lastMarkerBeforeProgress: BreakMarker | null = null;
    for (let i = 0; i < breakMarkersList.length; i++) {
      if (breakMarkersList[i].position <= scrubPosition) {
        lastMarkerBeforeProgress = breakMarkersList[i];
      }
    }

    return breakMarkersList.map((marker) => {
      if (marker.type === 'break') {
        return {...marker};
      }
      return {
        node: marker === lastMarkerBeforeProgress ? BelowMarker : null,
        position: marker.position,
        pointColor:
          marker === lastMarkerBeforeProgress
            ? SEEKBAR_COLORS.PRIMARY_BLUE
            : SEEKBAR_COLORS.YELLOW,
      };
    });
  }, [breakMarkersList, scrubPosition]);

  const segmentColors: SegmentColorsConfig = useMemo(
    () => ({
      0: {
        progressedColor: SEEKBAR_COLORS.SEGMENT_YELLOW_2,
        seekColor: SEEKBAR_COLORS.SEGMENT_BLUE_3,
        baseColor: SEEKBAR_COLORS.SEGMENT_YELLOW_1,
      },
      1: {
        progressedColor: SEEKBAR_COLORS.SEGMENT_YELLOW_2,
        seekColor: SEEKBAR_COLORS.SEGMENT_BLUE_3,
        baseColor: SEEKBAR_COLORS.SEGMENT_YELLOW_1,
      },
      2: {
        progressedColor: SEEKBAR_COLORS.PRIMARY_BLUE,
        seekColor: SEEKBAR_COLORS.SEGMENT_BLUE_3,
        baseColor: SEEKBAR_COLORS.SEGMENT_BLUE_1,
      },
      3: {
        baseColor: SEEKBAR_COLORS.SEGMENT_YELLOW_1,
        progressedColor: SEEKBAR_COLORS.SEGMENT_YELLOW_2,
      },
      4: {
        progressedColor: SEEKBAR_COLORS.PRIMARY_BLUE,
      },
    }),
    [],
  );

  // 3. Seeking Limits Configuration
  const lowerSeekLimit = Math.max(5, Math.round(safeDuration * 0.15));
  const upperSeekLimit = Math.min(
    safeDuration - 5,
    Math.round(safeDuration * 0.85),
  );

  const limitMarkers = useMemo(
    () => [
      {position: lowerSeekLimit, node: LimitMarkerArrow},
      {position: Math.max(0, lowerSeekLimit - 1), node: LimitMarkerBar},
      {position: upperSeekLimit, node: LimitMarkerArrow},
      {position: Math.max(0, upperSeekLimit - 1), node: LimitMarkerBar},
    ],
    [lowerSeekLimit, upperSeekLimit],
  );

  // Common Seekbar callbacks
  const handleOnValueChange = useCallback(
    (val: number) => {
      if (isLive) {
        return;
      }
      onInteraction?.();
      currentScrubPositionRef.current = val;
      if (isScrubbing) {
        setScrubPosition(val);
      }
    },
    [isLive, isScrubbing, onInteraction],
  );

  const handleOnPress = useCallback(
    (val: number) => {
      if (isLive) {
        return;
      }
      onInteraction?.();
      setIsScrubbing(false);
      currentScrubPositionRef.current = val;
      setScrubPosition(val);
      setSelectedProgress(val + 0.001);
      onSeek(val);
    },
    [isLive, onInteraction, onSeek],
  );

  const handleOnPlayPause = useCallback(
    (val: number) => {
      onInteraction?.();
      if (onTogglePlayPause) {
        onTogglePlayPause();
      } else if (!isLive) {
        handleOnPress(val);
      }
    },
    [handleOnPress, isLive, onInteraction, onTogglePlayPause],
  );

  const handleOnSlidingStart = useCallback(() => {
    if (isLive) {
      return;
    }
    onInteraction?.();
    setIsScrubbing(true);
    if (videoUrl) {
      prefetchDynamicVideoThumbnails(
        videoUrl,
        currentScrubPositionRef.current,
        safeDuration,
        10,
        movie,
      );
    }
  }, [isLive, onInteraction, safeDuration, videoUrl]);

  const handleOnSlidingEnd = useCallback(() => {
    if (isLive) {
      return;
    }
    onInteraction?.();
    setIsScrubbing(false);
    const target = currentScrubPositionRef.current;
    setScrubPosition(target);
    onSeek(target);
  }, [isLive, onInteraction, onSeek]);

  const handleSeekInteractionChange = useCallback(
    (event: InteractionEventPayload) => {
      if (isLive) {
        return;
      }
      onInteraction?.();
      if (event?.direction != null) {
        setIsScrubbing(true);
      } else {
        setIsScrubbing(false);
        const target = currentScrubPositionRef.current;
        setScrubPosition(target);
        onSeek(target);
      }
    },
    [isLive, onInteraction, onSeek],
  );

  const handleFastForward = useCallback(() => {
    if (isLive) {
      return;
    }
    onInteraction?.();
    const current = currentScrubPositionRef.current;
    const newPos = Math.min(safeDuration, current + 10);
    currentScrubPositionRef.current = newPos;
    setScrubPosition(newPos);
    setIsScrubbing(false);
    onSeek(newPos);
    onFastForwardPress?.();
  }, [isLive, onFastForwardPress, onInteraction, onSeek, safeDuration]);

  const handleRewind = useCallback(() => {
    if (isLive) {
      return;
    }
    onInteraction?.();
    const current = currentScrubPositionRef.current;
    const newPos = Math.max(0, current - 10);
    currentScrubPositionRef.current = newPos;
    setScrubPosition(newPos);
    setIsScrubbing(false);
    onSeek(newPos);
    onRewindPress?.();
  }, [isLive, onInteraction, onRewindPress, onSeek]);

  const stepValue = Math.max(1, Math.round(safeDuration / 60));

  const isThumbnailType =
    type === 'thumbnail-images' || type === 'thumbnails';

  const defaultThumbnailSource = useCallback(
    (thumbVal: number) =>
      getExactVideoThumbnail({
        thumbValue: thumbVal,
        duration: safeDuration,
        videoUrl,
        movie,
        player,
      }),
    [safeDuration, videoUrl, movie, player],
  );
  const effectiveThumbnailSource =
    thumbnailImageSource || defaultThumbnailSource;

  const defaultThumbnailLabel = useCallback(
    (thumbVal: number) => formatTime(thumbVal),
    [],
  );
  const effectiveThumbnailLabel = thumbnailLabel || defaultThumbnailLabel;

  return (
    <View style={styles.container} testID={testID}>
      {/* Top Controls Row: Play/Pause, Time, Type Switchers & Interactive Controls */}
      <View style={styles.topControlsRow}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[
              styles.playPauseButton,
              focusedButton === 'playPause' && styles.playPauseButtonFocused,
            ]}
            onFocus={() => {
              onInteraction?.();
              setFocusedButton('playPause');
            }}
            onBlur={() => setFocusedButton(null)}
            onPress={() => {
              onInteraction?.();
              onTogglePlayPause?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Play' : 'Pause'}
            testID="player-play-pause-toggle">
            <Text style={styles.playPauseIconText}>
              {isPaused
                ? strings.playerControls.pauseAction
                : strings.playerControls.playAction}
            </Text>
          </TouchableOpacity>

          {isLive ? (
            <View style={styles.liveInfoContainer}>
              <View style={styles.liveBadge} testID="player-live-badge">
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>{strings.header.live}</Text>
              </View>
              <Text style={styles.liveTimeText} testID="player-time-display">
                {strings.liveTV.isLive}
              </Text>
            </View>
          ) : (
            <Text style={styles.timeText} testID="player-time-display">
              {formatTime(effectiveCurrentTime)} / {formatTime(safeDuration)}
            </Text>
          )}
        </View>

        {isLive ? (
          <View style={styles.centerExtraControls}>
            <View style={styles.liveBroadcastTag} testID="player-live-tag">
              <Text style={styles.liveBroadcastText}>LIVE STREAM</Text>
            </View>
          </View>
        ) : (
          /* Dynamic Center Extra Controls based on active type */
          <View style={styles.centerExtraControls}>
            {type === 'break-markers' && (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    focusedButton === 'removeMarker' &&
                      styles.actionButtonFocused,
                  ]}
                  onFocus={() => {
                    onInteraction?.();
                    setFocusedButton('removeMarker');
                  }}
                  onBlur={() => setFocusedButton(null)}
                  onPress={handleOnRemoveMarker}
                  accessibilityRole="button"
                  accessibilityLabel="Remove marker"
                  testID="player-remove-marker-button">
                  <Text style={styles.actionButtonText}>
                    {strings.playerControls.removeMarker}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    focusedButton === 'addMarker' && styles.actionButtonFocused,
                  ]}
                  onFocus={() => {
                    onInteraction?.();
                    setFocusedButton('addMarker');
                  }}
                  onBlur={() => setFocusedButton(null)}
                  onPress={handleOnAddMarker}
                  accessibilityRole="button"
                  accessibilityLabel="Add marker"
                  testID="player-add-marker-button">
                  <Text style={styles.actionButtonText}>
                    {strings.playerControls.addMarker}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {type === 'limits' && (
              <View style={styles.limitsBadge} testID="player-limits-badge">
                <Text style={styles.limitsBadgeText}>
                  Limits: {formatTime(lowerSeekLimit)} –{' '}
                  {formatTime(upperSeekLimit)}
                </Text>
              </View>
            )}

            {type === 'long-press' && (
              <View
                style={styles.longPressBadge}
                testID="player-long-press-badge">
                <Text style={styles.longPressBadgeText}>
                  {strings.playerControls.longPressBadge}
                </Text>
              </View>
            )}

            {type === 'fast-forward-rewind' && (
              <View
                style={styles.skipControlsGroup}
                testID="player-skip-controls">
                <TouchableOpacity
                  style={[
                    styles.skipButton,
                    focusedButton === 'rewind' && styles.skipButtonFocused,
                  ]}
                  onFocus={() => {
                    onInteraction?.();
                    setFocusedButton('rewind');
                  }}
                  onBlur={() => setFocusedButton(null)}
                  onPress={handleRewind}
                  accessibilityRole="button"
                  accessibilityLabel="Rewind 10 seconds"
                  testID="player-rewind-button">
                  <Text style={styles.skipButtonText}>
                    {strings.playerControls.rewindButton}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.skipButton,
                    focusedButton === 'fastForward' && styles.skipButtonFocused,
                  ]}
                  onFocus={() => {
                    onInteraction?.();
                    setFocusedButton('fastForward');
                  }}
                  onBlur={() => setFocusedButton(null)}
                  onPress={handleFastForward}
                  accessibilityRole="button"
                  accessibilityLabel="Fast forward 10 seconds"
                  testID="player-fast-forward-button">
                  <Text style={styles.skipButtonText}>
                    {strings.playerControls.fastForwardButton}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isThumbnailType && (
              <View
                style={styles.thumbnailBadge}
                testID="player-thumbnails-badge">
                <Text style={styles.thumbnailBadgeText}>
                  {strings.playerControls.thumbnailBadge}
                </Text>
              </View>
            )}

            {/* Type Selector Pills */}
            <View style={styles.typeSelectorRow} testID="seekbar-type-selector">
              <Text style={styles.typeSelectorLabel}>Type:</Text>
              <TouchableOpacity
                style={[
                  styles.typePill,
                  type === 'markers' && styles.typePillActive,
                  focusedButton === 'type-markers' && styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-markers');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('markers');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Markers Seekbar"
                testID="type-pill-markers">
                <Text
                  style={[
                    styles.typePillText,
                    type === 'markers' && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.markers}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typePill,
                  type === 'break-markers' && styles.typePillActive,
                  focusedButton === 'type-break-markers' &&
                    styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-break-markers');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('break-markers');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Break Markers & Segments Seekbar"
                testID="type-pill-break-markers">
                <Text
                  style={[
                    styles.typePillText,
                    type === 'break-markers' && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.breakSegments}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typePill,
                  type === 'limits' && styles.typePillActive,
                  focusedButton === 'type-limits' && styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-limits');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('limits');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Seeking Limits Seekbar"
                testID="type-pill-limits">
                <Text
                  style={[
                    styles.typePillText,
                    type === 'limits' && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.limits}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typePill,
                  type === 'long-press' && styles.typePillActive,
                  focusedButton === 'type-long-press' && styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-long-press');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('long-press');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Long Press Seekbar"
                testID="type-pill-long-press">
                <Text
                  style={[
                    styles.typePillText,
                    type === 'long-press' && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.longPress}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typePill,
                  type === 'fast-forward-rewind' && styles.typePillActive,
                  focusedButton === 'type-fast-forward-rewind' &&
                    styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-fast-forward-rewind');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('fast-forward-rewind');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Fast Forward and Rewind Seekbar"
                testID="type-pill-fast-forward-rewind">
                <Text
                  style={[
                    styles.typePillText,
                    type === 'fast-forward-rewind' && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.fastForwardRewind}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typePill,
                  isThumbnailType && styles.typePillActive,
                  focusedButton === 'type-thumbnail-images' &&
                    styles.typePillFocused,
                ]}
                onFocus={() => {
                  onInteraction?.();
                  setFocusedButton('type-thumbnail-images');
                }}
                onBlur={() => setFocusedButton(null)}
                onPress={() => {
                  onInteraction?.();
                  onTypeChange?.('thumbnail-images');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Thumbnail Images Seekbar"
                testID="type-pill-thumbnail-images">
                <Text
                  style={[
                    styles.typePillText,
                    isThumbnailType && styles.typePillTextActive,
                  ]}>
                  {strings.playerControls.thumbnails}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Main Vega SeekBar implementation according to active type */}
      <View style={styles.seekbarWrapper} testID="vega-seekbar-wrapper">
        {isLive ? (
          <SeekBar
            currentValue={100}
            totalValue={100}
            step={1}
            barStyle={styles.liveBar}
            thumbIcon={LiveThumbIcon}
            onPress={handleOnPlayPause}
            onPlayPause={handleOnPlayPause}
            disabled={true}
            partialDisablingConfiguration={{
              skipBackward: true,
              skipForward: true,
              left: true,
              right: true,
              select: true,
            }}
            currentValueIndicatorColor={colors.heroAccent}
            disabledWhenNotFocused={false}
            disableThumbnail={true}
            trapFocus={false}
          />
        ) : (
          <>
            {type === 'markers' && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                barStyle={styles.markersBar}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                timeShiftIndicatorStyle={styles.seekbarTrackTimeshiftPart}
                currentValueIndicatorColor={'transparent'}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                trapFocus={false}
                markers={[
                  {
                    position: selectedProgress,
                    node: (
                      <Image
                        source={ARROW_IMG}
                        resizeMode="contain"
                        style={styles.savedDelayArrow}
                        key="markers-arrow"
                      />
                    ),
                  },
                  ...ticks,
                ]}
              />
            )}

            {type === 'break-markers' && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                trapFocus={false}
                markers={dynamicPointMarkers}
                currentValueIndicatorColor={(focused: boolean) =>
                  focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.GREY
                }
                segmentColors={segmentColors}
                enableAnimations={true}
              />
            )}

            {type === 'limits' && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                trapFocus={false}
                lowerSeekLimit={lowerSeekLimit}
                upperSeekLimit={upperSeekLimit}
                markers={limitMarkers}
                currentValueIndicatorColor={(focused: boolean) =>
                  focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.WHITE
                }
              />
            )}

            {type === 'long-press' && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                currentValueIndicatorColor={(focused: boolean) =>
                  focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.WHITE
                }
                displayAboveThumb={LongPressAboveThumb}
                enableLongPressAcceleration={true}
                stepMultiplierFactor={2}
                stepMultiplierFactorInterval={1000}
                longPressIntervalDuration={200}
                longPressDelay={1000}
                maxStepValue={80}
                trapFocus={false}
                enableAnimations={true}
              />
            )}

            {type === 'fast-forward-rewind' && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                onFastForwardPress={handleFastForward}
                onRewindPress={handleRewind}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                currentValueIndicatorColor={(focused: boolean) =>
                  focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.WHITE
                }
                displayAboveThumb={FastForwardRewindAboveThumb}
                enableSkipForwardBackwardAcceleration={true}
                stepMultiplierFactor={1}
                stepMultiplierFactorInterval={1000}
                longPressIntervalDuration={200}
                longPressDelay={1000}
                maxStepValue={50}
                trapFocus={false}
                enableAnimations={true}
              />
            )}

            {isThumbnailType && (
              <SeekBar
                currentValue={effectiveCurrentTime}
                totalValue={safeDuration}
                step={stepValue}
                thumbIcon={ThumbIcon}
                onPress={handleOnPress}
                onPlayPause={handleOnPlayPause}
                onValueChange={handleOnValueChange}
                onSlidingStart={handleOnSlidingStart}
                onSlidingEnd={handleOnSlidingEnd}
                onSeekInteractionChange={handleSeekInteractionChange}
                disabledWhenNotFocused={false}
                disableThumbnail={isLive ? true : !enableThumbnails}
                thumbnailImageSource={effectiveThumbnailSource}
                thumbnailLabel={effectiveThumbnailLabel}
                displayAboveThumb={ThumbnailAboveThumb}
                displayBelowThumb={ThumbnailBelowThumb}
                currentValueIndicatorColor={(focused: boolean) =>
                  focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.WHITE
                }
                trapFocus={false}
                enableAnimations={true}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default PlayerSeekBar;
