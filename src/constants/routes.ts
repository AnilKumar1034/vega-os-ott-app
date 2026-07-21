export const Routes = {
  Splash: 'Splash',
  Home: 'Home',
  Movies: 'Movies',
  Details: 'Details',
  Settings: 'Settings',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
