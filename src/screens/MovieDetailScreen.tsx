import React, {useEffect, useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {MovieDetailBody} from '../components/organisms/MovieDetailBody';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentItem} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {styles} from './MovieDetailScreen.styles';
import {filterContentItem} from '../utils/searchUtils';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {strings as appStrings} from '../constants/strings';
import {
  clearContinueWatchProgress,
  fetchContinueWatchForContent,
} from '../services/watchProgressService';
import {
  addFavourite,
  fetchFavouriteForContent,
  removeFavourite,
} from '../services/favouritesService';
import {findContentById} from '../utils/deeplink';

export const MovieDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [focusedAction, setFocusedAction] = useState<
    'play' | 'list' | 'back' | 'favourites' | 'continueWatch' | null
  >(null);
  const [continueWatchProgress, setContinueWatchProgress] = useState<
    number | null
  >(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedMovie: HomeContentItem =
    route.params?.movie ||
    findContentById(route.params?.movieId) ||
    homeContentRows[0].items[0];
  const resolvedMovie =
    route.params?.movie || findContentById(route.params?.movieId);
  const allRecommendations =
    homeContentRows[1]?.items || homeContentRows[0].items;

  const recommendations = allRecommendations.filter((item) =>
    filterContentItem(item, searchQuery),
  );

  useEffect(() => {
    if (!route.params?.movieId || resolvedMovie) {
      return;
    }

    navigation.replace(Routes.Home);
  }, [navigation, resolvedMovie, route.params?.movieId]);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      if (!user) {
        if (active) {
          setContinueWatchProgress(null);
          setIsFavourite(false);
        }
        return;
      }

      try {
        if (activeProfile?.id) {
          const progressRecord = await fetchContinueWatchForContent(
            activeProfile.id,
            selectedMovie.id,
          );
          if (active) {
            setContinueWatchProgress(
              progressRecord &&
                progressRecord.progress > 0 &&
                progressRecord.progress < 1
                ? progressRecord.progress
                : null,
            );
          }
        } else if (active) {
          setContinueWatchProgress(null);
        }

        const favouriteRecord = await fetchFavouriteForContent(
          selectedMovie.id,
        );
        if (active) {
          setIsFavourite(Boolean(favouriteRecord));
        }
      } catch (error) {
        console.log('Movie detail meta load error:', error);
        if (active) {
          setContinueWatchProgress(null);
          setIsFavourite(false);
        }
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, [activeProfile?.id, selectedMovie.id, user]);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const renderDetailItem = () => (
    <MovieDetailBody
      selectedMovie={selectedMovie}
      recommendations={recommendations}
      focusedAction={focusedAction}
      continueWatchProgress={continueWatchProgress}
      isFavourite={isFavourite}
      toastMessage={toastMsg}
      onRemoveContinueWatch={async () => {
        try {
          if (activeProfile?.id) {
            await clearContinueWatchProgress(
              activeProfile.id,
              selectedMovie.id,
            );
          }
          setContinueWatchProgress(null);
        } catch (error) {
          console.log('Remove watchlist error:', error);
        }
      }}
      onAddFavourite={async () => {
        if (!user) {
          showToast(appStrings.toasts.signInToAddFavourites);
          return;
        }
        try {
          await addFavourite(selectedMovie);
          setIsFavourite(true);
        } catch (error) {
          console.log('Add favourite error:', error);
        }
      }}
      onRemoveFavourite={async () => {
        if (!user) {
          showToast(appStrings.toasts.signInToRemoveFavourites);
          return;
        }
        try {
          await removeFavourite(selectedMovie.id);
          setIsFavourite(false);
        } catch (error) {
          console.log('Remove favourite error:', error);
        }
      }}
      onFocusAction={(action) => {
        setIsMenuExpanded(false);
        setFocusedAction(action);
      }}
      onBlurAction={() => setFocusedAction(null)}
      onCardFocus={collapseMenu}
    />
  );

  return (
    <ImageBackground
      source={selectedMovie.image}
      style={styles.background}
      imageStyle={styles.backdropImage}
      testID="movie-detail-screen">
      <View style={styles.overlay} />
      <SideMenu
        activeRoute={Routes.Details}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <CommonHeader
            title={AppDetails.name}
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
        </View>

        <TVFocusGuideView
          autoFocus={!isSearchFocused}
          style={styles.background}>
          <FlatList
            data={[selectedMovie]}
            keyExtractor={(item) => item.id || item.title}
            showsVerticalScrollIndicator={false}
            renderItem={renderDetailItem}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
