import React, {ReactNode} from 'react';
import {ImageBackground, Text, View} from 'react-native';
import {RouteName} from '../constants/routes';
import {styles} from './ScreenLayout.styles';
import {SideMenu} from './SideMenu';

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
  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}>
      <SideMenu activeRoute={activeRoute} />
      <View
        style={styles.content}
        testID={`${activeRoute.toLowerCase()}-screen`}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </ImageBackground>
  );
};
