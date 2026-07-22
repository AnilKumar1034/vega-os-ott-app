import 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';

import {App} from '../src/App';
import {SPLASH_DURATION} from '../src/screens/SplashScreen';

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const navigateToHome = () => {
    const screen = render(<App />);
    act(() => {
      jest.advanceTimersByTime(SPLASH_DURATION);
    });
    return screen;
  };

  it('shows the splash screen before navigating to home', () => {
    const screen = render(<App />);

    expect(screen.getByTestId('splash-screen')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(SPLASH_DURATION);
    });
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  it('renders all four tiles on the home screen', () => {
    const screen = navigateToHome();
    expect(screen.getByTestId('tile-featured')).toBeTruthy();
    expect(screen.getByTestId('tile-movies')).toBeTruthy();
    expect(screen.getByTestId('tile-series')).toBeTruthy();
    expect(screen.getByTestId('tile-my-list')).toBeTruthy();
  });

  it('navigates with the side menu', () => {
    const screen = navigateToHome();

    fireEvent.press(screen.getByTestId('side-menu-Movies'));

    expect(screen.getByTestId('movies-screen')).toBeTruthy();
  });

  it('collapses the menu when screen content is focused and expands it again', () => {
    const screen = navigateToHome();

    fireEvent(screen.getByTestId('tile-featured'), 'focus');
    expect(screen.queryByTestId('side-menu-label-Movies')).toBeNull();

    fireEvent(screen.getByTestId('side-menu-Movies'), 'focus');
    expect(screen.getByTestId('side-menu-label-Movies')).toBeTruthy();
  });

  it('focuses the first tile by default', () => {
    const screen = navigateToHome();
    const featuredTile = screen.getByTestId('tile-featured');
    const flatStyle = Object.assign({}, ...[featuredTile.props.style].flat());
    expect(flatStyle.backgroundColor).toBe('#FF6200');
  });

  it('sets TV preferred focus on the first tile only', () => {
    const screen = navigateToHome();
    expect(screen.getByTestId('tile-featured').props.hasTVPreferredFocus).toBe(
      true,
    );
    expect(screen.getByTestId('tile-movies').props.hasTVPreferredFocus).toBe(
      false,
    );
  });
});
