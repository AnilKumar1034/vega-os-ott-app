import React, {useRef, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {isSelectEvent, isKeyDown} from '../../utils/inputUtils';
import {analyticsService} from '../../analytics';
import {styles} from './ContentCard.styles';

export type CardLayoutType = 'horizontal' | 'portrait' | 'grid';

export interface ContentCardProps {
  id?: string;
  title: string;
  image: ImageSourcePropType;
  testID?: string;
  progress?: number;
  badge?: string;
  description?: string;
  meta?: string[];
  rating?: string;
  genre?: string;
  cast?: string;
  director?: string;
  videoUrl?: string;
  layout?: CardLayoutType;
  onFocus?: () => void;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  onMenuEscapeLeft?: () => void;
  rowId?: string;
  isContinueWatching?: boolean;
  savedPositionSeconds?: number;
  contentType?: string;
  isWatchlist?: boolean;
  selectionSource?: string;
  isRecommendation?: boolean;
  recommendationSource?: string;
  position?: number;
  sectionName?: string;
}

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

export const ContentCard = ({
  id,
  title,
  image,
  testID,
  progress,
  badge,
  description,
  meta,
  rating,
  genre,
  cast,
  director,
  videoUrl,
  layout = 'horizontal',
  onFocus,
  onPress,
  hasTVPreferredFocus,
  onMenuEscapeLeft,
  rowId,
  isContinueWatching,
  savedPositionSeconds,
  contentType,
  isWatchlist,
  selectionSource,
  isRecommendation,
  recommendationSource,
  position,
  sectionName,
}: ContentCardProps) => {
  const navigation = useSafeNavigation();
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const trackSelectionIfContinueWatching = () => {
    if (isContinueWatching || rowId === 'continue-watching') {
      const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
      const resolvedContentType =
        contentType || (meta?.includes('Series') ? 'episode' : 'movie');
      const params: any = {
        content_id: contentId,
        contentId,
        content_type: resolvedContentType,
        contentType: resolvedContentType,
        content_title: title,
        contentTitle: title,
        source_screen: 'Home',
        sourceScreen: 'Home',
        source_component: 'continue_watching',
        sourceComponent: 'continue_watching',
        selection_source: 'continue_watching',
        selectionSource: 'continue_watching',
      };
      if (
        savedPositionSeconds !== undefined &&
        Number.isFinite(savedPositionSeconds) &&
        savedPositionSeconds > 0
      ) {
        params.saved_position_seconds = Math.floor(savedPositionSeconds);
        params.savedPositionSeconds = Math.floor(savedPositionSeconds);
      }
      analyticsService.trackContinueWatchingSelected(params).catch(() => {});
    }
  };

  const trackSelectionIfWatchlist = (destinationType: 'details' | 'player') => {
    if (isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist') {
      const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
      const resolvedContentType =
        contentType || (meta?.includes('Series') ? 'series' : 'movie');
      const params = {
        content_id: contentId,
        contentId,
        content_type: resolvedContentType,
        contentType: resolvedContentType,
        content_title: title,
        contentTitle: title,
        source_screen: 'MyList',
        sourceScreen: 'MyList',
        source_component: 'my_list',
        sourceComponent: 'my_list',
        destination_type: destinationType,
        destinationType: destinationType,
        selection_source: 'watchlist',
        selectionSource: 'watchlist',
      };
      analyticsService.trackWatchlistItemSelected(params).catch(() => {});
    }
  };

  const isRec =
    isRecommendation ||
    rowId === 'recommended-for-you' ||
    rowId === 'because-you-watched' ||
    rowId === 'recently-added';

  const resolvedSectionName =
    sectionName ||
    (rowId === 'recommended-for-you'
      ? 'Recommended for You'
      : rowId === 'because-you-watched'
      ? 'Because You Watched'
      : rowId === 'recently-added'
      ? 'Recently Added'
      : 'Recommendations');

  const resolvedRecommendationSource =
    recommendationSource ||
    (rowId === 'recommended-for-you'
      ? 'genre_match'
      : rowId === 'because-you-watched'
      ? 'viewing_history'
      : rowId === 'recently-added'
      ? 'recently_added'
      : 'catalog_fallback');

  const trackSelectionIfRecommendation = (
    actionName: string = 'open_details',
    destScreen: string = 'MovieDetail',
  ) => {
    if (isRec) {
      const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
      const resolvedContentType =
        contentType || (meta?.includes('Series') ? 'series' : 'movie');

      analyticsService
        .trackRecommendationSelected({
          content_id: contentId,
          content_type: resolvedContentType,
          content_title: title,
          section_name: resolvedSectionName,
          section_id: rowId,
          recommendation_source: resolvedRecommendationSource,
          position,
          source_screen: 'Home',
          source_component: rowId || 'recommendations',
          destination_screen: destScreen,
          action_name: actionName,
        })
        .catch(() => {});
    }
  };

  const handlePress = () => {
    trackSelectionIfContinueWatching();
    trackSelectionIfWatchlist('details');
    trackSelectionIfRecommendation('open_details', 'MovieDetail');

    const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
    const resolvedContentType =
      contentType || (meta?.includes('Series') ? 'series' : 'movie');
    const isCW = isContinueWatching || rowId === 'continue-watching';
    const isWL = isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist';
    const sourceScreen = isCW
      ? 'ContinueWatching'
      : isWL
      ? 'MyList'
      : isRec
      ? 'Recommendations'
      : selectionSource || 'Home';

    analyticsService
      .trackContentSelected({
        content_id: contentId,
        content_type: resolvedContentType,
        content_title: title,
        source_screen: sourceScreen,
        source_component: rowId || (isCW ? 'continue_watching' : isWL ? 'my_list' : isRec ? 'recommendations' : 'content_card'),
        destination_screen: 'MovieDetail',
        action_name: 'open_details',
      })
      .catch(() => {});

    if (sourceScreen === 'Search' || selectionSource === 'Search') {
      analyticsService
        .trackSearchResultSelected({
          content_id: contentId,
          content_type: resolvedContentType,
          content_title: title,
          source_screen: 'Search',
          source_component: rowId || 'search_results',
          destination_screen: 'MovieDetail',
        })
        .catch(() => {});
    }

    if (onPress) {
      onPress();
    } else {
      const navParams: Record<string, any> = {
        movie: {
          id: id || title.toLowerCase().replace(/\s+/g, '-'),
          title,
          image,
          description,
          meta,
          badge,
          rating,
          genre,
          cast,
          director,
          videoUrl,
          savedPositionSeconds,
          contentType,
        },
      };
      if (isCW) {
        navParams.selectionSource = 'continue_watching';
        navParams.source = 'continue_watching';
      } else if (isWL) {
        navParams.selectionSource = 'watchlist';
        navParams.source = 'watchlist';
      } else if (isRec) {
        navParams.isRecommendation = true;
        navParams.recommendationSource = resolvedRecommendationSource;
        navParams.selectionSource = 'recommendations';
        navParams.source = 'recommendations';
      }
      if (sourceScreen && sourceScreen !== 'Home') {
        navParams.sourceScreen = sourceScreen;
      }
      navigation.navigate(Routes.MovieDetail, navParams);
    }
  };

  useTVEventHandler((evt) => {
    if (!isFocusedRef.current || !evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();
    if (isSelectEvent(type)) {
      handlePress();
    } else if (type === 'left') {
      if (onMenuEscapeLeft) {
        setIsFocused(false);
        onMenuEscapeLeft();
      }
    } else if (type === 'play' || type === 'playpause') {
      const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
      const resolvedContentType =
        contentType || (meta?.includes('Series') ? 'series' : 'movie');
      const isCW = isContinueWatching || rowId === 'continue-watching';
      const isWL = isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist';
      const sourceScreen = isCW
        ? 'ContinueWatching'
        : isWL
        ? 'MyList'
        : selectionSource || 'Home';

      analyticsService
        .trackContentSelected({
          content_id: contentId,
          content_type: resolvedContentType,
          content_title: title,
          source_screen: sourceScreen,
          source_component: rowId || (isCW ? 'continue_watching' : isWL ? 'my_list' : 'content_card'),
          destination_screen: videoUrl ? 'VideoPlayer' : 'MovieDetail',
          action_name: 'play_content',
        })
        .catch(() => {});

      if (sourceScreen === 'Search' || selectionSource === 'Search') {
        analyticsService
          .trackSearchResultSelected({
            content_id: contentId,
            content_type: resolvedContentType,
            content_title: title,
            source_screen: 'Search',
            source_component: rowId || 'search_results',
            destination_screen: videoUrl ? 'VideoPlayer' : 'MovieDetail',
          })
          .catch(() => {});
      }

      trackSelectionIfContinueWatching();
      trackSelectionIfRecommendation('play_content', videoUrl ? 'VideoPlayer' : 'MovieDetail');
      if (videoUrl) {
        trackSelectionIfWatchlist('player');
        const playerParams: Record<string, any> = {
          movie: {
            id: id || title.toLowerCase().replace(/\s+/g, '-'),
            title,
            image,
            description,
            meta,
            badge,
            rating,
            genre,
            cast,
            director,
            videoUrl,
            savedPositionSeconds,
            contentType,
          },
          videoUrl,
        };
        if (isCW) {
          playerParams.selectionSource = 'continue_watching';
          playerParams.source = 'continue_watching';
        } else if (isWL) {
          playerParams.selectionSource = 'watchlist';
          playerParams.source = 'watchlist';
        } else if (isRec) {
          playerParams.isRecommendation = true;
          playerParams.recommendationSource = resolvedRecommendationSource;
          playerParams.sectionName = resolvedSectionName;
          playerParams.selectionSource = 'recommendations';
          playerParams.source = 'recommendations';
        }
        if (sourceScreen && sourceScreen !== 'Home') {
          playerParams.sourceScreen = sourceScreen;
        }
        navigation.navigate(Routes.VideoPlayer, playerParams);
      } else {
        handlePress();
      }
    }
  });

  const containerStyle = [
    styles.container,
    layout === 'portrait' && styles.portraitContainer,
    layout === 'grid' && styles.gridContainer,
    isFocused && styles.focused,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onFocus={() => {
        setIsFocused(true);
        const contentId = id || title.toLowerCase().replace(/\s+/g, '-');
        const resolvedContentType =
          contentType || (meta?.includes('Series') ? 'series' : 'movie');
        const isCW = isContinueWatching || rowId === 'continue-watching';
        const isWL = isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist';
        const sourceScreen = isCW
          ? 'ContinueWatching'
          : isWL
          ? 'MyList'
          : isRec
          ? 'Recommendations'
          : selectionSource || 'Home';

        analyticsService
          .trackContentImpression({
            content_id: contentId,
            content_type: resolvedContentType,
            content_title: title,
            source_screen: sourceScreen,
            source_component: rowId || 'content_card',
          })
          .catch(() => {});

        if (isRec) {
          analyticsService
            .trackRecommendationImpression({
              content_id: contentId,
              content_type: resolvedContentType,
              content_title: title,
              section_name: resolvedSectionName,
              section_id: rowId,
              recommendation_source: resolvedRecommendationSource,
              position,
              source_screen: 'Home',
              source_component: rowId || 'recommendations',
            })
            .catch(() => {});
        }

        onFocus?.();
      }}
      onBlur={() => setIsFocused(false)}
      onPress={handlePress}
      focusable={true}
      hasTVPreferredFocus={hasTVPreferredFocus}
      activeOpacity={1}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <Image source={image} style={styles.image} resizeMode="cover" />
      <View style={styles.imageShade} />

      {badge && (
        <Text
          style={[
            styles.badge,
            layout === 'portrait' && styles.portraitBadge,
            layout === 'grid' && styles.portraitBadge,
          ]}>
          {badge}
        </Text>
      )}

      {rating && (layout === 'portrait' || layout === 'grid') && (
        <Text style={styles.ratingBadge}>{rating}</Text>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {genre && (layout === 'portrait' || layout === 'grid') && (
          <Text style={styles.genreText} numberOfLines={1}>
            {genre}
          </Text>
        )}

        {progress !== undefined && layout === 'horizontal' && (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressValue, {width: `${progress * 100}%`}]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
