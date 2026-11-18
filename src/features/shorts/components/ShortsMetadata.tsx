import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {ShortsItem} from '../types/shorts.types';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';

export interface ShortsMetadataProps {
  item: ShortsItem | null;
  testID?: string;
}

export const ShortsMetadata = ({
  item,
  testID = SHORTS_TEST_IDS.metadata,
}: ShortsMetadataProps) => {
  const [avatarError, setAvatarError] = useState(false);

  if (!item) {
    return null;
  }

  const formatCount = (count?: number): string => {
    if (!count || count <= 0) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:30';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Category and Tags Pill Row */}
      <View style={styles.pillRow}>
        {item.category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category}</Text>
          </View>
        ) : null}

        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>
            ⏱ {formatDuration(item.durationSeconds)}
          </Text>
        </View>

        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>
            {item.aspectRatio || '9:16'}
          </Text>
        </View>

        {item.ageRating || item.maturityRating ? (
          <View style={styles.agePill}>
            <Text style={styles.agePillText}>
              {item.ageRating || item.maturityRating}
            </Text>
          </View>
        ) : null}

        {item.isPremium ? (
          <View style={styles.premiumPill}>
            <Text style={styles.premiumPillText}>★ PRO SHORT</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Creator Info */}
      {item.creator ? (
        <View style={styles.creatorRow}>
          {item.creator.avatarUrl && !avatarError ? (
            <Image
              source={{uri: item.creator.avatarUrl}}
              onError={() => setAvatarError(true)}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {item.creator.name.charAt(0)}
              </Text>
            </View>
          )}

          <View style={styles.creatorDetails}>
            <View style={styles.creatorNameRow}>
              <Text style={styles.creatorName}>{item.creator.name}</Text>
              {item.creator.verified ? (
                <Text style={styles.verifiedBadge}>✓</Text>
              ) : null}
            </View>
            {item.creator.handle ? (
              <Text style={styles.creatorHandle}>{item.creator.handle}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>

      {/* Metrics Row (Views, Likes, Published Date) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Views</Text>
          <Text style={styles.metricValue}>{formatCount(item.viewCount)}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Likes</Text>
          <Text style={styles.metricValue}>{formatCount(item.likeCount)}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Ratio</Text>
          <Text style={styles.metricValue}>{item.aspectRatio}</Text>
        </View>
      </View>

      {/* Tags Chips */}
      {item.tags && item.tags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  categoryPill: {
    backgroundColor: colors.activeTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  metaPillText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  agePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  agePillText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  premiumPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  premiumPillText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: colors.cardBackground,
  },
  avatarPlaceholder: {
    backgroundColor: colors.heroAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  creatorDetails: {
    justifyContent: 'center',
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBadge: {
    color: colors.focusedTint,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
  },
  creatorHandle: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginVertical: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: spacing.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '500',
  },
});
