import React from 'react';
import {ScreenLayout} from '../components/ScreenLayout';
import {Routes} from '../constants/routes';

export const SettingsScreen = () => {
  return (
    <ScreenLayout
      activeRoute={Routes.Settings}
      title="Settings"
      description="Manage your StreamX preferences."
    />
  );
};
