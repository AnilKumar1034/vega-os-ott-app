import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ProfileAvatar} from '../components/molecules/ProfileAvatar';
import {ScreenLayout} from '../components/templates/ScreenLayout';
import {
  getProfileAvatar,
  getProfileTheme,
  getSubscriptionQuality,
} from '../constants/profileOptions';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {styles} from './ProfileScreen.styles';

interface DetailTileProps {
  label: string;
  value: string;
}

const DetailTile = ({label, value}: DetailTileProps) => (
  <View style={styles.detailTile}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

interface PreferenceRowProps {
  label: string;
  hint: string;
  value: string;
  enabled?: boolean;
  color?: string;
}

const PreferenceRow = ({
  label,
  hint,
  value,
  enabled,
  color,
}: PreferenceRowProps) => (
  <View style={styles.preferenceRow}>
    <View
      style={[styles.preferenceIcon, color ? {borderColor: color} : undefined]}>
      <View
        style={[
          styles.preferenceIconDot,
          color ? {backgroundColor: color} : undefined,
          enabled === false && styles.preferenceIconDotDisabled,
        ]}
      />
    </View>
    <View style={styles.preferenceCopy}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Text style={styles.preferenceHint}>{hint}</Text>
    </View>
    <View style={[styles.valuePill, enabled && styles.valuePillEnabled]}>
      <Text style={styles.valuePillText}>{value}</Text>
    </View>
  </View>
);

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const {user, userProfile} = useAuth();
  const [isEditFocused, setIsEditFocused] = useState(false);

  const displayName =
    userProfile?.username || user?.displayName || strings.auth.defaultUser;
  const email = userProfile?.email || user?.email || strings.auth.notAvailable;
  const subscription = userProfile?.subscription || strings.auth.defaultSub;
  const subscriptionQuality = getSubscriptionQuality(subscription);
  const city = userProfile?.city || strings.auth.notSpecified;
  const country = userProfile?.country || strings.auth.notSpecified;
  const avatarOption = getProfileAvatar(userProfile?.avatar);
  const theme = getProfileTheme(userProfile?.themePreference);
  const notificationsEnabled = userProfile?.notificationsEnabled ?? true;
  const autoplayEnabled = userProfile?.autoplayEnabled ?? true;

  return (
    <ScreenLayout
      activeRoute={Routes.Profile}
      menuActiveRoute={Routes.Settings}
      title={strings.nav.profileTitle}
      description={strings.nav.profileDesc}
      compactHeader
      preferContentFocus
      showSearch={false}>
      <TVFocusGuideView style={styles.container} autoFocus>
        <View style={styles.card}>
          <View style={styles.identityPanel}>
            <View style={styles.panelEyebrowRow}>
              <Text style={styles.panelEyebrow}>
                {strings.auth.profileSummary}
              </Text>
              <View style={styles.readyBadge}>
                <View style={styles.readyDot} />
                <Text style={styles.readyText}>
                  {strings.auth.profileReady}
                </Text>
              </View>
            </View>

            <ProfileAvatar
              avatar={userProfile?.avatar}
              displayName={displayName}
              size="large"
            />

            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>

            <View style={styles.membershipCard}>
              <View>
                <Text style={styles.membershipLabel}>
                  {strings.auth.activeMembership}
                </Text>
                <Text style={styles.membershipValue}>{subscription}</Text>
              </View>
              <Text style={styles.membershipQuality}>
                {subscriptionQuality}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.editButton,
                isEditFocused && styles.editButtonFocused,
              ]}
              onFocus={() => setIsEditFocused(true)}
              onBlur={() => setIsEditFocused(false)}
              onPress={() => navigation.navigate(Routes.EditProfile)}
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.auth.editProfile}
              testID="profile-edit-button">
              <Text style={styles.editButtonText}>
                {strings.auth.editProfile}
              </Text>
              <Text style={styles.editButtonArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentPanel}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {strings.auth.accountInformation}
                </Text>
                <Text style={styles.sectionHint}>
                  {strings.auth.accountInformationHint}
                </Text>
              </View>
              <View style={styles.avatarNameBadge}>
                <Text style={styles.avatarNameBadgeText}>
                  {avatarOption.label}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <DetailTile label={strings.auth.cityLabel} value={city} />
              <DetailTile label={strings.auth.countryLabel} value={country} />
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {strings.auth.viewingPreferences}
                </Text>
                <Text style={styles.sectionHint}>
                  {strings.auth.viewingPreferencesHint}
                </Text>
              </View>
            </View>

            <View style={styles.preferencesList}>
              <PreferenceRow
                label={strings.auth.themeLabel}
                hint={strings.auth.themeHint}
                value={theme.label}
                color={theme.color}
              />
              <PreferenceRow
                label={strings.auth.notificationsLabel}
                hint={strings.auth.notificationsHint}
                value={notificationsEnabled ? strings.common.on : strings.common.off}
                enabled={notificationsEnabled}
              />
              <PreferenceRow
                label={strings.auth.autoplayLabel}
                hint={strings.auth.autoplayHint}
                value={autoplayEnabled ? strings.common.on : strings.common.off}
                enabled={autoplayEnabled}
              />
            </View>
          </View>
        </View>
      </TVFocusGuideView>
    </ScreenLayout>
  );
};
