import React, {ReactNode, useState} from 'react';
import {ImageBackground, Text, View} from 'react-native';
import {RouteName} from '../../constants/routes';
import {CommonHeader} from '../molecules/CommonHeader';
import {SideMenu} from '../molecules/SideMenu';
import {AppDetails} from '../../constants/appDetails';
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
}

export const ScreenLayout = ({
  activeRoute,
  menuActiveRoute,
  title,
  description,
  children,
  showSearch,
  compactHeader = false,
  preferContentFocus = false,
}: ScreenLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}>
      <SideMenu
        activeRoute={menuActiveRoute || activeRoute}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
        preferActiveFocus={!preferContentFocus}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={collapseMenu}
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
