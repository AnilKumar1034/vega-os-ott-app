import React, {useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ShortsItem} from '../types/shorts.types';
import {DEFAULT_SHORTS_FALLBACK_THUMBNAIL, SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';
import {isKeyDown, isSelectEvent} from '../../../utils/inputUtils';

export interface ShortsCardProps {
  item: ShortsItem;
  isFocused?: boolean;
  isSelected?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  onMenuEscapeLeft?: () => void;
  testID?: string;
  width?: number;
  height?: number;
}

export const ShortsCard = ({
  item,
  isFocused: controlledFocused,
  isSelected = false,
  onFocus,
  onBlur,
  onPress,
  hasTVPreferredFocus = false,
  onMenuEscapeLeft,
  testID,
  width = 80,
  height = 142, // 9:16 aspect ratio
}: ShortsCardProps) => {
  const [internalFocused, setInternalFocused] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isFocused =
    controlledFocused !== undefined ? controlledFocused : internalFocused;

  const handleFocus = () => {
    setInternalFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setInternalFocused(false);
    onBlur?.();
  };

  const handlePress = () => {
    onPress?.();
  };

  useTVEventHandler((evt) => {
    if (!isFocused || !evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();
    if (isSelectEvent(type)) {
      handlePress();
    } else if (type === 'left' && onMenuEscapeLeft) {
      onMenuEscapeLeft();
    }
  });

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '0:30';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatViews = (views?: number): string => {
    if (!views || views <= 0) return 'Shorts';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return `${views}`;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPress={handlePress}
      hasTVPreferredFocus={hasTVPreferredFocus}
      testID={testID || SHORTS_TEST_IDS.card(item.id)}
      style={[
        styles.cardContainer,
        {width, height},
        isFocused && styles.cardFocused,
        isSelected && !isFocused && styles.cardSelected,
      ]}>
      <Image
        source={{
          uri: imgError || !item.thumbnailUrl
            ? DEFAULT_SHORTS_FALLBACK_THUMBNAIL
            : item.thumbnailUrl,
        }}
        onError={() => setImgError(true)}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.gradientOverlay} />

      {/* Top Left: YouTube TV Shorts Red Icon Badge */}
      <View style={styles.shortsLogoBadge}>
        <Text style={styles.shortsLogoText}>▶</Text>
      </View>

      {/* Top Right: Premium Badge if available */}
      {item.isPremium ? (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>★ 4K</Text>
        </View>
      ) : null}

      {/* Bottom Information (YouTube TV Shelf Style) */}
      <View style={styles.bottomInfo}>
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>
            {formatDuration(item.durationSeconds)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.creatorName} numberOfLines={1}>
          {item.creator?.name ? `${item.creator.name} • ` : ''}{formatViews(item.viewCount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: spacing.huge,
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  cardFocused: {
    borderColor: colors.white,
    transform: [{scale: 1.01}],
    shadowColor: colors.white,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  cardSelected: {
    borderColor: colors.heroAccent,
    borderWidth: 2.5,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  shortsLogoBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: colors.heroAccent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortsLogoText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  premiumBadgeText: {
    color: colors.black,
    fontSize: 7.5,
    fontWeight: '900',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: 'rgba(10, 10, 10, 0.88)',
  },
  durationPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  title: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 12,
  },
  creatorName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    marginTop: 2,
  },
});
