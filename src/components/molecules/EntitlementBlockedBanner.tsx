import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {styles} from './EntitlementBlockedBanner.styles';

export interface EntitlementBlockedBannerProps {
  badge?: string;
  title?: string;
  message?: string;
  primaryButtonText?: string;
  testID?: string;
  onChoosePlan?: () => void;
  onBackToHome?: () => void;
}

export const EntitlementBlockedBanner = ({
  badge = 'SUBSCRIPTION REQUIRED',
  title = 'Subscription Required',
  message = 'Subscribe to an active plan to access this premium title.',
  primaryButtonText = 'Choose Plan',
  testID = 'entitlement-blocked-banner',
  onChoosePlan,
  onBackToHome,
}: EntitlementBlockedBannerProps) => {
  const navigation = useNavigation<any>();
  const [focusedAction, setFocusedAction] = useState<'choose' | 'home'>('choose');

  const handleChoosePlan = () => {
    if (onChoosePlan) {
      onChoosePlan();
    } else {
      navigation.navigate(Routes.Subscription);
    }
  };

  const handleHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      navigation.navigate(Routes.Home);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <TVFocusGuideView style={styles.card} autoFocus>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              focusedAction === 'choose' && styles.primaryButtonFocused,
            ]}
            onFocus={() => setFocusedAction('choose')}
            onBlur={() => {}}
            onPress={handleChoosePlan}
            hasTVPreferredFocus
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={primaryButtonText}
            testID="entitlement-primary-button">
            <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              focusedAction === 'home' && styles.secondaryButtonFocused,
            ]}
            onFocus={() => setFocusedAction('home')}
            onBlur={() => {}}
            onPress={handleHome}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            testID="entitlement-home-button">
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </TVFocusGuideView>
    </View>
  );
};
