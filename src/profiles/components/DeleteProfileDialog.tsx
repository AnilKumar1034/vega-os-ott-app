import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, BackHandler, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {getAvatarMonogram, getProfileAvatarById} from '../data/profileAvatars';
import {UserProfile} from '../types/Profile';
import {colors} from '../../theme/colors';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';
import {styles} from './DeleteProfileDialog.styles';

export interface DeleteProfileDialogProps {
  visible: boolean;
  profile: UserProfile | null;
  isOnlyProfile: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteProfileDialog = ({
  visible,
  profile,
  isOnlyProfile,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteProfileDialogProps) => {
  const [focusedButton, setFocusedButton] = useState<'cancel' | 'delete'>(
    'cancel',
  );

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const isDeletingRef = useRef(isDeleting);
  isDeletingRef.current = isDeleting;
  const focusedButtonRef = useRef<'cancel' | 'delete'>(focusedButton);
  focusedButtonRef.current = focusedButton;
  const openedAtRef = useRef<number>(0);
  const elementRefs = useRef<Record<string, any>>({});

  const focusButton = useCallback((btn: 'cancel' | 'delete') => {
    setFocusedButton(btn);
    const target = elementRefs.current[btn];
    if (target && typeof target.requestTVFocus === 'function') {
      target.requestTVFocus();
    }
  }, []);

  useTVEventHandler((evt) => {
    if (!visible || !profile) {
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
      if (!isDeletingRef.current) {
        onCancelRef.current();
      }
      return;
    }

    if (type === 'left') {
      focusButton('cancel');
      return;
    }

    if (type === 'right' && !isOnlyProfile && !isDeletingRef.current) {
      focusButton('delete');
      return;
    }

    if (isSelectEvent(type)) {
      if (focusedButtonRef.current === 'cancel') {
        if (!isDeletingRef.current) {
          onCancelRef.current();
        }
      } else if (focusedButtonRef.current === 'delete') {
        if (!isDeletingRef.current) {
          onConfirm();
        }
      }
    }
  });

  useEffect(() => {
    if (!visible || !profile) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!isDeletingRef.current) {
          onCancelRef.current();
        }
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [visible, profile]);

  useEffect(() => {
    if (visible && profile) {
      setFocusedButton('cancel');
      openedAtRef.current = Date.now();
      const timer = setTimeout(() => {
        focusButton('cancel');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, profile, focusButton]);

  if (!visible || !profile) {
    return null;
  }

  const avatar = getProfileAvatarById(profile.avatarId);
  const monogram = getAvatarMonogram(profile.avatarId, profile.name);

  return (
    <View style={styles.overlay} testID="delete-profile-dialog-overlay">
      <TVFocusGuideView
        style={styles.dialog}
        autoFocus
        trapFocusUp
        trapFocusDown
        trapFocusLeft
        trapFocusRight>
        <View
          style={[
            styles.avatarCircle,
            {backgroundColor: avatar.background, borderColor: avatar.accent},
          ]}>
          <Text style={styles.avatarMonogram}>{monogram}</Text>
        </View>

        <Text style={styles.title}>
          {strings.profiles.deleteProfileConfirmTitle}
        </Text>

        <Text style={styles.message}>
          {strings.profiles.deleteProfileConfirmMessage(profile.name)}
        </Text>

        {isOnlyProfile ? (
          <Text style={styles.warningText}>
            {strings.profiles.cannotDeleteLastProfile}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            ref={(el) => {
              elementRefs.current['cancel'] = el;
            }}
            style={[
              styles.cancelButton,
              focusedButton === 'cancel' && styles.cancelButtonFocused,
            ]}
            onFocus={() => setFocusedButton('cancel')}
            onBlur={() => {}}
            onPress={onCancel}
            disabled={isDeleting}
            hasTVPreferredFocus={focusedButton === 'cancel'}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={strings.profiles.cancelDeleteAccessibility}
            testID="delete-dialog-cancel-button">
            <Text style={styles.cancelButtonText}>
              {strings.profiles.deleteProfileCancelButton}
            </Text>
          </TouchableOpacity>

          {!isOnlyProfile && (
            <TouchableOpacity
              ref={(el) => {
                elementRefs.current['delete'] = el;
              }}
              style={[
                styles.deleteButton,
                focusedButton === 'delete' && styles.deleteButtonFocused,
                isDeleting && styles.deleteButtonDisabled,
              ]}
              onFocus={() => setFocusedButton('delete')}
              onBlur={() => {}}
              onPress={onConfirm}
              disabled={isDeleting}
              hasTVPreferredFocus={focusedButton === 'delete'}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.profiles.confirmDeleteAccessibility}
              testID="delete-dialog-confirm-button">
              {isDeleting ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {strings.profiles.deleteProfileConfirmButton}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TVFocusGuideView>
    </View>
  );
};
