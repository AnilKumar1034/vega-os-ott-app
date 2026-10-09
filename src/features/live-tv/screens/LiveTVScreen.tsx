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
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {EPG, type EPGActions} from '../components/EPG';
import {CommonHeader} from '../../../components/molecules/CommonHeader';
import {SideMenu} from '../../../components/molecules/SideMenu';
import {Routes} from '../../../constants/routes';
import {strings} from '../../../constants/strings';
import {colors} from '../../../theme/colors';
import {fontSizes} from '../../../theme/fonts';
import {borderRadius, spacing} from '../../../theme/sizes';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../../utils/inputUtils';
import {
  EPG_END_TIME,
  EPG_START_TIME,
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
type TVFocusable = React.ElementRef<typeof TVFocusGuideView> & {
  requestTVFocus: () => void;
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
  const [isEPGReady, setIsEPGReady] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [hasNoFreeLiveChannels, setHasNoFreeLiveChannels] = useState(false);
  const [focusedCategoryOption, setFocusedCategoryOption] = useState<string | null>(null);
  const focusedCategoryOptionRef = useRef(focusedCategoryOption);
  focusedCategoryOptionRef.current = focusedCategoryOption;
  const [isEmptyButtonFocused, setIsEmptyButtonFocused] = useState(false);
  const isEmptyButtonFocusedRef = useRef(isEmptyButtonFocused);
  isEmptyButtonFocusedRef.current = isEmptyButtonFocused;
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

  const handleProgramPress = useCallback(
    (
      program: EPGProgram,
      streamUrl?: string,
      streamType?: 'hls' | 'dash',
      isVideoOnly?: boolean,
      drm?: LiveChannelDrmConfig,
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

      navigation.navigate(Routes.VideoPlayer, {
        videoUrl: streamUrl,
        isLive: true,
        streamType,
        isVideoOnly,
        drm,
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

  const handleEPGMenu = useCallback(() => {
    epgRef.current?.focusOnEPG(false);
    setIsMenuExpanded(true);
    setMenuFocusVersion((version) => version + 1);
  }, []);

  const handleEPGFocusEscapeUp = useCallback(() => {
    // Let the native EPG finish processing its directional event before moving
    // focus, otherwise its own navigation can override this request.
    epgRef.current?.focusOnEPG(false);
    setTimeout(() => categoryFilterFocusGuideRef.current?.requestTVFocus(), 50);
  }, []);

  const dismissCategoryMenu = useCallback(() => {
    setIsCategoryMenuVisible(false);
    setTimeout(() => epgRef.current?.focusOnEPG(true), 100);
  }, []);

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
        if (option === 'all') {
          setShowFreeLiveOnly(false);
          dismissCategoryMenu();
        } else if (option === 'free') {
          setShowFreeLiveOnly(true);
          dismissCategoryMenu();
        } else if (option) {
          setSelectedCategory(option);
          dismissCategoryMenu();
        }
        return;
      }
    }

    if (hasNoFreeLiveChannels && isEPGReady) {
      if (isSelectEvent(type) && isEmptyButtonFocusedRef.current) {
        setShowFreeLiveOnly(false);
        setSelectedCategory(strings.liveTV.allCategories);
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
    if (isEPGReady && !isCategoryMenuVisible && !isMenuExpanded) {
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
        isExpanded={isMenuExpanded}
        preferActiveFocus={isMenuExpanded}
        onMenuFocus={() => setIsMenuExpanded(true)}
        onMenuBlur={() => {
          setIsMenuExpanded(false);
          epgRef.current?.focusOnEPG(true);
        }}
      />
      <View style={styles.content} testID="live-tv-screen">
        <CommonHeader
          title={strings.liveTV.headerTitle}
          logo={require('../../../assets/vega.png')}
          filterLabel={strings.liveTV.filters}
          filterFocusGuideRef={categoryFilterFocusGuideRef}
          onFilterPress={() => {
            epgRef.current?.focusOnEPG(false);
            setIsCategoryMenuVisible((visible) => !visible);
          }}
          onFocusEscapeDown={() => {
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
                      channelId: event?.payload?.channel?.id || '',
                    }
                  : null);
              if (program) {
                handleProgramPress(
                  program,
                  progPayload?.extras?.streamUrl,
                  progPayload?.extras?.streamType,
                  progPayload?.extras?.isVideoOnly,
                  progPayload?.extras?.drm,
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
              style={[
                styles.emptyChannelButton,
                isEmptyButtonFocused && styles.emptyChannelButtonFocused,
              ]}
              onFocus={() => setIsEmptyButtonFocused(true)}
              onBlur={() => setIsEmptyButtonFocused(false)}
              onPress={() => {
                setShowFreeLiveOnly(false);
                setSelectedCategory(strings.liveTV.allCategories);
              }}
              hasTVPreferredFocus
              accessibilityRole="button"
              accessibilityLabel={strings.liveTV.showAllChannels}>
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
          <View style={styles.categoryMenu}>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                !showFreeLiveOnly && styles.categoryOptionSelected,
                focusedCategoryOption === 'all' &&
                  styles.categoryOptionFocused,
              ]}
              onFocus={() => setFocusedCategoryOption('all')}
              onBlur={() => setFocusedCategoryOption(null)}
              onPress={() => {
                setShowFreeLiveOnly(false);
                dismissCategoryMenu();
              }}
              hasTVPreferredFocus={!showFreeLiveOnly}
              accessibilityRole="button"
              accessibilityLabel={strings.liveTV.allChannelsFilter}>
              <Text style={styles.categoryOptionText}>
                {strings.liveTV.allChannelsFilter}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                showFreeLiveOnly && styles.categoryOptionSelected,
                focusedCategoryOption === 'free' &&
                  styles.categoryOptionFocused,
              ]}
              onFocus={() => setFocusedCategoryOption('free')}
              onBlur={() => setFocusedCategoryOption(null)}
              onPress={() => {
                setShowFreeLiveOnly(true);
                dismissCategoryMenu();
              }}
              hasTVPreferredFocus={showFreeLiveOnly}
              accessibilityRole="button"
              accessibilityLabel={strings.liveTV.freeChannelsFilter}>
              <Text style={styles.categoryOptionText}>
                {strings.liveTV.freeChannelsFilter}
              </Text>
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            {freeLiveCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category &&
                    styles.categoryOptionSelected,
                  focusedCategoryOption === category &&
                    styles.categoryOptionFocused,
                ]}
                onFocus={() => setFocusedCategoryOption(category)}
                onBlur={() => setFocusedCategoryOption(null)}
                onPress={() => {
                  setSelectedCategory(category);
                  dismissCategoryMenu();
                }}
                hasTVPreferredFocus={selectedCategory === category}
                accessibilityRole="button"
                accessibilityLabel={category}>
                <Text style={styles.categoryOptionText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
            accessibilityRole="alert">
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={dismissFutureProgrammeAlert}
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.liveTV.futureProgrammeDismiss}
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
          accessibilityLabel={program.title}
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
