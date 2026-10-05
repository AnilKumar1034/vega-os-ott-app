import React, {useEffect, useRef, useState} from 'react';
import {BackHandler, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ParentalControlsModal} from '../components/molecules/ParentalControlsModal';
import {PinEntryDialog} from '../components/molecules/PinEntryDialog';
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
import {isBackEvent, isKeyDown, isSelectEvent} from '../utils/inputUtils';
import {styles} from './SettingsScreen.styles';

const useSafeNavigation = () => {
  try {
    return useNavigation<any>();
  } catch {
    return {
      navigate: () => {},
      dispatch: () => {},
      goBack: () => {},
      replace: () => {},
      canGoBack: () => false,
    } as any;
  }
};

interface ActionButtonProps {
  id: string;
  label: string;
  hint: string;
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
  hasTVPreferredFocus?: boolean;
  buttonRef?: (node: any) => void;
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
  hasTVPreferredFocus = false,
  buttonRef,
}: ActionButtonProps) => (
  <TouchableOpacity
    ref={buttonRef}
    style={[
      styles.actionButton,
      destructive && styles.actionButtonDestructive,
      focusedId === id && styles.focusedControl,
    ]}
    onFocus={() => onFocus(id)}
    onBlur={() => onFocus(null)}
    onPress={onPress}
    hasTVPreferredFocus={hasTVPreferredFocus}
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
  hasTVPreferredFocus?: boolean;
  cardRef?: (node: any) => void;
  testID?: string;
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
  hasTVPreferredFocus = false,
  cardRef,
  testID,
}: ToggleCardProps) => (
  <TouchableOpacity
    ref={cardRef}
    style={[
      styles.toggleCard,
      focusedId === id && styles.focusedControl,
      disabled && styles.controlDisabled,
    ]}
    onFocus={() => onFocus(id)}
    onBlur={() => onFocus(null)}
    onPress={onPress}
    disabled={disabled}
    hasTVPreferredFocus={hasTVPreferredFocus}
    activeOpacity={1}
    accessibilityRole="switch"
    accessibilityState={{checked: enabled, disabled}}
    testID={testID}>
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
  const navigation = useSafeNavigation();
  const {user, userProfile, logout, updateProfile, loading} = useAuth();
  const {
    activeProfile,
    clearActiveProfile,
    parentalSettings,
    isParentAuthorized,
    verifyParentPin,
  } = useProfile();
  const [focusedId, setFocusedId] = useState<string | null>(
    user ? 'profile' : 'login',
  );
  const focusedIdRef = useRef<string | null>(focusedId);
  focusedIdRef.current = focusedId;
  const lastFocusedAccountActionRef = useRef<string>(
    user ? 'profile' : 'login',
  );
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const elementRefs = useRef<{[key: string]: any}>({});
  const contentGuideRef = useRef<any>(null);
  const themeRowGuideRef = useRef<any>(null);
  const toggleRowGuideRef = useRef<any>(null);

  const [themePreference, setThemePreference] = useState(
    userProfile?.themePreference || 'cinematic',
  );
  const themePreferenceRef = useRef<string>(themePreference);
  themePreferenceRef.current = themePreference;

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.notificationsEnabled ?? true,
  );
  const [autoplayEnabled, setAutoplayEnabled] = useState(
    userProfile?.autoplayEnabled ?? true,
  );
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [showParentalModal, setShowParentalModal] = useState(false);
  const [showPinAuthDialog, setShowPinAuthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'parental_controls' | 'switch_profile' | null
  >(null);

  const isPinLockActive = Boolean(
    activeProfile?.isKids &&
      parentalSettings?.pinEnabled &&
      !isParentAuthorized,
  );

  const focusElement = (id: string) => {
    setFocusedId(id);
    if (
      id === 'profile' ||
      id === 'edit' ||
      id === 'parental-controls' ||
      id === 'switch-profile' ||
      id === 'logout'
    ) {
      lastFocusedAccountActionRef.current = id;
    }
    const target = elementRefs.current[id];
    if (target && typeof target.requestTVFocus === 'function') {
      target.requestTVFocus();
    }
  };

  const handleAccountFocus = (id: string | null) => {
    setFocusedId(id);
    if (id) {
      lastFocusedAccountActionRef.current = id;
    }
    setIsMenuExpanded(false);
  };

  const handlePreferenceFocus = (id: string | null) => {
    setFocusedId(id);
    setIsMenuExpanded(false);
  };

  const handleOpenParentalControls = () => {
    if (isPinLockActive) {
      setPendingAction('parental_controls');
      setShowPinAuthDialog(true);
      return;
    }
    setShowParentalModal(true);
  };

  const handleSwitchProfile = () => {
    if (isPinLockActive) {
      setPendingAction('switch_profile');
      setShowPinAuthDialog(true);
      return;
    }
    navigation.navigate(Routes.ProfileSelection);
  };

  const handlePinAuthSuccess = () => {
    setShowPinAuthDialog(false);
    if (pendingAction === 'parental_controls') {
      setShowParentalModal(true);
    } else if (pendingAction === 'switch_profile') {
      navigation.navigate(Routes.ProfileSelection);
    }
    setPendingAction(null);
  };

  const isMenuExpandedRef = useRef(isMenuExpanded);
  isMenuExpandedRef.current = isMenuExpanded;
  const showPinAuthDialogRef = useRef(showPinAuthDialog);
  showPinAuthDialogRef.current = showPinAuthDialog;
  const showParentalModalRef = useRef(showParentalModal);
  showParentalModalRef.current = showParentalModal;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showPinAuthDialogRef.current) {
          setShowPinAuthDialog(false);
          setPendingAction(null);
          return true;
        }
        if (showParentalModalRef.current) {
          return true;
        }
        if (isMenuExpandedRef.current) {
          setIsMenuExpanded(false);
          return true;
        }
        if (navigation.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate(Routes.Home);
        }
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [navigation]);

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    // 1. Back button handling
    if (isBackEvent(type)) {
      if (showPinAuthDialogRef.current) {
        setShowPinAuthDialog(false);
        setPendingAction(null);
        return;
      }
      if (showParentalModalRef.current) {
        // Modal handles its own back navigation
        return;
      }
      if (isMenuExpandedRef.current) {
        setIsMenuExpanded(false);
        return;
      }
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(Routes.Home);
      }
      return;
    }

    // Modal or Side Menu captures remaining keys while open
    if (
      showPinAuthDialogRef.current ||
      showParentalModalRef.current ||
      isMenuExpandedRef.current
    ) {
      return;
    }

    // 2. Left button handling
    if (type === 'left') {
      const current = focusedIdRef.current;
      // If focused in account panel or signed out button
      if (
        !current ||
        current === 'profile' ||
        current === 'edit' ||
        current === 'parental-controls' ||
        current === 'switch-profile' ||
        current === 'logout' ||
        current === 'login'
      ) {
        setIsMenuExpanded(true);
        return;
      }

      if (current === 'register') {
        focusElement('login');
        return;
      }

      // If at leftmost theme option (theme-ocean)
      if (current === `theme-${PROFILE_THEMES[0].id}`) {
        focusElement(lastFocusedAccountActionRef.current || 'profile');
        return;
      }

      // If at intermediate theme option
      const currentThemeIdx = PROFILE_THEMES.findIndex(
        (t) => `theme-${t.id}` === current,
      );
      if (currentThemeIdx > 0) {
        focusElement(`theme-${PROFILE_THEMES[currentThemeIdx - 1].id}`);
        return;
      }

      // If at notifications (leftmost toggle)
      if (current === 'notifications') {
        const fallback =
          lastFocusedAccountActionRef.current === 'logout'
            ? 'logout'
            : lastFocusedAccountActionRef.current || 'parental-controls';
        focusElement(fallback);
        return;
      }

      // If at autoplay (second toggle)
      if (current === 'autoplay') {
        focusElement('notifications');
        return;
      }
    }

    // 3. Right button handling
    if (type === 'right') {
      const current = focusedIdRef.current;
      if (current === 'login') {
        focusElement('register');
        return;
      }

      if (current === 'profile' || current === 'edit') {
        const targetTheme = `theme-${themePreferenceRef.current || PROFILE_THEMES[0].id}`;
        focusElement(targetTheme);
        return;
      }

      if (
        current === 'parental-controls' ||
        current === 'switch-profile' ||
        current === 'logout'
      ) {
        focusElement('notifications');
        return;
      }

      // Inside theme row
      const currentThemeIdx = PROFILE_THEMES.findIndex(
        (t) => `theme-${t.id}` === current,
      );
      if (currentThemeIdx >= 0 && currentThemeIdx < PROFILE_THEMES.length - 1) {
        focusElement(`theme-${PROFILE_THEMES[currentThemeIdx + 1].id}`);
        return;
      }

      // Inside toggle row
      if (current === 'notifications') {
        focusElement('autoplay');
        return;
      }
    }

    // 4. Down button handling
    if (type === 'down') {
      const current = focusedIdRef.current;
      if (current === 'profile') {
        focusElement('edit');
        return;
      }
      if (current === 'edit') {
        focusElement('parental-controls');
        return;
      }
      if (current === 'parental-controls') {
        focusElement('switch-profile');
        return;
      }
      if (current === 'switch-profile') {
        focusElement('logout');
        return;
      }

      // From theme row to toggle row
      if (current && current.startsWith('theme-')) {
        const themeIdx = PROFILE_THEMES.findIndex(
          (t) => `theme-${t.id}` === current,
        );
        if (themeIdx >= 2) {
          focusElement('autoplay');
        } else {
          focusElement('notifications');
        }
        return;
      }
    }

    // 5. Up button handling
    if (type === 'up') {
      const current = focusedIdRef.current;
      if (current === 'logout') {
        focusElement('switch-profile');
        return;
      }
      if (current === 'switch-profile') {
        focusElement('parental-controls');
        return;
      }
      if (current === 'parental-controls') {
        focusElement('edit');
        return;
      }
      if (current === 'edit') {
        focusElement('profile');
        return;
      }

      // From toggle row to theme row
      if (current === 'notifications') {
        const targetTheme = `theme-${themePreferenceRef.current || PROFILE_THEMES[0].id}`;
        focusElement(targetTheme);
        return;
      }
      if (current === 'autoplay') {
        focusElement(`theme-${PROFILE_THEMES[PROFILE_THEMES.length - 1].id}`);
        return;
      }
    }

    // 6. Select button handling
    if (isSelectEvent(type)) {
      const current = focusedIdRef.current;
      if (!current) return;

      if (current === 'profile') {
        navigation.navigate(Routes.Profile);
      } else if (current === 'edit') {
        navigation.navigate(Routes.EditProfile);
      } else if (current === 'parental-controls') {
        handleOpenParentalControls();
      } else if (current === 'switch-profile') {
        handleSwitchProfile();
      } else if (current === 'logout') {
        handleLogout();
      } else if (current.startsWith('theme-')) {
        const themeId = current.replace('theme-', '');
        updateTheme(themeId);
      } else if (current === 'notifications') {
        toggleNotifications();
      } else if (current === 'autoplay') {
        toggleAutoplay();
      } else if (current === 'login') {
        navigation.navigate(Routes.Login);
      } else if (current === 'register') {
        navigation.navigate(Routes.Register);
      }
    }
  });

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

  const activeDestination =
    (focusedId && elementRefs.current[focusedId]) ||
    elementRefs.current[lastFocusedAccountActionRef.current] ||
    elementRefs.current.profile ||
    contentGuideRef.current;

  return (
    <ScreenLayout
      activeRoute={Routes.Settings}
      title={strings.nav.settingsTitle}
      description={strings.nav.settingsDesc}
      compactHeader
      preferContentFocus
      showSearch={false}
      isMenuExpanded={isMenuExpanded}
      onMenuFocus={() => setIsMenuExpanded(true)}
      onMenuBlur={() => setIsMenuExpanded(false)}
      destinations={activeDestination ? [activeDestination] : undefined}>
      <TVFocusGuideView
        ref={contentGuideRef}
        style={styles.container}
        autoFocus={!isMenuExpanded}>
        {user ? (
          <View style={styles.card}>
            <View style={styles.accountPanel}>
              <View style={styles.accountHeader}>
                <ProfileAvatar avatar={avatar} displayName={displayName} />
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
                  onFocus={handleAccountFocus}
                  onPress={() => navigation.navigate(Routes.Profile)}
                  hasTVPreferredFocus={
                    focusedId === 'profile' && !isMenuExpanded
                  }
                  buttonRef={(node) => {
                    elementRefs.current.profile = node;
                  }}
                  testID="settings-profile-button"
                />
                <ActionButton
                  id="edit"
                  label={strings.auth.editProfile}
                  hint={strings.common.avatarAndDetails}
                  focusedId={focusedId}
                  onFocus={handleAccountFocus}
                  onPress={() => navigation.navigate(Routes.EditProfile)}
                  hasTVPreferredFocus={focusedId === 'edit' && !isMenuExpanded}
                  buttonRef={(node) => {
                    elementRefs.current.edit = node;
                  }}
                  testID="settings-edit-profile-button"
                />
                <ActionButton
                  id="parental-controls"
                  label={strings.parentalControls.settingsSection}
                  hint={
                    parentalSettings?.pinEnabled
                      ? strings.parentalControls.pinStatusEnabled
                      : strings.parentalControls.settingsHint
                  }
                  focusedId={focusedId}
                  onFocus={handleAccountFocus}
                  onPress={handleOpenParentalControls}
                  hasTVPreferredFocus={
                    focusedId === 'parental-controls' && !isMenuExpanded
                  }
                  buttonRef={(node) => {
                    elementRefs.current['parental-controls'] = node;
                  }}
                  testID="settings-parental-controls-button"
                />
                <ActionButton
                  id="switch-profile"
                  label={strings.profiles?.switchProfile || 'Switch Profile'}
                  hint={
                    strings.profiles?.switchProfileHint ||
                    'Switch to another viewing profile'
                  }
                  focusedId={focusedId}
                  onFocus={handleAccountFocus}
                  onPress={handleSwitchProfile}
                  hasTVPreferredFocus={
                    focusedId === 'switch-profile' && !isMenuExpanded
                  }
                  buttonRef={(node) => {
                    elementRefs.current['switch-profile'] = node;
                  }}
                  testID="settings-switch-profile-button"
                />
              </View>

              <View style={styles.accountFooter}>
                <ActionButton
                  id="logout"
                  label={strings.actions.logOut}
                  hint={strings.common.signOutOfThisTV}
                  focusedId={focusedId}
                  onFocus={handleAccountFocus}
                  onPress={handleLogout}
                  hasTVPreferredFocus={
                    focusedId === 'logout' && !isMenuExpanded
                  }
                  buttonRef={(node) => {
                    elementRefs.current.logout = node;
                  }}
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
                  {savingPreference
                    ? strings.common.saving
                    : strings.common.autoSaved}
                </Text>
              </View>

              <Text style={styles.groupLabel}>{strings.auth.themeLabel}</Text>
              <TVFocusGuideView
                ref={themeRowGuideRef}
                style={styles.themeRow}
                autoFocus={false}>
                {PROFILE_THEMES.map((option) => {
                  const isSelected = themePreference === option.id;
                  const isFocused = focusedId === `theme-${option.id}`;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      ref={(node) => {
                        elementRefs.current[`theme-${option.id}`] = node;
                      }}
                      style={[
                        styles.themeCard,
                        isSelected && styles.themeCardSelected,
                        isFocused && styles.focusedControl,
                        savingPreference && styles.controlDisabled,
                      ]}
                      onFocus={() => handlePreferenceFocus(`theme-${option.id}`)}
                      onBlur={() => handlePreferenceFocus(null)}
                      onPress={() => updateTheme(option.id)}
                      disabled={savingPreference}
                      hasTVPreferredFocus={isFocused && !isMenuExpanded}
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
                        {isSelected
                          ? strings.common.selected
                          : strings.common.select}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </TVFocusGuideView>

              <View style={styles.divider} />

              <Text style={styles.groupLabel}>
                {strings.common.playbackAndAlerts}
              </Text>
              <TVFocusGuideView
                ref={toggleRowGuideRef}
                style={styles.toggleRow}
                autoFocus={false}>
                <ToggleCard
                  id="notifications"
                  label={strings.auth.notificationsLabel}
                  hint={strings.auth.notificationsHint}
                  enabled={notificationsEnabled}
                  focusedId={focusedId}
                  disabled={savingPreference}
                  onFocus={handlePreferenceFocus}
                  onPress={toggleNotifications}
                  hasTVPreferredFocus={
                    focusedId === 'notifications' && !isMenuExpanded
                  }
                  cardRef={(node) => {
                    elementRefs.current.notifications = node;
                  }}
                  testID="settings-toggle-notifications"
                />
                <ToggleCard
                  id="autoplay"
                  label={strings.auth.autoplayLabel}
                  hint={strings.auth.autoplayHint}
                  enabled={autoplayEnabled}
                  focusedId={focusedId}
                  disabled={savingPreference}
                  onFocus={handlePreferenceFocus}
                  onPress={toggleAutoplay}
                  hasTVPreferredFocus={
                    focusedId === 'autoplay' && !isMenuExpanded
                  }
                  cardRef={(node) => {
                    elementRefs.current.autoplay = node;
                  }}
                  testID="settings-toggle-autoplay"
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
                ref={(node) => {
                  elementRefs.current.login = node;
                }}
                style={[
                  styles.authButton,
                  focusedId === 'login' && styles.focusedControl,
                ]}
                onFocus={() => {
                  setFocusedId('login');
                  setIsMenuExpanded(false);
                }}
                onBlur={() => setFocusedId(null)}
                onPress={() => navigation.navigate(Routes.Login)}
                hasTVPreferredFocus={
                  !isMenuExpanded &&
                  (focusedId === 'login' || focusedId !== 'register')
                }
                activeOpacity={1}
                accessibilityRole="button"
                testID="settings-login-button">
                <Text style={styles.authButtonText}>
                  {strings.actions.signIn}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                ref={(node) => {
                  elementRefs.current.register = node;
                }}
                style={[
                  styles.authButton,
                  styles.authButtonSecondary,
                  focusedId === 'register' && styles.focusedControl,
                ]}
                onFocus={() => {
                  setFocusedId('register');
                  setIsMenuExpanded(false);
                }}
                onBlur={() => setFocusedId(null)}
                onPress={() => navigation.navigate(Routes.Register)}
                hasTVPreferredFocus={
                  !isMenuExpanded && focusedId === 'register'
                }
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

      <ParentalControlsModal
        visible={showParentalModal}
        onClose={() => setShowParentalModal(false)}
      />

      <PinEntryDialog
        visible={showPinAuthDialog}
        title={strings.parentalControls.enterPinTitle}
        subtitle={strings.parentalControls.enterPinSubtitle}
        isConfirmMode={false}
        validatePin={verifyParentPin}
        onSuccess={handlePinAuthSuccess}
        onCancel={() => {
          setShowPinAuthDialog(false);
          setPendingAction(null);
        }}
        testID="settings-pin-auth-dialog"
      />
    </ScreenLayout>
  );
};
