/**
 * Watch Party Empty Participants Component
 * Displayed when no other participants have joined the lobby yet.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyEmptyParticipantsProps {
  roomCode?: string;
  isHost?: boolean;
}

export const WatchPartyEmptyParticipants: React.FC<
  WatchPartyEmptyParticipantsProps
> = ({roomCode, isHost = false}) => {
  return (
    <View
      style={styles.container}
      testID={WATCH_PARTY_TEST_IDS.emptyParticipants}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>👥</Text>
      </View>
      <Text style={styles.title}>
        {isHost ? 'Waiting for Friends to Join' : 'Waiting for Others'}
      </Text>
      <Text style={styles.message}>
        {roomCode
          ? `Share room code "${roomCode}" with friends. They can join from the "Join Watch Party" menu on their TV.`
          : 'Once your friends enter the room code on their TVs, their profile cards will appear here.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 420,
  },
});
