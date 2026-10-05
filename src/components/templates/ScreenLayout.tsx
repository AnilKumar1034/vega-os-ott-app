import React, {ReactNode, useState} from 'react';
import {ImageBackground, Text, View} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {RouteName} from '../../constants/routes';
import {CommonHeader} from '../molecules/CommonHeader';
import {SideMenu} from '../molecules/SideMenu';
import {strings} from '../../constants/strings';
import {isBackEvent, isKeyDown} from '../../utils/inputUtils';
import {styles} from './ScreenLayout.styles';

interface ScreenLayoutProps {
  activeRoute: Exclude<RouteName, 'Splash'>;
  menuActiveRoute?: Exclude<RouteName, 'Splash'>;
  title: string;
  description: string;
  children?: ReactNode;
  showSearch?: boolean;
  compactHeader?: boolean;
  preferContentFocus?: boolean;
  isMenuExpanded?: boolean;
  onMenuFocus?: () => void;
  onMenuBlur?: () => void;
  destinations?: any[];
}

export const ScreenLayout = ({
  activeRoute,
  menuActiveRoute,
  title,
  description,
  children,
  showSearch,
  compactHeader = false,
  preferContentFocus = true,
  isMenuExpanded: controlledMenuExpanded,
  onMenuFocus: controlledMenuFocus,
  onMenuBlur: controlledMenuBlur,
  destinations,
}: ScreenLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [internalMenuExpanded, setInternalMenuExpanded] = useState(false);

  const isMenuExpanded =
    controlledMenuExpanded !== undefined
      ? controlledMenuExpanded
      : internalMenuExpanded;

  const handleMenuFocus = () => {
    if (controlledMenuFocus) {
      controlledMenuFocus();
    } else {
      setInternalMenuExpanded(true);
    }
  };

  const handleMenuBlur = () => {
    if (controlledMenuBlur) {
      controlledMenuBlur();
    } else {
      setInternalMenuExpanded(false);
    }
  };

  const collapseMenu = () => {
    if (controlledMenuBlur) {
      controlledMenuBlur();
    } else {
      setInternalMenuExpanded(false);
    }
  };

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();
    if (isBackEvent(type) && isMenuExpanded) {
      handleMenuBlur();
    }
  });

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}>
      <SideMenu
        activeRoute={menuActiveRoute || activeRoute}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
        preferActiveFocus={isMenuExpanded}
        destinations={destinations}
      />
      <View style={styles.content}>
        <CommonHeader
          title={strings.appName}
          logo={require('../../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            collapseMenu();
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
          showSearch={showSearch}
        />
        <View
          style={styles.body}
          testID={`${activeRoute.toLowerCase()}-screen`}
          focusable={false}>
          <View
            style={[styles.heading, compactHeader && styles.headingCompact]}
            focusable={false}>
            <Text style={[styles.title, compactHeader && styles.titleCompact]}>
              {title}
            </Text>
            <Text
              style={[
                styles.description,
                compactHeader && styles.descriptionCompact,
              ]}>
              {description}
            </Text>
          </View>
          {children}
        </View>
      </View>
    </ImageBackground>
  );
};
