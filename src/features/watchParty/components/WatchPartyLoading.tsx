/**
 * Watch Party Loading Component
 * TV-friendly activity indicator and status message.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyLoadingProps {
  message?: string;
  testID?: string;
}

export const WatchPartyLoading: React.FC<WatchPartyLoadingProps> = ({
  message = 'Loading Watch Party...',
  testID = WATCH_PARTY_TEST_IDS.loading,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size="large" color={colors.heroAccent} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 240,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
