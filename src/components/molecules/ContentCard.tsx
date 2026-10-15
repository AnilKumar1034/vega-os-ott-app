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
        destination_type: destinationType,
        destinationType: destinationType,
        selection_source: 'watchlist',
        selectionSource: 'watchlist',
      };
      analyticsService.trackWatchlistItemSelected(params).catch(() => {});
    }
  };

  const handlePress = () => {
    trackSelectionIfContinueWatching();
    trackSelectionIfWatchlist('details');
    if (onPress) {
      onPress();
    } else {
      const isCW = isContinueWatching || rowId === 'continue-watching';
      const isWL = isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist';
      navigation.navigate(Routes.MovieDetail, {
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
        selectionSource: isCW ? 'continue_watching' : isWL ? 'watchlist' : undefined,
        source: isCW ? 'continue_watching' : isWL ? 'watchlist' : undefined,
      });
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
      trackSelectionIfContinueWatching();
      if (videoUrl) {
        trackSelectionIfWatchlist('player');
        const isCW = isContinueWatching || rowId === 'continue-watching';
        const isWL = isWatchlist || rowId === 'my-list' || selectionSource === 'watchlist';
        navigation.navigate(Routes.VideoPlayer, {
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
          selectionSource: isCW ? 'continue_watching' : isWL ? 'watchlist' : undefined,
          source: isCW ? 'continue_watching' : isWL ? 'watchlist' : undefined,
        });
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
