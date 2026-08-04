import React from 'react';
import {Text, View} from 'react-native';
import {
  getAvatarMonogram,
  getProfileAvatar,
} from '../../constants/profileOptions';
import {styles} from './ProfileAvatar.styles';

interface ProfileAvatarProps {
  avatar?: string;
  displayName: string;
  size?: 'compact' | 'standard' | 'large';
}

export const ProfileAvatar = ({
  avatar,
  displayName,
  size = 'standard',
}: ProfileAvatarProps) => {
  const option = getProfileAvatar(avatar);
  const isCompact = size === 'compact';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.avatar,
        isCompact && styles.avatarCompact,
        isLarge && styles.avatarLarge,
        {backgroundColor: option.background, borderColor: option.accent},
      ]}
      accessibilityLabel={`${option.label} avatar`}>
      <View
        style={[
          styles.accent,
          isCompact && styles.accentCompact,
          isLarge && styles.accentLarge,
          {backgroundColor: option.accent},
        ]}
      />
      <View
        style={[
          styles.innerRing,
          isCompact && styles.innerRingCompact,
          isLarge && styles.innerRingLarge,
          {borderColor: option.accent},
        ]}>
        <Text
          style={[
            styles.monogram,
            isCompact && styles.monogramCompact,
            isLarge && styles.monogramLarge,
          ]}>
          {getAvatarMonogram(avatar, displayName)}
        </Text>
      </View>
    </View>
  );
};
