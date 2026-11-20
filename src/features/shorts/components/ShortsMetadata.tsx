import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {ShortsItem} from '../types/shorts.types';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';

export interface ShortsMetadataProps {
  item: ShortsItem | null;
  testID?: string;
  children?: React.ReactNode;
}

export const ShortsMetadata = ({
  item,
  testID = SHORTS_TEST_IDS.metadata,
  children,
}: ShortsMetadataProps) => {
  const [avatarError, setAvatarError] = useState(false);

  if (!item) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* 1. Large Bold Title (matching reference: "Swinging") */}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {/* 2. Audio Track Line (matching reference: "ılı Original sound") */}
      <View style={styles.soundRow}>
        <Text style={styles.soundIcon}>ılı</Text>
        <Text style={styles.soundText} numberOfLines={1}>
          {item.audioTrack || `Original sound${item.creator?.name ? ` • ${item.creator.name}` : ''}`}
        </Text>
      </View>

      {/* 3. Creator Row (matching reference: Circular Avatar + "Catherine Clark") */}
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

          <Text style={styles.creatorName} numberOfLines={1}>
            {item.creator.name}
          </Text>

          {item.creator.verified ? (
            <View style={styles.verifiedBadgeContainer}>
              <Text style={styles.verifiedBadge}>✓</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 4. Category & Quality Badges */}
      <View style={styles.badgeRow}>
        {item.category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category}</Text>
          </View>
        ) : null}

        {item.durationSeconds ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>
              ⏱ {item.durationSeconds}s
            </Text>
          </View>
        ) : null}

        {item.isPremium ? (
          <View style={styles.premiumPill}>
            <Text style={styles.premiumPillText}>★ 4K</Text>
          </View>
        ) : null}
      </View>

      {/* Optional Children */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  soundIcon: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
    letterSpacing: -1,
  },
  soundText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(56, 189, 248, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  creatorName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  verifiedBadgeContainer: {
    marginLeft: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 6,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryPillText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  metaPillText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '600',
  },
  premiumPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  premiumPillText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
  },
});
