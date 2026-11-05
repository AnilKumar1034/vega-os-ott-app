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
  | 'LiveTV'
  | 'MyList'
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
  home: require('../../assets/home.png'),
  Movies: require('../../assets/movies.png'),
  movies: require('../../assets/movies.png'),
  LiveTV: require('../../assets/livetv.png'),
  livetv: require('../../assets/livetv.png'),
  'Live TV': require('../../assets/livetv.png'),
  MyList: require('../../assets/mylist.png'),
  mylist: require('../../assets/mylist.png'),
  'My List': require('../../assets/mylist.png'),
  Details: require('../../assets/details.png'),
  details: require('../../assets/details.png'),
  Settings: require('../../assets/settings.png'),
  settings: require('../../assets/settings.png'),
  Search: require('../../assets/search.png'),
  search: require('../../assets/search.png'),
  Close: require('../../assets/close.png'),
  close: require('../../assets/close.png'),
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
    iconColor = colors.focusedTint;
  } else if (active) {
    iconColor = colors.activeTint;
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
