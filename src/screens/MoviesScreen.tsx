import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, ImageBackground, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentItem, HomeContentRow} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {
  ContinueWatchRecord,
  fetchContinueWatchItems,
} from '../services/watchProgressService';
import {
  canProfileAccessContent,
  filterContentRowsForProfile,
} from '../utils/contentAccessPolicy';
import {findContentById} from '../utils/deeplink';
import {filterContentRows} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';

const useSafeNavigation = () => {
  try {
    return useNavigation<any>();
  } catch {
    return {
      navigate: () => {},
      dispatch: () => {},
      goBack: () => {},
      replace: () => {},
    } as any;
  }
};

export const MoviesScreen = () => {
  const navigation = useSafeNavigation();
  const contentGuideRef = useRef<any>(null);
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [lastFocusedRowIndex, setLastFocusedRowIndex] = useState(0);
  const rowRefs = useRef<{[key: number]: any}>({});
  const [continueWatchRecords, setContinueWatchRecords] = useState<
    ContinueWatchRecord[]
  >([]);

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (evt.eventKeyAction !== undefined && evt.eventKeyAction !== 0) return;
    const type = evt.eventType?.toLowerCase();

    if (type === 'back') {
      if (isMenuExpanded) {
        setIsMenuExpanded(false);
      } else if (isSearchFocused) {
        setIsSearchFocused(false);
      }
      return;
    }

    if (type === 'play' || type === 'playpause') {
      if (!isMenuExpanded && filteredRows.length > 0 && filteredRows[0].items.length > 0) {
        const firstMovie = filteredRows[0].items[0];
        navigation.navigate(Routes.VideoPlayer, {
          movie: firstMovie,
          videoUrl: firstMovie.videoUrl,
        });
      }
    }
  });

  useEffect(() => {
    let isCurrent = true;

    // Immediately clear current records when active profile changes
    // to prevent showing previous profile's continue watching items
    setContinueWatchRecords([]);

    if (!user || !activeProfile?.id) {
      return;
    }

    const currentProfileId = activeProfile.id;
    (async () => {
      try {
        const continueWatch = await fetchContinueWatchItems(currentProfileId);
        if (isCurrent) {
          setContinueWatchRecords(continueWatch);
        }
      } catch (error) {
        console.log('MoviesScreen continue watch load error:', error);
        if (isCurrent) {
          setContinueWatchRecords([]);
        }
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [user, activeProfile?.id]);

  const continueWatchingItems = useMemo<HomeContentItem[]>(() => {
    return continueWatchRecords
      .map((record) => {
        const fullItem = findContentById(record.contentId);
        return {
          id: record.contentId,
          maturityRating: fullItem?.maturityRating,
          title: record.title,
          image: record.imageUri
            ? {uri: record.imageUri}
            : require('../assets/background.png'),
          progress: record.progress,
          videoUrl: record.videoUrl,
        };
      })
      .filter((item) => canProfileAccessContent(activeProfile, item));
  }, [activeProfile, continueWatchRecords]);

  const continueWatchingRow: HomeContentRow | null =
    continueWatchingItems.length
      ? {
          id: 'continue-watching',
          title: strings.hero.continueWatching,
          layout: 'horizontal',
          items: continueWatchingItems,
        }
      : null;

  const allowedCatalogRows = useMemo(() => {
    const rawCatalog = homeContentRows.filter(
      (row) =>
        row.id !== 'continue-watching' &&
        row.id !== 'favourites' &&
        row.id !== 'my-list',
    );
    return filterContentRowsForProfile(activeProfile, rawCatalog);
  }, [activeProfile]);

  const rowsToDisplay = useMemo(
    () => [
      ...(continueWatchingRow ? [continueWatchingRow] : []),
      ...allowedCatalogRows,
    ],
    [allowedCatalogRows, continueWatchingRow],
  );

  const filteredRows = filterContentRows(rowsToDisplay, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  const renderMovieRow = ({
    item: row,
    index,
  }: {
    item: HomeContentRow;
    index: number;
  }) => (
    <ContentRow
      ref={(node) => {
        rowRefs.current[index] = node;
      }}
      row={row}
      onContentFocus={() => {
        setLastFocusedRowIndex(index);
        collapseMenu();
      }}
      shouldPreferFocus={
        index === lastFocusedRowIndex && !isMenuExpanded && !isSearchFocused
      }
      onMenuEscapeLeft={() => {
        setLastFocusedRowIndex(index);
        setIsMenuExpanded(true);
      }}
    />
  );

  const activeDestination =
    rowRefs.current[lastFocusedRowIndex] || contentGuideRef.current;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID={AppDetails.moviesTestId}>
      <SideMenu
        activeRoute={Routes.Movies}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
        preferActiveFocus={isMenuExpanded}
        destinations={
          activeDestination ? [activeDestination] : undefined
        }
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.moviesScreenTitle}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            collapseMenu();
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
        />
        <TVFocusGuideView
          ref={contentGuideRef}
          style={styles.contentGuide}
          autoFocus={!isSearchFocused && !isMenuExpanded}>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => `movies-${row.id}`}
            ListHeaderComponent={
              <View style={styles.moviesHeader}>
                <Text style={styles.moviesTitle}>
                  {strings.nav.moviesHeaderTitle}
                </Text>
                <Text style={styles.moviesSubtitle}>
                  {strings.nav.moviesHeaderSubtitle}
                </Text>
              </View>
            }
            renderItem={renderMovieRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentList}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
