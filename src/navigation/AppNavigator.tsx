import React, {useCallback, useEffect} from 'react';
import {
  LinkingOptions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {useAuth} from '../context/authContext';
import {screenNavigationTracker} from './navigationAnalytics';
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
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {MyListScreen} from '../screens/MyListScreen';
import {LiveTVScreen} from '../features/live-tv/screens/LiveTVScreen';
import {LiveChannelDrmConfig} from '../features/live-tv/models/LiveChannel';
import {createStackNavigator} from './StackNavigator';
import {AuthProvider} from '../context/AuthProvider';
import {ProfileProvider} from '../profiles/context/ProfileProvider';
import {ProfileSelectionScreen} from '../profiles/screens/ProfileSelectionScreen';
import {CreateProfileScreen} from '../profiles/screens/CreateProfileScreen';
import {Linking} from 'react-native';
import {
  DEEPLINK_PREFIX,
  DeeplinkRoutes,
  deeplinkManager,
} from '../utils/deeplink';

export type RootStackParamList = {
  [Routes.Splash]: undefined;
  [Routes.Home]: undefined;
  [Routes.Movies]: undefined;
  [Routes.LiveTV]: undefined;
  [Routes.MyList]: undefined;
  [Routes.Search]: {q?: string};
  [Routes.Details]: undefined;
  [Routes.Settings]: undefined;
  [Routes.Profile]: undefined;
  [Routes.EditProfile]: undefined;
  [Routes.ProfileSelection]: undefined;
  [Routes.CreateProfile]: undefined;
  [Routes.MovieDetail]: {movie?: any};
  [Routes.VideoPlayer]: {
    movie?: any;
    videoUrl?: string;
    seek?: number;
    isLive?: boolean;
    streamType?: 'hls' | 'dash';
    isVideoOnly?: boolean;
    drm?: LiveChannelDrmConfig;
  };
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

// These routes initialize the native W3C media module. Register lightweight
// route wrappers so the module is not evaluated while the app is booting into
// Splash/Home.
const VideoPlayerRoute = () => {
  const {VideoPlayerScreen} = require('../screens/VideoPlayerScreen');
  return <VideoPlayerScreen />;
};

const PlayerTestRoute = () => {
  const PlayerTestScreen = require('../PlayerTestScreen').default;
  return <PlayerTestScreen />;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEPLINK_PREFIX],
  getInitialURL: () => {
    if ((globalThis as any).process?.env?.NODE_ENV === 'test') {
      const testUrl = deeplinkManager.getTestInitialUrl();
      if (testUrl) {
        deeplinkManager.handleIncomingUrl(testUrl, 'cold_start').catch(() => {});
        return testUrl;
      }
      return null;
    }
    return Linking.getInitialURL()
      .then((url) => {
        if (url) {
          deeplinkManager.handleIncomingUrl(url, 'cold_start').catch(() => {});
        }
        return url;
      })
      .catch(() => null);
  },
  subscribe: (listener: (url: string) => void) => {
    const onReceiveURL = ({url}: {url: string}) => {
      deeplinkManager.handleIncomingUrl(url, 'warm_start').catch(() => {});
      listener(url);
    };
    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => {
      subscription?.remove?.();
    };
  },
  config: {

    screens: {
      [Routes.Splash]: 'splash',
      [Routes.Home]: DeeplinkRoutes.Home,
      [Routes.Movies]: DeeplinkRoutes.Movies,
      [Routes.LiveTV]: DeeplinkRoutes.LiveTV,
      [Routes.MyList]: DeeplinkRoutes.MyList,
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
      [Routes.ProfileSelection]: DeeplinkRoutes.Profiles,
      [Routes.CreateProfile]: 'create-profile',
      [Routes.Login]: 'login',
      [Routes.Register]: 'register',
    },
  },
};

const AppNavigatorInner = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const {user, loading: authLoading} = useAuth();

  const handleReady = useCallback(() => {
    const route = navigationRef.getCurrentRoute();
    screenNavigationTracker
      .handleRoute(route, {user, authLoading, isInitial: true})
      .catch(() => {});
  }, [authLoading, navigationRef, user]);

  const handleStateChange = useCallback(() => {
    const route = navigationRef.getCurrentRoute();
    screenNavigationTracker
      .handleRoute(route, {user, authLoading, isInitial: false})
      .catch(() => {});
  }, [authLoading, navigationRef, user]);

  useEffect(() => {
    if (
      !authLoading &&
      (typeof navigationRef.isReady === 'function'
        ? navigationRef.isReady()
        : true)
    ) {
      const route = navigationRef.getCurrentRoute();
      if (route) {
        screenNavigationTracker
          .handleRoute(route, {user, authLoading, isInitial: false})
          .catch(() => {});
      }
    }
  }, [authLoading, navigationRef, user]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={handleReady}
      onStateChange={handleStateChange}>
      <Stack.Navigator
        initialRouteName={Routes.Splash}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name={Routes.Splash} component={SplashScreen} />
        <Stack.Screen name={Routes.Home} component={HomeScreen} />
        <Stack.Screen name={Routes.Movies} component={MoviesScreen} />
        <Stack.Screen name={Routes.LiveTV} component={LiveTVScreen} />
        <Stack.Screen name={Routes.MyList} component={MyListScreen} />
        <Stack.Screen name={Routes.Search} component={SearchScreen} />
        <Stack.Screen name={Routes.Details} component={DetailsScreen} />
        <Stack.Screen
          name={Routes.MovieDetail}
          component={MovieDetailScreen}
        />
        <Stack.Screen
          name={Routes.VideoPlayer}
          component={VideoPlayerRoute}
        />
        <Stack.Screen
          name={Routes.PlayerTest}
          component={PlayerTestRoute}
        />
        <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
        <Stack.Screen name={Routes.Profile} component={ProfileScreen} />
        <Stack.Screen
          name={Routes.EditProfile}
          component={EditProfileScreen}
        />
        <Stack.Screen
          name={Routes.ProfileSelection}
          component={ProfileSelectionScreen}
        />
        <Stack.Screen
          name={Routes.CreateProfile}
          component={CreateProfileScreen}
        />
        <Stack.Screen name={Routes.Login} component={LoginScreen} />
        <Stack.Screen name={Routes.Register} component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const AppNavigator = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppNavigatorInner />
      </ProfileProvider>
    </AuthProvider>
  );
};
