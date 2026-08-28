import React, {useState} from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {strings} from '../../constants/strings';
import {colors} from '../../theme/colors';
import {AvatarPicker} from '../components/AvatarPicker';
import {
  DEFAULT_AVATAR_ID,
  DEFAULT_KIDS_AVATAR_ID,
} from '../data/profileAvatars';
import {useProfile} from '../hooks/useProfile';
import {
  MAX_PROFILES_PER_ACCOUNT,
  PROFILE_NAME_MAX_LENGTH,
  validateProfileName,
} from '../types/Profile';
import {
  ContentMaturityRating,
  DEFAULT_KIDS_MATURITY_LIMIT,
} from '../../types/maturity';
import {styles} from './CreateProfileScreen.styles';

export const CreateProfileScreen = () => {
  const navigation = useNavigation<any>();
  const {profiles, createProfile} = useProfile();

  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState<string>(DEFAULT_AVATAR_ID);
  const [isKids, setIsKids] = useState(false);
  const [kidsMaturityLimit, setKidsMaturityLimit] =
    useState<ContentMaturityRating>(DEFAULT_KIDS_MATURITY_LIMIT);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>('name');

  const isLimitReached = profiles.length >= MAX_PROFILES_PER_ACCOUNT;

  const handleKidsToggle = () => {
    const nextKids = !isKids;
    setIsKids(nextKids);
    if (nextKids && avatarId === DEFAULT_AVATAR_ID) {
      setAvatarId(DEFAULT_KIDS_AVATAR_ID);
    } else if (!nextKids && avatarId === DEFAULT_KIDS_AVATAR_ID) {
      setAvatarId(DEFAULT_AVATAR_ID);
    }
  };

  const handleCreate = async () => {
    const validation = validateProfileName(name);
    if (!validation.isValid) {
      setErrorMsg(validation.error || strings.profiles.enterProfileName);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await createProfile({
        name: name.trim(),
        avatarId,
        isKids,
        kidsMaturityLimit: isKids ? kidsMaturityLimit : undefined,
      });

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace(Routes.ProfileSelection);
      }
    } catch (err: any) {
      console.log('Error creating profile:', err);
      setErrorMsg(err?.message || strings.errors.failedRegister);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(Routes.ProfileSelection);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.backgroundImage}
      testID="create-profile-screen">
      <View style={styles.container}>
        <TVFocusGuideView style={styles.card} autoFocus>
          <View style={styles.header}>
            <Text style={styles.title}>
              {strings.profiles.createProfileTitle}
            </Text>
            <Text style={styles.subtitle}>
              {strings.profiles.createProfileSubtitle}
            </Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {isLimitReached ? (
            <View style={styles.limitBanner}>
              <Text style={styles.limitText}>
                {strings.profiles.maxProfilesReached}
              </Text>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  focusedField === 'limit-back' && styles.cancelButtonFocused,
                ]}
                onFocus={() => setFocusedField('limit-back')}
                onBlur={() => setFocusedField(null)}
                onPress={handleCancel}
                hasTVPreferredFocus
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.actions.back}
                testID="limit-back-button">
                <Text style={styles.cancelButtonText}>
                  {strings.actions.back}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              {/* Profile Name */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    {strings.profiles.profileNameLabel}
                  </Text>
                  <Text style={styles.charCount}>
                    {name.length}/{PROFILE_NAME_MAX_LENGTH}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'name' && styles.inputFocused,
                  ]}
                  value={name}
                  onChangeText={(text) => {
                    if (text.length <= PROFILE_NAME_MAX_LENGTH) {
                      setName(text);
                      if (errorMsg) setErrorMsg(null);
                    }
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={strings.profiles.profileNamePlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={PROFILE_NAME_MAX_LENGTH}
                  hasTVPreferredFocus
                  testID="create-profile-name-input"
                />
              </View>

              {/* Avatar Selector */}
              <AvatarPicker
                selectedAvatarId={avatarId}
                onSelectAvatar={setAvatarId}
              />

              {/* Kids Profile Toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleCard,
                  focusedField === 'kids' && styles.toggleCardFocused,
                ]}
                onFocus={() => setFocusedField('kids')}
                onBlur={() => setFocusedField(null)}
                onPress={handleKidsToggle}
                activeOpacity={1}
                accessibilityRole="switch"
                accessibilityState={{checked: isKids}}
                accessibilityLabel={strings.profiles.kidsProfileLabel}
                testID="kids-profile-toggle">
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleLabel}>
                    {strings.profiles.kidsProfileLabel}
                  </Text>
                  <Text style={styles.toggleHint}>
                    {strings.profiles.kidsProfileHint}
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchTrack,
                    isKids && styles.switchTrackEnabled,
                  ]}>
                  <View
                    style={[
                      styles.switchThumb,
                      isKids && styles.switchThumbEnabled,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {isKids && (
                <View style={styles.maturityGroup} testID="create-kids-maturity-selector">
                  <Text style={styles.label}>
                    {strings.parentalControls.maturityLimitLabel}
                  </Text>
                  <TVFocusGuideView style={styles.maturityGrid} autoFocus>
                    {(
                      [
                        {id: 'KIDS', label: 'Kids Only', age: 'Preschool'},
                        {id: '7_PLUS', label: 'Older Kids', age: '7+'},
                        {id: '13_PLUS', label: 'Teens', age: '13+'},
                        {id: '16_PLUS', label: 'Young Adult', age: '16+'},
                        {id: 'ALL', label: 'All Ages', age: 'All'},
                      ] as const
                    ).map((option) => {
                      const isSelected = kidsMaturityLimit === option.id;
                      const isFocused = focusedField === `create-maturity-${option.id}`;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.maturityOption,
                            isSelected && styles.maturityOptionSelected,
                            isFocused && styles.maturityOptionFocused,
                          ]}
                          onFocus={() => setFocusedField(`create-maturity-${option.id}`)}
                          onBlur={() => setFocusedField(null)}
                          onPress={() => setKidsMaturityLimit(option.id)}
                          activeOpacity={1}
                          accessibilityRole="radio"
                          accessibilityState={{selected: isSelected}}
                          testID={`create-maturity-option-${option.id}`}>
                          <Text style={styles.maturityOptionText}>
                            {option.label}
                          </Text>
                          <Text style={styles.maturityOptionAge}>
                            {option.age}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </TVFocusGuideView>
                </View>
              )}

              {/* Actions */}
              <TVFocusGuideView style={styles.actionsRow} autoFocus>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    focusedField === 'cancel' && styles.cancelButtonFocused,
                  ]}
                  onFocus={() => setFocusedField('cancel')}
                  onBlur={() => setFocusedField(null)}
                  onPress={handleCancel}
                  disabled={isSubmitting}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityLabel={strings.actions.goBack}
                  testID="create-profile-cancel-button">
                  <Text style={styles.cancelButtonText}>
                    {strings.actions.goBack}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    focusedField === 'create' && styles.createButtonFocused,
                    isSubmitting && styles.createButtonDisabled,
                  ]}
                  onFocus={() => setFocusedField('create')}
                  onBlur={() => setFocusedField(null)}
                  onPress={handleCreate}
                  disabled={isSubmitting}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityLabel={strings.profiles.createProfileSubmit}
                  testID="create-profile-submit-button">
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.createButtonText}>
                      {strings.profiles.createProfileSubmit}
                    </Text>
                  )}
                </TouchableOpacity>
              </TVFocusGuideView>
            </View>
          )}
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
