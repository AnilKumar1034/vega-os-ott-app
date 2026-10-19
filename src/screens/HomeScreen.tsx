import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
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
import {fetchWatchlist} from '../services/watchlistService';
import {
  ViewingHistoryItem,
  fetchViewingHistory,
} from '../services/viewingHistoryService';
import {
  getAllCatalogItems,
  getPersonalizedRecommendations,
} from '../services/recommendationService';
import {analyticsService} from '../analytics';
import {WatchlistItem} from '../types/watchlist';
import {
  canProfileAccessContent,
  filterContentRowsForProfile,
  filterHeroSlidesForProfile,
} from '../utils/contentAccessPolicy';
import {findContentById, deeplinkManager} from '../utils/deeplink';
import {filterContentRows, filterHeroSlides} from '../utils/searchUtils';
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

export const HomeScreen = () => {
  const navigation = useSafeNavigation();
  const contentGuideRef = useRef<any>(null);
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isAnyCardFocused, setIsAnyCardFocused] = useState(false);
  const [lastFocusedRow, setLastFocusedRow] = useState<'hero' | number>('hero');
  const rowRefs = useRef<{[key: number]: any}>({});
  const heroRef = useRef<any>(null);
  const [continueWatchRecords, setContinueWatchRecords] = useState<
    ContinueWatchRecord[]
  >([]);
  const [watchlistRecords, setWatchlistRecords] = useState<WatchlistItem[]>([]);
  const [viewingHistoryRecords, setViewingHistoryRecords] = useState<
    ViewingHistoryItem[]
  >([]);

  useEffect(() => {
    deeplinkManager.onDestinationOpened('home').catch(() => {});
  }, []);

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
      if (filteredHeroSlides.length > 0 && !isAnyCardFocused && !isMenuExpanded) {
        const currentHero = filteredHeroSlides[0];
        navigation.navigate(Routes.VideoPlayer, {
          movie: currentHero,
          videoUrl: (currentHero as any).videoUrl,
        });
      }
    }
  });

  const loadLibraryState = useCallback(async () => {
    if (!user) {
      setContinueWatchRecords([]);
      setWatchlistRecords([]);
      setViewingHistoryRecords([]);
      return;
    }

    if (activeProfile?.id) {
      try {
        const [continueWatch, watchlist, history] = await Promise.all([
          fetchContinueWatchItems(activeProfile.id).catch(() => []),
          fetchWatchlist(activeProfile.id).catch(() => []),
          fetchViewingHistory(activeProfile.id).catch(() => []),
        ]);
        setContinueWatchRecords(continueWatch);
        setWatchlistRecords(watchlist);
        setViewingHistoryRecords(history);
        analyticsService.syncWatchlistState(
          activeProfile.id,
          watchlist.map((i) => i.contentId),
        );
      } catch (error) {
        console.log('Library load error:', error);
      }
    } else {
      setContinueWatchRecords([]);
      setWatchlistRecords([]);
      setViewingHistoryRecords([]);
    }
  }, [user, activeProfile?.id]);

  useEffect(() => {
    let isCurrent = true;

    // Immediately clear current records when active profile changes
    // to prevent showing previous profile's items
    setContinueWatchRecords([]);
    setWatchlistRecords([]);
    setViewingHistoryRecords([]);

    if (!user || !activeProfile?.id) {
      return;
    }

    const currentProfileId = activeProfile.id;
    (async () => {
      try {
        const [continueWatch, watchlist, history] = await Promise.all([
          fetchContinueWatchItems(currentProfileId).catch(() => []),
          fetchWatchlist(currentProfileId).catch(() => []),
          fetchViewingHistory(currentProfileId).catch(() => []),
        ]);
        if (isCurrent) {
          setContinueWatchRecords(continueWatch);
          setWatchlistRecords(watchlist);
          setViewingHistoryRecords(history);
          analyticsService.syncWatchlistState(
            currentProfileId,
            watchlist.map((i) => i.contentId),
          );
        }
      } catch (error) {
        console.log('Profile library load error:', error);
        if (isCurrent) {
          setContinueWatchRecords([]);
          setWatchlistRecords([]);
          setViewingHistoryRecords([]);
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
        const isEpisode = Boolean(
          fullItem?.seriesId || fullItem?.meta?.includes('Series'),
        );
        return {
          id: record.contentId,
          maturityRating: fullItem?.maturityRating,
          title: record.title,
          image: record.imageUri
            ? {uri: record.imageUri}
            : require('../assets/background.png'),
          progress: record.progress,
          videoUrl: record.videoUrl,
          savedPositionSeconds: record.currentTime,
          contentType: (isEpisode ? 'episode' : 'movie') as 'episode' | 'movie',
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

  const watchlistItems = useMemo<HomeContentItem[]>(() => {
    return watchlistRecords
      .map((record) => {
        const fullCatalogItem = findContentById(record.contentId);
        if (fullCatalogItem) {
          return fullCatalogItem;
        }

        return {
          id: record.contentId,
          maturityRating: undefined,
          title: record.title,
          genre: record.genre,
          image: record.image
            ? {uri: record.image}
            : require('../assets/background.png'),
        };
      })
      .filter((item) => canProfileAccessContent(activeProfile, item));
  }, [activeProfile, watchlistRecords]);

  const watchlistRow: HomeContentRow | null = watchlistItems.length
    ? {
        id: 'my-list',
        title: strings.myList.title,
        layout: 'portrait',
        items: watchlistItems,
      }
    : null;

  const catalogItems = useMemo(() => getAllCatalogItems(), []);

  const recommendations = useMemo(() => {
    return getPersonalizedRecommendations({
      activeProfile,
      catalog: catalogItems,
      viewingHistory: viewingHistoryRecords,
      continueWatching: continueWatchRecords,
      watchlist: watchlistRecords,
      limit: 15,
    });
  }, [
    activeProfile,
    catalogItems,
    viewingHistoryRecords,
    continueWatchRecords,
    watchlistRecords,
  ]);

  const recommendedForYouRow: HomeContentRow | null = useMemo(() => {
    if (
      !recommendations.recommendedForYou ||
      recommendations.recommendedForYou.length === 0
    ) {
      return null;
    }
    return {
      id: 'recommended-for-you',
      title: strings.recommendations.recommendedForYou,
      layout: 'portrait',
      items: recommendations.recommendedForYou,
    };
  }, [recommendations.recommendedForYou]);

  const becauseYouWatchedRow: HomeContentRow | null = useMemo(() => {
    if (
      !recommendations.becauseYouWatched ||
      !recommendations.becauseYouWatched.items ||
      recommendations.becauseYouWatched.items.length === 0
    ) {
      return null;
    }
    return {
      id: 'because-you-watched',
      title: strings.recommendations.becauseYouWatched(
        recommendations.becauseYouWatched.sourceTitle,
      ),
      layout: 'portrait',
      items: recommendations.becauseYouWatched.items,
    };
  }, [recommendations.becauseYouWatched]);

  const recentlyAddedRow: HomeContentRow | null = useMemo(() => {
    if (
      !recommendations.recentlyAdded ||
      recommendations.recentlyAdded.length === 0
    ) {
      return null;
    }
    return {
      id: 'recently-added',
      title: strings.recommendations.recentlyAdded,
      layout: 'portrait',
      items: recommendations.recentlyAdded,
    };
  }, [recommendations.recentlyAdded]);

  const allowedCatalogRows = useMemo(() => {
    const rawCatalog = homeContentRows.filter(
      (row) =>
        row.id !== 'continue-watching' &&
        row.id !== 'favourites' &&
        row.id !== 'my-list' &&
        row.id !== 'recommended-for-you' &&
        row.id !== 'because-you-watched' &&
        row.id !== 'recently-added',
    );
    return filterContentRowsForProfile(activeProfile, rawCatalog);
  }, [activeProfile]);

  const rowsToDisplay = [
    ...(continueWatchingRow
      ? [continueWatchingRow]
      : (!user && !activeProfile?.id)
      ? (homeContentRows.filter((r) => r.id === 'continue-watching') as HomeContentRow[])
      : []),
    ...(watchlistRow ? [watchlistRow] : []),
    ...(recommendedForYouRow ? [recommendedForYouRow] : []),
    ...(becauseYouWatchedRow ? [becauseYouWatchedRow] : []),
    ...(recentlyAddedRow ? [recentlyAddedRow] : []),
    ...allowedCatalogRows,
  ];


  const allowedHeroSlides = useMemo(() => {
    return filterHeroSlidesForProfile(activeProfile, homeHeroSlides);
  }, [activeProfile]);

  const filteredRows = filterContentRows(rowsToDisplay, searchQuery);
  const filteredHeroSlides = filterHeroSlides(allowedHeroSlides, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
    setIsAnyCardFocused(false);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const handleHeroFocus = () => {
    setLastFocusedRow('hero');
    setIsMenuExpanded(false);
    setIsAnyCardFocused(false);
  };

  const handleCardFocus = (rowIndex: number) => {
    setLastFocusedRow(rowIndex);
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
      ref={(node) => {
        rowRefs.current[index] = node;
      }}
      row={row}
      onContentFocus={() => handleCardFocus(index)}
      shouldPreferFocus={
        (filteredHeroSlides.length === 0 && lastFocusedRow === 'hero'
          ? index === 0
          : lastFocusedRow === index) &&
        !isMenuExpanded &&
        !isSearchFocused
      }
      onMenuEscapeLeft={() => {
        setLastFocusedRow(index);
        setIsAnyCardFocused(false);
        setIsMenuExpanded(true);
      }}
    />
  );

  const activeDestination =
    lastFocusedRow === 'hero'
      ? heroRef.current || contentGuideRef.current
      : rowRefs.current[lastFocusedRow] || contentGuideRef.current;

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
        preferActiveFocus={isMenuExpanded}
        destinations={
          activeDestination ? [activeDestination] : undefined
        }
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
        <TVFocusGuideView
          ref={contentGuideRef}
          style={styles.contentGuide}
          autoFocus={!isSearchFocused && !isMenuExpanded}>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => row.id}
            ListHeaderComponent={
              filteredHeroSlides.length > 0 ? (
                <HeroCarousel
                  ref={heroRef}
                  slides={filteredHeroSlides}
                  onContentFocus={handleHeroFocus}
                  onLibraryChange={() => void loadLibraryState()}
                  isMenuOpen={isMenuExpanded}
                  isPaused={isAnyCardFocused}
                  shouldPreferFocus={
                    lastFocusedRow === 'hero' &&
                    !isMenuExpanded &&
                    !isSearchFocused
                  }
                  onMenuEscapeLeft={() => {
                    setLastFocusedRow('hero');
                    setIsMenuExpanded(true);
                  }}
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
