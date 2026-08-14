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
import {I18nManager} from '@amazon-devices/react-native-kepler';
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
import {EPGProgram} from '../models/EPGProgram';
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

export const LiveTVScreen = () => {
  const navigation = useNavigation<any>();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [menuFocusVersion, setMenuFocusVersion] = useState(0);
  const [isFutureProgrammeAlertVisible, setIsFutureProgrammeAlertVisible] =
    useState(false);
  const [now, setNow] = useState(() => new Date());
  const [isEPGReady, setIsEPGReady] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const epgRef = useRef<EPGActions>(null);
  const epgOpacity = useRef(new Animated.Value(0)).current;
  const nextChannelOffsetRef = useRef(EPG_INITIAL_CHANNEL_COUNT);
  const isLoadingNextPageRef = useRef(false);
  const hasMoreChannelsRef = useRef(true);
  const gridStartTimeRef = useRef(getCurrentEPGSlotTimeMs());
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
    (program: EPGProgram) => {
      handleProgramFocus(program);
      if (isProgramFuture(program)) {
        epgRef.current?.focusOnEPG(false);
        setIsFutureProgrammeAlertVisible(true);
        return;
      }

      navigation.navigate(Routes.VideoPlayer, {
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

  const dismissFutureProgrammeAlert = useCallback(() => {
    setIsFutureProgrammeAlertVisible(false);
    epgRef.current?.focusOnEPG(true);
  }, []);

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
  }, []);

  useEffect(() => {
    I18nManager.setTimezone(EPG_TIMEZONE);
  }, []);

  useEffect(() => {
    const currentGridStartTime = getCurrentEPGSlotTimeMs();
    gridStartTimeRef.current = currentGridStartTime;
    epgRef.current?.resetData(vegaEPGChannelData, {
      startTimeMs: new Date(EPG_START_TIME).getTime(),
      endTimeMs: EPG_END_TIME,
    });
    epgRef.current?.updateGridStartTime(
      currentGridStartTime,
      currentGridStartTime,
    );

    const loadLogixTVEPGData = async () => {
      try {
        const realEPGData = await fetchLogixTVEPGPage({
          offset: 0,
          limit: EPG_INITIAL_CHANNEL_COUNT,
        });
        hasMoreChannelsRef.current = realEPGData.hasMore;
        epgRef.current?.resetData(realEPGData.channels, {
          startTimeMs: realEPGData.startTimeMs,
          endTimeMs: realEPGData.endTimeMs,
        });
        epgRef.current?.updateGridStartTime(
          currentGridStartTime,
          currentGridStartTime,
        );
      } catch (error) {
        console.warn(
          'Unable to load LogixTV EPG data. Using local sample data.',
          error,
        );
      }
      setIsEPGReady(true);
      Animated.timing(epgOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    };

    loadLogixTVEPGData();
  }, [epgOpacity]);

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
        />
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
                handleProgramPress(program);
              }
            }}
            onMenu={handleEPGMenu}
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
        <ProgramDetails program={focusedProgram} now={now} />
      </View>
      <Modal
        transparent
        visible={isFutureProgrammeAlertVisible}
        animationType="none"
        onRequestClose={dismissFutureProgrammeAlert}>
        <View style={styles.alertBackdrop}>
          <View
            style={styles.alertCard}
            accessibilityViewIsModal
            accessibilityRole="alert">
            <Text style={styles.alertTitle}>
              {strings.liveTV.futureProgrammeTitle}
            </Text>
            <Text style={styles.alertMessage}>
              {strings.liveTV.futureProgrammeMessage}
            </Text>
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
          resizeMode="cover"
          accessibilityLabel={program.title}
        />
      )}
      <View style={styles.detailsText}>
        <Text style={styles.detailsTitle} numberOfLines={1}>
          {program.title}
        </Text>
        <Text style={styles.detailsTime}>
          {formatEPGTime(program.startTime)} - {formatEPGTime(program.endTime)}
        </Text>
        <Text style={styles.detailsDescription} numberOfLines={1}>
          {program.description ||
            program.category ||
            strings.liveTV.unavailableProgramme}
        </Text>
      </View>
      {isLive && <Text style={styles.detailsLive}>● LIVE</Text>}
    </View>
  );
};
