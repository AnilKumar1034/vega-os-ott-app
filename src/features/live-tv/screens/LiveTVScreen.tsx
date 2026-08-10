import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ImageBackground, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
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
import {formatEPGTime, isProgramLive} from '../utils/epgTimeUtils';
import {styles} from './LiveTVScreen.styles';

const epgFocusBorder = {enabled: true, color: colors.focusRing};
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
  const [now, setNow] = useState(() => new Date());
  const epgRef = useRef<EPGActions>(null);
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

  useEffect(() => {
    epgRef.current?.resetData(vegaEPGChannelData, {
      startTimeMs: new Date(EPG_START_TIME).getTime(),
      endTimeMs: EPG_END_TIME,
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
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
        <View style={styles.titleSection}>
          <Text style={styles.title}>{strings.liveTV.screenTitle}</Text>
          <Text style={styles.subtitle}>{strings.liveTV.screenSubtitle}</Text>
        </View>
        <EPG
          ref={epgRef}
          style={styles.guide}
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
          focusBorder={epgFocusBorder}
          logoStyle={epgLogoStyle}
          overlayStyle={epgOverlayStyle}
          tileLayout="expanded"
          tileStyle={epgTileStyle}
          timeRange={{
            startTimeMs: new Date(EPG_START_TIME).getTime(),
            initialPosition: new Date(EPG_START_TIME).getTime(),
          }}
          localizedStrings={{
            loadingText: strings.liveTV.loadingSchedule,
            unavailableText: strings.liveTV.unavailableProgramme,
          }}
        />
        <ProgramDetails program={focusedProgram} now={now} />
      </View>
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
