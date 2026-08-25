import React, {useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {
  getAvatarMonogram,
  getProfileAvatarById,
} from '../data/profileAvatars';
import {UserProfile} from '../types/Profile';
import {colors} from '../../theme/colors';
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
            style={[
              styles.cancelButton,
              focusedButton === 'cancel' && styles.cancelButtonFocused,
            ]}
            onFocus={() => setFocusedButton('cancel')}
            onBlur={() => {}}
            onPress={onCancel}
            disabled={isDeleting}
            hasTVPreferredFocus
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
              style={[
                styles.deleteButton,
                focusedButton === 'delete' && styles.deleteButtonFocused,
                isDeleting && styles.deleteButtonDisabled,
              ]}
              onFocus={() => setFocusedButton('delete')}
              onBlur={() => {}}
              onPress={onConfirm}
              disabled={isDeleting}
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
