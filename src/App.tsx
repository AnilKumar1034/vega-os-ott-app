import React, {useEffect} from 'react';
import {AppNavigator} from './navigation/AppNavigator';
import {analyticsService} from './analytics';
import {amazonVegaIapService} from './iap';

export const App = () => {
  useEffect(() => {
    analyticsService
      .initialize({trackAppOpenOnInitialLaunch: true})
      .catch(() => {});

    // Initialize Amazon IAP service and establish Appstore session on launch
    amazonVegaIapService
      .initialize()
      .catch(() => {});
  }, []);

  return <AppNavigator />;
};
