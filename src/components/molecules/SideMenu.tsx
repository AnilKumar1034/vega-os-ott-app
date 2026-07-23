import React, {useState} from 'react';
import {FlatList, Text} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {styles} from './SideMenu.styles';
import {AppDetails} from '../../constants/appDetails';
import {MenuOptionItem, SideMenuItem} from './SideMenuItem';

const menuOptions: MenuOptionItem[] = [
  {
    route: Routes.Home,
    title: 'Home',
    name: 'Home',
    icon: require('../../assets/home.png'),
  },
  {
    route: Routes.Movies,
    title: 'Movies',
    name: 'Movies',
    icon: require('../../assets/get-started.png'),
  },
  {
    route: Routes.Details,
    title: 'Details',
    name: 'Details',
    icon: require('../../assets/learn-more.png'),
  },
  {
    route: Routes.Settings,
    title: 'Settings',
    name: 'Settings',
    icon: require('../../assets/debug.png'),
  },
];

interface SideMenuProps {
  activeRoute: MenuOptionItem['route'];
  isExpanded: boolean;
  onMenuFocus: () => void;
}

export const SideMenu = ({
  activeRoute,
  isExpanded,
  onMenuFocus,
}: SideMenuProps) => {
  const [focusedRoute, setFocusedRoute] = useState<string | null>(null);

  const renderOptionItem = ({item: option}: {item: MenuOptionItem}) => (
    <SideMenuItem
      option={option}
      isActive={option.route === activeRoute}
      isFocused={option.route === focusedRoute}
      isExpanded={isExpanded}
      onFocus={() => {
        setFocusedRoute(option.route);
        onMenuFocus();
      }}
      onBlur={() => {
        setFocusedRoute((prev) => (prev === option.route ? null : prev));
      }}
    />
  );

  return (
    <TVFocusGuideView
      style={[styles.container, !isExpanded && styles.collapsedContainer]}
      accessibilityRole="menu"
      autoFocus>
      {isExpanded && <Text style={styles.menuTitle}>{AppDetails.name}</Text>}
      <FlatList
        data={menuOptions}
        keyExtractor={(option) => option.route}
        contentContainerStyle={styles.optionList}
        renderItem={renderOptionItem}
      />
    </TVFocusGuideView>
  );
};
