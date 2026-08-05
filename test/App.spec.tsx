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

  it('renders the streaming hero and mock-data content rows', () => {
    const screen = navigateToHome();
    expect(screen.getByTestId('hero-banner')).toBeTruthy();
    expect(screen.getByText('Continue Watching')).toBeTruthy();
    expect(screen.getByText('Trending Now')).toBeTruthy();
    expect(screen.getByTestId('content-card-horizon')).toBeTruthy();
    expect(screen.getByTestId('content-card-summit')).toBeTruthy();
  });

  it('navigates with the side menu', () => {
    const screen = navigateToHome();

    fireEvent.press(screen.getByTestId('side-menu-Movies'));

    expect(screen.getByTestId('movies-screen')).toBeTruthy();
  });

  it('collapses the menu when screen content is focused and expands it again', () => {
    const screen = navigateToHome();

    fireEvent(screen.getByLabelText('Play The Last Horizon'), 'focus');
    expect(screen.queryByTestId('side-menu-label-Movies')).toBeNull();

    fireEvent(screen.getByTestId('side-menu-Movies'), 'focus');
    expect(screen.getByTestId('side-menu-label-Movies')).toBeTruthy();
  });

  it('sets TV preferred focus on the hero play action', () => {
    const screen = navigateToHome();
    expect(
      screen.getByLabelText('Play The Last Horizon').props.hasTVPreferredFocus,
    ).toBe(true);
  });
});
