import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ProfileAvatar} from '../components/molecules/ProfileAvatar';
import {ScreenLayout} from '../components/templates/ScreenLayout';
import {PROFILE_AVATARS, PROFILE_THEMES} from '../constants/profileOptions';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {DeleteProfileDialog} from '../profiles/components/DeleteProfileDialog';
import {PinEntryDialog} from '../components/molecules/PinEntryDialog';
import {useProfile} from '../profiles/hooks/useProfile';
import {
  PROFILE_NAME_MAX_LENGTH,
  validateProfileName,
} from '../profiles/types/Profile';
import {
  ContentMaturityRating,
  DEFAULT_KIDS_MATURITY_LIMIT,
} from '../types/maturity';
import {colors} from '../theme/colors';
import {sanitizeEmailInput} from '../utils/inputUtils';
import {styles} from './EditProfileScreen.styles';

interface PreferenceToggleProps {
  id: string;
  label: string;
  hint: string;
  enabled: boolean;
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  onPress: () => void;
}

const PreferenceToggle = ({
  id,
  label,
  hint,
  enabled,
  focusedId,
  onFocus,
  onPress,
}: PreferenceToggleProps) => (
  <TouchableOpacity
    style={[styles.toggleCard, focusedId === id && styles.controlFocused]}
    onFocus={() => onFocus(id)}
    onBlur={() => onFocus(null)}
    onPress={onPress}
    activeOpacity={1}
    accessibilityRole="switch"
    accessibilityState={{checked: enabled}}>
    <View style={styles.toggleCopy}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleHint}>{hint}</Text>
    </View>
    <View style={[styles.switchTrack, enabled && styles.switchTrackEnabled]}>
      <View
        style={[styles.switchThumb, enabled && styles.switchThumbEnabled]}
      />
    </View>
  </TouchableOpacity>
);

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const {user, userProfile, updateProfile: updateAccountProfile, loading: authLoading} = useAuth();
  const {
    activeProfile,
    profiles,
    parentalSettings,
    isParentAuthorized,
    verifyParentPin,
    updateProfile: updateActiveViewingProfile,
    deleteProfile: deleteActiveViewingProfile,
  } = useProfile();

  const [profileName, setProfileName] = useState(
    activeProfile?.name || userProfile?.username || user?.displayName || '',
  );
  const email = sanitizeEmailInput(userProfile?.email || user?.email || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [country, setCountry] = useState(userProfile?.country || '');
  const [avatar, setAvatar] = useState(
    activeProfile?.avatarId || userProfile?.avatar || 'avatar-1',
  );
  const [isKids, setIsKids] = useState(activeProfile?.isKids ?? false);
  const [kidsMaturityLimit, setKidsMaturityLimit] =
    useState<ContentMaturityRating>(
      activeProfile?.kidsMaturityLimit || DEFAULT_KIDS_MATURITY_LIMIT,
    );
  const [themePreference, setThemePreference] = useState(
    userProfile?.themePreference || 'cinematic',
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.notificationsEnabled ?? true,
  );
  const [autoplayEnabled, setAutoplayEnabled] = useState(
    userProfile?.autoplayEnabled ?? true,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<
    'save' | 'delete' | null
  >(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const isPinLockActive = Boolean(
    activeProfile?.isKids &&
      parentalSettings?.pinEnabled &&
      !isParentAuthorized,
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigation.replace(Routes.Login, {
        redirectTo: {routeName: Routes.EditProfile},
      });
    }
  }, [authLoading, navigation, user]);

  const leaveEditor = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(Routes.Profile);
  };

  const executeSave = async () => {
    const validation = validateProfileName(profileName);
    if (!validation.isValid) {
      setErrorMsg(validation.error || strings.errors.enterUsername);
      return;
    }

    setErrorMsg(null);
    setSaving(true);
    try {
      if (activeProfile) {
        await updateActiveViewingProfile(activeProfile.id, {
          name: profileName.trim(),
          avatarId: avatar,
          isKids,
          kidsMaturityLimit: isKids ? kidsMaturityLimit : undefined,
        });
      }

      await updateAccountProfile({
        username: profileName.trim(),
        city: city.trim(),
        country: country.trim(),
        avatar,
        themePreference,
        notificationsEnabled,
        autoplayEnabled,
      });

      leaveEditor();
    } catch (err: any) {
      console.log('Update profile error:', err);
      setErrorMsg(err.message || strings.auth.preferenceUpdateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (isPinLockActive) {
      setPendingPinAction('save');
      setShowPinDialog(true);
      return;
    }
    await executeSave();
  };

  const handleDeleteConfirm = async () => {
    if (!activeProfile) {
      return;
    }

    setDeleting(true);
    try {
      await deleteActiveViewingProfile(activeProfile.id);
      setShowDeleteDialog(false);
      navigation.replace(Routes.ProfileSelection);
    } catch (err: any) {
      console.log('Delete profile error:', err);
      setErrorMsg(err.message || strings.profiles.deleteProfileFailed);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenLayout
      activeRoute={Routes.EditProfile}
      menuActiveRoute={Routes.Settings}
      title={strings.nav.editProfileTitle}
      description={strings.nav.editProfileDesc}
      compactHeader
      preferContentFocus
      showSearch={false}>
      <TVFocusGuideView style={styles.container} autoFocus>
        <View style={styles.card}>
          <View style={styles.avatarPanel}>
            <View style={styles.avatarHeading}>
              <Text style={styles.sectionTitle}>
                {strings.auth.chooseAvatar}
              </Text>
              <Text style={styles.sectionHint}>
                {strings.auth.chooseAvatarHint}
              </Text>
            </View>

            <ProfileAvatar
              avatar={avatar}
              displayName={profileName || strings.auth.defaultUser}
              size="large"
            />
            <Text style={styles.previewName} numberOfLines={1}>
              {profileName || strings.auth.defaultUser}
            </Text>
            <Text style={styles.previewLabel}>
              {isKids
                ? strings.profiles.kidsProfileType
                : strings.common.primaryViewer}
            </Text>

            <TVFocusGuideView style={styles.avatarGrid} autoFocus>
              {PROFILE_AVATARS.map((option) => {
                const isSelected = avatar === option.id;
                const isFocused = focusedId === `avatar-${option.id}`;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.avatarOption,
                      isSelected && styles.avatarOptionSelected,
                      isFocused && styles.controlFocused,
                    ]}
                    onFocus={() => setFocusedId(`avatar-${option.id}`)}
                    onBlur={() => setFocusedId(null)}
                    onPress={() => setAvatar(option.id)}
                    hasTVPreferredFocus={isSelected}
                    activeOpacity={1}
                    accessibilityRole="radio"
                    accessibilityState={{selected: isSelected}}
                    testID={`avatar-${option.id}`}>
                    <View
                      style={[
                        styles.avatarColor,
                        {backgroundColor: option.background},
                      ]}
                    />
                    <Text style={styles.avatarOptionText}>{option.label}</Text>
                    <View
                      style={[
                        styles.selectionDot,
                        isSelected && styles.selectionDotSelected,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </TVFocusGuideView>
          </View>

          <View style={styles.editorPanel}>
            <View style={styles.editorHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  {strings.auth.accountInformation}
                </Text>
                <Text style={styles.sectionHint}>
                  {strings.common.yourPublicProfile}
                </Text>
              </View>
              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            </View>

            <View style={styles.formRow}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {strings.profiles?.profileNameLabel || strings.auth.usernameLabel}
                </Text>
                <TextInput
                  style={[styles.input]}
                  value={profileName}
                  onChangeText={setProfileName}
                  onFocus={() => setFocusedId('username')}
                  onBlur={() => setFocusedId(null)}
                  placeholder={strings.profiles.profileNamePlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={PROFILE_NAME_MAX_LENGTH}
                  testID="edit-username-input"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{strings.auth.emailLabel}</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText} numberOfLines={1}>
                    {email}
                  </Text>
                  <Text style={styles.lockedLabel}>{strings.common.locked}</Text>
                </View>
              </View>
            </View>

            {/* Kids Profile Toggle */}
            <TVFocusGuideView style={styles.toggleRow} autoFocus>
              <PreferenceToggle
                id="kids-toggle"
                label={strings.profiles.kidsProfileLabel}
                hint={strings.profiles.kidsProfileShortHint}
                enabled={isKids}
                focusedId={focusedId}
                onFocus={setFocusedId}
                onPress={() => setIsKids((value) => !value)}
              />
            </TVFocusGuideView>

            {isKids && (
              <View style={styles.maturityGroup} testID="kids-maturity-selector">
                <Text style={styles.label}>
                  {strings.parentalControls.maturityLimitLabel}
                </Text>
                <Text style={styles.sectionHint}>
                  {strings.parentalControls.maturityLimitHint}
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
                    const isFocused = focusedId === `maturity-${option.id}`;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.maturityOption,
                          isSelected && styles.maturityOptionSelected,
                          isFocused && styles.controlFocused,
                        ]}
                        onFocus={() => setFocusedId(`maturity-${option.id}`)}
                        onBlur={() => setFocusedId(null)}
                        onPress={() => setKidsMaturityLimit(option.id)}
                        activeOpacity={1}
                        accessibilityRole="radio"
                        accessibilityState={{selected: isSelected}}
                        testID={`maturity-option-${option.id}`}>
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

            <View style={styles.formRow}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{strings.auth.cityLabel}</Text>
                <TextInput
                  style={[styles.input]}
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setFocusedId('city')}
                  onBlur={() => setFocusedId(null)}
                  placeholder={strings.placeholders.city}
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  testID="edit-city-input"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{strings.auth.countryLabel}</Text>
                <TextInput
                  style={[styles.input]}
                  value={country}
                  onChangeText={setCountry}
                  onFocus={() => setFocusedId('country')}
                  onBlur={() => setFocusedId(null)}
                  placeholder={strings.placeholders.country}
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  testID="edit-country-input"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.groupLabel}>{strings.auth.themeLabel}</Text>
            <TVFocusGuideView style={styles.themeRow} autoFocus>
              {PROFILE_THEMES.map((option) => {
                const isSelected = themePreference === option.id;
                const isFocused = focusedId === `theme-${option.id}`;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.themeOption,
                      isSelected && styles.themeOptionSelected,
                      isFocused && styles.controlFocused,
                    ]}
                    onFocus={() => setFocusedId(`theme-${option.id}`)}
                    onBlur={() => setFocusedId(null)}
                    onPress={() => setThemePreference(option.id)}
                    activeOpacity={1}
                    accessibilityRole="radio"
                    accessibilityState={{selected: isSelected}}
                    testID={`theme-${option.id}`}>
                    <View
                      style={[
                        styles.themeColor,
                        {backgroundColor: option.color},
                      ]}
                    />
                    <Text style={styles.themeOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </TVFocusGuideView>

            <TVFocusGuideView style={styles.toggleRow} autoFocus>
              <PreferenceToggle
                id="notifications"
                label={strings.auth.notificationsLabel}
                hint={strings.auth.notificationsHint}
                enabled={notificationsEnabled}
                focusedId={focusedId}
                onFocus={setFocusedId}
                onPress={() => setNotificationsEnabled((value) => !value)}
              />
              <PreferenceToggle
                id="autoplay"
                label={strings.auth.autoplayLabel}
                hint={strings.auth.autoplayHint}
                enabled={autoplayEnabled}
                focusedId={focusedId}
                onFocus={setFocusedId}
                onPress={() => setAutoplayEnabled((value) => !value)}
              />
            </TVFocusGuideView>

            <TVFocusGuideView style={styles.actionRow} autoFocus>
              {activeProfile && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    focusedId === 'delete' && styles.controlFocused,
                  ]}
                  onFocus={() => setFocusedId('delete')}
                  onBlur={() => setFocusedId(null)}
                  onPress={() => setShowDeleteDialog(true)}
                  disabled={saving || deleting}
                  activeOpacity={1}
                  accessibilityRole="button"
                  testID="delete-profile-button">
                  <Text style={styles.deleteButtonText}>
                    {strings.profiles?.deleteProfile || 'Delete Profile'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  focusedId === 'cancel' && styles.controlFocused,
                ]}
                onFocus={() => setFocusedId('cancel')}
                onBlur={() => setFocusedId(null)}
                onPress={leaveEditor}
                disabled={saving || deleting}
                activeOpacity={1}
                accessibilityRole="button"
                testID="cancel-profile-button">
                <Text style={styles.cancelButtonText}>
                  {strings.auth.cancelChanges}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  focusedId === 'save' && styles.controlFocused,
                  (saving || deleting) && styles.controlDisabled,
                ]}
                onFocus={() => setFocusedId('save')}
                onBlur={() => setFocusedId(null)}
                onPress={handleSave}
                disabled={saving || deleting}
                activeOpacity={1}
                accessibilityRole="button"
                testID="save-profile-button">
                {saving ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {strings.auth.saveChanges}
                  </Text>
                )}
              </TouchableOpacity>
            </TVFocusGuideView>
          </View>
        </View>

        <DeleteProfileDialog
          visible={showDeleteDialog}
          profile={activeProfile}
          isOnlyProfile={profiles.length <= 1}
          isDeleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />

        <PinEntryDialog
          visible={showPinDialog}
          title={strings.parentalControls.enterPinTitle}
          subtitle={strings.parentalControls.profileManagementLockMessage}
          isConfirmMode={false}
          validatePin={verifyParentPin}
          onSuccess={async () => {
            setShowPinDialog(false);
            if (pendingPinAction === 'save') {
              await executeSave();
            }
            setPendingPinAction(null);
          }}
          onCancel={() => {
            setShowPinDialog(false);
            setPendingPinAction(null);
          }}
          testID="edit-profile-pin-dialog"
        />
      </TVFocusGuideView>
    </ScreenLayout>
  );
};
