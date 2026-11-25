/**
 * Watch Party Content Info Component
 * Displays the selected movie or episode metadata, thumbnail, and badges.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {
  DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
  WATCH_PARTY_TEST_IDS,
} from '../constants/watchParty.constants';
import {WatchPartyContentType} from '../types/watchParty.types';

export interface WatchPartyContentInfoProps {
  title: string;
  thumbnailUrl?: string;
  contentType: WatchPartyContentType;
  description?: string;
  metadata?: string[];
  badge?: string;
  releaseYear?: number;
  duration?: string;
  season?: number;
  episode?: number;
}

export const WatchPartyContentInfo: React.FC<WatchPartyContentInfoProps> = ({
  title,
  thumbnailUrl,
  contentType,
  description,
  metadata = [],
  badge,
  releaseYear,
  duration,
  season,
  episode,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const imageSource =
    thumbnailUrl && !imageFailed
      ? {uri: thumbnailUrl}
      : {uri: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL};

  // Combine explicit extra fields with provided metadata items
  const combinedMetadata = [...metadata];
  if (season && episode) {
    combinedMetadata.unshift(`S${season} E${episode}`);
  }
  if (releaseYear && !combinedMetadata.some((m) => m.includes(String(releaseYear)))) {
    combinedMetadata.push(String(releaseYear));
  }
  if (duration && !combinedMetadata.some((m) => m.includes(duration))) {
    combinedMetadata.push(duration);
  }

  return (
    <View
      style={styles.cardContainer}
      testID={WATCH_PARTY_TEST_IDS.contentInfo}>
      <Image
        source={imageSource}
        style={styles.thumbnail}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />

      <View style={styles.detailsContainer}>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {contentType.toUpperCase()}
            </Text>
          </View>
          {badge ? (
            <View style={styles.extraBadge}>
              <Text style={styles.extraBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {combinedMetadata.length > 0 ? (
          <View style={styles.metaRow}>
            {combinedMetadata.map((item, index) => (
              <React.Fragment key={index}>
                <Text style={styles.metaItem}>{item}</Text>
                {index < combinedMetadata.length - 1 ? (
                  <Text style={styles.metaDot}>•</Text>
                ) : null}
              </React.Fragment>
            ))}
          </View>
        ) : null}

        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    gap: 20,
  },
  thumbnail: {
    width: 200,
    height: 112,
    borderRadius: 10,
    backgroundColor: colors.cardBackgroundSubtle,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  extraBadge: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  extraBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaItem: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metaDot: {
    color: colors.textSecondary,
    fontSize: 13,
    marginHorizontal: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
