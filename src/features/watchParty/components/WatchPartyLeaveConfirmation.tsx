/**
 * Watch Party Leave Confirmation Modal
 * TV-friendly confirmation dialog with remote focus containment.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {colors} from '../../../theme/colors';
import {WATCH_PARTY_TEST_IDS} from '../constants/watchParty.constants';

export interface WatchPartyLeaveConfirmationProps {
  visible: boolean;
  isHost?: boolean;
  isLeaving?: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export const WatchPartyLeaveConfirmation: React.FC<
  WatchPartyLeaveConfirmationProps
> = ({visible, isHost = false, isLeaving = false, onStay, onLeave}) => {
  const [focusedButton, setFocusedButton] = useState<'stay' | 'leave'>('stay');

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onStay}>
      <View
        style={styles.overlay}
        testID={WATCH_PARTY_TEST_IDS.leaveConfirmModal}>
        <TVFocusGuideView style={styles.card} autoFocus>
          <View style={styles.headerArea}>
            <View
              style={[
                styles.iconBadge,
                isHost && styles.iconBadgeHost,
              ]}>
              <Text style={styles.iconText}>{isHost ? '⚠️' : '🚪'}</Text>
            </View>
            <Text style={styles.title}>Leave Watch Party?</Text>
            <Text style={styles.message}>
              {isHost
                ? 'You are the room host. Leaving will end this Watch Party for all participants and close the room.'
                : 'You will leave this Watch Party room and return to the previous screen. You can rejoin using the room code if the room is still open.'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            {/* Stay Button (Safe Default) */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.stayButton,
                focusedButton === 'stay' && styles.buttonFocused,
              ]}
              onFocus={() => setFocusedButton('stay')}
              onPress={onStay}
              disabled={isLeaving}
              hasTVPreferredFocus
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Stay in Watch Party room"
              testID={WATCH_PARTY_TEST_IDS.leaveCancelButton}>
              <Text style={styles.stayButtonText}>Stay in Room</Text>
            </TouchableOpacity>

            {/* Leave Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.leaveButton,
                focusedButton === 'leave' && styles.buttonFocused,
                isLeaving && styles.buttonDisabled,
              ]}
              onFocus={() => setFocusedButton('leave')}
              onPress={onLeave}
              disabled={isLeaving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={
                isHost
                  ? 'Confirm end watch party and leave'
                  : 'Confirm leave watch party'
              }
              testID={WATCH_PARTY_TEST_IDS.leaveConfirmButton}>
              {isLeaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.leaveButtonText}>
                  {isHost ? 'End Party & Leave' : 'Leave Party'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBadgeHost: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  stayButton: {
    backgroundColor: colors.cardBackgroundSubtle,
    borderColor: colors.cardBorderSubtle,
  },
  stayButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  leaveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  leaveButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
