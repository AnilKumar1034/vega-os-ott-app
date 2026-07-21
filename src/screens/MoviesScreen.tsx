import React from 'react';
import {ScreenLayout} from '../components/ScreenLayout';
import {Routes} from '../constants/routes';

export const MoviesScreen = () => {
  return (
    <ScreenLayout
      activeRoute={Routes.Movies}
      title="Movies"
      description="Browse blockbuster and trending movies."
    />
  );
};
