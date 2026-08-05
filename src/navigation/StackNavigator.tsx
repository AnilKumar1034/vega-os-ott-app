import React, {ReactNode, useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {
  createNavigatorFactory,
  StackRouter,
  useNavigationBuilder,
} from '@react-navigation/native';
import {colors} from '../theme/colors';

interface StackNavigatorProps {
  children: ReactNode;
  initialRouteName?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
});

declare const process: any;

const StackNavigator = ({children, initialRouteName}: StackNavigatorProps) => {
  const {state, descriptors, NavigationContent} = useNavigationBuilder(
    StackRouter,
    {
      children,
      initialRouteName,
    },
  );
  const activeRoute = state.routes[state.index];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test') {
      fadeAnim.setValue(1);
      return;
    }
    fadeAnim.setValue(0.1);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeRoute.key, fadeAnim]);

  return (
    <NavigationContent>
      <View style={styles.container}>
        <Animated.View
          key={activeRoute.key}
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}>
          {descriptors[activeRoute.key].render()}
        </Animated.View>
      </View>
    </NavigationContent>
  );
};

export const createStackNavigator = createNavigatorFactory(StackNavigator);
