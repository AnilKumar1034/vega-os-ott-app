import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ScreenLayout} from '../components/templates/ScreenLayout';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {styles} from './SettingsScreen.styles';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const {user, userProfile, logout} = useAuth();
  const [focusedBtn, setFocusedBtn] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate(Routes.Login);
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const displayName =
    userProfile?.username || user?.displayName || strings.auth.defaultUser;
  const email = userProfile?.email || user?.email || strings.auth.notAvailable;
  const subscription = userProfile?.subscription || strings.auth.defaultSub;
  const city = userProfile?.city || strings.auth.notSpecified;
  const country = userProfile?.country || strings.auth.notSpecified;

  return (
    <ScreenLayout
      activeRoute={Routes.Settings}
      title={strings.nav.settingsTitle}
      description={strings.nav.settingsDesc}
      showSearch={false}>
      <TVFocusGuideView style={styles.container} autoFocus>
        <View style={styles.card}>
          {user ? (
            <>
              <View style={styles.headerRow}>
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userEmail}>{email}</Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {strings.auth.subscriptionTierLabel}
                  </Text>
                  <View style={styles.subBadge}>
                    <Text style={styles.subBadgeText}>{subscription}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{strings.auth.cityLabel}</Text>
                  <Text style={styles.infoValue}>{city}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {strings.auth.countryLabel}
                  </Text>
                  <Text style={styles.infoValue}>{country}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {strings.auth.accountUidLabel}
                  </Text>
                  <Text style={[styles.infoValue, styles.infoValueSmall]}>
                    {user.uid}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  focusedBtn === 'logout' && styles.logoutButtonFocused,
                ]}
                onFocus={() => setFocusedBtn('logout')}
                onBlur={() => setFocusedBtn(null)}
                onPress={handleLogout}
                hasTVPreferredFocus
                activeOpacity={0.85}
                accessibilityRole="button"
                testID="logout-button">
                <Text style={styles.logoutButtonText}>
                  {strings.actions.logOut}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.userName}>
                {strings.auth.notSignedInTitle}
              </Text>
              <Text style={styles.userEmail}>
                {strings.auth.notSignedInSubtitle}
              </Text>

              <View style={styles.authActionRow}>
                <TouchableOpacity
                  style={[
                    styles.authBtn,
                    focusedBtn === 'login' && styles.authBtnFocused,
                  ]}
                  onFocus={() => setFocusedBtn('login')}
                  onBlur={() => setFocusedBtn(null)}
                  onPress={() => navigation.navigate(Routes.Login)}
                  hasTVPreferredFocus
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  testID="settings-login-button">
                  <Text style={styles.authBtnText}>
                    {strings.actions.signIn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.authBtn,
                    styles.authBtnSecondary,
                    focusedBtn === 'register' && styles.authBtnFocused,
                  ]}
                  onFocus={() => setFocusedBtn('register')}
                  onBlur={() => setFocusedBtn(null)}
                  onPress={() => navigation.navigate(Routes.Register)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  testID="settings-register-button">
                  <Text style={styles.authBtnText}>
                    {strings.actions.register}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TVFocusGuideView>
    </ScreenLayout>
  );
};
