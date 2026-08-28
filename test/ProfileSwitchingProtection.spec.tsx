import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {ProfileSelectionScreen} from '../src/profiles/screens/ProfileSelectionScreen';
import * as profileContext from '../src/profiles/context/profileContext';
import {UserProfile} from '../src/profiles/types/Profile';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
}));

describe('Profile Switching & Parental PIN Protection', () => {
  const adultProfile1: UserProfile = {
    id: 'profile-adult-1',
    name: 'Parent Adult',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const adultProfile2: UserProfile = {
    id: 'profile-adult-2',
    name: 'Other Adult',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: 2000,
    updatedAt: 2000,
  };

  const kidsProfile1: UserProfile = {
    id: 'profile-kids-1',
    name: 'Kid One',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 3000,
    updatedAt: 3000,
  };

  const kidsProfile2: UserProfile = {
    id: 'profile-kids-2',
    name: 'Kid Two',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: '7_PLUS',
    createdAt: 4000,
    updatedAt: 4000,
  };

  const mockSwitchProfile = jest.fn();
  const mockVerifyParentPin = jest.fn();

  beforeEach(() => {
    mockSwitchProfile.mockReset();
    mockVerifyParentPin.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires PIN when switching from Kids profile to an Adult profile', async () => {
    mockVerifyParentPin.mockResolvedValue(true);

    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: kidsProfile1,
      profiles: [adultProfile1, kidsProfile1],
      isLoadingProfiles: false,
      error: null,
      isParentAuthorized: false,
      parentalSettings: {pinEnabled: true, pinHash: 'hash'},
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      setActiveProfile: jest.fn(),
      switchProfile: mockSwitchProfile,
      refreshProfiles: jest.fn(),
      refreshParentalSettings: jest.fn(),
      verifyParentPin: mockVerifyParentPin,
      setParentPin: jest.fn(),
      removeParentPin: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      clearActiveProfile: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);

    // Click on Adult Profile card
    fireEvent.press(screen.getByTestId('profile-card-profile-adult-1'));

    // Should NOT switch immediately; must show PIN dialog
    expect(mockSwitchProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('switch-adult-pin-dialog-overlay')).toBeTruthy();

    // Enter correct 4-digit PIN (e.g. 1 2 3 4)
    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-3'));
    fireEvent.press(screen.getByTestId('pin-key-4'));

    await waitFor(() => {
      expect(mockVerifyParentPin).toHaveBeenCalledWith('1234');
      expect(mockSwitchProfile).toHaveBeenCalledWith('profile-adult-1');
      expect(mockReplace).toHaveBeenCalledWith('Home');
    });
  });

  it('allows switching from Kids profile to another Kids profile without PIN', async () => {
    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: kidsProfile1,
      profiles: [adultProfile1, kidsProfile1, kidsProfile2],
      isLoadingProfiles: false,
      error: null,
      isParentAuthorized: false,
      parentalSettings: {pinEnabled: true, pinHash: 'hash'},
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      setActiveProfile: jest.fn(),
      switchProfile: mockSwitchProfile,
      refreshProfiles: jest.fn(),
      refreshParentalSettings: jest.fn(),
      verifyParentPin: mockVerifyParentPin,
      setParentPin: jest.fn(),
      removeParentPin: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      clearActiveProfile: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);

    // Click on Kid Two
    fireEvent.press(screen.getByTestId('profile-card-profile-kids-2'));

    // Should switch immediately without prompt
    await waitFor(() => {
      expect(mockSwitchProfile).toHaveBeenCalledWith('profile-kids-2');
      expect(mockVerifyParentPin).not.toHaveBeenCalled();
    });
  });

  it('allows switching between Adult profiles without PIN', async () => {
    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: adultProfile1,
      profiles: [adultProfile1, adultProfile2, kidsProfile1],
      isLoadingProfiles: false,
      error: null,
      isParentAuthorized: false,
      parentalSettings: {pinEnabled: true, pinHash: 'hash'},
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      setActiveProfile: jest.fn(),
      switchProfile: mockSwitchProfile,
      refreshProfiles: jest.fn(),
      refreshParentalSettings: jest.fn(),
      verifyParentPin: mockVerifyParentPin,
      setParentPin: jest.fn(),
      removeParentPin: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      clearActiveProfile: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);

    // Click on Adult Two
    fireEvent.press(screen.getByTestId('profile-card-profile-adult-2'));

    await waitFor(() => {
      expect(mockSwitchProfile).toHaveBeenCalledWith('profile-adult-2');
      expect(mockVerifyParentPin).not.toHaveBeenCalled();
    });
  });
});
