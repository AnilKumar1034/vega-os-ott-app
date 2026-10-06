import React, {useEffect} from 'react';
import {AppNavigator} from './navigation/AppNavigator';
import {analyticsService} from './analytics';

export const App = () => {
  useEffect(() => {
    analyticsService
      .initialize({trackAppOpenOnInitialLaunch: true})
      .catch(() => {});
  }, []);

  return <AppNavigator />;
};
