import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {SHORTS_TEST_IDS} from '../constants/shorts.constants';
import {colors} from '../../../theme/colors';

export interface ShortsLoadingProps {
  message?: string;
  testID?: string;
}

export const ShortsLoading = ({
  message = 'Loading Shorts feed…',
  testID = SHORTS_TEST_IDS.loading,
}: ShortsLoadingProps) => {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size="large" color={colors.activeTint} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
});
