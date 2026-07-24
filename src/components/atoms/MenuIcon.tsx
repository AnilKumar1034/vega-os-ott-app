import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import {colors} from '../../theme/colors';

export type MenuIconName =
  | 'Home'
  | 'Movies'
  | 'Details'
  | 'Settings'
  | 'Search'
  | 'Close';

export interface MenuIconProps {
  name: MenuIconName | string;
  style?: StyleProp<ImageStyle>;
  focused?: boolean;
  active?: boolean;
  size?: number;
  color?: string;
  testID?: string;
}

const iconSources: Record<string, ImageSourcePropType> = {
  Home: require('../../assets/home.png'),
  Movies: require('../../assets/get-started.png'),
  Details: require('../../assets/learn-more.png'),
  Settings: require('../../assets/debug.png'),
  Search: require('../../assets/search.png'),
  Close: require('../../assets/close.png'),
};

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
});

export const MenuIcon = ({
  name,
  style,
  focused,
  active,
  size = 26,
  color,
  testID,
}: MenuIconProps) => {
  const source = iconSources[name] || iconSources.Home;

  let iconColor = color || colors.textPrimary;
  if (focused) {
    iconColor = colors.focusedTint || '#FFFFFF';
  } else if (active) {
    iconColor = colors.activeTint || '#E50914';
  }

  return (
    <Image
      source={source}
      style={[
        styles.icon,
        {width: size, height: size, tintColor: iconColor},
        style,
      ]}
      resizeMode="contain"
      testID={testID || `menu-icon-${name.toLowerCase()}`}
    />
  );
};
