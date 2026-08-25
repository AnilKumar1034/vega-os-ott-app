import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {PROFILE_AVATARS, ProfileAvatarConfig} from '../data/profileAvatars';
import {styles} from './AvatarPicker.styles';

export interface AvatarPickerProps {
  selectedAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  label?: string;
}

export const AvatarPicker = ({
  selectedAvatarId,
  onSelectAvatar,
  label = strings.profiles.avatarLabel,
}: AvatarPickerProps) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TVFocusGuideView style={styles.avatarRow} autoFocus>
        {PROFILE_AVATARS.map((avatar: ProfileAvatarConfig) => {
          const isSelected = selectedAvatarId === avatar.id;
          const isFocused = focusedId === avatar.id;

          return (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                isSelected && styles.avatarOptionSelected,
                isFocused && styles.avatarOptionFocused,
              ]}
              onFocus={() => setFocusedId(avatar.id)}
              onBlur={() => setFocusedId(null)}
              onPress={() => onSelectAvatar(avatar.id)}
              hasTVPreferredFocus={isSelected}
              activeOpacity={1}
              accessibilityRole="radio"
              accessibilityState={{selected: isSelected}}
              accessibilityLabel={strings.profiles.avatarOptionAccessibility(
                avatar.label,
              )}
              testID={`avatar-option-${avatar.id}`}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: avatar.background,
                    borderColor: avatar.accent,
                  },
                ]}>
                <Text style={styles.avatarMonogram}>{avatar.monogram}</Text>
              </View>
              <Text
                style={[
                  styles.avatarLabel,
                  isSelected && styles.avatarLabelSelected,
                ]}
                numberOfLines={1}>
                {avatar.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </TVFocusGuideView>
    </View>
  );
};
