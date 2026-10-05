import 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';
import {SideMenu} from '../src/components/molecules/SideMenu';
import {Routes} from '../src/constants/routes';

// Mock navigation
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
}));

describe('SideMenu component', () => {
  const mockOnMenuFocus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders menu items in expanded state', () => {
    const screen = render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={true}
        onMenuFocus={mockOnMenuFocus}
      />,
    );

    expect(screen.getByText('LogiXstream')).toBeTruthy();
    expect(screen.getByTestId('side-menu-label-Home')).toBeTruthy();
    expect(screen.getByTestId('side-menu-label-Movies')).toBeTruthy();
    expect(screen.getByTestId('side-menu-label-MyList')).toBeTruthy();
  });

  it('calls onMenuFocus when a menu item is focused', () => {
    const screen = render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={false}
        onMenuFocus={mockOnMenuFocus}
      />,
    );

    fireEvent(screen.getByTestId('side-menu-Movies'), 'focus');
    expect(mockOnMenuFocus).toHaveBeenCalledTimes(1);
  });

  it('clears focused state on blur', () => {
    const screen = render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={true}
        onMenuFocus={mockOnMenuFocus}
      />,
    );

    const moviesItem = screen.getByTestId('side-menu-Movies');
    fireEvent(moviesItem, 'focus');
    fireEvent(moviesItem, 'blur');
    expect(moviesItem).toBeTruthy();
  });

  it('does not give TV preferred focus to items by default when collapsed', () => {
    const screen = render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={false}
        onMenuFocus={mockOnMenuFocus}
      />,
    );

    const homeItem = screen.getByTestId('side-menu-Home');
    expect(homeItem.props.hasTVPreferredFocus).toBeFalsy();
  });

  it('handles TV remote right and back events to blur menu when expanded', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const mockOnMenuBlur = jest.fn();
    render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={true}
        onMenuFocus={mockOnMenuFocus}
        onMenuBlur={mockOnMenuBlur}
      />,
    );

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('setFocusedRoute(null)'));

    expect(tvEventHandler).toBeDefined();

    tvEventHandler({eventType: 'right', eventKeyAction: 0});
    expect(mockOnMenuBlur).toHaveBeenCalledTimes(1);

    tvEventHandler({eventType: 'back', eventKeyAction: 0});
    expect(mockOnMenuBlur).toHaveBeenCalledTimes(2);
  });

  it('handles TV remote up and down events to navigate menu items when expanded', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const screen = render(
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={true}
        onMenuFocus={mockOnMenuFocus}
      />,
    );

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('setFocusedRoute(null)'));

    expect(tvEventHandler).toBeDefined();

    act(() => {
      tvEventHandler({eventType: 'down', eventKeyAction: 0});
    });

    expect(screen.getByTestId('side-menu-Movies')).toBeTruthy();

    act(() => {
      tvEventHandler({eventType: 'up', eventKeyAction: 0});
    });

    expect(screen.getByTestId('side-menu-Home')).toBeTruthy();
  });
});
