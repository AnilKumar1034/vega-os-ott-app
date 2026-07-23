import React from 'react';
import {ScreenLayout} from '../components/templates/ScreenLayout';
import {Routes} from '../constants/routes';
import {AppDetails} from '../constants/appDetails';

export const SettingsScreen = () => {
  return (
    <ScreenLayout
      activeRoute={Routes.Settings}
      title={AppDetails.settingsHeaderTitle}
      description={AppDetails.settingsSubtitle}
    />
  );
};
