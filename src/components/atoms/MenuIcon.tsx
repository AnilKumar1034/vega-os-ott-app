import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import {colors} from '../../theme/colors';

interface MenuIconProps {
  name: 'Home' | 'Movies' | 'Details' | 'Settings';
  style?: StyleProp<ImageStyle>;
  focused?: boolean;
  active?: boolean;
}

const customIconSources: Record<string, ImageSourcePropType> = {
  Home: require('../../assets/home.png'),
  Movies: require('../../assets/get-started.png'),
  Details: require('../../assets/learn-more.png'),
  Settings: require('../../assets/debug.png'),
};

const styles = StyleSheet.create({
  activeTint: {
    tintColor: colors.activeTint,
  },
  focusedTint: {
    tintColor: colors.focusedTint,
  },
});

export const MenuIcon = ({name, style, focused, active}: MenuIconProps) => {
  const source = customIconSources[name] || customIconSources.Home;

  return (
    <Image
      source={source}
      style={[
        style,
        active && styles.activeTint,
        focused && styles.focusedTint,
      ]}
      resizeMode="contain"
    />
  );
};
