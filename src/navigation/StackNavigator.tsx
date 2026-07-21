import React, {ReactNode} from 'react';
import {
  createNavigatorFactory,
  StackRouter,
  useNavigationBuilder,
} from '@react-navigation/native';

interface StackNavigatorProps {
  children: ReactNode;
  initialRouteName?: string;
}

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
      {descriptors[activeRoute.key].render()}
    </NavigationContent>
  );
};

export const createStackNavigator = createNavigatorFactory(StackNavigator);
