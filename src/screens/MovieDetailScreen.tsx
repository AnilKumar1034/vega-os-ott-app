import React, {useEffect, useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentBlockedBanner} from '../components/molecules/ContentBlockedBanner';
import {MovieDetailBody} from '../components/organisms/MovieDetailBody';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentItem} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {styles} from './MovieDetailScreen.styles';
import {
  canProfileAccessContent,
  filterContentForProfile,
} from '../utils/contentAccessPolicy';
import {filterContentItem} from '../utils/searchUtils';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {strings as appStrings} from '../constants/strings';
import {
  clearContinueWatchProgress,
  fetchContinueWatchForContent,
} from '../services/watchProgressService';
import {
  addToWatchlist,
  getWatchlistItem,
  removeFromWatchlist,
} from '../services/watchlistService';
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
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTogglingList, setIsTogglingList] = useState(false);

  const selectedMovie: HomeContentItem =
    route.params?.movie ||
    findContentById(route.params?.movieId) ||
    homeContentRows[0].items[0];
  const resolvedMovie =
    route.params?.movie || findContentById(route.params?.movieId);
  const isContentAllowed = canProfileAccessContent(activeProfile, selectedMovie);

  const allRecommendations =
    homeContentRows[1]?.items || homeContentRows[0].items;

  const allowedRecommendations = filterContentForProfile(
    activeProfile,
    allRecommendations,
  );

  const recommendations = allowedRecommendations.filter((item) =>
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

    // Immediately reset on profile/user change
    setIsInWatchlist(false);
    setContinueWatchProgress(null);

    const loadMeta = async () => {
      if (!user) {
        return;
      }

      try {
        if (activeProfile?.id) {
          const [progressRecord, watchlistItem] = await Promise.all([
            fetchContinueWatchForContent(activeProfile.id, selectedMovie.id),
            getWatchlistItem(activeProfile.id, selectedMovie.id),
          ]);

          if (active) {
            setContinueWatchProgress(
              progressRecord &&
                progressRecord.progress > 0 &&
                progressRecord.progress < 1
                ? progressRecord.progress
                : null,
            );
            setIsInWatchlist(Boolean(watchlistItem));
          }
        }
      } catch (error) {
        console.log('Movie detail meta load error:', error);
        if (active) {
          setContinueWatchProgress(null);
          setIsInWatchlist(false);
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

  const handleToggleWatchlist = async () => {
    if (isTogglingList) {
      return;
    }

    if (!user) {
      showToast(appStrings.toasts.signInToAddToWatchlist);
      return;
    }

    if (!activeProfile?.id) {
      showToast(appStrings.toasts.selectProfileToAddToWatchlist);
      return;
    }

    setIsTogglingList(true);
    const profileId = activeProfile.id;
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(profileId, selectedMovie.id);
        setIsInWatchlist(false);
        showToast(appStrings.toasts.removedFromWatchlist);
      } else {
        await addToWatchlist(profileId, selectedMovie);
        setIsInWatchlist(true);
        showToast(appStrings.toasts.addedToWatchlist);
      }
    } catch (error) {
      console.log('Toggle watchlist error:', error);
      // Recheck actual remote state to ensure UI accuracy
      try {
        const item = await getWatchlistItem(profileId, selectedMovie.id);
        setIsInWatchlist(Boolean(item));
      } catch {
        // ignore
      }
    } finally {
      setIsTogglingList(false);
    }
  };

  const renderDetailItem = () => (
    <MovieDetailBody
      selectedMovie={selectedMovie}
      recommendations={recommendations}
      focusedAction={focusedAction}
      continueWatchProgress={continueWatchProgress}
      isInWatchlist={isInWatchlist}
      isFavourite={isInWatchlist}
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
          console.log('Remove continue watch error:', error);
        }
      }}
      onToggleWatchlist={handleToggleWatchlist}
      onAddFavourite={handleToggleWatchlist}
      onRemoveFavourite={handleToggleWatchlist}
      onFocusAction={(action) => {
        setIsMenuExpanded(false);
        setFocusedAction(action);
      }}
      onBlurAction={() => setFocusedAction(null)}
      onCardFocus={collapseMenu}
    />
  );

  const backdropSource = isContentAllowed
    ? selectedMovie.image
    : require('../assets/background.png');

  return (
    <ImageBackground
      source={backdropSource}
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

        {!isContentAllowed ? (
          <ContentBlockedBanner
            title={appStrings.parentalControls.contentRestrictedTitle}
            message={appStrings.parentalControls.contentRestrictedMessage}
            testID="movie-detail-blocked-state"
          />
        ) : (
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
        )}
      </View>
    </ImageBackground>
  );
};
