/**
 * Watch Party Synchronization Status Indicator (Day 4)
 * Subtle, non-intrusive on-screen indicator displaying room sync status.
 * Optimized for 10-foot TV viewing without interfering with player controls or focus.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WATCH_PARTY_SYNC_TEST_IDS} from '../constants/watchPartySync.constants';
import {WatchPartySyncStatusState} from '../types/watchPartySync.types';

export interface WatchPartySyncStatusProps {
  status: WatchPartySyncStatusState;
  isHost?: boolean;
  driftMs?: number;
  testID?: string;
}

export const WatchPartySyncStatus: React.FC<WatchPartySyncStatusProps> = ({
  status,
  isHost = false,
  driftMs,
  testID = WATCH_PARTY_SYNC_TEST_IDS.syncStatusBadge,
}) => {
  // If idle, don't render anything
  if (status === 'idle') {
    return null;
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting Sync...';
      case 'synchronizing':
        return 'Syncing...';
      case 'adjusting':
        return 'Aligning Playback...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Sync Offline';
      case 'room_closed':
        return 'Party Ended';
      case 'synchronized':
      default:
        return isHost ? 'Host (Authoritative)' : 'In Sync';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'synchronized':
        return '#4CAF50'; // Green
      case 'adjusting':
      case 'synchronizing':
      case 'connecting':
        return '#FF9800'; // Amber
      case 'reconnecting':
      case 'error':
      case 'room_closed':
        return '#F44336'; // Red
      default:
        return '#9E9E9E';
    }
  };

  const statusColor = getStatusColor();

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Watch Party Sync Status: ${getStatusLabel()}`}
      style={styles.container}>
      <View style={[styles.dot, {backgroundColor: statusColor}]} />
      <Text style={styles.text}>{getStatusLabel()}</Text>
      {!isHost && typeof driftMs === 'number' && Math.abs(driftMs) > 1000 ? (
        <Text
          testID={WATCH_PARTY_SYNC_TEST_IDS.syncDriftIndicator}
          style={styles.driftText}>
          {`(${(Math.abs(driftMs) / 1000).toFixed(1)}s)`}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  driftText: {
    color: '#94A3B8',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
});
