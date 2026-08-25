import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ProfileAvatar} from '../components/molecules/ProfileAvatar';
import {ScreenLayout} from '../components/templates/ScreenLayout';
import {
  getSubscriptionQuality,
  PROFILE_THEMES,
} from '../constants/profileOptions';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {styles} from './SettingsScreen.styles';

interface ActionButtonProps {
  id: string;
  label: string;
  hint: string;
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}

const ActionButton = ({
  id,
  label,
  hint,
  focusedId,
  onFocus,
  onPress,
  destructive = false,
  testID,
}: ActionButtonProps) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      destructive && styles.actionButtonDestructive,
      focusedId === id && styles.focusedControl,
    ]}
    onFocus={() => onFocus(id)}
    onBlur={() => onFocus(null)}
    onPress={onPress}
    activeOpacity={1}
    accessibilityRole="button"
    accessibilityLabel={label}
    testID={testID}>
    <View style={styles.actionCopy}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionHint}>{hint}</Text>
    </View>
    <Text style={styles.actionArrow}>{'>'}</Text>
  </TouchableOpacity>
);

interface ToggleCardProps {
  id: string;
  label: string;
  hint: string;
  enabled: boolean;
  focusedId: string | null;
  disabled: boolean;
  onFocus: (id: string | null) => void;
  onPress: () => void;
}

const ToggleCard = ({
  id,
  label,
  hint,
  enabled,
  focusedId,
  disabled,
  onFocus,
  onPress,
}: ToggleCardProps) => (
  <TouchableOpacity
    style={[
      styles.toggleCard,
      focusedId === id && styles.focusedControl,
      disabled && styles.controlDisabled,
    ]}
    onFocus={() => onFocus(id)}
    onBlur={() => onFocus(null)}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={1}
    accessibilityRole="switch"
    accessibilityState={{checked: enabled, disabled}}>
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

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const {user, userProfile, logout, updateProfile, loading} = useAuth();
  const {activeProfile, clearActiveProfile} = useProfile();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState(
    userProfile?.themePreference || 'cinematic',
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.notificationsEnabled ?? true,
  );
  const [autoplayEnabled, setAutoplayEnabled] = useState(
    userProfile?.autoplayEnabled ?? true,
  );
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  useEffect(() => {
    setThemePreference(userProfile?.themePreference || 'cinematic');
    setNotificationsEnabled(userProfile?.notificationsEnabled ?? true);
    setAutoplayEnabled(userProfile?.autoplayEnabled ?? true);
  }, [
    userProfile?.autoplayEnabled,
    userProfile?.notificationsEnabled,
    userProfile?.themePreference,
  ]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      navigation.replace(Routes.Login, {
        redirectTo: {routeName: Routes.Settings},
      });
    }
  }, [loading, navigation, user]);

  const displayName =
    activeProfile?.name ||
    userProfile?.username ||
    user?.displayName ||
    strings.auth.defaultUser;
  const avatar = activeProfile?.avatarId || userProfile?.avatar;
  const isKids = activeProfile?.isKids ?? false;

  const email = userProfile?.email || user?.email || strings.auth.notAvailable;
  const subscription = userProfile?.subscription || strings.auth.defaultSub;
  const subscriptionQuality = getSubscriptionQuality(subscription);
  const city = userProfile?.city || strings.auth.notSpecified;
  const country = userProfile?.country || strings.auth.notSpecified;

  const handleLogout = async () => {
    try {
      await clearActiveProfile();
      await logout();
      navigation.navigate(Routes.Login);
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const updateTheme = async (nextTheme: string) => {
    if (nextTheme === themePreference || savingPreference) {
      return;
    }
    const previousTheme = themePreference;
    setThemePreference(nextTheme);
    setPreferenceError(null);
    setSavingPreference(true);
    try {
      await updateProfile({themePreference: nextTheme});
    } catch (err) {
      console.log('Theme preference update error:', err);
      setThemePreference(previousTheme);
      setPreferenceError(strings.auth.preferenceUpdateFailed);
    } finally {
      setSavingPreference(false);
    }
  };

  const toggleNotifications = async () => {
    if (savingPreference) {
      return;
    }
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    setPreferenceError(null);
    setSavingPreference(true);
    try {
      await updateProfile({notificationsEnabled: nextValue});
    } catch (err) {
      console.log('Notification preference update error:', err);
      setNotificationsEnabled(!nextValue);
      setPreferenceError(strings.auth.preferenceUpdateFailed);
    } finally {
      setSavingPreference(false);
    }
  };

  const toggleAutoplay = async () => {
    if (savingPreference) {
      return;
    }
    const nextValue = !autoplayEnabled;
    setAutoplayEnabled(nextValue);
    setPreferenceError(null);
    setSavingPreference(true);
    try {
      await updateProfile({autoplayEnabled: nextValue});
    } catch (err) {
      console.log('Autoplay preference update error:', err);
      setAutoplayEnabled(!nextValue);
      setPreferenceError(strings.auth.preferenceUpdateFailed);
    } finally {
      setSavingPreference(false);
    }
  };

  return (
    <ScreenLayout
      activeRoute={Routes.Settings}
      title={strings.nav.settingsTitle}
      description={strings.nav.settingsDesc}
      compactHeader
      preferContentFocus
      showSearch={false}>
      <TVFocusGuideView style={styles.container} autoFocus>
        {user ? (
          <View style={styles.card}>
            <View style={styles.accountPanel}>
              <View style={styles.accountHeader}>
                <ProfileAvatar
                  avatar={avatar}
                  displayName={displayName}
                />
                <View style={styles.accountHeaderCopy}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {isKids && (
                    <Text style={styles.kidsBadgeText}>
                      {strings.profiles?.kidsBadge || 'KIDS PROFILE'}
                    </Text>
                  )}
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={styles.planRow}>
                <View>
                  <Text style={styles.metaLabel}>
                    {strings.auth.subscriptionTierLabel}
                  </Text>
                  <Text style={styles.planValue}>{subscription}</Text>
                </View>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>
                    {subscriptionQuality}
                  </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <View style={styles.locationItem}>
                  <Text style={styles.metaLabel}>{strings.auth.cityLabel}</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {city}
                  </Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.metaLabel}>
                    {strings.auth.countryLabel}
                  </Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {country}
                  </Text>
                </View>
              </View>

              <View style={styles.accountActions}>
                <ActionButton
                  id="profile"
                  label={strings.auth.viewProfile}
                  hint={strings.common.accountOverview}
                  focusedId={focusedId}
                  onFocus={setFocusedId}
                  onPress={() => navigation.navigate(Routes.Profile)}
                  testID="settings-profile-button"
                />
                <ActionButton
                  id="edit"
                  label={strings.auth.editProfile}
                  hint={strings.common.avatarAndDetails}
                  focusedId={focusedId}
                  onFocus={setFocusedId}
                  onPress={() => navigation.navigate(Routes.EditProfile)}
                  testID="settings-edit-profile-button"
                />
                <ActionButton
                  id="switch-profile"
                  label={strings.profiles?.switchProfile || 'Switch Profile'}
                  hint={strings.profiles?.switchProfileHint || 'Switch to another viewing profile'}
                  focusedId={focusedId}
                  onFocus={setFocusedId}
                  onPress={() => navigation.navigate(Routes.ProfileSelection)}
                  testID="settings-switch-profile-button"
                />
              </View>

              <View style={styles.accountFooter}>
                <ActionButton
                  id="logout"
                  label={strings.actions.logOut}
                  hint={strings.common.signOutOfThisTV}
                  focusedId={focusedId}
                  onFocus={setFocusedId}
                  onPress={handleLogout}
                  destructive
                  testID="logout-button"
                />
              </View>
            </View>

            <View style={styles.preferencesPanel}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {strings.auth.viewingPreferences}
                  </Text>
                  <Text style={styles.sectionHint}>
                    {strings.auth.viewingPreferencesHint}
                  </Text>
                </View>
                <Text style={styles.saveStatus}>
                  {savingPreference ? strings.common.saving : strings.common.autoSaved}
                </Text>
              </View>

              <Text style={styles.groupLabel}>{strings.auth.themeLabel}</Text>
              <TVFocusGuideView style={styles.themeRow} autoFocus>
                {PROFILE_THEMES.map((option) => {
                  const isSelected = themePreference === option.id;
                  const isFocused = focusedId === `theme-${option.id}`;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.themeCard,
                        isSelected && styles.themeCardSelected,
                        isFocused && styles.focusedControl,
                        savingPreference && styles.controlDisabled,
                      ]}
                      onFocus={() => setFocusedId(`theme-${option.id}`)}
                      onBlur={() => setFocusedId(null)}
                      onPress={() => updateTheme(option.id)}
                      disabled={savingPreference}
                      hasTVPreferredFocus={isSelected}
                      activeOpacity={1}
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected: isSelected,
                        disabled: savingPreference,
                      }}
                      testID={`settings-theme-${option.id}`}>
                      <View
                        style={[
                          styles.themeSwatch,
                          {backgroundColor: option.color},
                        ]}
                      />
                      <Text style={styles.themeName}>{option.label}</Text>
                      <Text style={styles.themeHint}>{option.description}</Text>
                      <Text
                        style={[
                          styles.themeState,
                          isSelected && styles.themeStateSelected,
                        ]}>
                        {isSelected ? strings.common.selected : strings.common.select}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </TVFocusGuideView>

              <View style={styles.divider} />

              <Text style={styles.groupLabel}>
                {strings.common.playbackAndAlerts}
              </Text>
              <TVFocusGuideView style={styles.toggleRow} autoFocus>
                <ToggleCard
                  id="notifications"
                  label={strings.auth.notificationsLabel}
                  hint={strings.auth.notificationsHint}
                  enabled={notificationsEnabled}
                  focusedId={focusedId}
                  disabled={savingPreference}
                  onFocus={setFocusedId}
                  onPress={toggleNotifications}
                />
                <ToggleCard
                  id="autoplay"
                  label={strings.auth.autoplayLabel}
                  hint={strings.auth.autoplayHint}
                  enabled={autoplayEnabled}
                  focusedId={focusedId}
                  disabled={savingPreference}
                  onFocus={setFocusedId}
                  onPress={toggleAutoplay}
                />
              </TVFocusGuideView>

              {preferenceError ? (
                <Text style={styles.preferenceError}>{preferenceError}</Text>
              ) : (
                <Text style={styles.remoteHint}>
                  {strings.common.remoteHint}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.signedOutCard}>
            <Text style={styles.signedOutTitle}>
              {strings.auth.notSignedInTitle}
            </Text>
            <Text style={styles.signedOutSubtitle}>
              {strings.auth.notSignedInSubtitle}
            </Text>
            <View style={styles.signedOutActions}>
              <TouchableOpacity
                style={[
                  styles.authButton,
                  focusedId === 'login' && styles.focusedControl,
                ]}
                onFocus={() => setFocusedId('login')}
                onBlur={() => setFocusedId(null)}
                onPress={() => navigation.navigate(Routes.Login)}
                hasTVPreferredFocus
                activeOpacity={1}
                accessibilityRole="button"
                testID="settings-login-button">
                <Text style={styles.authButtonText}>
                  {strings.actions.signIn}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.authButton,
                  styles.authButtonSecondary,
                  focusedId === 'register' && styles.focusedControl,
                ]}
                onFocus={() => setFocusedId('register')}
                onBlur={() => setFocusedId(null)}
                onPress={() => navigation.navigate(Routes.Register)}
                activeOpacity={1}
                accessibilityRole="button"
                testID="settings-register-button">
                <Text style={styles.authButtonText}>
                  {strings.actions.register}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TVFocusGuideView>
    </ScreenLayout>
  );
};
