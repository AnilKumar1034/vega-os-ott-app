/**
 * Watch Party Room Status Component
 * Displays room lifecycle state with visual indicator and description.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {WatchPartyRoomStatus as RoomStatusType} from '../types/watchParty.types';

export interface WatchPartyRoomStatusProps {
  status: RoomStatusType;
  participantCount?: number;
  maxParticipants?: number;
  isHost?: boolean;
}

export const WatchPartyRoomStatus: React.FC<WatchPartyRoomStatusProps> = ({
  status,
  participantCount,
  maxParticipants,
  isHost,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'ACTIVE',
          dotColor: colors.success,
          bgColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.4)',
          textColor: '#4ADE80',
          description: 'Synchronized playback is currently active in this room.',
        };
      case 'paused':
        return {
          label: 'PAUSED',
          dotColor: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          textColor: '#FDE68A',
          description: 'Playback has been temporarily paused by the room host.',
        };
      case 'expired':
        return {
          label: 'EXPIRED',
          dotColor: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          textColor: '#FCA5A5',
          description: 'This room has exceeded its active window and is no longer valid.',
        };
      case 'ended':
        return {
          label: 'ENDED',
          dotColor: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.2)',
          borderColor: 'rgba(107, 114, 128, 0.4)',
          textColor: '#D1D5DB',
          description: 'The host has ended this Watch Party session.',
        };
      case 'waiting':
      default:
        return {
          label: 'WAITING IN LOBBY',
          dotColor: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.12)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          textColor: '#FDE68A',
          description: isHost
            ? 'You are the host. Share the room code so friends can join your party.'
            : 'Waiting for the host and other participants to get ready.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: config.bgColor, borderColor: config.borderColor},
      ]}
      testID={WATCH_PARTY_TEST_IDS.roomStatusDisplay}>
      <View style={styles.topRow}>
        <View style={styles.badgeWrapper}>
          <View style={[styles.dot, {backgroundColor: config.dotColor}]} />
          <Text style={[styles.statusText, {color: config.textColor}]}>
            {config.label}
          </Text>
        </View>

        {typeof participantCount === 'number' ? (
          <Text style={styles.capacityText}>
            {participantCount}
            {maxParticipants ? ` / ${maxParticipants}` : ''} participants
          </Text>
        ) : null}
      </View>

      <Text style={styles.description}>{config.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  capacityText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
