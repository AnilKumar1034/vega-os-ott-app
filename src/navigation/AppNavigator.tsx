import React from 'react';
import {LinkingOptions, NavigationContainer} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import {HomeScreen} from '../screens/HomeScreen';
import {DetailsScreen} from '../screens/DetailsScreen';
import {MovieDetailScreen} from '../screens/MovieDetailScreen';
import {MoviesScreen} from '../screens/MoviesScreen';
import {SearchScreen} from '../screens/SearchScreen';
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
import {DEEPLINK_PREFIX, DeeplinkRoutes} from '../utils/deeplink';

export type RootStackParamList = {
  [Routes.Splash]: undefined;
  [Routes.Home]: undefined;
  [Routes.Movies]: undefined;
  [Routes.Search]: {q?: string};
  [Routes.Details]: undefined;
  [Routes.Settings]: undefined;
  [Routes.Profile]: undefined;
  [Routes.EditProfile]: undefined;
  [Routes.MovieDetail]: {movie?: any};
  [Routes.VideoPlayer]: {movie?: any; videoUrl?: string};
  [Routes.PlayerTest]: undefined;
  [Routes.Login]: {
    redirectTo?: {
      routeName: keyof RootStackParamList;
      params?: Record<string, unknown>;
    };
  };
  [Routes.Register]: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEPLINK_PREFIX],
  config: {
    screens: {
      [Routes.Splash]: 'splash',
      [Routes.Home]: DeeplinkRoutes.Home,
      [Routes.Movies]: DeeplinkRoutes.Movies,
      [Routes.Search]: {
        path: DeeplinkRoutes.Search,
        parse: {
          q: (q: string) => q,
        },
      },
      [Routes.Details]: 'details',
      [Routes.MovieDetail]: {
        path: `${DeeplinkRoutes.Details}/:movieId`,
      },
      [Routes.VideoPlayer]: {
        path: `${DeeplinkRoutes.Player}/:movieId`,
      },
      [Routes.PlayerTest]: 'player-test',
      [Routes.Settings]: DeeplinkRoutes.Settings,
      [Routes.Profile]: DeeplinkRoutes.Profile,
      [Routes.EditProfile]: 'edit-profile',
      [Routes.Login]: 'login',
      [Routes.Register]: 'register',
    },
  },
};

export const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          initialRouteName={Routes.Splash}
          screenOptions={{headerShown: false}}>
          <Stack.Screen name={Routes.Splash} component={SplashScreen} />
          <Stack.Screen name={Routes.Home} component={HomeScreen} />
          <Stack.Screen name={Routes.Movies} component={MoviesScreen} />
          <Stack.Screen name={Routes.Search} component={SearchScreen} />
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
