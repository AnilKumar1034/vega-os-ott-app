export const Routes = {
  Splash: 'Splash',
  Home: 'Home',
  Movies: 'Movies',
  LiveTV: 'LiveTV',
  Search: 'Search',
  Details: 'Details',
  Settings: 'Settings',
  MovieDetail: 'MovieDetail',
  VideoPlayer: 'VideoPlayer',
  PlayerTest: 'PlayerTest',
  Profile: 'Profile',
  EditProfile: 'EditProfile',
  ProfileSelection: 'ProfileSelection',
  CreateProfile: 'CreateProfile',
  Login: 'Login',
  Register: 'Register',
  MyList: 'MyList',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
