import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {colors} from '../../theme/colors';
import {styles} from './PinEntryDialog.styles';

export interface PinEntryDialogProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  isConfirmMode?: boolean; // If true: enter PIN then confirm PIN
  onSuccess: (pin: string) => void | Promise<void>;
  onCancel: () => void;
  validatePin?: (pin: string) => Promise<boolean> | boolean;
  testID?: string;
}

export const PinEntryDialog = ({
  visible,
  title,
  subtitle,
  isConfirmMode = false,
  onSuccess,
  onCancel,
  validatePin,
  testID = 'pin-entry-dialog',
}: PinEntryDialogProps) => {
  const [currentPin, setCurrentPin] = useState<string>('');
  const [firstPin, setFirstPin] = useState<string>('');
  const [isConfirmingStep, setIsConfirmingStep] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [focusedKey, setFocusedKey] = useState<string | null>('key-1');

  useEffect(() => {
    if (visible) {
      setCurrentPin('');
      setFirstPin('');
      setIsConfirmingStep(false);
      setErrorMessage(null);
      setIsVerifying(false);
      setFocusedKey('key-1');
    }
  }, [visible]);

  const handleDigitPress = useCallback(
    async (digit: string) => {
      if (isVerifying || currentPin.length >= 4) {
        return;
      }

      setErrorMessage(null);
      const nextPin = currentPin + digit;
      setCurrentPin(nextPin);

      if (nextPin.length === 4) {
        if (isConfirmMode) {
          if (!isConfirmingStep) {
            // First PIN entered, move to confirmation step
            setFirstPin(nextPin);
            setCurrentPin('');
            setIsConfirmingStep(true);
          } else {
            // Confirming step: verify match
            if (nextPin === firstPin) {
              setIsVerifying(true);
              try {
                await onSuccess(nextPin);
              } catch (err: any) {
                setErrorMessage(err?.message || strings.errors.failedRegister);
                setCurrentPin('');
                setIsConfirmingStep(false);
              } finally {
                setIsVerifying(false);
              }
            } else {
              setErrorMessage(strings.parentalControls.pinMismatch);
              setCurrentPin('');
              setFirstPin('');
              setIsConfirmingStep(false);
            }
          }
        } else {
          // Normal verification / entry mode
          setIsVerifying(true);
          try {
            if (validatePin) {
              const isValid = await validatePin(nextPin);
              if (isValid) {
                await onSuccess(nextPin);
              } else {
                setErrorMessage(strings.parentalControls.incorrectPin);
                setCurrentPin('');
              }
            } else {
              await onSuccess(nextPin);
            }
          } catch (err: any) {
            setErrorMessage(
              err?.message || strings.parentalControls.incorrectPin,
            );
            setCurrentPin('');
          } finally {
            setIsVerifying(false);
          }
        }
      }
    },
    [
      currentPin,
      firstPin,
      isConfirmMode,
      isConfirmingStep,
      isVerifying,
      onSuccess,
      validatePin,
    ],
  );

  const handleClear = useCallback(() => {
    if (isVerifying) return;
    setErrorMessage(null);
    setCurrentPin('');
  }, [isVerifying]);

  if (!visible) {
    return null;
  }

  const displayTitle = isConfirmMode
    ? isConfirmingStep
      ? strings.parentalControls.confirmPinTitle
      : title || strings.parentalControls.setupPinTitle
    : title || strings.parentalControls.enterPinTitle;

  const displaySubtitle = isConfirmMode
    ? isConfirmingStep
      ? strings.parentalControls.confirmPinSubtitle
      : subtitle || strings.parentalControls.setupPinSubtitle
    : subtitle || strings.parentalControls.enterPinSubtitle;

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'cancel'],
  ];

  return (
    <View style={styles.overlay} testID={`${testID}-overlay`}>
      <TVFocusGuideView
        style={styles.dialog}
        autoFocus
        trapFocusUp
        trapFocusDown
        trapFocusLeft
        trapFocusRight>
        <View style={styles.lockIconCircle}>
          <Text style={styles.lockIconText}>🔒</Text>
        </View>

        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.subtitle}>{displaySubtitle}</Text>

        {isConfirmMode && (
          <Text style={styles.stepIndicator}>
            {isConfirmingStep ? 'Step 2 of 2: Confirm' : 'Step 1 of 2: Enter PIN'}
          </Text>
        )}

        {/* Masked PIN dots */}
        <View style={styles.dotsRow} testID="pin-dots-container">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = currentPin.length > index;
            return (
              <View
                key={index}
                style={[styles.dot, isFilled && styles.dotFilled]}
                testID={`pin-digit-${index}`}
              />
            );
          })}
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner} testID="pin-error-banner">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isVerifying ? (
          <ActivityIndicator
            size="large"
            color={colors.heroAccent}
            style={{marginVertical: 20}}
          />
        ) : (
          /* Numeric Keypad */
          <View style={styles.keypadContainer} testID="pin-keypad">
            {keypadRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key) => {
                  const isDigit = /^\d$/.test(key);
                  const isClear = key === 'clear';
                  const isCancel = key === 'cancel';
                  const keyId = `key-${key}`;
                  const isFocused = focusedKey === keyId;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.keyButton,
                        (!isDigit || isClear || isCancel) &&
                          styles.keyButtonUtility,
                        isFocused && styles.keyButtonFocused,
                      ]}
                      onFocus={() => setFocusedKey(keyId)}
                      onBlur={() => {}}
                      onPress={() => {
                        if (isDigit) {
                          handleDigitPress(key);
                        } else if (isClear) {
                          handleClear();
                        } else if (isCancel) {
                          onCancel();
                        }
                      }}
                      hasTVPreferredFocus={key === '1'}
                      activeOpacity={1}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isDigit
                          ? `Digit ${key}`
                          : isClear
                          ? 'Clear PIN digits'
                          : 'Cancel PIN entry'
                      }
                      testID={`pin-key-${key}`}>
                      <Text
                        style={[
                          styles.keyButtonText,
                          (!isDigit || isClear || isCancel) &&
                            styles.keyButtonUtilityText,
                        ]}>
                        {isDigit
                          ? key
                          : isClear
                          ? strings.parentalControls.clearPinDigit
                          : strings.parentalControls.cancel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              focusedKey === 'bottom-cancel' && styles.cancelButtonFocused,
            ]}
            onFocus={() => setFocusedKey('bottom-cancel')}
            onBlur={() => {}}
            onPress={onCancel}
            disabled={isVerifying}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={strings.actions.back}
            testID="pin-dialog-cancel-button">
            <Text style={styles.cancelButtonText}>
              {strings.actions.backChevron} {strings.actions.goBack}
            </Text>
          </TouchableOpacity>
        </View>
      </TVFocusGuideView>
    </View>
  );
};
