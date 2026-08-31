import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {strings} from '../../constants/strings';
import {colors} from '../../theme/colors';
import {ProfileCard} from '../components/ProfileCard';
import {PinEntryDialog} from '../../components/molecules/PinEntryDialog';
import {useProfile} from '../hooks/useProfile';
import {MAX_PROFILES_PER_ACCOUNT, UserProfile} from '../types/Profile';
import {styles} from './ProfileSelectionScreen.styles';

export const ProfileSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const {
    profiles,
    activeProfile,
    isLoadingProfiles,
    error,
    isParentAuthorized,
    parentalSettings,
    verifyParentPin,
    switchProfile,
    refreshProfiles,
  } = useProfile();

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFocused, setRetryFocused] = useState(false);
  const [pendingProfileSwitch, setPendingProfileSwitch] =
    useState<UserProfile | null>(null);
  const [showAddPinDialog, setShowAddPinDialog] = useState(false);

  const isPinLockActive = Boolean(
    activeProfile?.isKids &&
      parentalSettings?.pinEnabled &&
      !isParentAuthorized,
  );

  const executeSwitch = async (profile: UserProfile) => {
    try {
      await switchProfile(profile.id);
      navigation.replace(Routes.Home);
    } catch (err) {
      console.log('Error selecting profile:', err);
    }
  };

  const handleSelectProfile = async (profile: UserProfile) => {
    // If switching from Kids profile to an Adult profile and PIN is enabled
    if (isPinLockActive && !profile.isKids) {
      setPendingProfileSwitch(profile);
      return;
    }

    await executeSwitch(profile);
  };

  const handleAddProfile = () => {
    if (isPinLockActive) {
      setShowAddPinDialog(true);
      return;
    }
    navigation.navigate(Routes.CreateProfile);
  };

  const handlePinSuccessForSwitch = async () => {
    if (pendingProfileSwitch) {
      const target = pendingProfileSwitch;
      setPendingProfileSwitch(null);
      await executeSwitch(target);
    }
  };

  const handlePinSuccessForAdd = () => {
    setShowAddPinDialog(false);
    navigation.navigate(Routes.CreateProfile);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshProfiles();
    } finally {
      setIsRetrying(false);
    }
  };

  const canAddMoreProfiles = profiles.length < MAX_PROFILES_PER_ACCOUNT;

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.backgroundImage}
      testID="profile-selection-screen">
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/vega.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={styles.title}>{strings.profiles.whosWatching}</Text>
          <Text style={styles.subtitle}>
            {strings.profiles.selectProfileSubtitle}
          </Text>
        </View>

        {isLoadingProfiles || isRetrying ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.heroAccent} />
            <Text style={styles.loadingText}>
              {strings.profiles.loadingProfiles}
            </Text>
          </View>
        ) : error && profiles.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                retryFocused && styles.retryButtonFocused,
              ]}
              onFocus={() => setRetryFocused(true)}
              onBlur={() => setRetryFocused(false)}
              onPress={handleRetry}
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.actions.retry}
              testID="retry-profiles-button">
              <Text style={styles.retryButtonText}>
                {strings.actions.retry}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TVFocusGuideView style={styles.profilesGrid} autoFocus>
            {profiles.map((profile, index) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={activeProfile?.id === profile.id}
                hasTVPreferredFocus={
                  activeProfile?.id === profile.id ||
                  (!activeProfile && index === 0)
                }
                onPress={() => handleSelectProfile(profile)}
              />
            ))}

            {canAddMoreProfiles && (
              <ProfileCard
                isAddProfile
                hasTVPreferredFocus={profiles.length === 0}
                onPress={handleAddProfile}
              />
            )}
          </TVFocusGuideView>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{strings.common.remoteHint}</Text>
        </View>
      </View>

      {/* PIN verification when switching from Kids to Adult profile */}
      <PinEntryDialog
        visible={Boolean(pendingProfileSwitch)}
        title={strings.parentalControls.enterPinTitle}
        subtitle={strings.parentalControls.switchFromKidsLockMessage}
        isConfirmMode={false}
        validatePin={verifyParentPin}
        onSuccess={handlePinSuccessForSwitch}
        onCancel={() => setPendingProfileSwitch(null)}
        testID="switch-adult-pin-dialog"
      />

      {/* PIN verification when creating profile from Kids mode */}
      <PinEntryDialog
        visible={showAddPinDialog}
        title={strings.parentalControls.enterPinTitle}
        subtitle={strings.parentalControls.profileManagementLockMessage}
        isConfirmMode={false}
        validatePin={verifyParentPin}
        onSuccess={handlePinSuccessForAdd}
        onCancel={() => setShowAddPinDialog(false)}
        testID="add-profile-pin-dialog"
      />
    </ImageBackground>
  );
};
