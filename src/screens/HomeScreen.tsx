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
import {
  fetchFavouriteItems,
  FavouriteRecord,
} from '../services/favouritesService';
import {
  ContinueWatchRecord,
  fetchContinueWatchItems,
} from '../services/watchProgressService';
import {filterContentRows, filterHeroSlides} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => {
  const {user} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isAnyCardFocused, setIsAnyCardFocused] = useState(false);
  const [continueWatchRecords, setContinueWatchRecords] = useState<
    ContinueWatchRecord[]
  >([]);
  const [favouriteRecords, setFavouriteRecords] = useState<FavouriteRecord[]>(
    [],
  );

  const loadLibraryState = useCallback(async () => {
    if (!user) {
      setContinueWatchRecords([]);
      setFavouriteRecords([]);
      return;
    }

    try {
      const continueWatch = await fetchContinueWatchItems();
      setContinueWatchRecords(continueWatch);
    } catch (error) {
      console.log('Continue watch load error:', error);
      setContinueWatchRecords([]);
    }

    try {
      const favourites = await fetchFavouriteItems();
      setFavouriteRecords(favourites);
    } catch (error) {
      console.log('Favourite load error:', error);
      setFavouriteRecords([]);
    }
  }, [user]);

  useEffect(() => {
    void loadLibraryState();
  }, [loadLibraryState]);

  const continueWatchingItems = useMemo<HomeContentItem[]>(() => {
    return continueWatchRecords.map((record) => ({
      id: record.contentId,
      title: record.title,
      image: record.imageUri ? {uri: record.imageUri} : require('../assets/background.png'),
      progress: record.progress,
      videoUrl: record.videoUrl,
    }));
  }, [continueWatchRecords]);

  const continueWatchingRow: HomeContentRow | null = continueWatchingItems.length
    ? {
        id: 'continue-watching',
        title: strings.hero.continueWatching,
        layout: 'horizontal',
        items: continueWatchingItems,
      }
    : null;

  const favouritesItems = useMemo<HomeContentItem[]>(() => {
    return favouriteRecords.map((record) => ({
      id: record.contentId,
      title: record.title,
      image: record.imageUri ? {uri: record.imageUri} : require('../assets/background.png'),
      videoUrl: record.videoUrl,
    }));
  }, [favouriteRecords]);

  const favouritesRow: HomeContentRow | null = favouritesItems.length
    ? {
        id: 'favourites',
        title: AppDetails.favouritesRow,
        layout: 'horizontal',
        items: favouritesItems,
      }
    : null;

  const rowsToDisplay = [
    ...(continueWatchingRow ? [continueWatchingRow] : []),
    ...(favouritesRow ? [favouritesRow] : []),
    ...homeContentRows.filter(
      (row) => row.id !== 'continue-watching' && row.id !== 'favourites',
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
          onSearchFocus={handleHeroFocus}
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
