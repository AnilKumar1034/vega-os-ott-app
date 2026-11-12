import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  ActivityIndicator,
  BackHandler,
  Image,
  ImageBackground,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  I18nManager,
  Pressable,
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {EPG, type EPGActions} from '../components/EPG';
import {CommonHeader} from '../../../components/molecules/CommonHeader';
import {SideMenu} from '../../../components/molecules/SideMenu';
import {analyticsService} from '../../../analytics';
import {Routes} from '../../../constants/routes';
import {strings} from '../../../constants/strings';
import {colors} from '../../../theme/colors';
import {deeplinkManager} from '../../../utils/deeplink';
import {fontSizes} from '../../../theme/fonts';
import {borderRadius, spacing} from '../../../theme/sizes';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../../utils/inputUtils';
import {
  EPG_END_TIME,
  epgPrograms,
  vegaEPGChannelData,
} from '../data/epgMockData';
import {getFreeLiveEPGData} from '../data/freeLiveChannels';
import {EPGProgram} from '../models/EPGProgram';
import {LiveChannelDrmConfig} from '../models/LiveChannel';
import {fetchLogixTVEPGPage} from '../services/logixTVEPGService';
import {
  formatEPGTime,
  getCurrentEPGSlotTimeMs,
  isProgramFuture,
  isProgramLive,
  isProgramPast,
} from '../utils/epgTimeUtils';
import {styles} from './LiveTVScreen.styles';

const epgFocusBorder = {enabled: true, color: colors.focusRing};
const EPG_TIMEZONE = 'Asia/Kolkata';
const EPG_INITIAL_CHANNEL_COUNT = 8;
const EPG_CHANNEL_PAGE_SIZE = 5;
const freeLiveCategories = [
  strings.liveTV.allCategories,
  strings.liveTV.categoryNews,
  strings.liveTV.categoryEntertainment,
  strings.liveTV.categorySports,
  strings.liveTV.categoryMovies,
  strings.liveTV.categoryKids,
  strings.liveTV.categoryCulture,
  strings.liveTV.categoryRegional,
  strings.liveTV.categoryDocumentary,
];
const categoryMenuOptions = [
  'all',
  'free',
  ...freeLiveCategories,
];
const epgLogoStyle = {backgroundColor: colors.cardBackground, width: 110};
const epgOverlayStyle = {
  enabled: true,
  elapsedColor: colors.heroAccent,
  pendingColor: colors.darkCardBackground,
};
const epgTileStyle = {
  backgroundColor: colors.darkCardBackground,
  foregroundColor: colors.textPrimary,
  focusedForegroundColor: colors.textPrimary,
  elapsedBackgroundColor: colors.cardBackground,
  pendingBackgroundColor: colors.darkCardBackground,
  rowHeight: 50,
  fontSize: fontSizes.cardTitle,
  boldFocusedTitle: true,
  borderRadius: borderRadius.sm,
  tileSpacing: spacing.xs,
};
type TVFocusable = {
  requestTVFocus?: () => void;
  focus?: () => void;
};

export const LiveTVScreen = () => {
  const navigation = useNavigation<any>();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [showFreeLiveOnly, setShowFreeLiveOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    strings.liveTV.allCategories,
  );
  const [isCategoryMenuVisible, setIsCategoryMenuVisible] = useState(false);
  const [menuFocusVersion, setMenuFocusVersion] = useState(0);
  const [programmeAlert, setProgrammeAlert] = useState<
    'future' | 'past' | 'playbackUnavailable' | null
  >(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    deeplinkManager.onDestinationOpened('live_tv').catch(() => {});
  }, []);

  const [isEPGReady, setIsEPGReady] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [hasNoFreeLiveChannels, setHasNoFreeLiveChannels] = useState(false);
  const [focusedCategoryOption, setFocusedCategoryOption] = useState<string | null>(null);
  const focusedCategoryOptionRef = useRef(focusedCategoryOption);
  focusedCategoryOptionRef.current = focusedCategoryOption;
  const [isEmptyButtonFocused, setIsEmptyButtonFocused] = useState(false);
  const isEmptyButtonFocusedRef = useRef(isEmptyButtonFocused);
  isEmptyButtonFocusedRef.current = isEmptyButtonFocused;
  const [isFilterPreferred, setIsFilterPreferred] = useState(false);
  const isFilterPreferredRef = useRef(isFilterPreferred);
  isFilterPreferredRef.current = isFilterPreferred;
  const epgRef = useRef<EPGActions>(null);
  const epgOpacity = useRef(new Animated.Value(0)).current;
  const nextChannelOffsetRef = useRef(EPG_INITIAL_CHANNEL_COUNT);
  const isLoadingNextPageRef = useRef(false);
  const hasMoreChannelsRef = useRef(true);
  const gridStartTimeRef = useRef(getCurrentEPGSlotTimeMs());
  const categoryFilterFocusGuideRef = useRef<TVFocusable>(null);
  const [focusedProgram, setFocusedProgram] = useState<EPGProgram | null>(
    epgPrograms.find((program) => isProgramLive(program, now)) ||
      epgPrograms[0] ||
      null,
  );
  const [focusedNextProgramTitle, setFocusedNextProgramTitle] = useState<
    string | null
  >(vegaEPGChannelData[0]?.programs[1]?.title || null);

  const handleProgramFocus = useCallback(
    (program: EPGProgram, nextTitle?: string) => {
      setIsMenuExpanded(false);
      setFocusedProgram(program);
      setFocusedNextProgramTitle(nextTitle || null);
    },
    [],
  );

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    analyticsService
      .trackContentCategorySelected({
        category_name: category,
        source_screen: 'LiveTV',
        source_component: 'category_menu',
      })
      .catch(() => {});
  }, []);

  const handleProgramPress = useCallback(
    (
      program: EPGProgram,
      streamUrl?: string,
      streamType?: 'hls' | 'dash',
      isVideoOnly?: boolean,
      drm?: LiveChannelDrmConfig,
      channelId?: string,
      channelName?: string,
    ) => {
      handleProgramFocus(program);
      if (isProgramFuture(program)) {
        epgRef.current?.focusOnEPG(false);
        setProgrammeAlert('future');
        return;
      }

      if (isProgramPast(program)) {
        epgRef.current?.focusOnEPG(false);
        setProgrammeAlert('past');
        return;
      }

      if (!streamUrl) {
        epgRef.current?.focusOnEPG(false);
        setProgrammeAlert('playbackUnavailable');
        return;
      }

      const effectiveChannelId =
        channelId || program.channelId || `live-${program.id}`;

      try {
        analyticsService.trackLiveChannelSelected({
          channel_id: effectiveChannelId,
          channelId: effectiveChannelId,
          channel_name: channelName,
          channelName: channelName,
          selection_source: 'epg',
          selectionSource: 'epg',
        });
      } catch (err) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[LiveTVScreen] trackLiveChannelSelected failed:', err);
        }
      }

      analyticsService
        .trackContentSelected({
          content_id: effectiveChannelId,
          content_type: 'live_channel',
          content_title: channelName || program.title,
          source_screen: 'LiveTV',
          source_component: 'epg',
          destination_screen: 'VideoPlayer',
          action_name: 'play_content',
        })
        .catch(() => {});

      navigation.navigate(Routes.VideoPlayer, {
        videoUrl: streamUrl,
        isLive: true,
        streamType,
        isVideoOnly,
        drm,
        channelId: effectiveChannelId,
        channelName,
        selectionSource: 'epg',
        sourceScreen: 'LiveTV',
        movie: {
          id: `live-${program.id}`,
          title: program.title,
          description: program.description,
          genre: program.category,
          image: require('../../../assets/background.png'),
        },
      });
    },
    [handleProgramFocus, navigation],
  );

  const categoryOptionRefs = useRef<Record<string, any>>({});

  const focusCategoryOption = useCallback((option: string) => {
    setFocusedCategoryOption(option);
    focusedCategoryOptionRef.current = option;
    const target = categoryOptionRefs.current[option];
    if (target && typeof target.requestTVFocus === 'function') {
      target.requestTVFocus();
    } else if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }, []);

  const handleEPGMenu = useCallback(() => {
    epgRef.current?.focusOnEPG(false);
    setIsMenuExpanded(true);
    setMenuFocusVersion((version) => version + 1);
  }, []);

  const handleEPGFocusEscapeUp = useCallback(() => {
    setIsMenuExpanded(false);
    epgRef.current?.focusOnEPG(false);
    setIsFilterPreferred(true);
    categoryFilterFocusGuideRef.current?.requestTVFocus?.();
    setTimeout(() => {
      categoryFilterFocusGuideRef.current?.requestTVFocus?.();
    }, 50);
  }, []);

  const handleOpenFilterModal = useCallback(() => {
    setIsMenuExpanded(false);
    setIsFilterPreferred(false);
    epgRef.current?.focusOnEPG(false);
    setIsCategoryMenuVisible(true);
  }, []);

  const dismissCategoryMenu = useCallback(() => {
    setIsCategoryMenuVisible(false);
    setIsMenuExpanded(false);
    setTimeout(() => {
      epgRef.current?.focusOnEPG(true);
    }, 100);
  }, []);

  const applyCategorySelection = useCallback(
    (option: string) => {
      if (option === 'all') {
        setShowFreeLiveOnly(false);
        handleSelectCategory(strings.liveTV.allCategories);
        dismissCategoryMenu();
      } else if (option === 'free') {
        setShowFreeLiveOnly(true);
        analyticsService
          .trackContentCategorySelected({
            category_name: 'Free Channels',
            source_screen: 'LiveTV',
            source_component: 'category_menu',
          })
          .catch(() => {});
        dismissCategoryMenu();
      } else if (option) {
        setShowFreeLiveOnly(false);
        handleSelectCategory(option);
        dismissCategoryMenu();
      }
    },
    [dismissCategoryMenu, handleSelectCategory],
  );

  const dismissFutureProgrammeAlert = useCallback(() => {
    setProgrammeAlert(null);
    epgRef.current?.focusOnEPG(true);
  }, []);

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (programmeAlert) {
      if (isSelectEvent(type) || isBackEvent(type)) {
        dismissFutureProgrammeAlert();
      }
      return;
    }

    if (isCategoryMenuVisible) {
      if (isBackEvent(type)) {
        dismissCategoryMenu();
        return;
      }
      if (isSelectEvent(type)) {
        const option =
          focusedCategoryOptionRef.current ||
          (showFreeLiveOnly ? 'free' : selectedCategory);
        if (option) {
          applyCategorySelection(option);
        }
        return;
      }
      if (type === 'up') {
        const currentOption =
          focusedCategoryOptionRef.current ||
          (showFreeLiveOnly ? 'free' : selectedCategory);
        const currentIndex = categoryMenuOptions.indexOf(currentOption);
        if (currentIndex > 0) {
          focusCategoryOption(categoryMenuOptions[currentIndex - 1]);
        }
        return;
      }
      if (type === 'down') {
        const currentOption =
          focusedCategoryOptionRef.current ||
          (showFreeLiveOnly ? 'free' : selectedCategory);
        const currentIndex = categoryMenuOptions.indexOf(currentOption);
        if (
          currentIndex >= 0 &&
          currentIndex < categoryMenuOptions.length - 1
        ) {
          focusCategoryOption(categoryMenuOptions[currentIndex + 1]);
        }
        return;
      }
      if (type === 'left' || type === 'right') {
        return;
      }
    }

    if (hasNoFreeLiveChannels && isEPGReady) {
      if (isSelectEvent(type) && isEmptyButtonFocusedRef.current) {
        setShowFreeLiveOnly(false);
        handleSelectCategory(strings.liveTV.allCategories);
        return;
      }
      if (type === 'up' && isEmptyButtonFocusedRef.current) {
        setIsEmptyButtonFocused(false);
        setIsFilterPreferred(true);
        setTimeout(() => {
          categoryFilterFocusGuideRef.current?.requestTVFocus?.();
        }, 50);
        return;
      }
    }

    if (isBackEvent(type)) {
      if (isMenuExpanded) {
        setIsMenuExpanded(false);
        epgRef.current?.focusOnEPG(true);
      } else {
        navigation.navigate(Routes.Home);
      }
      return;
    }
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (programmeAlert) {
          dismissFutureProgrammeAlert();
          return true;
        }
        if (isCategoryMenuVisible) {
          dismissCategoryMenu();
          return true;
        }
        if (isMenuExpanded) {
          setIsMenuExpanded(false);
          epgRef.current?.focusOnEPG(true);
          return true;
        }
        navigation.navigate(Routes.Home);
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [
    programmeAlert,
    isCategoryMenuVisible,
    isMenuExpanded,
    dismissFutureProgrammeAlert,
    dismissCategoryMenu,
    navigation,
  ]);

  const alertTitle =
    programmeAlert === 'future'
      ? strings.liveTV.futureProgrammeTitle
      : programmeAlert === 'past'
      ? strings.liveTV.pastProgrammeTitle
      : strings.liveTV.playbackUnavailableTitle;
  const alertMessage =
    programmeAlert === 'future'
      ? strings.liveTV.futureProgrammeMessage
      : programmeAlert === 'past'
      ? strings.liveTV.pastProgrammeMessage
      : strings.liveTV.playbackUnavailableMessage;

  const loadNextChannelPage = useCallback(async () => {
    if (!hasMoreChannelsRef.current || isLoadingNextPageRef.current) {
      return;
    }

    isLoadingNextPageRef.current = true;
    setIsLoadingNextPage(true);
    try {
      const page = await fetchLogixTVEPGPage({
        offset: nextChannelOffsetRef.current,
        limit: EPG_CHANNEL_PAGE_SIZE,
        requiresStreamUrl: showFreeLiveOnly,
        category:
          selectedCategory === strings.liveTV.allCategories
            ? undefined
            : selectedCategory,
      });
      if (page.channels.length) {
        epgRef.current?.updateData(page.channels, {
          startTimeMs: gridStartTimeRef.current,
          endTimeMs: page.endTimeMs,
        });
      }
      nextChannelOffsetRef.current += EPG_CHANNEL_PAGE_SIZE;
      hasMoreChannelsRef.current = page.hasMore;
    } catch (error) {
      console.warn('Unable to load the next LogixTV channel page.', error);
    } finally {
      isLoadingNextPageRef.current = false;
      setIsLoadingNextPage(false);
    }
  }, [selectedCategory, showFreeLiveOnly]);

  useEffect(() => {
    try {
      I18nManager.setTimezone?.(EPG_TIMEZONE);
    } catch {
      // Ignore if setTimezone is not supported
    }
  }, []);

  useEffect(() => {
    const currentGridStartTime = getCurrentEPGSlotTimeMs();
    gridStartTimeRef.current = currentGridStartTime;
    nextChannelOffsetRef.current = EPG_INITIAL_CHANNEL_COUNT;
    hasMoreChannelsRef.current = true;
    setIsEPGReady(false);
    setHasNoFreeLiveChannels(false);
    epgOpacity.setValue(0);

    if (showFreeLiveOnly) {
      const freeLiveEPGData = getFreeLiveEPGData(
        selectedCategory === strings.liveTV.allCategories
          ? undefined
          : selectedCategory,
      );
      const firstFreeProgramme =
        freeLiveEPGData.channels[0]?.programs[0]?.extras?.sourceProgram || null;
      const nextFreeProgramme =
        freeLiveEPGData.channels[0]?.programs[1]?.title || null;

      hasMoreChannelsRef.current = false;
      setFocusedProgram(firstFreeProgramme);
      setFocusedNextProgramTitle(nextFreeProgramme);
      setHasNoFreeLiveChannels(!freeLiveEPGData.channels.length);
      if (freeLiveEPGData.channels.length) {
        epgRef.current?.resetData(freeLiveEPGData.channels, {
          startTimeMs: freeLiveEPGData.startTimeMs,
          endTimeMs: freeLiveEPGData.endTimeMs,
        });
        epgRef.current?.updateGridStartTime(
          currentGridStartTime,
          currentGridStartTime,
        );
      }
      setIsEPGReady(true);
      Animated.timing(epgOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    let isActive = true;
    const loadLogixTVEPGData = async () => {
      try {
        const realEPGData = await fetchLogixTVEPGPage({
          offset: 0,
          limit: EPG_INITIAL_CHANNEL_COUNT,
          requiresStreamUrl: showFreeLiveOnly,
          category:
            selectedCategory === strings.liveTV.allCategories
              ? undefined
              : selectedCategory,
        });
        if (!isActive) {
          return;
        }
        hasMoreChannelsRef.current = realEPGData.hasMore;
        const hasNoMatchingChannels = !realEPGData.channels.length;
        setHasNoFreeLiveChannels(hasNoMatchingChannels);

        // The native Vega EPG does not accept an empty data set. Keep its
        // current data mounted and cover it with the empty state instead.
        if (!hasNoMatchingChannels) {
          const firstProgramme =
            realEPGData.channels[0]?.programs[0]?.extras?.sourceProgram || null;
          const nextProgramme =
            realEPGData.channels[0]?.programs[1]?.title || null;
          if (firstProgramme) {
            setFocusedProgram(firstProgramme);
            setFocusedNextProgramTitle(nextProgramme);
          }
          epgRef.current?.resetData(realEPGData.channels, {
            startTimeMs: realEPGData.startTimeMs,
            endTimeMs: realEPGData.endTimeMs,
          });
          epgRef.current?.updateGridStartTime(
            currentGridStartTime,
            currentGridStartTime,
          );
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.warn(
          'Unable to load LogixTV EPG data. Using local sample data.',
          error,
        );
        const firstMockProg =
          epgPrograms.find((program) => isProgramLive(program, now)) ||
          epgPrograms[0] ||
          null;
        setFocusedProgram(firstMockProg);
        setFocusedNextProgramTitle(
          vegaEPGChannelData[0]?.programs[1]?.title || null,
        );
        epgRef.current?.resetData(vegaEPGChannelData, {
          startTimeMs: currentGridStartTime,
          endTimeMs: EPG_END_TIME,
        });
        epgRef.current?.updateGridStartTime(
          currentGridStartTime,
          currentGridStartTime,
        );
      }
      if (!isActive) {
        return;
      }
      setIsEPGReady(true);
      Animated.timing(epgOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    };

    loadLogixTVEPGData();
    return () => {
      isActive = false;
    };
  }, [epgOpacity, selectedCategory, showFreeLiveOnly]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date();
      const nextGridStartTime = getCurrentEPGSlotTimeMs(currentTime);

      setNow(currentTime);
      if (nextGridStartTime !== gridStartTimeRef.current) {
        gridStartTimeRef.current = nextGridStartTime;
        epgRef.current?.updateGridStartTime(
          nextGridStartTime,
          nextGridStartTime,
        );
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isCategoryMenuVisible) {
      setIsMenuExpanded(false);
      const initialOption = showFreeLiveOnly
        ? 'free'
        : selectedCategory && selectedCategory !== strings.liveTV.allCategories
        ? selectedCategory
        : 'all';
      focusCategoryOption(initialOption);
      const timer = setTimeout(() => {
        focusCategoryOption(initialOption);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [
    focusCategoryOption,
    isCategoryMenuVisible,
    selectedCategory,
    showFreeLiveOnly,
  ]);

  useEffect(() => {
    if (
      isEPGReady &&
      !isCategoryMenuVisible &&
      !isMenuExpanded &&
      !isFilterPreferredRef.current
    ) {
      const timer = setTimeout(() => {
        epgRef.current?.focusOnEPG(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEPGReady, isCategoryMenuVisible, isMenuExpanded]);

  return (
    <ImageBackground
      source={require('../../../assets/background.png')}
      style={styles.background}>
      <SideMenu
        key={`live-tv-menu-${menuFocusVersion}`}
        activeRoute={Routes.LiveTV}
        isExpanded={!isCategoryMenuVisible && isMenuExpanded}
        preferActiveFocus={!isCategoryMenuVisible && isMenuExpanded}
        onMenuFocus={() => {
          if (!isCategoryMenuVisible) {
            setIsMenuExpanded(true);
          }
        }}
        onMenuBlur={() => {
          setIsMenuExpanded(false);
          if (!isCategoryMenuVisible) {
            epgRef.current?.focusOnEPG(true);
          }
        }}
      />
      <View style={styles.content} testID="live-tv-screen">
        <CommonHeader
          title={strings.liveTV.headerTitle}
          logo={require('../../../assets/vega.png')}
          filterLabel={strings.liveTV.filters}
          filterFocusGuideRef={categoryFilterFocusGuideRef}
          filterHasTVPreferredFocus={isFilterPreferred}
          onFilterPress={handleOpenFilterModal}
          onFocusEscapeDown={() => {
            setIsFilterPreferred(false);
            setIsMenuExpanded(false);
            epgRef.current?.focusOnEPG(true);
          }}
          onFocusEscapeLeft={() => {
            setIsFilterPreferred(false);
            epgRef.current?.focusOnEPG(true);
          }}
        />
        <ProgramDetails
          program={focusedProgram}
          now={now}
          nextProgramTitle={focusedNextProgramTitle}
        />
        <Animated.View style={[styles.guide, {opacity: epgOpacity}]}>
          <EPG
            ref={epgRef}
            style={styles.epg}
            onTileFocus={(event) => {
              const program =
                event?.payload?.program?.extras?.sourceProgram;
              if (program) {
                handleProgramFocus(program, event?.payload?.nextProgramTitle);
              }
            }}
            onTilePress={(event) => {
              const progPayload = event?.payload?.program;
              const channelPayload = event?.payload?.channel;
              const program =
                progPayload?.extras?.sourceProgram ||
                (progPayload
                  ? {
                      id: progPayload.programId,
                      title: progPayload.title,
                      description: progPayload.shortDescription || '',
                      startTime: new Date(progPayload.startTime).toISOString(),
                      endTime: new Date(progPayload.endTime).toISOString(),
                      category: '',
                      channelId: channelPayload?.id || '',
                    }
                  : null);
              if (program) {
                const effectiveChannelId =
                  channelPayload?.id || program.channelId || '';
                const effectiveChannelName =
                  channelPayload?.displayName ||
                  (channelPayload as any)?.name;

                try {
                  analyticsService.trackEpgProgramSelected({
                    program_id: program.id,
                    programId: program.id,
                    channel_id: effectiveChannelId,
                    channelId: effectiveChannelId,
                    program_start_time: program.startTime,
                    programStartTime: program.startTime,
                    program_end_time: program.endTime,
                    programEndTime: program.endTime,
                    selection_source: 'epg',
                    selectionSource: 'epg',
                  });
                } catch (err) {
                  if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn(
                      '[LiveTVScreen] trackEpgProgramSelected failed:',
                      err,
                    );
                  }
                }

                handleProgramPress(
                  program,
                  progPayload?.extras?.streamUrl,
                  progPayload?.extras?.streamType,
                  progPayload?.extras?.isVideoOnly,
                  progPayload?.extras?.drm,
                  effectiveChannelId,
                  effectiveChannelName,
                );
              }
            }}
            onMenu={handleEPGMenu}
            onFocusEscapeUp={handleEPGFocusEscapeUp}
            onScroll={(event) => {
              if (
                typeof event?.row === 'number' &&
                event.row >= nextChannelOffsetRef.current - 2
              ) {
                loadNextChannelPage();
              }
            }}
            focusBorder={epgFocusBorder}
            logoStyle={epgLogoStyle}
            overlayStyle={epgOverlayStyle}
            tileLayout="expanded"
            tileStyle={epgTileStyle}
            timeRange={{
              startTimeMs: gridStartTimeRef.current,
              initialPosition: gridStartTimeRef.current,
            }}
            localizedStrings={{
              loadingText: strings.liveTV.loadingSchedule,
              unavailableText: strings.liveTV.unavailableProgramme,
            }}
          />
        </Animated.View>
        {isLoadingNextPage && (
          <View style={styles.paginationLoaderOverlay} pointerEvents="none">
            <View style={styles.paginationLoader}>
              <ActivityIndicator color={colors.focusedTint} size="large" />
            </View>
          </View>
        )}
        {!isEPGReady && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.focusedTint} size="large" />
          </View>
        )}
        {hasNoFreeLiveChannels && isEPGReady && (
          <View style={styles.emptyChannelOverlay}>
            <Text style={styles.emptyChannelText}>
              {strings.liveTV.noFreeLiveChannels}
            </Text>
            <TouchableOpacity
             accessibilityHint="TODO"
              style={[
                styles.emptyChannelButton,
                isEmptyButtonFocused && styles.emptyChannelButtonFocused,
              ]}
              onFocus={() => {
                setIsEmptyButtonFocused(true);
                setIsFilterPreferred(false);
              }}
              onBlur={() => setIsEmptyButtonFocused(false)}
              onPress={() => {
                setShowFreeLiveOnly(false);
                setSelectedCategory(strings.liveTV.allCategories);
              }}
              focusable={!isFilterPreferred}
              role="button"
              aria-label={strings.liveTV.showAllChannels}>
              <Text style={styles.emptyChannelButtonText}>
                {strings.liveTV.showAllChannels}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal
        transparent
        visible={isCategoryMenuVisible}
        animationType="none"
        onRequestClose={dismissCategoryMenu}>
        <View style={styles.categoryMenuBackdrop}>
          <TVFocusGuideView
            style={styles.categoryMenu}
            autoFocus
            trapFocusLeft
            trapFocusRight
            trapFocusUp
            trapFocusDown>
            <Pressable accessibilityHint="TODO"
              ref={(node) => {
                categoryOptionRefs.current.all = node;
              }}
              style={({focused}) => [
                styles.categoryOption,
                !showFreeLiveOnly &&
                  (!selectedCategory ||
                    selectedCategory === strings.liveTV.allCategories) &&
                  styles.categoryOptionSelected,
                (focused || focusedCategoryOption === 'all') &&
                  styles.categoryOptionFocused,
              ]}
              onFocus={() => {
                setFocusedCategoryOption('all');
                focusedCategoryOptionRef.current = 'all';
              }}
              onPress={() => applyCategorySelection('all')}
              focusable={
                !showFreeLiveOnly &&
                (!selectedCategory ||
                  selectedCategory === strings.liveTV.allCategories)
              }
              role="button"
              aria-label={strings.liveTV.allChannelsFilter}
              testID="category-option-all">
              <Text style={styles.categoryOptionText}>
                {strings.liveTV.allChannelsFilter}
              </Text>
            </Pressable>
            <Pressable accessibilityHint="TODO"
              ref={(node) => {
                categoryOptionRefs.current.free = node;
              }}
              style={({focused}) => [
                styles.categoryOption,
                showFreeLiveOnly && styles.categoryOptionSelected,
                (focused || focusedCategoryOption === 'free') &&
                  styles.categoryOptionFocused,
              ]}
              onFocus={() => {
                setFocusedCategoryOption('free');
                focusedCategoryOptionRef.current = 'free';
              }}
              onPress={() => applyCategorySelection('free')}
              hasTVPreferredFocus={showFreeLiveOnly}
              role="button"
              aria-label={strings.liveTV.freeChannelsFilter}
              testID="category-option-free">
              <Text style={styles.categoryOptionText}>
                {strings.liveTV.freeChannelsFilter}
              </Text>
            </Pressable>
            <View style={styles.filterDivider} />
            {freeLiveCategories.map((category) => (
              <Pressable accessibilityHint="TODO"
                key={category}
                ref={(node) => {
                  categoryOptionRefs.current[category] = node;
                }}
                style={({focused}) => [
                  styles.categoryOption,
                  !showFreeLiveOnly &&
                    selectedCategory === category &&
                    styles.categoryOptionSelected,
                  (focused || focusedCategoryOption === category) &&
                    styles.categoryOptionFocused,
                ]}
                onFocus={() => {
                  setFocusedCategoryOption(category);
                  focusedCategoryOptionRef.current = category;
                }}
                onPress={() => applyCategorySelection(category)}
                focusable={
                  !showFreeLiveOnly &&
                  selectedCategory === category &&
                  category !== strings.liveTV.allCategories
                }
                role="button"
                aria-label={category}
                testID={`category-option-${category}`}>
                <Text style={styles.categoryOptionText}>{category}</Text>
              </Pressable>
            ))}
          </TVFocusGuideView>
        </View>
      </Modal>
      <Modal
        transparent
        visible={Boolean(programmeAlert)}
        animationType="none"
        onRequestClose={dismissFutureProgrammeAlert}>
        <View style={styles.alertBackdrop}>
          <View
            style={styles.alertCard}
            accessibilityViewIsModal
            role="alert">
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity accessibilityHint="TODO"
              style={styles.alertButton}
              onPress={dismissFutureProgrammeAlert}
              hasTVPreferredFocus
              activeOpacity={1}
              role="button"
              aria-label={strings.liveTV.futureProgrammeDismiss}
              testID="future-programme-alert-dismiss">
              <Text style={styles.alertButtonText}>
                {strings.liveTV.futureProgrammeDismiss}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const ProgramDetails = ({
  program,
  now,
  nextProgramTitle,
}: {
  program: EPGProgram | null;
  now: Date;
  nextProgramTitle?: string | null;
}) => {
  if (!program) {
    return (
      <View style={styles.details}>
        <Text style={styles.emptyDetails}>{strings.liveTV.focusProgramme}</Text>
      </View>
    );
  }

  const isLive = isProgramLive(program, now);
  const isFuture = isProgramFuture(program, now);
  return (
    <View style={styles.details}>
      {program.image && (
        <Image
          source={{uri: program.image}}
          style={styles.detailsImage}
          resizeMode="contain"
          aria-label={program.title}
        />
      )}
      <View style={styles.detailsText}>
        <View style={styles.detailsTitleRow}>
          <Text style={styles.detailsTitle} numberOfLines={1}>
            {program.title}
          </Text>
          {isLive && (
            <View style={styles.detailsBadgeLive}>
              <Text style={styles.detailsLive}>{strings.liveTV.isLive}</Text>
            </View>
          )}
          {isFuture && (
            <View style={styles.detailsBadgeUpcoming}>
              <Text style={styles.detailsUpcoming}>
                {strings.liveTV.upcoming}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.detailsTime}>
          {formatEPGTime(program.startTime)} - {formatEPGTime(program.endTime)}
        </Text>
        <Text style={styles.detailsDescription} numberOfLines={2}>
          {program.description ||
            program.category ||
            strings.liveTV.unavailableProgramme}
        </Text>
        {isLive && nextProgramTitle ? (
          <Text style={styles.detailsNextEpisode} numberOfLines={1}>
            {strings.liveTV.upNext}: {nextProgramTitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
