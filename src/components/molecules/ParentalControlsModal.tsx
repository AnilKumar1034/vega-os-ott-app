import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {useProfile} from '../../profiles/hooks/useProfile';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';
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

  const isPinEnabled = Boolean(parentalSettings?.pinEnabled);
  const defaultOptionId = isPinEnabled ? 'opt-change' : 'opt-setup';

  const [dialogStep, setDialogStep] = useState<DialogStep>('none');
  const [focusedId, setFocusedId] = useState<string | null>(defaultOptionId);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const dialogStepRef = useRef<DialogStep>(dialogStep);
  dialogStepRef.current = dialogStep;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const focusedIdRef = useRef<string | null>(focusedId);
  focusedIdRef.current = focusedId;
  const openedAtRef = useRef<number>(0);
  const elementRefs = useRef<Record<string, any>>({});

  const focusElement = useCallback((id: string) => {
    setFocusedId(id);
    const target = elementRefs.current[id];
    if (target && typeof target.requestTVFocus === 'function') {
      target.requestTVFocus();
    }
  }, []);

  const handleTVEvent = useCallback(
    (evt: any) => {
      if (!visible) {
        return;
      }
      if (dialogStepRef.current !== 'none') {
        // Sub-dialog (PinEntryDialog) is active and handles its own remote Back (onCancel -> setDialogStep('none'))
        return;
      }
      if (!evt) {
        return;
      }
      if (!isKeyDown(evt.eventKeyAction)) {
        return;
      }
      const type = evt.eventType?.toLowerCase();
      if (isBackEvent(type)) {
        onCloseRef.current();
        return;
      }

      if (type === 'down') {
        const current = focusedIdRef.current;
        if (current === 'opt-setup') {
          focusElement('close');
        } else if (current === 'opt-change') {
          focusElement('opt-remove');
        } else if (current === 'opt-remove') {
          focusElement('close');
        }
        return;
      }

      if (type === 'up') {
        const current = focusedIdRef.current;
        if (current === 'close') {
          focusElement(isPinEnabled ? 'opt-remove' : 'opt-setup');
        } else if (current === 'opt-remove') {
          focusElement('opt-change');
        }
        return;
      }

      if (isSelectEvent(type)) {
        const current = focusedIdRef.current;
        if (current === 'opt-setup') {
          setDialogStep('setup_new');
        } else if (current === 'opt-change') {
          setDialogStep('verify_before_change');
        } else if (current === 'opt-remove') {
          setDialogStep('verify_before_remove');
        } else if (current === 'close') {
          onCloseRef.current();
        }
      }
    },
    [visible, isPinEnabled, focusElement],
  );

  useTVEventHandler(handleTVEvent);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (dialogStepRef.current !== 'none') {
          setDialogStep('none');
          return true;
        }
        onCloseRef.current();
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const initial = isPinEnabled ? 'opt-change' : 'opt-setup';
      setFocusedId(initial);
      openedAtRef.current = Date.now();
      const timer = setTimeout(() => {
        focusElement(initial);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDialogStep('none');
      setFeedbackMessage(null);
    }
  }, [visible, isPinEnabled, focusElement]);

  if (!visible) {
    return null;
  }

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
            <Text style={styles.statusLabel}>
              {strings.parentalControls.lockStatus}
            </Text>
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
              {isPinEnabled
                ? strings.parentalControls.statusProtected
                : strings.parentalControls.statusUnlocked}
            </Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          {!isPinEnabled ? (
            <TouchableOpacity
              ref={(el) => {
                elementRefs.current['opt-setup'] = el;
              }}
              style={[
                styles.optionButton,
                focusedId === 'opt-setup' && styles.optionButtonFocused,
              ]}
              onFocus={() => setFocusedId('opt-setup')}
              onBlur={() => {}}
              onPress={() => setDialogStep('setup_new')}
              hasTVPreferredFocus={focusedId === 'opt-setup'}
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
                ref={(el) => {
                  elementRefs.current['opt-change'] = el;
                }}
                style={[
                  styles.optionButton,
                  focusedId === 'opt-change' && styles.optionButtonFocused,
                ]}
                onFocus={() => setFocusedId('opt-change')}
                onBlur={() => {}}
                onPress={() => setDialogStep('verify_before_change')}
                hasTVPreferredFocus={focusedId === 'opt-change'}
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
                ref={(el) => {
                  elementRefs.current['opt-remove'] = el;
                }}
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
          ref={(el) => {
            elementRefs.current['close'] = el;
          }}
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
          <Text style={styles.closeButtonText}>
            {strings.parentalControls.close}
          </Text>
        </TouchableOpacity>
      </TVFocusGuideView>

      {/* Setup New PIN */}
      {dialogStep === 'setup_new' && (
        <PinEntryDialog
          visible={true}
          title={strings.parentalControls.setupPinTitle}
          subtitle={strings.parentalControls.setupPinSubtitle}
          isConfirmMode={true}
          onSuccess={handleSetupPinSuccess}
          onCancel={() => setDialogStep('none')}
          testID="setup-pin-dialog"
        />
      )}

      {/* Verify Current PIN before change */}
      {dialogStep === 'verify_before_change' && (
        <PinEntryDialog
          visible={true}
          title={strings.parentalControls.enterPinTitle}
          subtitle={strings.parentalControls.enterCurrentPinSubtitle}
          isConfirmMode={false}
          validatePin={verifyParentPin}
          onSuccess={handleVerifyBeforeChangeSuccess}
          onCancel={() => setDialogStep('none')}
          testID="verify-before-change-dialog"
        />
      )}

      {/* Change: Enter new PIN */}
      {dialogStep === 'change_new' && (
        <PinEntryDialog
          visible={true}
          title={strings.parentalControls.changePinTitle}
          subtitle={strings.parentalControls.changePinSubtitle}
          isConfirmMode={true}
          onSuccess={handleChangePinSuccess}
          onCancel={() => setDialogStep('none')}
          testID="change-pin-dialog"
        />
      )}

      {/* Verify before remove */}
      {dialogStep === 'verify_before_remove' && (
        <PinEntryDialog
          visible={true}
          title={strings.parentalControls.enterPinTitle}
          subtitle={strings.parentalControls.enterCurrentPinSubtitle}
          isConfirmMode={false}
          validatePin={verifyParentPin}
          onSuccess={handleVerifyBeforeRemoveSuccess}
          onCancel={() => setDialogStep('none')}
          testID="verify-before-remove-dialog"
        />
      )}
    </View>
  );
};
