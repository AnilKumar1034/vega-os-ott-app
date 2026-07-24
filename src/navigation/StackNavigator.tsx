import React, {ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
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
    backgroundColor: colors.screenBackground || '#090909',
  },
});

const StackNavigator = ({children, initialRouteName}: StackNavigatorProps) => {
  const {state, descriptors, NavigationContent} = useNavigationBuilder(
    StackRouter,
    {
      children,
      initialRouteName,
    },
  );
  const activeRoute = state.routes[state.index];

  return (
    <NavigationContent>
      <View style={styles.container}>
        {descriptors[activeRoute.key].render()}
      </View>
    </NavigationContent>
  );
};

export const createStackNavigator = createNavigatorFactory(StackNavigator);
