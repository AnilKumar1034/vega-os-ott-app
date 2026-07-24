import React, {ReactNode, useState} from 'react';
import {ImageBackground, Text, TouchableOpacity, View} from 'react-native';
import {RouteName} from '../../constants/routes';
import {CommonHeader} from '../molecules/CommonHeader';
import {SideMenu} from '../molecules/SideMenu';
import {AppDetails} from '../../constants/appDetails';
import {styles} from './ScreenLayout.styles';

interface ScreenLayoutProps {
  activeRoute: Exclude<RouteName, 'Splash'>;
  title: string;
  description: string;
  children?: ReactNode;
}

export const ScreenLayout = ({
  activeRoute,
  title,
  description,
  children,
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
        activeRoute={activeRoute}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={collapseMenu}
        />
        <TouchableOpacity
          style={styles.background}
          testID={`${activeRoute.toLowerCase()}-screen`}
          onFocus={collapseMenu}
          activeOpacity={1}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {children}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};
