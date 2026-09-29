import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ColorValue,
  Image,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {colors} from '../../../theme/colors';
import {fontSizes, fontWeights} from '../../../theme/fonts';
import {borderRadius, spacing} from '../../../theme/sizes';
import {
  formatEPGTime,
  getCurrentEPGSlotTimeMs,
  isProgramLive,
  SLOT_MINUTES,
  SLOT_WIDTH,
} from '../utils/epgTimeUtils';

export interface Channel {
  id: string;
  displayName: string;
  groupId?: string;
  groupName?: string;
  logoUrl: string;
  programs: Program[];
  extras?: any;
  isFavorite?: boolean;
}

export interface Program {
  programId: string;
  title: string;
  startTime: number;
  endTime: number;
  shortDescription?: string;
  extras?: any;
}

export interface EPGScrollEvent {
  timeMs: number;
  row: number;
  stationIds?: string[];
}

export interface EPGInteractionEvent<Payload> {
  title: string;
  payload: Payload;
}

export interface EPGFocusEventPayload<C = Channel, P = Program> {
  program: P;
  channel: C;
  nextProgramTitle?: string;
}

export interface EPGPressEventPayload<C = Channel, P = Program> {
  program: P;
  channel: C;
  rowIndex?: number;
}

export interface EPGMenuEventPayload<C = Channel, P = Program> {
  program: P;
  channel: C;
}

export interface EPGFocusEscapeEvent {
  row: number;
}

export type EPGTileFocusEvent<P = Program> = EPGInteractionEvent<
  EPGFocusEventPayload<Channel, P>
>;
export type EPGTilePressEvent<C = Channel, P = Program> = EPGInteractionEvent<
  EPGPressEventPayload<C, P>
>;
export type EPGMenuEvent<C = Channel, P = Program> = EPGInteractionEvent<
  EPGMenuEventPayload<C, P>
>;

export interface FocusBorderProps {
  enabled: boolean;
  color?: ColorValue;
}

export interface OverlayProps {
  enabled: boolean;
  pendingColor?: ColorValue;
  elapsedColor?: ColorValue;
}

export interface TileProps {
  foregroundColor?: ColorValue;
  backgroundColor?: ColorValue;
  focusedForegroundColor?: ColorValue;
  pendingBackgroundColor?: ColorValue;
  elapsedBackgroundColor?: ColorValue;
  rowHeight?: number;
  fontSize?: number;
  boldFocusedTitle?: boolean;
  borderRadius?: number;
  tileSpacing?: number;
  fontFamilyPrimary?: string;
  fontFamilySecondary?: string;
}

export interface LogoProps {
  width?: number;
  backgroundColor?: ColorValue;
  highlightColor?: ColorValue;
}

export interface PageInfo {
  prepend?: boolean;
  startTimeMs?: number;
  endTimeMs?: number;
}

export interface KeplerEPGProps<
  C extends Channel = Channel,
  P extends Program = Program,
> extends ViewProps {
  onScroll?: (event: EPGScrollEvent) => void;
  onTileFocus: (event: EPGTileFocusEvent<P>) => void;
  onTilePress: (event: EPGTilePressEvent<C, P>) => void;
  onMenu?: (event: EPGMenuEvent<C, P>) => void;
  onMetricEmit?: (event: any) => void;
  onFocusEscapeUp?: (event: EPGFocusEscapeEvent) => void;
  features?: object[];
  focusBorder?: FocusBorderProps;
  tileStyle?: TileProps;
  logoStyle?: LogoProps;
  overlayStyle?: OverlayProps;
  tileLayout?: 'standard' | 'expanded';
  timeRange?: {
    startTimeMs?: number;
    initialPosition?: number;
  };
  localizedStrings?: {
    loadingText?: string;
    unavailableText?: string;
  };
}

export interface KeplerEPGRef {
  updateData(channelData: Channel[], page?: PageInfo): void;
  resetData(channelData: Channel[], page?: PageInfo): void;
  resetViewport(): void;
  updateGridStartTime(gridStartTimeMs: number, timelinePosition?: number): void;
  presetChannelContainer(totalChannelCount: number, initialRowIndex: number): void;
  updateFavorite(
    uniqueId: string,
    favorite: boolean,
    groupLabel?: string,
  ): void;
  focusOnEPG(isFocus: boolean): void;
}

export type EPGActions = KeplerEPGRef;

const PX_PER_MIN = SLOT_WIDTH / SLOT_MINUTES; // 150 / 30 = 5 px/min
const DEFAULT_ROW_HEIGHT = 50;
const DEFAULT_LOGO_WIDTH = 110;
const DEFAULT_TILE_SPACING = spacing.xs;
const HEADER_HEIGHT = 32;

interface Segment {
  key: string;
  isUnavailable: boolean;
  program?: Program;
  width: number;
  segIndex: number;
}

const EPGComponent = forwardRef<KeplerEPGRef, KeplerEPGProps>((props, ref) => {
  const {
    onScroll,
    onTileFocus,
    onTilePress,
    onMenu,
    onFocusEscapeUp,
    focusBorder,
    tileStyle,
    logoStyle,
    overlayStyle,
    timeRange,
    localizedStrings,
    style,
  } = props;

  const rowHeight = tileStyle?.rowHeight ?? DEFAULT_ROW_HEIGHT;
  const logoWidth = logoStyle?.width ?? DEFAULT_LOGO_WIDTH;
  const tileSpacing = tileStyle?.tileSpacing ?? DEFAULT_TILE_SPACING;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [gridStartTime, setGridStartTime] = useState<number>(() => {
    return timeRange?.startTimeMs ?? getCurrentEPGSlotTimeMs();
  });
  const [isEpgFocused, setIsEpgFocused] = useState<boolean>(true);
  const [focusedRow, setFocusedRow] = useState<number>(0);
  const [focusedCol, setFocusedCol] = useState<number>(0);

  const isEpgFocusedRef = useRef(isEpgFocused);
  isEpgFocusedRef.current = isEpgFocused;

  const focusedRowRef = useRef(focusedRow);
  focusedRowRef.current = focusedRow;

  const focusedColRef = useRef(focusedCol);
  focusedColRef.current = focusedCol;

  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);
  const headerScrollRef = useRef<ScrollView>(null);
  const tileRefs = useRef<Record<string, any>>({});

  const slotDurationMs = SLOT_MINUTES * 60000;
  const timelineStartMs = useMemo(() => {
    return Math.floor(gridStartTime / slotDurationMs) * slotDurationMs;
  }, [gridStartTime, slotDurationMs]);

  // Determine timeline span (at least 12 slots = 6 hours)
  const totalSlots = useMemo(() => {
    let maxEnd = timelineStartMs + 12 * slotDurationMs;
    for (const ch of channels) {
      for (const p of ch.programs || []) {
        if (p.endTime > maxEnd) {
          maxEnd = p.endTime;
        }
      }
    }
    const neededSlots = Math.ceil((maxEnd - timelineStartMs) / slotDurationMs);
    return Math.max(12, Math.min(36, neededSlots + 1));
  }, [channels, timelineStartMs, slotDurationMs]);

  const totalTimelineWidth = totalSlots * SLOT_WIDTH;

  const timelineSlots = useMemo(() => {
    return Array.from({length: totalSlots}, (_, index) => {
      const timeMs = timelineStartMs + index * slotDurationMs;
      return {
        timeMs,
        label: formatEPGTime(new Date(timeMs).toISOString()),
      };
    });
  }, [totalSlots, timelineStartMs, slotDurationMs]);

  // Compute row segments for all channels
  const channelSegments = useMemo(() => {
    return channels.map((channel) => {
      const segments: Segment[] = [];
      const progs = [...(channel.programs || [])]
        .filter((p) => p.endTime > timelineStartMs)
        .sort((a, b) => a.startTime - b.startTime);

      let cursorTime = timelineStartMs;
      let segIndex = 0;

      for (const prog of progs) {
        if (prog.startTime > cursorTime) {
          const gapMin = (prog.startTime - cursorTime) / 60000;
          const gapWidth = gapMin * PX_PER_MIN;
          if (gapWidth > 5) {
            segments.push({
              key: `${channel.id}-gap-${segIndex}`,
              isUnavailable: true,
              width: gapWidth - tileSpacing,
              segIndex,
            });
            segIndex++;
          }
          cursorTime = prog.startTime;
        }

        const effectiveStart = Math.max(prog.startTime, cursorTime);
        const effectiveEnd = prog.endTime;
        if (effectiveEnd > effectiveStart) {
          const durMin = (effectiveEnd - effectiveStart) / 60000;
          const progWidth = Math.max(durMin * PX_PER_MIN - tileSpacing, 30);
          segments.push({
            key: `${channel.id}-${prog.programId || segIndex}`,
            isUnavailable: false,
            program: prog,
            width: progWidth,
            segIndex,
          });
          segIndex++;
          cursorTime = effectiveEnd;
        }
      }

      const timelineEndMs = timelineStartMs + totalSlots * slotDurationMs;
      if (cursorTime < timelineEndMs) {
        const remMin = (timelineEndMs - cursorTime) / 60000;
        if (remMin > 1) {
          segments.push({
            key: `${channel.id}-gap-end`,
            isUnavailable: true,
            width: remMin * PX_PER_MIN - tileSpacing,
            segIndex,
          });
        }
      }

      return segments;
    });
  }, [channels, timelineStartMs, totalSlots, slotDurationMs, tileSpacing]);

  // Current focused program and channel for event dispatch
  const currentFocusedInfo = useMemo(() => {
    const channel = channels[focusedRow];
    if (!channel) {
      return null;
    }
    const segs = channelSegments[focusedRow];
    const seg = segs?.[focusedCol];
    return {
      channel,
      program: seg?.program,
      seg,
    };
  }, [channels, channelSegments, focusedRow, focusedCol]);

  const currentInfoRef = useRef(currentFocusedInfo);
  currentInfoRef.current = currentFocusedInfo;

  const handleTileFocus = useCallback(
    (
      rIdx: number,
      cIdx: number,
      program: Program | undefined,
      channel: Channel,
      nextProgramTitle?: string,
    ) => {
      setFocusedRow(rIdx);
      setFocusedCol(cIdx);
      setIsEpgFocused(true);

      if (program) {
        onTileFocus({
          title: program.title,
          payload: {
            program,
            channel,
            nextProgramTitle,
          },
        });
      }

      if (rIdx >= channelsRef.current.length - 2) {
        onScroll?.({
          row: rIdx,
          timeMs: program?.startTime ?? Date.now(),
        });
      }
    },
    [onTileFocus, onScroll],
  );

  const handleTilePress = useCallback(
    (
      rIdx: number,
      program: Program | undefined,
      channel: Channel,
    ) => {
      if (program) {
        onTilePress({
          title: program.title,
          payload: {
            program,
            channel,
            rowIndex: rIdx,
          },
        });
      }
    },
    [onTilePress],
  );

  // TV remote navigation event listener
  useTVEventHandler(
    useCallback(
      (evt: any) => {
        if (!isEpgFocusedRef.current) {
          return;
        }

        // On Kepler, 0 is key down, 1 is key up
        if (evt.eventKeyAction !== undefined && evt.eventKeyAction !== 0) {
          return;
        }

        const r = focusedRowRef.current;
        const c = focusedColRef.current;
        const currentChannel = channelsRef.current[r];
        const currentProgram = currentInfoRef.current?.program;

        if (evt.eventType === 'left') {
          if (c === 0) {
            onMenu?.({
              title: currentProgram?.title || '',
              payload: {
                program: currentProgram || ({} as Program),
                channel: currentChannel || ({} as Channel),
              },
            });
          }
        } else if (evt.eventType === 'up') {
          if (r === 0) {
            onFocusEscapeUp?.({row: 0});
          }
        } else if (evt.eventType === 'menu') {
          onMenu?.({
            title: currentProgram?.title || '',
            payload: {
              program: currentProgram || ({} as Program),
              channel: currentChannel || ({} as Channel),
            },
          });
        }
      },
      [onMenu, onFocusEscapeUp],
    ),
  );

  useImperativeHandle(
    ref,
    () => ({
      updateData: (channelData: Channel[], page?: PageInfo) => {
        setChannels((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const ch of channelData) {
            map.set(ch.id, ch);
          }
          return Array.from(map.values());
        });
        if (page?.startTimeMs) {
          setGridStartTime(page.startTimeMs);
        }
      },
      resetData: (channelData: Channel[], page?: PageInfo) => {
        setChannels(channelData);
        if (page?.startTimeMs) {
          setGridStartTime(page.startTimeMs);
        }
        setFocusedRow(0);
        setFocusedCol(0);
      },
      resetViewport: () => {
        horizontalScrollRef.current?.scrollTo({x: 0, animated: true});
        verticalScrollRef.current?.scrollTo({y: 0, animated: true});
        headerScrollRef.current?.scrollTo({x: 0, animated: true});
        setFocusedRow(0);
        setFocusedCol(0);
      },
      updateGridStartTime: (
        gridStartTimeMs: number,
        timelinePosition?: number,
      ) => {
        setGridStartTime(gridStartTimeMs);
        if (typeof timelinePosition === 'number') {
          const offsetMin = (timelinePosition - gridStartTimeMs) / 60000;
          if (offsetMin > 0) {
            horizontalScrollRef.current?.scrollTo({
              x: offsetMin * PX_PER_MIN,
              animated: true,
            });
            headerScrollRef.current?.scrollTo({
              x: offsetMin * PX_PER_MIN,
              animated: true,
            });
          }
        }
      },
      presetChannelContainer: () => {},
      updateFavorite: () => {},
      focusOnEPG: (isFocus: boolean) => {
        setIsEpgFocused(isFocus);
        if (isFocus) {
          const key = `${focusedRowRef.current}-${focusedColRef.current}`;
          const target = tileRefs.current[key] || tileRefs.current['0-0'];
          if (target && typeof target.requestTVFocus === 'function') {
            target.requestTVFocus();
          } else if (target && typeof target.focus === 'function') {
            target.focus();
          }
        }
      },
    }),
    [],
  );

  const now = new Date();

  return (
    <View style={[styles.container, style]}>
      {/* Pinned Top Timeline Ruler */}
      <View style={styles.rulerRow}>
        <View
          style={[
            styles.cornerBox,
            {
              width: logoWidth,
              height: HEADER_HEIGHT,
              backgroundColor:
                logoStyle?.backgroundColor || colors.cardBackground,
            },
          ]}>
          <Text style={styles.cornerText}>CHANNELS</Text>
        </View>
        <ScrollView
          ref={headerScrollRef}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.headerScroll}>
          <View style={[styles.rulerContainer, {width: totalTimelineWidth}]}>
            {timelineSlots.map((slot) => (
              <View
                key={slot.timeMs}
                style={[styles.slotItem, {width: SLOT_WIDTH}]}>
                <Text style={styles.slotText}>{slot.label}</Text>
                <View style={styles.slotTick} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main Grid: Left Logos Column + Right Program Rows */}
      <ScrollView
        ref={verticalScrollRef}
        style={styles.bodyScroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.bodyRow}>
          {/* Channel Logos Column */}
          <View style={[styles.logosColumn, {width: logoWidth}]}>
            {channels.map((channel) => (
              <View
                key={channel.id}
                style={[
                  styles.logoCell,
                  {
                    height: rowHeight,
                    marginBottom: tileSpacing,
                    backgroundColor:
                      logoStyle?.backgroundColor || colors.cardBackground,
                  },
                ]}>
                {channel.logoUrl ? (
                  <Image
                    source={{uri: channel.logoUrl}}
                    style={styles.channelLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.channelName} numberOfLines={2}>
                    {channel.displayName}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Program Tiles Horizontal Scroll */}
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              headerScrollRef.current?.scrollTo({
                x: e.nativeEvent.contentOffset.x,
                animated: false,
              });
            }}
            style={styles.programsScroll}>
            <TVFocusGuideView
              autoFocus
              trapFocusLeft={false}
              trapFocusUp={false}
              style={{width: totalTimelineWidth}}>
              {channels.map((channel, rIdx) => {
                const segments = channelSegments[rIdx] || [];
                return (
                  <View
                    key={channel.id}
                    style={[
                      styles.channelProgramRow,
                      {
                        height: rowHeight,
                        marginBottom: tileSpacing,
                      },
                    ]}>
                    {segments.map((seg, cIdx) => {
                      const isFocused =
                        isEpgFocused &&
                        focusedRow === rIdx &&
                        focusedCol === cIdx;
                      const prog = seg.program;
                      const nextProg = segments[cIdx + 1]?.program;
                      const isLive = prog ? isProgramLive(prog as any, now) : false;

                      if (seg.isUnavailable || !prog) {
                        return (
                          <View
                            key={seg.key}
                            style={[
                              styles.unavailableTile,
                              {
                                width: seg.width,
                                height: rowHeight,
                                marginRight: tileSpacing,
                                borderRadius:
                                  tileStyle?.borderRadius ?? borderRadius.sm,
                              },
                            ]}>
                            <Text
                              style={styles.unavailableText}
                              numberOfLines={1}>
                              {localizedStrings?.unavailableText ||
                                'No program information'}
                            </Text>
                          </View>
                        );
                      }

                      // Calculate progress for live program
                      let progressPercent = 0;
                      if (isLive && prog.endTime > prog.startTime) {
                        const elapsed = now.getTime() - prog.startTime;
                        const duration = prog.endTime - prog.startTime;
                        progressPercent = Math.min(
                          Math.max((elapsed / duration) * 100, 0),
                          100,
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={seg.key}
                          ref={(r) => {
                            tileRefs.current[`${rIdx}-${cIdx}`] = r;
                          }}
                          activeOpacity={0.85}
                          hasTVPreferredFocus={isFocused}
                          onFocus={() =>
                            handleTileFocus(
                              rIdx,
                              cIdx,
                              prog,
                              channel,
                              nextProg?.title,
                            )
                          }
                          onPress={() =>
                            handleTilePress(rIdx, prog, channel)
                          }
                          style={[
                            styles.programTile,
                            {
                              width: seg.width,
                              height: rowHeight,
                              marginRight: tileSpacing,
                              borderRadius:
                                tileStyle?.borderRadius ?? borderRadius.sm,
                              borderWidth: isFocused ? 2 : 1,
                              borderColor:
                                isFocused && focusBorder?.enabled !== false
                                  ? (focusBorder?.color as string) ||
                                    colors.focusRing
                                  : colors.cardBorder,
                              backgroundColor: isFocused
                                ? colors.cardBackgroundSubtle
                                : isLive
                                ? (tileStyle?.elapsedBackgroundColor as string) ||
                                  colors.cardBackground
                                : (tileStyle?.backgroundColor as string) ||
                                  colors.darkCardBackground,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${channel.displayName}, ${prog.title}`}>
                          <View style={styles.tileHeader}>
                            <Text
                              style={[
                                styles.tileTitle,
                                {
                                  fontSize:
                                    tileStyle?.fontSize ?? fontSizes.cardTitle,
                                  fontWeight:
                                    isFocused && tileStyle?.boldFocusedTitle
                                      ? fontWeights.bold
                                      : fontWeights.semibold,
                                  color: isFocused
                                    ? (tileStyle?.focusedForegroundColor as string) ||
                                      colors.textPrimary
                                    : (tileStyle?.foregroundColor as string) ||
                                      colors.textPrimary,
                                },
                              ]}
                              numberOfLines={1}>
                              {prog.title}
                            </Text>
                            {isLive && (
                              <View style={styles.liveIndicator}>
                                <Text style={styles.liveIndicatorText}>
                                  ● LIVE
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.tileTime} numberOfLines={1}>
                            {formatEPGTime(
                              new Date(prog.startTime).toISOString(),
                            )}{' '}
                            -{' '}
                            {formatEPGTime(
                              new Date(prog.endTime).toISOString(),
                            )}
                          </Text>
                          {isLive && overlayStyle?.enabled && (
                            <View style={styles.progressContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${progressPercent}%`,
                                    backgroundColor:
                                      (overlayStyle.elapsedColor as string) ||
                                      colors.heroAccent,
                                  },
                                ]}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </TVFocusGuideView>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
});

EPGComponent.displayName = 'EPG';

export const EPG = EPGComponent;
export const KeplerEPG = EPGComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  rulerRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  cornerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  cornerText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  headerScroll: {
    flex: 1,
  },
  rulerContainer: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
  },
  slotItem: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorderLight,
    position: 'relative',
  },
  slotText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  slotTick: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 1,
    height: 6,
    backgroundColor: colors.cardBorder,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyRow: {
    flexDirection: 'row',
  },
  logosColumn: {
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  logoCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  channelLogo: {
    width: '85%',
    height: '75%',
  },
  channelName: {
    color: colors.textPrimary,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  programsScroll: {
    flex: 1,
  },
  channelProgramRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programTile: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileTitle: {
    flex: 1,
  },
  liveIndicator: {
    marginLeft: spacing.xs,
  },
  liveIndicatorText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  tileTime: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.progressTrack,
  },
  progressBar: {
    height: 3,
  },
  unavailableTile: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.darkCardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorderLight,
    borderStyle: 'dashed',
  },
  unavailableText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
