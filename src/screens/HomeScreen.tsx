import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {HeroCarousel} from '../components/molecules/HeroCarousel';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {
  homeContentRows,
  HomeContentItem,
  HomeContentRow,
  homeHeroSlides,
} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {
  fetchFavouriteItems,
  FavouriteRecord,
} from '../services/favouritesService';
import {
  ContinueWatchRecord,
  fetchContinueWatchItems,
} from '../services/watchProgressService';
import {
  fetchWatchlist,
} from '../services/watchlistService';
import {WatchlistItem} from '../types/watchlist';
import {findContentById} from '../utils/deeplink';
import {filterContentRows, filterHeroSlides} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => {
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isAnyCardFocused, setIsAnyCardFocused] = useState(false);
  const [continueWatchRecords, setContinueWatchRecords] = useState<
    ContinueWatchRecord[]
  >([]);
  const [watchlistRecords, setWatchlistRecords] = useState<WatchlistItem[]>([]);

  const loadLibraryState = useCallback(async () => {
    if (!user) {
      setContinueWatchRecords([]);
      setWatchlistRecords([]);
      return;
    }

    if (activeProfile?.id) {
      try {
        const [continueWatch, watchlist] = await Promise.all([
          fetchContinueWatchItems(activeProfile.id),
          fetchWatchlist(activeProfile.id),
        ]);
        setContinueWatchRecords(continueWatch);
        setWatchlistRecords(watchlist);
      } catch (error) {
        console.log('Library load error:', error);
      }
    } else {
      setContinueWatchRecords([]);
      setWatchlistRecords([]);
    }
  }, [user, activeProfile?.id]);

  useEffect(() => {
    let isCurrent = true;

    // Immediately clear current records when active profile changes
    // to prevent showing previous profile's items
    setContinueWatchRecords([]);
    setWatchlistRecords([]);

    if (!user || !activeProfile?.id) {
      return;
    }

    const currentProfileId = activeProfile.id;
    (async () => {
      try {
        const [continueWatch, watchlist] = await Promise.all([
          fetchContinueWatchItems(currentProfileId),
          fetchWatchlist(currentProfileId),
        ]);
        if (isCurrent) {
          setContinueWatchRecords(continueWatch);
          setWatchlistRecords(watchlist);
        }
      } catch (error) {
        console.log('Profile library load error:', error);
        if (isCurrent) {
          setContinueWatchRecords([]);
          setWatchlistRecords([]);
        }
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [user, activeProfile?.id]);

  const continueWatchingItems = useMemo<HomeContentItem[]>(() => {
    return continueWatchRecords.map((record) => ({
      id: record.contentId,
      title: record.title,
      image: record.imageUri
        ? {uri: record.imageUri}
        : require('../assets/background.png'),
      progress: record.progress,
      videoUrl: record.videoUrl,
    }));
  }, [continueWatchRecords]);

  const continueWatchingRow: HomeContentRow | null =
    continueWatchingItems.length
      ? {
          id: 'continue-watching',
          title: strings.hero.continueWatching,
          layout: 'horizontal',
          items: continueWatchingItems,
        }
      : null;

  const watchlistItems = useMemo<HomeContentItem[]>(() => {
    return watchlistRecords.map((record) => {
      const fullCatalogItem = findContentById(record.contentId);
      if (fullCatalogItem) {
        return fullCatalogItem;
      }

      return {
        id: record.contentId,
        title: record.title,
        genre: record.genre,
        image: record.image
          ? {uri: record.image}
          : require('../assets/background.png'),
      };
    });
  }, [watchlistRecords]);

  const watchlistRow: HomeContentRow | null = watchlistItems.length
    ? {
        id: 'my-list',
        title: strings.myList.title,
        layout: 'portrait',
        items: watchlistItems,
      }
    : null;

  const rowsToDisplay = [
    ...(continueWatchingRow ? [continueWatchingRow] : []),
    ...(watchlistRow ? [watchlistRow] : []),
    ...homeContentRows.filter(
      (row) =>
        row.id !== 'continue-watching' &&
        row.id !== 'favourites' &&
        row.id !== 'my-list',
    ),
  ];

  const filteredRows = filterContentRows(rowsToDisplay, searchQuery);
  const filteredHeroSlides = filterHeroSlides(homeHeroSlides, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
    setIsAnyCardFocused(false);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const handleHeroFocus = () => {
    setIsMenuExpanded(false);
    setIsAnyCardFocused(false);
  };

  const handleCardFocus = () => {
    setIsMenuExpanded(false);
    setIsAnyCardFocused(true);
  };

  const renderHomeRow = ({
    item: row,
    index,
  }: {
    item: HomeContentRow;
    index: number;
  }) => (
    <ContentRow
      row={row}
      onContentFocus={handleCardFocus}
      shouldPreferFocus={index === 0}
    />
  );

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID={AppDetails.homeTestId}>
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            handleHeroFocus();
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
        />
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => row.id}
            ListHeaderComponent={
              filteredHeroSlides.length > 0 ? (
                <HeroCarousel
                  slides={filteredHeroSlides}
                  onContentFocus={handleHeroFocus}
                  onLibraryChange={() => void loadLibraryState()}
                  isMenuOpen={isMenuExpanded}
                  isPaused={isAnyCardFocused}
                  testID={AppDetails.heroBannerTestId}
                />
              ) : null
            }
            renderItem={renderHomeRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentList}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
