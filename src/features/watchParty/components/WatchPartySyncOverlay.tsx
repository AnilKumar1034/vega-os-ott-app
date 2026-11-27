/**
 * Watch Party Synchronization Overlay (Day 4)
 * Top overlay container for Watch Party badges, room synchronization status,
 * and transient alignment notifications.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WATCH_PARTY_SYNC_TEST_IDS} from '../constants/watchPartySync.constants';
import {WatchPartySyncStatusState} from '../types/watchPartySync.types';
import {WatchPartySyncStatus} from './WatchPartySyncStatus';

export interface WatchPartySyncOverlayProps {
  isVisible?: boolean;
  status: WatchPartySyncStatusState;
  isHost?: boolean;
  roomCode?: string;
  driftMs?: number;
  errorMessage?: string | null;
}

export const WatchPartySyncOverlay: React.FC<WatchPartySyncOverlayProps> = ({
  isVisible = true,
  status,
  isHost = false,
  roomCode,
  driftMs,
  errorMessage,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View
      testID={WATCH_PARTY_SYNC_TEST_IDS.syncOverlay}
      style={styles.overlayContainer}
      pointerEvents="none">
      <View style={styles.topRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.watchPartyText}>WATCH PARTY</Text>
          {roomCode ? (
            <Text style={styles.roomCodeText}>{`#${roomCode}`}</Text>
          ) : null}
        </View>

        <WatchPartySyncStatus
          status={status}
          isHost={isHost}
          driftMs={driftMs}
        />
      </View>

      {errorMessage && status === 'error' ? (
        <View style={styles.errorBanner}>
          <Text
            testID={WATCH_PARTY_SYNC_TEST_IDS.syncErrorMessage}
            style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 24,
    left: 32,
    right: 32,
    zIndex: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 81, 0, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  watchPartyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  roomCodeText: {
    color: '#FFE0B2',
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '600',
  },
  errorBanner: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(185, 28, 28, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
