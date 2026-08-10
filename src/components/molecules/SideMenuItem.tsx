import React from 'react';
import {ImageSourcePropType, Text, TouchableOpacity} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {MenuIcon} from '../atoms/MenuIcon';
import {RouteName} from '../../constants/routes';
import {styles} from './SideMenu.styles';

export interface MenuOptionItem {
  route: Exclude<RouteName, 'Splash'>;
  title: string;
  name: 'Home' | 'Movies' | 'LiveTV' | 'Details' | 'Settings';
  icon: ImageSourcePropType;
}

interface SideMenuItemProps {
  option: MenuOptionItem;
  isActive: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  preferActiveFocus: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export const SideMenuItem = ({
  option,
  isActive,
  isFocused,
  isExpanded,
  preferActiveFocus,
  onFocus,
  onBlur,
}: SideMenuItemProps) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[
        styles.option,
        isActive && styles.activeOption,
        isFocused && styles.focusedOption,
        !isExpanded && styles.collapsedOption,
        !isExpanded && isFocused && styles.collapsedFocusedOption,
      ]}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={() =>
        navigation.dispatch(CommonActions.navigate({name: option.route}))
      }
      hasTVPreferredFocus={preferActiveFocus && isActive}
      accessibilityRole="button"
      accessibilityLabel={option.title}
      testID={`side-menu-${option.route}`}>
      <MenuIcon
        name={option.name}
        active={isActive}
        focused={isFocused}
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
};
