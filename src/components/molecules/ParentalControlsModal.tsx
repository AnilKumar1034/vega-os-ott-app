import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {useProfile} from '../../profiles/hooks/useProfile';
import {PinEntryDialog} from './PinEntryDialog';
import {styles} from './ParentalControlsModal.styles';

export interface ParentalControlsModalProps {
  visible: boolean;
  onClose: () => void;
}

type DialogStep =
  | 'none'
  | 'setup_new'
  | 'verify_before_change'
  | 'change_new'
  | 'verify_before_remove';

export const ParentalControlsModal = ({
  visible,
  onClose,
}: ParentalControlsModalProps) => {
  const {parentalSettings, setParentPin, removeParentPin, verifyParentPin} =
    useProfile();

  const [dialogStep, setDialogStep] = useState<DialogStep>('none');
  const [focusedId, setFocusedId] = useState<string | null>('opt-primary');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!visible) {
    return null;
  }

  const isPinEnabled = Boolean(parentalSettings?.pinEnabled);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleSetupPinSuccess = async (pin: string) => {
    try {
      await setParentPin(pin);
      setDialogStep('none');
      showFeedback(strings.parentalControls.pinSetSuccess);
    } catch (err: any) {
      console.log('Error setting PIN:', err);
    }
  };

  const handleVerifyBeforeChangeSuccess = () => {
    setDialogStep('change_new');
  };

  const handleChangePinSuccess = async (pin: string) => {
    try {
      await setParentPin(pin);
      setDialogStep('none');
      showFeedback(strings.parentalControls.pinSetSuccess);
    } catch (err: any) {
      console.log('Error changing PIN:', err);
    }
  };

  const handleVerifyBeforeRemoveSuccess = async () => {
    try {
      await removeParentPin();
      setDialogStep('none');
      showFeedback(strings.parentalControls.pinRemovedSuccess);
    } catch (err: any) {
      console.log('Error removing PIN:', err);
    }
  };

  return (
    <View style={styles.overlay} testID="parental-controls-modal-overlay">
      <TVFocusGuideView
        style={styles.modal}
        autoFocus
        trapFocusUp
        trapFocusDown
        trapFocusLeft
        trapFocusRight>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>
          <Text style={styles.title}>{strings.parentalControls.title}</Text>
          <Text style={styles.subtitle}>
            {strings.parentalControls.subtitle}
          </Text>
        </View>

        {feedbackMessage && (
          <Text style={styles.feedbackText} testID="parental-controls-feedback">
            {feedbackMessage}
          </Text>
        )}

        <View style={styles.statusCard} testID="parental-controls-status-card">
          <View>
            <Text style={styles.statusLabel}>Parental Lock Status</Text>
            <Text style={styles.statusValue}>
              {isPinEnabled
                ? strings.parentalControls.pinStatusEnabled
                : strings.parentalControls.pinStatusDisabled}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isPinEnabled
                ? styles.statusBadgeActive
                : styles.statusBadgeInactive,
            ]}>
            <Text style={styles.statusBadgeText}>
              {isPinEnabled ? 'PROTECTED' : 'UNLOCKED'}
            </Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          {!isPinEnabled ? (
            <TouchableOpacity
              style={[
                styles.optionButton,
                focusedId === 'opt-setup' && styles.optionButtonFocused,
              ]}
              onFocus={() => setFocusedId('opt-setup')}
              onBlur={() => {}}
              onPress={() => setDialogStep('setup_new')}
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.parentalControls.setPin}
              testID="parental-setup-pin-button">
              <Text style={styles.optionButtonText}>
                {strings.parentalControls.setPin}
              </Text>
              <Text style={styles.optionArrow}>{'>'}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  focusedId === 'opt-change' && styles.optionButtonFocused,
                ]}
                onFocus={() => setFocusedId('opt-change')}
                onBlur={() => {}}
                onPress={() => setDialogStep('verify_before_change')}
                hasTVPreferredFocus
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.parentalControls.changePin}
                testID="parental-change-pin-button">
                <Text style={styles.optionButtonText}>
                  {strings.parentalControls.changePin}
                </Text>
                <Text style={styles.optionArrow}>{'>'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.optionButtonDestructive,
                  focusedId === 'opt-remove' && styles.optionButtonFocused,
                ]}
                onFocus={() => setFocusedId('opt-remove')}
                onBlur={() => {}}
                onPress={() => setDialogStep('verify_before_remove')}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.parentalControls.removePin}
                testID="parental-remove-pin-button">
                <Text
                  style={[
                    styles.optionButtonText,
                    styles.optionButtonTextDestructive,
                  ]}>
                  {strings.parentalControls.removePin}
                </Text>
                <Text style={styles.optionArrow}>{'>'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.closeButton,
            focusedId === 'close' && styles.closeButtonFocused,
          ]}
          onFocus={() => setFocusedId('close')}
          onBlur={() => {}}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={strings.parentalControls.cancel}
          testID="parental-modal-close-button">
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </TVFocusGuideView>

      {/* Setup New PIN */}
      <PinEntryDialog
        visible={dialogStep === 'setup_new'}
        title={strings.parentalControls.setupPinTitle}
        subtitle={strings.parentalControls.setupPinSubtitle}
        isConfirmMode={true}
        onSuccess={handleSetupPinSuccess}
        onCancel={() => setDialogStep('none')}
        testID="setup-pin-dialog"
      />

      {/* Verify Current PIN before change */}
      <PinEntryDialog
        visible={dialogStep === 'verify_before_change'}
        title={strings.parentalControls.enterPinTitle}
        subtitle={strings.parentalControls.enterCurrentPinSubtitle}
        isConfirmMode={false}
        validatePin={verifyParentPin}
        onSuccess={handleVerifyBeforeChangeSuccess}
        onCancel={() => setDialogStep('none')}
        testID="verify-before-change-dialog"
      />

      {/* Change: Enter new PIN */}
      <PinEntryDialog
        visible={dialogStep === 'change_new'}
        title={strings.parentalControls.changePinTitle}
        subtitle={strings.parentalControls.changePinSubtitle}
        isConfirmMode={true}
        onSuccess={handleChangePinSuccess}
        onCancel={() => setDialogStep('none')}
        testID="change-pin-dialog"
      />

      {/* Verify before remove */}
      <PinEntryDialog
        visible={dialogStep === 'verify_before_remove'}
        title={strings.parentalControls.enterPinTitle}
        subtitle={strings.parentalControls.enterCurrentPinSubtitle}
        isConfirmMode={false}
        validatePin={verifyParentPin}
        onSuccess={handleVerifyBeforeRemoveSuccess}
        onCancel={() => setDialogStep('none')}
        testID="verify-before-remove-dialog"
      />
    </View>
  );
};
