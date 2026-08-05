import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import {HomeScreen} from '../screens/HomeScreen';
import {DetailsScreen} from '../screens/DetailsScreen';
import {MovieDetailScreen} from '../screens/MovieDetailScreen';
import {MoviesScreen} from '../screens/MoviesScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {EditProfileScreen} from '../screens/EditProfileScreen';
import {SplashScreen} from '../screens/SplashScreen';
import {VideoPlayerScreen} from '../screens/VideoPlayerScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import PlayerTestScreen from '../PlayerTestScreen';
import {createStackNavigator} from './StackNavigator';
import {AuthProvider} from '../context/AuthProvider';

export type RootStackParamList = {
  [Routes.Splash]: undefined;
  [Routes.Home]: undefined;
  [Routes.Movies]: undefined;
  [Routes.Details]: undefined;
  [Routes.Settings]: undefined;
  [Routes.Profile]: undefined;
  [Routes.EditProfile]: undefined;
  [Routes.MovieDetail]: {movie?: any};
  [Routes.VideoPlayer]: {movie?: any; videoUrl?: string};
  [Routes.PlayerTest]: undefined;
  [Routes.Login]: undefined;
  [Routes.Register]: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={Routes.Splash}
          screenOptions={{headerShown: false}}>
          <Stack.Screen name={Routes.Splash} component={SplashScreen} />
          <Stack.Screen name={Routes.Home} component={HomeScreen} />
          <Stack.Screen name={Routes.Movies} component={MoviesScreen} />
          <Stack.Screen name={Routes.Details} component={DetailsScreen} />
          <Stack.Screen
            name={Routes.MovieDetail}
            component={MovieDetailScreen}
          />
          <Stack.Screen
            name={Routes.VideoPlayer}
            component={VideoPlayerScreen}
          />
          <Stack.Screen name={Routes.PlayerTest} component={PlayerTestScreen} />
          <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
          <Stack.Screen name={Routes.Profile} component={ProfileScreen} />
          <Stack.Screen
            name={Routes.EditProfile}
            component={EditProfileScreen}
          />
          <Stack.Screen name={Routes.Login} component={LoginScreen} />
          <Stack.Screen name={Routes.Register} component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};
