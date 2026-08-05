import React, {useEffect} from 'react';
import {Image, ImageBackground, Text, View} from 'react-native';
import {NavigationProp, StackActions} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {styles} from './SplashScreen.styles';
import {AppDetails} from '../constants/appDetails';

export const SPLASH_DURATION = 2000;

interface SplashScreenProps {
  navigation: NavigationProp<RootStackParamList, typeof Routes.Splash>;
}

export const SplashScreen = ({navigation}: SplashScreenProps) => {
  useEffect(() => {
    const timeoutId = setTimeout(
      () => navigation.dispatch(StackActions.replace(Routes.Home)),
      SPLASH_DURATION,
    );

    return () => clearTimeout(timeoutId);
  }, [navigation]);

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
