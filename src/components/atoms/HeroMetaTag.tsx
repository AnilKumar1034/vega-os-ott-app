import React from 'react';
import {Text} from 'react-native';
import {styles} from '../molecules/HeroCarousel.styles';

interface HeroMetaTagProps {
  item: string;
}

export const HeroMetaTag = ({item}: HeroMetaTagProps) => {
  return <Text style={styles.metaText}>{item}</Text>;
};
