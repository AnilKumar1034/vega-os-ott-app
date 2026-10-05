import React, {useEffect, useRef, useState} from 'react';
import {Animated, FlatList, Text} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {styles} from './SideMenu.styles';
import {MenuOptionItem, SideMenuItem} from './SideMenuItem';
import {sizes} from '../../theme/sizes';

import {strings} from '../../constants/strings';

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
    route: Routes.LiveTV,
    title: strings.sideMenu.liveTV,
    name: 'LiveTV',
    icon: require('../../assets/get-started.png'),
  },
  {
    route: Routes.MyList,
    title: strings.sideMenu.myList,
    name: 'MyList',
    icon: require('../../assets/learn-more.png'),
  },
  {
    route: Routes.Details,
    title: strings.sideMenu.details,
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
  preferActiveFocus?: boolean;
}

declare const process: any;

export const SideMenu = ({
  activeRoute,
  isExpanded,
  onMenuFocus,
  onMenuBlur,
  destinations,
  preferActiveFocus = false,
}: SideMenuProps) => {
  const [focusedRoute, setFocusedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      setFocusedRoute((prev) => prev || activeRoute);
    } else {
      setFocusedRoute(null);
    }
  }, [isExpanded, activeRoute]);

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (evt.eventKeyAction !== undefined && evt.eventKeyAction !== 0) return;
    const type = evt.eventType?.toLowerCase();
    if ((isExpanded || focusedRoute !== null) && (type === 'right' || type === 'back')) {
      setFocusedRoute(null);
      if (onMenuBlur) {
        onMenuBlur();
      }
      return;
    }

    if (isExpanded) {
      if (type === 'up') {
        const currentIndex = menuOptions.findIndex(
          (opt) => opt.route === (focusedRoute || activeRoute),
        );
        if (currentIndex > 0) {
          setFocusedRoute(menuOptions[currentIndex - 1].route);
        }
      } else if (type === 'down') {
        const currentIndex = menuOptions.findIndex(
          (opt) => opt.route === (focusedRoute || activeRoute),
        );
        if (currentIndex >= 0 && currentIndex < menuOptions.length - 1) {
          setFocusedRoute(menuOptions[currentIndex + 1].route);
        }
      }
    }
  });

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
  };

  const renderOptionItem = ({item: option}: {item: MenuOptionItem}) => {
    const isCurrentFocused = focusedRoute
      ? option.route === focusedRoute
      : isExpanded && option.route === activeRoute;

    return (
      <SideMenuItem
        option={option}
        isActive={option.route === activeRoute}
        isFocused={isCurrentFocused}
        isExpanded={isExpanded}
        preferActiveFocus={preferActiveFocus}
        onFocus={() => {
          setFocusedRoute(option.route);
          onMenuFocus();
        }}
        onBlur={() => handleItemBlur(option.route)}
      />
    );
  };

  return (
    <Animated.View style={[styles.container, {width: widthAnim}]}>
      <TVFocusGuideView
        style={{flex: 1}}
        accessibilityRole="menu"
        autoFocus={isExpanded}
        trapFocusLeft
        destinations={
          destinations && destinations.length > 0 ? destinations : undefined
        }>
        <Animated.View style={{opacity: opacityAnim}}>
          {isExpanded && <Text style={styles.menuTitle}>{strings.appName}</Text>}
        </Animated.View>
        <FlatList
          data={menuOptions}
          keyExtractor={(option) => option.route}
          contentContainerStyle={styles.optionList}
          renderItem={renderOptionItem}
        />
      </TVFocusGuideView>
    </Animated.View>
  );
};
