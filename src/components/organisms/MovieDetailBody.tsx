import React from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {HomeContentItem} from '../../data/home';
import {EpisodeItem} from '../../types/episode';
import {CastMember} from '../../services/contentDetailsService';
import {strings} from '../../constants/strings';
import {ContentCard} from '../molecules/ContentCard';
import {styles} from '../../screens/MovieDetailScreen.styles';
import {isKeyDown, isSelectEvent} from '../../utils/inputUtils';
import {analyticsService} from '../../analytics';

export interface MovieDetailBodyProps {
  selectedMovie: HomeContentItem;
  recommendations: HomeContentItem[];
  focusedAction:
    | 'play'
    | 'list'
    | 'back'
    | 'favourites'
    | 'continueWatch'
    | 'trailer'
    | 'subscribe'
    | null;
  continueWatchProgress: number | null;
  isFavourite?: boolean;
  isInWatchlist?: boolean;
  toastMessage?: string | null;
  isMenuOpen?: boolean;
  onMenuEscapeLeft?: () => void;
  lastFocusedArea?: 'actions' | 'seasons' | 'episodes' | 'cast' | 'recommendations';
  onFocusAction: (
    action:
      | 'play'
      | 'list'
      | 'back'
      | 'favourites'
      | 'continueWatch'
      | 'trailer'
      | 'subscribe',
  ) => void;
  onBlurAction: () => void;
  onCardFocus: () => void;
  onAddFavourite?: () => void;
  onRemoveFavourite?: () => void;
  onToggleWatchlist?: () => void;
  onRemoveContinueWatch: () => void;
  selectionSource?: string;
  onWatchPress?: () => void;

  // Rich series extensions
  isSeries?: boolean;
  seasons?: number[];
  selectedSeason?: number;
  onSelectSeason?: (seasonNumber: number) => void;
  episodes?: EpisodeItem[];
  episodeProgressMap?: Record<string, number>;
  onPlayEpisode?: (episode: EpisodeItem) => void;

  // Cast & crew extensions
  castMembers?: CastMember[];

  // Entitlement extensions
  isEntitled?: boolean;
  entitlementBadge?: string;
  onSubscribePress?: () => void;

  // Trailer extensions
  hasTrailer?: boolean;
  onTrailerPress?: () => void;

  // Primary action label override
  primaryActionLabel?: string;
}

export const MovieDetailBody = ({
  selectedMovie,
  recommendations,
  focusedAction,
  continueWatchProgress,
  isFavourite = false,
  isInWatchlist = false,
  toastMessage,
  isMenuOpen = false,
  onMenuEscapeLeft,
  lastFocusedArea = 'actions',
  onFocusAction,
  onBlurAction,
  onCardFocus,
  onAddFavourite,
  onRemoveFavourite,
  onToggleWatchlist,
  onRemoveContinueWatch,
  selectionSource,
  onWatchPress,
  isSeries = false,
  seasons = [1],
  selectedSeason = 1,
  onSelectSeason,
  episodes = [],
  episodeProgressMap = {},
  onPlayEpisode,
  castMembers = [],
  isEntitled = true,
  entitlementBadge,
  onSubscribePress,
  hasTrailer = false,
  onTrailerPress,
  primaryActionLabel,
}: MovieDetailBodyProps) => {
  const navigation = useNavigation<any>();
  const inList = isInWatchlist || isFavourite;
  const handleToggleList =
    onToggleWatchlist || (inList ? onRemoveFavourite : onAddFavourite);

  const defaultPoster = require('../../assets/background.png');
  const posterSource = selectedMovie?.image || defaultPoster;

  const handleWatchPress = () => {
    if (onWatchPress) {
      onWatchPress();
      return;
    }
    const isCW =
      selectionSource === 'continue_watching' ||
      (continueWatchProgress !== null && continueWatchProgress > 0);
    const resolvedContentType =
      selectedMovie.contentType ||
      (selectedMovie.meta?.includes('Series') || isSeries ? 'series' : 'movie');

    analyticsService
      .trackContentSelected({
        content_id: selectedMovie.id,
        content_type: resolvedContentType,
        content_title: selectedMovie.title,
        source_screen: 'MovieDetail',
        source_component: isCW ? 'continue_watching_button' : 'play_button',
        destination_screen: 'VideoPlayer',
        action_name: isCW ? 'continue_watching' : 'play_content',
      })
      .catch(() => {});

    navigation.navigate(Routes.VideoPlayer, {
      movie: selectedMovie,
      videoUrl: selectedMovie.videoUrl,
      selectionSource: isCW ? 'continue_watching' : 'details',
      source: isCW ? 'continue_watching' : 'details',
      sourceScreen: 'MovieDetail',
    });
  };

  const handleBackPress = () => {
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Home);
    }
  };

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (focusedAction === 'play' && type === 'left') {
      onMenuEscapeLeft?.();
      return;
    }

    if (isSelectEvent(type)) {
      if (focusedAction === 'back') {
        handleBackPress();
        return;
      }
      if (focusedAction === 'subscribe') {
        onSubscribePress?.();
        return;
      }
      if (focusedAction === 'trailer') {
        onTrailerPress?.();
        return;
      }
      if (focusedAction === 'favourites' || focusedAction === 'list') {
        handleToggleList?.();
        return;
      }
      if (focusedAction === 'continueWatch') {
        onRemoveContinueWatch?.();
        return;
      }
      if (
        focusedAction === 'play' ||
        (!focusedAction && lastFocusedArea === 'actions' && !isMenuOpen)
      ) {
        handleWatchPress();
        return;
      }
    }
  });

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const effectivePlayLabel =
    primaryActionLabel ||
    (continueWatchProgress !== null && continueWatchProgress > 0
      ? '▶ Resume'
      : strings.actions.watchWithIcon);

  return (
    <View style={styles.mainCardContainer}>
      {/* Hero Section */}
      <View style={styles.mainCardRow}>
        <Image
          source={posterSource}
          style={styles.posterImage}
          resizeMode="cover"
        />
        <View style={styles.detailsColumn}>
          <View style={styles.badgeRow}>
            {entitlementBadge ? (
              <View style={styles.entitlementBadge}>
                <Text style={styles.entitlementBadgeText}>
                  {entitlementBadge}
                </Text>
              </View>
            ) : null}
            {selectedMovie.badge && (
              <Text style={styles.badge}>{selectedMovie.badge}</Text>
            )}
            {selectedMovie.rating && (
              <Text style={styles.ratingText}>{selectedMovie.rating}</Text>
            )}
            {selectedMovie.genre && (
              <Text style={styles.genreText}>{selectedMovie.genre}</Text>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {selectedMovie.title}
          </Text>

          {selectedMovie.meta && (
            <View style={styles.metaRow}>
              {selectedMovie.meta.map((m) => (
                <View key={m} style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{m}</Text>
                </View>
              ))}
              {isSeries && seasons.length > 0 && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {seasons.length === 1
                      ? '1 Season'
                      : `${seasons.length} Seasons`}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.description} numberOfLines={4}>
            {selectedMovie.description}
          </Text>

          {continueWatchProgress !== null && continueWatchProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {strings.hero.continueWatching}
                </Text>
                <Text style={styles.progressValueLabel}>
                  {Math.round(continueWatchProgress * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${continueWatchProgress * 100}%`},
                  ]}
                />
              </View>
            </View>
          )}

          {/* Cast & Director summary text (fallback when structured cast cards are absent) */}
          {selectedMovie.cast && castMembers.length === 0 && (
            <View style={styles.castRow}>
              <Text style={styles.castLabel}>
                {strings.movieDetail.castLabel}{' '}
                <Text style={styles.castText}>{selectedMovie.cast}</Text>
              </Text>
            </View>
          )}

          {selectedMovie.director && castMembers.length === 0 && (
            <View style={styles.castRow}>
              <Text style={styles.castLabel}>
                {strings.movieDetail.directorLabel}{' '}
                <Text style={styles.castText}>{selectedMovie.director}</Text>
              </Text>
            </View>
          )}

          {/* Primary Actions Row */}
          <View style={styles.actionsGuide}>
            {/* Play Button */}
            <TouchableOpacity
              style={[
                styles.playButton,
                focusedAction === 'play' && styles.focusedAction,
              ]}
              onFocus={() => onFocusAction('play')}
              onBlur={onBlurAction}
              onPress={handleWatchPress}
              hasTVPreferredFocus={
                lastFocusedArea === 'actions' && !isMenuOpen
              }
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.hero.playAccessibility(
                selectedMovie.title,
              )}
              testID="detail-play-button">
              <Text style={styles.playButtonText}>{effectivePlayLabel}</Text>
            </TouchableOpacity>

            {/* Subscribe / Choose Plan Action if unentitled */}
            {!isEntitled && onSubscribePress && (
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  focusedAction === 'subscribe' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('subscribe')}
                onBlur={onBlurAction}
                onPress={onSubscribePress}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel="Choose Plan"
                testID="entitlement-action-button">
                <Text style={styles.subscribeButtonText}>
                  Choose Plan
                </Text>
              </TouchableOpacity>
            )}

            {/* Trailer Action */}
            {hasTrailer && onTrailerPress && (
              <TouchableOpacity
                style={[
                  styles.trailerButton,
                  focusedAction === 'trailer' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('trailer')}
                onBlur={onBlurAction}
                onPress={onTrailerPress}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.actions.trailer}
                testID="detail-trailer-button">
                <Text style={styles.trailerButtonText}>
                  {strings.actions.trailer}
                </Text>
              </TouchableOpacity>
            )}

            {/* Remove from Continue Watching if present */}
            {continueWatchProgress !== null && continueWatchProgress > 0 && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.removeWatchlistButton,
                  focusedAction === 'continueWatch' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('continueWatch')}
                onBlur={onBlurAction}
                onPress={onRemoveContinueWatch}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.removeWatchlist} ${selectedMovie.title}`}
                testID="remove-watchlist-button">
                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.removeWatchlistText,
                  ]}>
                  {strings.actions.watchlist}
                </Text>
              </TouchableOpacity>
            )}

            {/* Watchlist toggle */}
            {inList ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.removeFavouriteButton,
                  focusedAction === 'favourites' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('favourites')}
                onBlur={onBlurAction}
                onPress={handleToggleList}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.removeFromMyList} ${selectedMovie.title}`}
                testID="my-list-button">
                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.removeFavouriteText,
                  ]}>
                  {strings.actions.inMyList}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.addFavouriteButton,
                  focusedAction === 'favourites' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('favourites')}
                onBlur={onBlurAction}
                onPress={handleToggleList}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.addToMyList} ${selectedMovie.title}`}
                testID="my-list-button">
                <Text
                  style={[styles.secondaryButtonText, styles.addFavouriteText]}>
                  {strings.actions.addToMyList}
                </Text>
              </TouchableOpacity>
            )}

            {/* Back action */}
            <TouchableOpacity
              style={[
                styles.backButton,
                focusedAction === 'back' && styles.focusedAction,
              ]}
              onFocus={() => onFocusAction('back')}
              onBlur={onBlurAction}
              onPress={handleBackPress}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.actions.goBack}
              testID="detail-back-button">
              <Text style={styles.backButtonText}>
                {strings.actions.backWithChevron}
              </Text>
            </TouchableOpacity>
          </View>

          {toastMessage ? (
            <View style={styles.inlineToast}>
              <Text style={styles.inlineToastText}>{toastMessage}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Series Season Selector & Episode List */}
      {isSeries && (
        <View style={styles.seasonsSection}>
          <Text style={styles.sectionTitle}>
            {strings.movieDetail.seasons || 'Seasons'}
          </Text>

          {/* Season Selector Tabs */}
          <View style={styles.seasonTabsContainer} testID="season-selector">
            {seasons.map((seasonNum) => {
              const isSelected = seasonNum === selectedSeason;
              return (
                <TouchableOpacity
                  key={`season-${seasonNum}`}
                  style={[
                    styles.seasonTab,
                    isSelected && styles.seasonTabSelected,
                  ]}
                  onPress={() => onSelectSeason?.(seasonNum)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{selected: isSelected}}
                  testID={`season-tab-${seasonNum}`}>
                  <Text
                    style={[
                      styles.seasonTabText,
                      isSelected && styles.seasonTabTextSelected,
                    ]}>
                    {strings.nextEpisode.seasonTitle(seasonNum)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Episode List */}
          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>
              {`Season ${selectedSeason} Episodes`}
            </Text>

            {episodes.length === 0 ? (
              <View style={styles.emptyEpisodesContainer}>
                <Text style={styles.emptyEpisodesText}>
                  {strings.nextEpisode.noFurtherEpisodes}
                </Text>
              </View>
            ) : (
              <FlatList
                horizontal
                data={episodes}
                keyExtractor={(ep) => ep.id || `ep-${ep.episodeNumber}`}
                testID="episode-list"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.episodesList}
                renderItem={({item: ep}) => {
                  const epProgress = episodeProgressMap[ep.id] || 0;
                  const isWatched = epProgress >= 0.95;
                  const epThumbnail =
                    ep.image ||
                    (ep.thumbnailUrl ? {uri: ep.thumbnailUrl} : posterSource);

                  return (
                    <TouchableOpacity
                      style={styles.episodeCard}
                      onPress={() => onPlayEpisode?.(ep)}
                      activeOpacity={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`Episode ${ep.episodeNumber}: ${ep.title}`}
                      testID={`episode-card-${ep.id}`}>
                      <View style={styles.episodeThumbnailWrapper}>
                        <Image
                          source={epThumbnail}
                          style={styles.episodeThumbnail}
                          resizeMode="cover"
                        />
                        {ep.durationFormatted && (
                          <View style={styles.episodeDurationBadge}>
                            <Text style={styles.episodeDurationText}>
                              {ep.durationFormatted}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.episodeDetails}>
                        <View style={styles.episodeHeaderRow}>
                          <Text style={styles.episodeBadge}>
                            {`EP ${ep.episodeNumber}`}
                          </Text>
                          {ep.rating && (
                            <Text style={styles.episodeRating}>
                              {ep.rating}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.episodeTitle} numberOfLines={1}>
                          {ep.title}
                        </Text>
                        {ep.description ? (
                          <Text
                            style={styles.episodeDescription}
                            numberOfLines={2}>
                            {ep.description}
                          </Text>
                        ) : null}
                        {epProgress > 0 && !isWatched && (
                          <View style={styles.episodeProgressContainer}>
                            <View
                              style={[
                                styles.episodeProgressBar,
                                {width: `${epProgress * 100}%`},
                              ]}
                            />
                          </View>
                        )}
                        {isWatched && (
                          <View style={styles.episodeWatchedPill}>
                            <Text style={styles.episodeWatchedText}>
                              {strings.nextEpisode.watchedEpisode}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      )}

      {/* Cast & Crew Section */}
      {castMembers.length > 0 && (
        <View style={styles.castSection}>
          <Text style={styles.sectionTitle}>
            {strings.movieDetail.castCrew}
          </Text>
          <FlatList
            horizontal
            data={castMembers}
            keyExtractor={(item) => item.id}
            testID="cast-crew-list"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castList}
            renderItem={({item}) => (
              <View style={styles.castCard} testID={`cast-card-${item.id}`}>
                <View style={styles.castAvatar}>
                  <Text style={styles.castInitials}>
                    {getInitials(item.name)}
                  </Text>
                </View>
                <Text style={styles.castName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.castRole}>{item.role}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* More Like This / Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>
          {strings.movieDetail.moreLikeThis}
        </Text>
        <FlatList
          horizontal
          data={recommendations}
          keyExtractor={(item) => `rec-${item.id}`}
          testID="recommendations-list"
          renderItem={({item, index}) => (
            <ContentCard
              {...item}
              layout="portrait"
              selectionSource="MovieDetail"
              rowId="recommendations"
              onFocus={onCardFocus}
              hasTVPreferredFocus={
                lastFocusedArea === 'recommendations' &&
                !isMenuOpen &&
                index === 0
              }
              onMenuEscapeLeft={index === 0 ? onMenuEscapeLeft : undefined}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recList}
        />
      </View>
    </View>
  );
};
