import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ShortsActionRailProps} from '../types/shorts.types';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';

const formatCount = (count?: number): string => {
  if (!count || count < 0) return '0';
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
};

export const ShortsActionRail: React.FC<ShortsActionRailProps> = ({
  short,
  onToggleLike,
  onToggleSave,
  isLikeLoading = false,
  isSaveLoading = false,
  disabled = false,
}) => {
  const [focusedAction, setFocusedAction] = useState<
    'like' | 'dislike' | 'save' | 'more' | null
  >(null);
  const [isDisliked, setIsDisliked] = useState(false);

  const isLiked = Boolean(short?.isLiked);
  const isSaved = Boolean(short?.isSaved);
  const likeCountFormatted = formatCount(short?.likeCount);

  const handleLikePress = useCallback(() => {
    if (disabled || isLikeLoading) return;
    if (isDisliked) {
      setIsDisliked(false);
    }
    onToggleLike();
  }, [disabled, isDisliked, isLikeLoading, onToggleLike]);

  const handleDislikePress = useCallback(() => {
    if (disabled) return;
    setIsDisliked((prev) => !prev);
    if (isLiked) {
      onToggleLike();
    }
  }, [disabled, isLiked, onToggleLike]);

  const handleSavePress = useCallback(() => {
    if (disabled || isSaveLoading) return;
    onToggleSave();
  }, [disabled, isSaveLoading, onToggleSave]);

  return (
    <View style={styles.container} testID={SHORTS_TEST_IDS.actionRail}>
      {/* 1. Thumbs Up (Like Button) - matching reference image */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled || isLikeLoading}
          onFocus={() => setFocusedAction('like')}
          onBlur={() => setFocusedAction(null)}
          onPress={handleLikePress}
          testID={SHORTS_TEST_IDS.likeButton}
          style={[
            styles.actionCircle,
            isLiked && styles.actionCircleActive,
            focusedAction === 'like' && styles.actionCircleFocused,
          ]}>
          <Text
            style={[
              styles.actionIcon,
              isLiked && styles.actionIconActive,
              focusedAction === 'like' && styles.actionIconFocused,
            ]}>
            👍
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.countLabel,
            focusedAction === 'like' && styles.countLabelFocused,
          ]}
          testID={SHORTS_TEST_IDS.likeCount}>
          {likeCountFormatted}
        </Text>
      </View>

      {/* 2. Thumbs Down (Dislike Button) - matching reference image */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled}
          onFocus={() => setFocusedAction('dislike')}
          onBlur={() => setFocusedAction(null)}
          onPress={handleDislikePress}
          style={[
            styles.actionCircle,
            isDisliked && styles.actionCircleDisliked,
            focusedAction === 'dislike' && styles.actionCircleFocused,
          ]}>
          <Text
            style={[
              styles.actionIcon,
              isDisliked && styles.actionIconDisliked,
              focusedAction === 'dislike' && styles.actionIconFocused,
            ]}>
            👎
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Bookmark / Save Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled || isSaveLoading}
          onFocus={() => setFocusedAction('save')}
          onBlur={() => setFocusedAction(null)}
          onPress={handleSavePress}
          testID={SHORTS_TEST_IDS.saveButton}
          style={[
            styles.actionCircle,
            isSaved && styles.actionCircleSaved,
            focusedAction === 'save' && styles.actionCircleFocused,
          ]}>
          <Text
            style={[
              styles.actionIcon,
              isSaved && styles.saveIconActive,
              focusedAction === 'save' && styles.actionIconFocused,
            ]}>
            {isSaved ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. More Options Button (Three dots) - matching reference image */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled}
          onFocus={() => setFocusedAction('more')}
          onBlur={() => setFocusedAction(null)}
          style={[
            styles.actionCircle,
            focusedAction === 'more' && styles.actionCircleFocused,
          ]}>
          <Text
            style={[
              styles.moreIcon,
              focusedAction === 'more' && styles.actionIconFocused,
            ]}>
            •••
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  actionCircleActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.35)',
    borderColor: colors.heroAccent,
  },
  actionCircleDisliked: {
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
    borderColor: '#94A3B8',
  },
  actionCircleSaved: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
    borderColor: '#F59E0B',
  },
  actionCircleFocused: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    transform: [{scale: 1.15}],
    shadowColor: colors.white,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 19,
    color: colors.white,
    textAlign: 'center',
  },
  moreIcon: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -1,
  },
  actionIconActive: {
    color: colors.heroAccent,
  },
  actionIconDisliked: {
    color: '#CBD5E1',
  },
  saveIconActive: {
    color: '#F59E0B',
  },
  actionIconFocused: {
    color: colors.black,
  },
  countLabel: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '700',
    marginTop: 3,
  },
  countLabelFocused: {
    color: colors.white,
  },
});
