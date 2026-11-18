import 'react-native';
import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import {HomeScreen} from '../src/screens/HomeScreen';
import {Routes} from '../src/constants/routes';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('HomeScreen Shorts Integration', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: adultProfile,
      profiles: [adultProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);
  });

  it('renders the Shorts row on the Home screen', async () => {
    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeTruthy();
      expect(screen.getByText('Shorts • Quick Stories')).toBeTruthy();
    });
  });

  it('navigates to ShortsScreen when a Shorts card is pressed on Home', async () => {
    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-card-short_001')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('content-card-short_001'));

    expect(mockNavigate).toHaveBeenCalledWith(Routes.Shorts, {
      shortId: 'short_001',
    });
  });

  it('filters out mature shorts when a Kids profile is active', async () => {
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: kidsProfile,
      profiles: [kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);

    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeTruthy();
    });

    // 16+ short (short_004) must not appear for Kids profile
    expect(screen.queryByTestId('content-card-short_004')).toBeNull();

    // ALL/KIDS short (short_001) should appear
    expect(screen.queryByTestId('content-card-short_001')).toBeTruthy();
  });
});
