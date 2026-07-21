import React from 'react';
import {ScreenLayout} from '../components/ScreenLayout';
import {Routes} from '../constants/routes';

export const DetailsScreen = () => {
  return (
    <ScreenLayout
      activeRoute={Routes.Details}
      title="Details"
      description="Find information about your selected content."
    />
  );
};
