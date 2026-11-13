import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentBlockedBanner} from '../components/molecules/ContentBlockedBanner';
import {MovieDetailBody} from '../components/organisms/MovieDetailBody';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {HomeContentItem, homeContentRows} from '../data/home';
import {EpisodeItem} from '../types/episode';
import {AppDetails} from '../constants/appDetails';
import {styles} from './MovieDetailScreen.styles';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {filterContentItem} from '../utils/searchUtils';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {entitlementService} from '../services/entitlementService';
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
import {analyticsService} from '../analytics';
import {findContentById, deeplinkManager} from '../utils/deeplink';
import {isBackEvent, isKeyDown, isPlayPauseEvent} from '../utils/inputUtils';
import {
  resolveContentDetails,
  isSeriesContent,
  getSeriesSeasons,
  getEpisodesForSeries,
  parseCastAndCrew,
  getRelatedContent,
  getResumeStateForContent,
  CastMember,
} from '../services/contentDetailsService';
import {saveLastWatchedEpisode} from '../services/episodeService';

export const MovieDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const contentGuideRef = useRef<any>(null);
  const isAuthorizingRef = useRef(false);
  const {user, userProfile} = useAuth();
  const {activeProfile} = useProfile();

  // Initial synchronous resolution
  const initialMovieParam = route.params?.movie;
  const initialIdParam = route.params?.movieId;
  const synchronousResolved =
    initialMovieParam ||
    findContentById(initialIdParam) ||
    (!initialIdParam ? homeContentRows[0].items[0] : null);

  const [isLoading, setIsLoading] = useState(!synchronousResolved && Boolean(initialIdParam));
  const [isNotFound, setIsNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [lastFocusedArea, setLastFocusedArea] = useState<
    'actions' | 'seasons' | 'episodes' | 'cast' | 'recommendations'
  >('actions');
  const [focusedAction, setFocusedAction] = useState<
    | 'play'
    | 'list'
    | 'back'
    | 'favourites'
    | 'continueWatch'
    | 'trailer'
    | 'subscribe'
    | null
  >(null);

  const defaultItem = synchronousResolved || homeContentRows[0].items[0];
  const [selectedMovie, setSelectedMovie] = useState<HomeContentItem>(defaultItem);
  const [isSeries, setIsSeries] = useState<boolean>(() =>
    isSeriesContent(defaultItem),
  );
  const [seasons, setSeasons] = useState<number[]>(() =>
    getSeriesSeasons(defaultItem),
  );
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<EpisodeItem[]>(() =>
    getEpisodesForSeries(defaultItem, 1),
  );
  const [episodeProgressMap, setEpisodeProgressMap] = useState<
    Record<string, number>
  >({});
  const [castMembers, setCastMembers] = useState<CastMember[]>(() =>
    parseCastAndCrew(defaultItem),
  );
  const [recommendations, setRecommendations] = useState<HomeContentItem[]>(
    () => getRelatedContent(defaultItem, activeProfile),
  );
  const [continueWatchProgress, setContinueWatchProgress] = useState<
    number | null
  >(null);
  const [resumableEpisode, setResumableEpisode] =
    useState<EpisodeItem | null>(null);
  const [primaryActionLabel, setPrimaryActionLabel] = useState<string>(
    appStrings.actions.watchWithIcon,
  );
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTogglingList, setIsTogglingList] = useState(false);

  const isContentAllowed = canProfileAccessContent(
    activeProfile,
    selectedMovie,
  );
  const entitlementAccess = entitlementService.checkContentAccess(
    userProfile,
    activeProfile,
    selectedMovie,
  );

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  // Main loader for content metadata, series episodes, watchlist, and resume state
  const loadFullDetails = useCallback(
    async (isActive: () => boolean) => {
      const movieIdParam = route.params?.movieId;
      const movieParam = route.params?.movie;

      if (!movieIdParam && !movieParam && !synchronousResolved) {
        if (isActive()) {
          setIsNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!synchronousResolved) {
          setIsLoading(true);
        }

        const resolved = await resolveContentDetails(movieIdParam, movieParam);
        if (!isActive()) return;

        if (!resolved) {
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }

        setIsNotFound(false);
        setSelectedMovie(resolved);

        const seriesCheck = isSeriesContent(resolved);
        setIsSeries(seriesCheck);

        const resolvedSeasons = getSeriesSeasons(resolved);
        setSeasons(resolvedSeasons);
        const initialSeason = resolvedSeasons[0] || 1;
        setSelectedSeason(initialSeason);

        const eps = getEpisodesForSeries(resolved, initialSeason);
        setSeasonEpisodes(eps);

        const cast = parseCastAndCrew(resolved);
        setCastMembers(cast);

        const related = getRelatedContent(resolved, activeProfile);
        setRecommendations(related);

        // Resume & Continue Watching State
        if (activeProfile?.id) {
          const resumeInfo = await getResumeStateForContent(
            resolved,
            activeProfile.id,
          );
          if (isActive()) {
            setContinueWatchProgress(resumeInfo.progress);
            setResumableEpisode(resumeInfo.resumableEpisode);
            setPrimaryActionLabel(resumeInfo.primaryActionLabel);
          }

          // Watchlist state
          const watchlistItem = await getWatchlistItem(
            activeProfile.id,
            resolved.id,
          );
          if (isActive()) {
            setIsInWatchlist(Boolean(watchlistItem));
            if (watchlistItem) {
              analyticsService.syncWatchlistState(activeProfile.id, [
                resolved.id,
              ]);
            }
          }

          // Fetch progress for individual episodes if series
          if (seriesCheck && eps.length > 0) {
            const progMap: Record<string, number> = {};
            await Promise.all(
              eps.map(async (ep) => {
                const epRecord = await fetchContinueWatchForContent(
                  activeProfile.id,
                  ep.id,
                );
                if (epRecord && epRecord.progress > 0) {
                  progMap[ep.id] = epRecord.progress;
                }
              }),
            );
            if (isActive()) {
              setEpisodeProgressMap(progMap);
            }
          }
        }
      } catch (err) {
        console.log('Error loading content details:', err);
        if (isActive() && !synchronousResolved) {
          setIsNotFound(true);
        }
      } finally {
        if (isActive()) {
          setIsLoading(false);
        }
      }
    },
    [activeProfile, route.params?.movie, route.params?.movieId, synchronousResolved],
  );

  useEffect(() => {
    let active = true;
    loadFullDetails(() => active);
    return () => {
      active = false;
    };
  }, [loadFullDetails]);

  // Track content details viewed
  useEffect(() => {
    if (selectedMovie?.id) {
      const resolvedContentType =
        selectedMovie.contentType || (isSeries ? 'series' : 'movie');

      deeplinkManager
        .onDestinationOpened('details', resolvedContentType)
        .catch(() => {});

      analyticsService
        .trackContentDetailsViewed({
          content_id: selectedMovie.id,
          content_type: resolvedContentType,
          content_title: selectedMovie.title,
          source_screen:
            route.params?.sourceScreen ||
            route.params?.source_screen ||
            'Home',
        })
        .catch(() => {});
    }
  }, [isSeries, route.params?.sourceScreen, route.params?.source_screen, selectedMovie.id, selectedMovie.title, selectedMovie.contentType]);

  // Season change handler
  const handleSelectSeason = useCallback(
    async (seasonNum: number) => {
      setSelectedSeason(seasonNum);
      const eps = getEpisodesForSeries(selectedMovie, seasonNum);
      setSeasonEpisodes(eps);

      if (activeProfile?.id && eps.length > 0) {
        const progMap: Record<string, number> = {...episodeProgressMap};
        await Promise.all(
          eps.map(async (ep) => {
            const epRecord = await fetchContinueWatchForContent(
              activeProfile.id,
              ep.id,
            );
            if (epRecord && epRecord.progress > 0) {
              progMap[ep.id] = epRecord.progress;
            }
          }),
        );
        setEpisodeProgressMap(progMap);
      }
    },
    [activeProfile?.id, episodeProgressMap, selectedMovie],
  );

  // Play Action Handler
  const handlePlayAction = useCallback(
    (targetEpisode?: EpisodeItem) => {
      if (isAuthorizingRef.current) return;
      isAuthorizingRef.current = true;
      setTimeout(() => {
        isAuthorizingRef.current = false;
      }, 800);

      // Parental Controls Check
      if (!isContentAllowed) {
        return;
      }

      const activeEp = targetEpisode || resumableEpisode;
      const targetContent = activeEp
        ? {
            ...selectedMovie,
            id: activeEp.id,
            title: activeEp.title,
            seriesTitle: selectedMovie.title,
            seriesId: selectedMovie.id,
            seasonNumber: activeEp.seasonNumber,
            episodeNumber: activeEp.episodeNumber,
            videoUrl: activeEp.videoUrl,
            image: activeEp.image || selectedMovie.image,
            description: activeEp.description || selectedMovie.description,
            contentType: 'episode' as const,
          }
        : selectedMovie;

      // Persist last watched episode if episodic
      if (activeEp && activeProfile?.id) {
        saveLastWatchedEpisode(
          activeProfile.id,
          selectedMovie.id,
          activeEp.id,
        ).catch(() => {});
      }

      const isCW =
        route?.params?.selectionSource === 'continue_watching' ||
        (continueWatchProgress !== null && continueWatchProgress > 0);
      const resolvedContentType = targetContent.contentType || (isSeries ? 'series' : 'movie');

      analyticsService
        .trackContentSelected({
          content_id: targetContent.id,
          content_type: resolvedContentType,
          content_title: targetContent.title,
          source_screen: 'MovieDetail',
          source_component: targetEpisode
            ? 'episode_card'
            : isCW
            ? 'continue_watching_button'
            : 'play_button',
          destination_screen: 'VideoPlayer',
          action_name: isCW ? 'continue_watching' : 'play_content',
          series_id: activeEp ? selectedMovie.id : undefined,
          episode_id: activeEp ? activeEp.id : undefined,
        })
        .catch(() => {});

      navigation.navigate(Routes.VideoPlayer, {
        movie: targetContent,
        videoUrl: targetContent.videoUrl,
        selectionSource: isCW ? 'continue_watching' : 'details',
        source: isCW ? 'continue_watching' : 'details',
        sourceScreen: 'MovieDetail',
      });
    },
    [
      activeProfile?.id,
      continueWatchProgress,
      isContentAllowed,
      isSeries,
      navigation,
      resumableEpisode,
      route?.params?.selectionSource,
      selectedMovie,
    ],
  );

  // Trailer handler
  const handleTrailerPress = useCallback(() => {
    const trailerUrl =
      (selectedMovie as any).trailerUrl ||
      (selectedMovie.videoUrl?.includes('trailer')
        ? selectedMovie.videoUrl
        : null);

    if (trailerUrl) {
      navigation.navigate(Routes.VideoPlayer, {
        movie: selectedMovie,
        videoUrl: trailerUrl,
        isTrailer: true,
        selectionSource: 'details_trailer',
        source: 'details',
        sourceScreen: 'MovieDetail',
      });
    }
  }, [navigation, selectedMovie]);

  // Subscription action handler
  const handleSubscribePress = useCallback(() => {
    navigation.navigate(Routes.Subscription, {
      sourceScreen: 'MovieDetail',
    });
  }, [navigation]);

  // Watchlist Toggle
  const handleToggleWatchlist = useCallback(async () => {
    if (isTogglingList) return;

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
    const resolvedContentType =
      selectedMovie.contentType || (isSeries ? 'series' : 'movie');

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(profileId, selectedMovie.id);
        setIsInWatchlist(false);
        showToast(appStrings.toasts.removedFromWatchlist);
        await analyticsService
          .trackWatchlistRemoved({
            content_type: resolvedContentType,
            action_source: 'details',
            content_id: selectedMovie.id,
            content_title: selectedMovie.title,
            source_screen: 'MovieDetail',
            source_component: 'details_action_button',
            success: true,
          })
          .catch(() => {});
      } else {
        await addToWatchlist(profileId, selectedMovie);
        setIsInWatchlist(true);
        showToast(appStrings.toasts.addedToWatchlist);
        await analyticsService
          .trackWatchlistAdded({
            content_type: resolvedContentType,
            action_source: 'details',
            content_id: selectedMovie.id,
            content_title: selectedMovie.title,
            source_screen: 'MovieDetail',
            source_component: 'details_action_button',
            success: true,
          })
          .catch(() => {});
      }
    } catch (error) {
      console.log('Toggle watchlist error:', error);
      try {
        const item = await getWatchlistItem(profileId, selectedMovie.id);
        setIsInWatchlist(Boolean(item));
        if (item) {
          analyticsService.syncWatchlistState(profileId, [selectedMovie.id]);
        }
      } catch {
        // ignore
      }
    } finally {
      setIsTogglingList(false);
    }
  }, [
    activeProfile?.id,
    isInWatchlist,
    isSeries,
    isTogglingList,
    selectedMovie,
    showToast,
    user,
  ]);

  // Remote key handling
  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      if (isMenuExpanded) {
        setIsMenuExpanded(false);
      } else if (isSearchFocused) {
        setIsSearchFocused(false);
      } else {
        navigation.navigate(Routes.Home);
      }
      return;
    }

    if (isPlayPauseEvent(type)) {
      if (!isMenuExpanded) {
        handlePlayAction();
      }
    }
  });

  const backdropSource = isContentAllowed && selectedMovie?.image
    ? selectedMovie.image
    : require('../assets/background.png');

  const hasTrailer = Boolean(
    (selectedMovie as any).trailerUrl ||
      (selectedMovie.videoUrl && selectedMovie.videoUrl.includes('trailer')),
  );

  const entitlementBadge = !entitlementAccess.isEntitled && user
    ? entitlementAccess.reason === 'upgrade_required'
      ? 'PREMIUM 4K REQUIRED'
      : 'SUBSCRIPTION REQUIRED'
    : undefined;

  const filteredRecommendations = recommendations.filter((item) =>
    filterContentItem(item, searchQuery),
  );

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
        onMenuFocus={() => setIsMenuExpanded(true)}
        onMenuBlur={() => setIsMenuExpanded(false)}
        preferActiveFocus={isMenuExpanded}
        destinations={
          contentGuideRef.current ? [contentGuideRef.current] : undefined
        }
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
              setIsMenuExpanded(false);
            }}
            onSearchBlur={() => setIsSearchFocused(false)}
            searchHasTVPreferredFocus={isSearchFocused}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer} testID="detail-loading-state">
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : isNotFound ? (
          <View style={styles.centerContainer} testID="detail-error-state">
            <View style={styles.errorCard}>
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>CONTENT NOT FOUND</Text>
              </View>
              <Text style={styles.errorTitle}>Title Unavailable</Text>
              <Text style={styles.errorMessage}>
                The requested movie or series could not be found or is currently
                unavailable.
              </Text>
              <View style={styles.errorButtonsRow}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadFullDetails(() => true)}
                  accessibilityRole="button"
                  accessibilityLabel="Retry Loading"
                  testID="detail-retry-button">
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.homeButton}
                  onPress={() => navigation.navigate(Routes.Home)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Home"
                  testID="detail-error-home-button">
                  <Text style={styles.homeButtonText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : !isContentAllowed ? (
          <ContentBlockedBanner
            title={appStrings.parentalControls.contentRestrictedTitle}
            message={appStrings.parentalControls.contentRestrictedMessage}
            testID="movie-detail-blocked-state"
          />
        ) : (
          <TVFocusGuideView ref={contentGuideRef} style={styles.background}>
            <FlatList
              data={[selectedMovie]}
              extraData={{
                continueWatchProgress,
                isInWatchlist,
                selectedSeason,
                episodeProgressMap,
                focusedAction,
                lastFocusedArea,
                seasons,
                seasonEpisodes,
                castMembers,
                filteredRecommendations,
                primaryActionLabel,
              }}
              keyExtractor={(item) => item.id || item.title}
              showsVerticalScrollIndicator={false}
              renderItem={() => (
                <MovieDetailBody
                  selectedMovie={selectedMovie}
                  recommendations={filteredRecommendations}
                  focusedAction={focusedAction}
                  continueWatchProgress={continueWatchProgress}
                  selectionSource={
                    route?.params?.selectionSource || route?.params?.source
                  }
                  isInWatchlist={isInWatchlist}
                  isFavourite={isInWatchlist}
                  toastMessage={toastMsg}
                  isMenuOpen={isMenuExpanded}
                  lastFocusedArea={lastFocusedArea}
                  onMenuEscapeLeft={() => setIsMenuExpanded(true)}
                  onFocusAction={(action) => {
                    setLastFocusedArea('actions');
                    setIsMenuExpanded(false);
                    setFocusedAction(action);
                  }}
                  onBlurAction={() => setFocusedAction(null)}
                  onWatchPress={() => handlePlayAction()}
                  onCardFocus={() => {
                    setLastFocusedArea('recommendations');
                    setIsMenuExpanded(false);
                  }}
                  onToggleWatchlist={handleToggleWatchlist}
                  onAddFavourite={handleToggleWatchlist}
                  onRemoveFavourite={handleToggleWatchlist}
                  onRemoveContinueWatch={async () => {
                    try {
                      if (activeProfile?.id) {
                        await clearContinueWatchProgress(
                          activeProfile.id,
                          selectedMovie.id,
                        );
                      }
                      setContinueWatchProgress(null);
                      setPrimaryActionLabel(appStrings.actions.watchWithIcon);
                    } catch (error) {
                      console.log('Remove continue watch error:', error);
                    }
                  }}
                  // Series props
                  isSeries={isSeries}
                  seasons={seasons}
                  selectedSeason={selectedSeason}
                  onSelectSeason={handleSelectSeason}
                  episodes={seasonEpisodes}
                  episodeProgressMap={episodeProgressMap}
                  onPlayEpisode={(ep) => handlePlayAction(ep)}
                  // Cast & crew
                  castMembers={castMembers}
                  // Entitlement
                  isEntitled={entitlementAccess.isEntitled}
                  entitlementBadge={entitlementBadge}
                  onSubscribePress={handleSubscribePress}
                  // Trailer
                  hasTrailer={hasTrailer}
                  onTrailerPress={handleTrailerPress}
                  primaryActionLabel={primaryActionLabel}
                />
              )}
            />
          </TVFocusGuideView>
        )}
      </View>
    </ImageBackground>
  );
};
