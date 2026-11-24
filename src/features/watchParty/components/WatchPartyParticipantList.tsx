/**
 * Watch Party Participant List Component
 * Renders the room participant count and cards.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';
import {WatchPartyParticipant} from '../types/watchParty.types';
import {WatchPartyParticipantCard} from './WatchPartyParticipantCard';

export interface WatchPartyParticipantListProps {
  participants: WatchPartyParticipant[];
  maxParticipants?: number;
  enableItemFocus?: boolean;
}

export const WatchPartyParticipantList: React.FC<
  WatchPartyParticipantListProps
> = ({participants, maxParticipants, enableItemFocus = false}) => {
  return (
    <View
      style={styles.container}
      testID={WATCH_PARTY_TEST_IDS.participantList}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>PARTICIPANTS</Text>
        <Text
          style={styles.countText}
          testID={WATCH_PARTY_TEST_IDS.participantCountText}>
          {participants.length}
          {maxParticipants ? ` / ${maxParticipants}` : ''}
        </Text>
      </View>

      {participants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No participants in the room.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {participants.map((participant) => (
            <WatchPartyParticipantCard
              key={participant.id}
              participant={participant}
              focusable={enableItemFocus}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  countText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackgroundSubtle,
    borderRadius: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
