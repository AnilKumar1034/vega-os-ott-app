import React, {ReactNode, useState} from 'react';
import {ImageBackground, Text, TouchableOpacity} from 'react-native';
import {RouteName} from '../../constants/routes';
import {styles} from './ScreenLayout.styles';
import {SideMenu} from '../molecules/SideMenu';

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
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}>
      <SideMenu
        activeRoute={activeRoute}
        isExpanded={isMenuExpanded}
        onMenuFocus={() => setIsMenuExpanded(true)}
      />
      <TouchableOpacity
        style={styles.content}
        testID={`${activeRoute.toLowerCase()}-screen`}
        onFocus={() => setIsMenuExpanded(false)}
        activeOpacity={1}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </TouchableOpacity>
    </ImageBackground>
  );
};
