import React, {useEffect, useRef} from 'react';
import {Image, ImageBackground, Text, View} from 'react-native';
import {NavigationProp, StackActions} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {styles} from './SplashScreen.styles';
import {AppDetails} from '../constants/appDetails';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';

export const SPLASH_DURATION = 1500;

interface SplashScreenProps {
  navigation: NavigationProp<RootStackParamList, typeof Routes.Splash>;
}

export const SplashScreen = ({navigation}: SplashScreenProps) => {
  const {user, loading: authLoading} = useAuth();
  const {activeProfile, isLoadingProfiles} = useProfile();
  const hasNavigated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted || hasNavigated.current) {
        return;
      }

      // If still resolving auth or profiles, wait for completion in the next effect run
      if (authLoading) {
        return;
      }

      // Unauthenticated users can directly browse content on Home
      if (!user) {
        hasNavigated.current = true;
        navigation.dispatch(StackActions.replace(Routes.Home));
        return;
      }

      if (isLoadingProfiles) {
        return;
      }

      hasNavigated.current = true;
      if (activeProfile) {
        navigation.dispatch(StackActions.replace(Routes.Home));
      } else {
        navigation.dispatch(StackActions.replace(Routes.ProfileSelection));
      }
    }, SPLASH_DURATION);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [authLoading, user, isLoadingProfiles, activeProfile, navigation]);

  // Handle case where auth/profile loading took longer than SPLASH_DURATION
  useEffect(() => {
    if (hasNavigated.current || authLoading) {
      return;
    }

    // Unauthenticated users can directly browse content on Home
    if (!user) {
      hasNavigated.current = true;
      navigation.dispatch(StackActions.replace(Routes.Home));
      return;
    }

    if (!isLoadingProfiles) {
      hasNavigated.current = true;
      if (activeProfile) {
        navigation.dispatch(StackActions.replace(Routes.Home));
      } else {
        navigation.dispatch(StackActions.replace(Routes.ProfileSelection));
      }
    }
  }, [authLoading, user, isLoadingProfiles, activeProfile, navigation]);

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID="splash-screen">
      <View style={styles.content}>
        <Image
          source={require('../assets/vega.png')}
          style={styles.logo}
          resizeMode="contain"
          accessible={false}
        />
        <Text style={styles.title}>{AppDetails.name}</Text>
      </View>
    </ImageBackground>
  );
};
