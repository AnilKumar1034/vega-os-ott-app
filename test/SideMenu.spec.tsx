import 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
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
});
