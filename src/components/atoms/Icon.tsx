import React from 'react';
import {Image, ImageSourcePropType, ImageStyle, StyleProp} from 'react-native';

interface IconProps {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  accessible?: boolean;
}

export const Icon = ({source, style, accessible = false}: IconProps) => {
  return <Image source={source} style={style} accessible={accessible} />;
};
