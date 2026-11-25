/**
 * Watch Party Host Badge Component
 * Visual pill indicating room host status.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyHostBadgeProps {
  label?: string;
  size?: 'small' | 'medium';
}

export const WatchPartyHostBadge: React.FC<WatchPartyHostBadgeProps> = ({
  label = 'HOST',
  size = 'medium',
}) => {
  const isSmall = size === 'small';

  return (
    <View
      style={[styles.badge, isSmall && styles.badgeSmall]}
      testID={WATCH_PARTY_TEST_IDS.hostBadge}>
      <Text style={[styles.text, isSmall && styles.textSmall]}>
        ★ {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    borderColor: colors.heroAccent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  textSmall: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
