/**
 * Watch Party Participant Card Component
 * TV-friendly card showing a participant's avatar, name, host status, and connection state.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {WatchPartyParticipant} from '../types/watchParty.types';

export interface WatchPartyParticipantCardProps {
  participant: WatchPartyParticipant;
  focusable?: boolean;
  onFocus?: () => void;
  onPress?: () => void;
}

export const WatchPartyParticipantCard: React.FC<
  WatchPartyParticipantCardProps
> = ({participant, focusable = false, onFocus, onPress}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getStatusColor = () => {
    switch (participant.status) {
      case 'connected':
        return colors.success;
      case 'reconnecting':
        return '#F59E0B';
      case 'disconnected':
      default:
        return '#6B7280';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const content = (
    <View
      style={[
        styles.card,
        isFocused && styles.cardFocused,
        participant.isHost && styles.hostCardBorder,
      ]}
      testID={WATCH_PARTY_TEST_IDS.participantCard(participant.id)}>
      {/* Avatar or Initials */}
      <View style={styles.avatarWrapper}>
        {participant.avatarUrl ? (
          <Image
            source={{uri: participant.avatarUrl}}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {getInitials(participant.displayName)}
            </Text>
          </View>
        )}
        <View
          style={[styles.connectionDot, {backgroundColor: getStatusColor()}]}
        />
      </View>

      {/* Name and Badges */}
      <View style={styles.infoArea}>
        <Text style={styles.displayName} numberOfLines={1}>
          {participant.displayName}
        </Text>

        <View style={styles.badgeRow}>
          {participant.isHost ? (
            <View
              style={styles.hostBadge}
              testID={WATCH_PARTY_TEST_IDS.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          ) : (
            <Text style={styles.memberText}>Guest</Text>
          )}
        </View>
      </View>
    </View>
  );

  if (focusable) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => setIsFocused(false)}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${participant.displayName}, ${participant.isHost ? 'Host' : 'Participant'}`}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    minWidth: 200,
    gap: 12,
  },
  cardFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.cardHoverBackground,
  },
  hostCardBorder: {
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardBackgroundSubtle,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.actionSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  connectionDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  infoArea: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  memberText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
