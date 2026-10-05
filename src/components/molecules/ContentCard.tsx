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
}: ContentCardProps) => {
  const navigation = useSafeNavigation();
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
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
        },
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
      if (videoUrl) {
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
          },
          videoUrl,
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
