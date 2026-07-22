import React, {useState} from 'react';
import {ImageSourcePropType, Text, TouchableOpacity, View} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {Icon} from '../atoms/Icon';
import {RouteName, Routes} from '../../constants/routes';
import {styles} from './SideMenu.styles';

interface MenuOption {
  route: Exclude<RouteName, typeof Routes.Splash>;
  title: string;
  icon: ImageSourcePropType;
}

const menuOptions: MenuOption[] = [
  {route: Routes.Home, title: 'Home', icon: require('../../assets/home.png')},
  {
    route: Routes.Movies,
    title: 'Movies',
    icon: require('../../assets/get-started.png'),
  },
  {
    route: Routes.Details,
    title: 'Details',
    icon: require('../../assets/learn-more.png'),
  },
  {
    route: Routes.Settings,
    title: 'Settings',
    icon: require('../../assets/debug.png'),
  },
];

interface SideMenuProps {
  activeRoute: MenuOption['route'];
  isExpanded: boolean;
  onMenuFocus: () => void;
}

export const SideMenu = ({
  activeRoute,
  isExpanded,
  onMenuFocus,
}: SideMenuProps) => {
  const navigation = useNavigation();
  const [focusedRoute, setFocusedRoute] = useState(activeRoute);

  return (
    <View
      style={[styles.container, !isExpanded && styles.collapsedContainer]}
      accessibilityRole="menu">
      {isExpanded && <Text style={styles.menuTitle}>LogiXstream</Text>}
      {menuOptions.map((option) => {
        const isActive = option.route === activeRoute;
        const isFocused = option.route === focusedRoute;

        return (
          <TouchableOpacity
            key={option.route}
            style={[
              styles.option,
              isActive && styles.activeOption,
              isExpanded && isFocused && styles.focusedOption,
              !isExpanded && styles.collapsedOption,
            ]}
            onFocus={() => {
              setFocusedRoute(option.route);
              onMenuFocus();
            }}
            onPress={() =>
              navigation.dispatch(CommonActions.navigate({name: option.route}))
            }
            accessibilityRole="button"
            accessibilityLabel={option.title}
            testID={`side-menu-${option.route}`}>
            <Icon
              source={option.icon}
              style={[styles.icon, !isExpanded && styles.collapsedIcon]}
            />
            {isExpanded && (
              <Text
                style={[styles.optionTitle, isActive && styles.activeTitle]}
                testID={`side-menu-label-${option.route}`}>
                {option.title}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
