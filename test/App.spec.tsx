import 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';

import {App} from '../src/App';
import {SPLASH_DURATION} from '../src/screens/SplashScreen';
import {homeHero} from '../src/data/home';


describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const navigateToHome = async () => {
    const screen = render(<App />);
    await act(async () => {
      jest.advanceTimersByTime(SPLASH_DURATION);
    });
    return screen;
  };

  it('shows the splash screen before navigating to home', async () => {
    const screen = render(<App />);

    expect(screen.getByTestId('splash-screen')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(SPLASH_DURATION);
    });
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });





  it('renders the streaming hero and mock-data content rows', async () => {
    const screen = await navigateToHome();
    expect(screen.getByTestId('hero-banner')).toBeTruthy();
    expect(screen.getByText('Continue Watching')).toBeTruthy();
    expect(screen.getByText('Trending Now')).toBeTruthy();
    expect(screen.getByTestId('content-card-horizon')).toBeTruthy();
    expect(screen.getByTestId('content-card-summit')).toBeTruthy();
  });

  it('navigates with the side menu', async () => {
    const screen = await navigateToHome();

    fireEvent.press(screen.getByTestId('side-menu-Movies'));

    expect(screen.getByTestId('movies-screen')).toBeTruthy();
  });

  it('collapses the menu when screen content is focused and expands it again', async () => {
    const screen = await navigateToHome();

    fireEvent(screen.getByLabelText(`Play ${homeHero.title}`), 'focus');
    expect(screen.queryByTestId('side-menu-label-Movies')).toBeNull();

    fireEvent(screen.getByTestId('side-menu-Movies'), 'focus');
    expect(screen.getByTestId('side-menu-label-Movies')).toBeTruthy();
  });

  it('sets TV preferred focus on the hero play action', async () => {
    const screen = await navigateToHome();
    expect(
      screen.getByLabelText(`Play ${homeHero.title}`).props.hasTVPreferredFocus,
    ).toBe(true);
  });


});
