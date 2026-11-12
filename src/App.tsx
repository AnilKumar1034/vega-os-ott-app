import React, {useEffect} from 'react';
import {AppNavigator} from './navigation/AppNavigator';
import {analyticsService} from './analytics';
import {getIapService} from './iap';

export const App = () => {
  useEffect(() => {
    analyticsService
      .initialize({trackAppOpenOnInitialLaunch: true})
      .catch(() => {});

    // Initialize active IAP service (Mock for POC or Amazon for live)
    getIapService()
      .initialize()
      .catch(() => {});
  }, []);

  return <AppNavigator />;
};
