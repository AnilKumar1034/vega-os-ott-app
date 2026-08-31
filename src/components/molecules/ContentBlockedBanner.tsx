import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {strings} from '../../constants/strings';
import {styles} from './ContentBlockedBanner.styles';

export interface ContentBlockedBannerProps {
  title?: string;
  message?: string;
  testID?: string;
  onBackToHome?: () => void;
  onSwitchProfile?: () => void;
}

export const ContentBlockedBanner = ({
  title = strings.parentalControls.contentRestrictedTitle,
  message = strings.parentalControls.contentRestrictedMessage,
  testID = 'content-blocked-banner',
  onBackToHome,
  onSwitchProfile,
}: ContentBlockedBannerProps) => {
  const navigation = useNavigation<any>();
  const [focusedAction, setFocusedAction] = useState<'home' | 'switch'>('home');

  const handleHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      navigation.navigate(Routes.Home);
    }
  };

  const handleSwitch = () => {
    if (onSwitchProfile) {
      onSwitchProfile();
    } else {
      navigation.navigate(Routes.ProfileSelection);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <TVFocusGuideView style={styles.card} autoFocus>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {strings.parentalControls.contentRestrictedTitle}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              focusedAction === 'home' && styles.primaryButtonFocused,
            ]}
            onFocus={() => setFocusedAction('home')}
            onBlur={() => {}}
            onPress={handleHome}
            hasTVPreferredFocus
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={strings.parentalControls.backToHome}
            testID="blocked-back-home-button">
            <Text style={styles.primaryButtonText}>
              {strings.parentalControls.backToHome}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              focusedAction === 'switch' && styles.secondaryButtonFocused,
            ]}
            onFocus={() => setFocusedAction('switch')}
            onBlur={() => {}}
            onPress={handleSwitch}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={strings.parentalControls.switchProfileButton}
            testID="blocked-switch-profile-button">
            <Text style={styles.secondaryButtonText}>
              {strings.parentalControls.switchProfileButton}
            </Text>
          </TouchableOpacity>
        </View>
      </TVFocusGuideView>
    </View>
  );
};
