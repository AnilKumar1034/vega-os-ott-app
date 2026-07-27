import React, {useEffect, useRef, useState} from 'react';
import {Animated, FlatList, Text} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {styles} from './SideMenu.styles';
import {AppDetails} from '../../constants/appDetails';
import {MenuOptionItem, SideMenuItem} from './SideMenuItem';
import {sizes} from '../../theme/sizes';

import {strings} from '../../constants/strings';

const AnimatedTVFocusGuideView =
  Animated.createAnimatedComponent(TVFocusGuideView);

const menuOptions: MenuOptionItem[] = [
  {
    route: Routes.Home,
    title: strings.sideMenu.home,
    name: strings.sideMenu.home,
    icon: require('../../assets/home.png'),
  },
  {
    route: Routes.Movies,
    title: strings.sideMenu.movies,
    name: strings.sideMenu.movies,
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
    title: strings.sideMenu.settings,
    name: strings.sideMenu.settings,
    icon: require('../../assets/debug.png'),
  },
];

export interface SideMenuProps {
  activeRoute: MenuOptionItem['route'];
  isExpanded: boolean;
  onMenuFocus: () => void;
  onMenuBlur?: () => void;
  destinations?: any[];
}

declare const process: any;

export const SideMenu = ({
  activeRoute,
  isExpanded,
  onMenuFocus,
  onMenuBlur,
  destinations,
}: SideMenuProps) => {
  const [focusedRoute, setFocusedRoute] = useState<string | null>(null);

  const widthAnim = useRef(
    new Animated.Value(
      isExpanded ? sizes.menuWidthExpanded : sizes.menuWidthCollapsed,
    ),
  ).current;

  const opacityAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test') {
      widthAnim.setValue(
        isExpanded ? sizes.menuWidthExpanded : sizes.menuWidthCollapsed,
      );
      opacityAnim.setValue(isExpanded ? 1 : 0);
      return;
    }
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: isExpanded
          ? sizes.menuWidthExpanded
          : sizes.menuWidthCollapsed,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded, widthAnim, opacityAnim]);

  const handleItemBlur = (route: string) => {
    setFocusedRoute((prev) => (prev === route ? null : prev));
    if (onMenuBlur) {
      onMenuBlur();
    }
  };

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
      onBlur={() => handleItemBlur(option.route)}
    />
  );

  return (
    <AnimatedTVFocusGuideView
      style={[styles.container, {width: widthAnim}]}
      accessibilityRole="menu"
      autoFocus
      trapFocusLeft
      destinations={destinations}>
      <Animated.View style={{opacity: opacityAnim}}>
        {isExpanded && <Text style={styles.menuTitle}>{AppDetails.name}</Text>}
      </Animated.View>
      <FlatList
        data={menuOptions}
        keyExtractor={(option) => option.route}
        contentContainerStyle={styles.optionList}
        renderItem={renderOptionItem}
      />
    </AnimatedTVFocusGuideView>
  );
};
