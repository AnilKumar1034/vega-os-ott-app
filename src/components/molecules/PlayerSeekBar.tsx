import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {
  SeekBar,
  SegmentColorsConfig,
} from '@amazon-devices/kepler-ui-components/dist/src/components/SeekBar';
import {BreakMarker} from '@amazon-devices/kepler-ui-components/dist/src/components/ProgressBar';
import {SEEKBAR_COLORS} from '../../constants/seekbarColors';
import {circleStyle, styles} from './PlayerSeekBar.styles';
import { strings } from '../../constants/strings';

export type SeekbarType = 'markers' | 'break-markers' | 'limits';

export interface PlayerSeekBarProps {
  type: SeekbarType;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  onSeek: (timeInSeconds: number) => void;
  onTogglePlayPause?: () => void;
  onTypeChange?: (newType: SeekbarType) => void;
  onInteraction?: () => void;
  testID?: string;
}

const ARROW_IMG = require('../../assets/arrow_up.png');

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
  onSeek,
  onTogglePlayPause,
  onTypeChange,
  onInteraction,
  testID = 'player-seekbar-container',
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
  const [focusedButton, setFocusedButton] = useState<string | null>(null);

  // 1. Markers State: Dynamic arrow position indicator
  const [selectedProgress, setSelectedProgress] = useState<number>(
    safeCurrentTime + 0.001,
  );

  useEffect(() => {
    if (!isScrubbing) {
      setScrubPosition(safeCurrentTime);
    }
  }, [isScrubbing, safeCurrentTime]);

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
      onInteraction?.();
      setIsScrubbing(true);
      setScrubPosition(val);
    },
    [onInteraction],
  );

  const handleOnPress = useCallback(
    (val: number) => {
      onInteraction?.();
      setIsScrubbing(false);
      setScrubPosition(val);
      setSelectedProgress(val + 0.001);
      onSeek(val);
    },
    [onInteraction, onSeek],
  );

  const handleOnPlayPause = useCallback(
    (val: number) => {
      onInteraction?.();
      if (onTogglePlayPause) {
        onTogglePlayPause();
      } else {
        handleOnPress(val);
      }
    },
    [handleOnPress, onInteraction, onTogglePlayPause],
  );

  const handleOnSlidingStart = useCallback(() => {
    onInteraction?.();
    setIsScrubbing(true);
  }, [onInteraction]);

  const handleOnSlidingEnd = useCallback(() => {
    onInteraction?.();
    setIsScrubbing(false);
    onSeek(scrubPosition);
  }, [onInteraction, onSeek, scrubPosition]);

  const stepValue = Math.max(1, Math.round(safeDuration / 60));

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
              {isPaused ? strings.playerControls.pauseAction : strings.playerControls.playAction}
            </Text>
          </TouchableOpacity>

          <Text style={styles.timeText} testID="player-time-display">
            {formatTime(scrubPosition)} / {formatTime(safeDuration)}
          </Text>
        </View>

        {/* Dynamic Center Extra Controls based on active type */}
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
                <Text style={styles.actionButtonText}>{strings.playerControls.removeMarker}</Text>
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
                <Text style={styles.actionButtonText}>{strings.playerControls.addMarker}</Text>
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
                ⇥ Limits ⇤
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Vega SeekBar implementation according to active type */}
      <View style={styles.seekbarWrapper} testID="vega-seekbar-wrapper">
        {type === 'markers' && (
          <SeekBar
            currentValue={scrubPosition}
            totalValue={safeDuration}
            step={stepValue}
            barStyle={styles.markersBar}
            thumbIcon={ThumbIcon}
            onPress={handleOnPress}
            onPlayPause={handleOnPlayPause}
            onValueChange={handleOnValueChange}
            onSlidingStart={handleOnSlidingStart}
            onSlidingEnd={handleOnSlidingEnd}
            timeShiftIndicatorStyle={styles.seekbarTrackTimeshiftPart}
            currentValueIndicatorColor={'transparent'}
            disabledWhenNotFocused={false}
            disableThumbnail={true}
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
            currentValue={scrubPosition}
            totalValue={safeDuration}
            step={stepValue}
            thumbIcon={ThumbIcon}
            onPress={handleOnPress}
            onPlayPause={handleOnPlayPause}
            onValueChange={handleOnValueChange}
            onSlidingStart={handleOnSlidingStart}
            onSlidingEnd={handleOnSlidingEnd}
            disabledWhenNotFocused={false}
            disableThumbnail={true}
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
            currentValue={scrubPosition}
            totalValue={safeDuration}
            step={stepValue}
            thumbIcon={ThumbIcon}
            onPress={handleOnPress}
            onPlayPause={handleOnPlayPause}
            onValueChange={handleOnValueChange}
            onSlidingStart={handleOnSlidingStart}
            onSlidingEnd={handleOnSlidingEnd}
            disabledWhenNotFocused={false}
            disableThumbnail={true}
            trapFocus={false}
            lowerSeekLimit={lowerSeekLimit}
            upperSeekLimit={upperSeekLimit}
            markers={limitMarkers}
            currentValueIndicatorColor={(focused: boolean) =>
              focused ? SEEKBAR_COLORS.PRIMARY_BLUE : SEEKBAR_COLORS.WHITE
            }
          />
        )}
      </View>
    </View>
  );
};

export default PlayerSeekBar;
