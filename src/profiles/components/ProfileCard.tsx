import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {strings} from '../../constants/strings';
import {
  getAvatarMonogram,
  getProfileAvatarById,
} from '../data/profileAvatars';
import {UserProfile} from '../types/Profile';
import {styles} from './ProfileCard.styles';

export interface ProfileCardProps {
  profile?: UserProfile;
  isAddProfile?: boolean;
  isActive?: boolean;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  testID?: string;
}

export const ProfileCard = ({
  profile,
  isAddProfile = false,
  isActive = false,
  onPress,
  hasTVPreferredFocus = false,
  testID,
}: ProfileCardProps) => {
  const [isFocused, setIsFocused] = useState(false);

  if (isAddProfile) {
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.addCard, isFocused && styles.addCardFocused]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPress={onPress}
          hasTVPreferredFocus={hasTVPreferredFocus}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={strings.profiles.addNewProfileAccessibility}
          testID={testID || 'add-profile-card'}>
          <View style={styles.addIconWrapper}>
            <Text style={styles.addIconText}>
              {strings.profiles.addProfileSymbol}
            </Text>
          </View>
          <Text style={[styles.addLabel, isFocused && styles.addLabelFocused]}>
            {strings.profiles.addProfile}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const avatar = getProfileAvatarById(profile.avatarId);
  const monogram = getAvatarMonogram(profile.avatarId, profile.name);

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={[
          styles.card,
          isFocused && styles.cardFocused,
          isActive && styles.cardActive,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={onPress}
        hasTVPreferredFocus={hasTVPreferredFocus}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={strings.profiles.profileCardAccessibility(
          profile.name,
          profile.isKids,
          isActive,
        )}
        testID={testID || `profile-card-${profile.id}`}>
        <View
          style={[
            styles.avatarWrapper,
            {backgroundColor: avatar.background, borderColor: avatar.accent},
          ]}>
          <View
            style={[
              styles.avatarInner,
              {backgroundColor: avatar.background, borderColor: avatar.accent},
            ]}>
            <Text style={styles.monogram}>{monogram}</Text>
          </View>
          {profile.isKids && (
            <View style={styles.kidsBadge}>
              <Text style={styles.kidsBadgeText}>{strings.profiles.kidsBadge}</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.profileName, isFocused && styles.profileNameFocused]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {profile.name}
        </Text>

        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>
              {strings.profiles.activeBadge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
