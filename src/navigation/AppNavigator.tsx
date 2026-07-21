import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import {HomeScreen} from '../screens/HomeScreen';
import {DetailsScreen} from '../screens/DetailsScreen';
import {MoviesScreen} from '../screens/MoviesScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {SplashScreen} from '../screens/SplashScreen';
import {createStackNavigator} from './StackNavigator';

export type RootStackParamList = {
  [Routes.Splash]: undefined;
  [Routes.Home]: undefined;
  [Routes.Movies]: undefined;
  [Routes.Details]: undefined;
  [Routes.Settings]: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={Routes.Splash}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name={Routes.Splash} component={SplashScreen} />
        <Stack.Screen name={Routes.Home} component={HomeScreen} />
        <Stack.Screen name={Routes.Movies} component={MoviesScreen} />
        <Stack.Screen name={Routes.Details} component={DetailsScreen} />
        <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
