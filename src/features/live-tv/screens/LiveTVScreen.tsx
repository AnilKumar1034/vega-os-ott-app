import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  ActivityIndicator,
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
} from '@amazon-devices/react-native-kepler';
import {EPG, EPGActions} from '@amazon-devices/kepler-ui-components';
import {CommonHeader} from '../../../components/molecules/CommonHeader';
import {SideMenu} from '../../../components/molecules/SideMenu';
import {Routes} from '../../../constants/routes';
import {strings} from '../../../constants/strings';
import {colors} from '../../../theme/colors';
import {fontSizes} from '../../../theme/fonts';
import {borderRadius, spacing} from '../../../theme/sizes';
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
const epgLogoStyle = {backgroundColor: colors.cardBackground, width: 220};
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
  rowHeight: 100,
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
  const [isCategoryMenuVisible, setIsCategoryMenuVisible] = useState(true);
  const [menuFocusVersion, setMenuFocusVersion] = useState(0);
  const [programmeAlert, setProgrammeAlert] = useState<
    'future' | 'playbackUnavailable' | null
  >(null);
  const [now, setNow] = useState(() => new Date());
  const [isEPGReady, setIsEPGReady] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [hasNoFreeLiveChannels, setHasNoFreeLiveChannels] = useState(false);
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

  const handleProgramFocus = useCallback((program: EPGProgram) => {
    setIsMenuExpanded(false);
    setFocusedProgram(program);
  }, []);

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
    setTimeout(() => categoryFilterFocusGuideRef.current?.requestTVFocus(), 50);
  }, []);

  const dismissFutureProgrammeAlert = useCallback(() => {
    setProgrammeAlert(null);
    epgRef.current?.focusOnEPG(true);
  }, []);

  const alertTitle =
    programmeAlert === 'future'
      ? strings.liveTV.futureProgrammeTitle
      : strings.liveTV.playbackUnavailableTitle;
  const alertMessage =
    programmeAlert === 'future'
      ? strings.liveTV.futureProgrammeMessage
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
          startTimeMs: page.startTimeMs,
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
    I18nManager.setTimezone(EPG_TIMEZONE);
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
        freeLiveEPGData.channels[0]?.programs[1]?.extras.sourceProgram || null;

      hasMoreChannelsRef.current = false;
      setFocusedProgram(firstFreeProgramme);
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
        epgRef.current?.resetData(vegaEPGChannelData, {
          startTimeMs: new Date(EPG_START_TIME).getTime(),
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

  return (
    <ImageBackground
      source={require('../../../assets/background.png')}
      style={styles.background}>
      <SideMenu
        key={`live-tv-menu-${menuFocusVersion}`}
        activeRoute={Routes.LiveTV}
        isExpanded={isMenuExpanded}
        onMenuFocus={() => setIsMenuExpanded(true)}
        onMenuBlur={() => setIsMenuExpanded(false)}
      />
      <View style={styles.content} testID="live-tv-screen">
        <CommonHeader
          title={strings.liveTV.headerTitle}
          logo={require('../../../assets/vega.png')}
          filterLabel={strings.liveTV.filters}
          filterFocusGuideRef={categoryFilterFocusGuideRef}
          filterHasTVPreferredFocus
          onFilterPress={() => setIsCategoryMenuVisible((visible) => !visible)}
        />
        <ProgramDetails program={focusedProgram} now={now} />
        <Animated.View style={[styles.guide, {opacity: epgOpacity}]}>
          <EPG
            ref={epgRef}
            style={styles.epg}
            onTileFocus={(event) => {
              const program = event.payload.program.extras?.sourceProgram;
              if (program) {
                handleProgramFocus(program);
              }
            }}
            onTilePress={(event) => {
              const program = event.payload.program.extras?.sourceProgram;
              if (program) {
                handleProgramPress(
                  program,
                  event.payload.program.extras?.streamUrl,
                  event.payload.program.extras?.streamType,
                  event.payload.program.extras?.isVideoOnly,
                  event.payload.program.extras?.drm,
                );
              }
            }}
            onMenu={handleEPGMenu}
            onFocusEscapeUp={handleEPGFocusEscapeUp}
            onScroll={(event) => {
              if (event.row >= nextChannelOffsetRef.current - 2) {
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
              style={styles.emptyChannelButton}
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
        onRequestClose={() => setIsCategoryMenuVisible(false)}>
        <View style={styles.categoryMenuBackdrop}>
          <View style={styles.categoryMenu}>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                !showFreeLiveOnly && styles.categoryOptionSelected,
              ]}
              onPress={() => {
                setShowFreeLiveOnly(false);
                setIsCategoryMenuVisible(false);
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
              ]}
              onPress={() => {
                setShowFreeLiveOnly(true);
                setIsCategoryMenuVisible(false);
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
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setIsCategoryMenuVisible(false);
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
}: {
  program: EPGProgram | null;
  now: Date;
}) => {
  if (!program) {
    return (
      <View style={styles.details}>
        <Text style={styles.emptyDetails}>{strings.liveTV.focusProgramme}</Text>
      </View>
    );
  }

  const isLive = isProgramLive(program, now);
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
        <Text style={styles.detailsTitle} numberOfLines={1}>
          {program.title}{' '}
          {isLive && (
            <Text style={styles.detailsLive}>{strings.liveTV.isLive}</Text>
          )}
        </Text>
        <Text style={styles.detailsTime}>
          {formatEPGTime(program.startTime)} - {formatEPGTime(program.endTime)}
        </Text>
        <Text style={styles.detailsDescription} numberOfLines={2}>
          {program.description ||
            program.category ||
            strings.liveTV.unavailableProgramme}
        </Text>
      </View>
      {/* {isLive && <Text style={styles.detailsLive}>● LIVE</Text>} */}
    </View>
  );
};
