import React from 'react';
import {ImageSourcePropType} from 'react-native';

export interface TileData {
  id: string;
  label: string;
  accessibilityLabel: string;
  description?: string | React.JSX.Element;
  icon: ImageSourcePropType;
}

export const tiles: TileData[] = [
  {
    id: 'featured',
    label: 'Featured',
    accessibilityLabel: 'Featured',
    description: 'Watch the latest featured content.',
    icon: require('../assets/home.png'),
  },
  {
    id: 'movies',
    label: 'Movies',
    accessibilityLabel: 'Movies',
    description: 'Browse blockbuster and trending movies.',
    icon: require('../assets/get-started.png'),
  },
  {
    id: 'series',
    label: 'Series',
    accessibilityLabel: 'Series',
    description: 'Discover popular TV series and originals.',
    icon: require('../assets/debug.png'),
  },
  {
    id: 'my-list',
    label: 'My List',
    accessibilityLabel: 'My List',
    description: 'Your saved favorites will appear here.',
    icon: require('../assets/learn-more.png'),
  },
];
