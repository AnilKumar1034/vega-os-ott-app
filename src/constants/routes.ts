export const Routes = {
  Splash: 'Splash',
  Home: 'Home',
  Movies: 'Movies',
  Search: 'Search',
  Details: 'Details',
  Settings: 'Settings',
  MovieDetail: 'MovieDetail',
  VideoPlayer: 'VideoPlayer',
  PlayerTest: 'PlayerTest',
  Profile: 'Profile',
  EditProfile: 'EditProfile',
  Login: 'Login',
  Register: 'Register',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
