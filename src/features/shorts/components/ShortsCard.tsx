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
import {sizes, spacing} from '../../../theme/sizes';
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
  height = 142, // roughly 9:16 aspect ratio
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
    if (!seconds || seconds <= 0) return 'SHORT';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

      {/* Top Category Badge */}
      {item.category ? (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      ) : null}

      {/* Premium Badge */}
      {item.isPremium ? (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>★ PRO</Text>
        </View>
      ) : null}

      {/* Bottom Information */}
      <View style={styles.bottomInfo}>
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>
            {formatDuration(item.durationSeconds)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.creator?.name ? (
          <Text style={styles.creatorName} numberOfLines={1}>
            {item.creator.name}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.huge,
    justifyContent: 'space-between',
  },
  cardFocused: {
    borderColor: colors.focusedTint,
    transform: [{scale: 1.05}],
    shadowColor: colors.focusedTint,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cardSelected: {
    borderColor: colors.white,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: '85%',
  },
  topBadgeText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: colors.black,
    fontSize: 8,
    fontWeight: '900',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(5,5,5,0.85)',
  },
  durationPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 3,
  },
  durationText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '600',
  },
  title: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  creatorName: {
    color: colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },
});
