import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {EditProfileScreen} from '../src/screens/EditProfileScreen';
import {useAuth} from '../src/context/authContext';
import {useProfile} from '../src/profiles/hooks/useProfile';

(jest as any).now = Date.now;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
    replace: jest.fn(),
  }),
}));

jest.mock('../src/context/authContext');
jest.mock('../src/profiles/hooks/useProfile');

describe('EditProfileScreen Remote Back and Dialog Dismissal', () => {
  const mockActiveProfile = {
    id: 'p1',
    name: 'Anil',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const mockUser = {
    uid: 'u1',
    email: 'anil@example.com',
    displayName: 'Anil',
  };

  const mockUserProfile = {
    username: 'Anil',
    email: 'anil@example.com',
    city: 'Hyderabad',
    country: 'India',
    avatar: 'avatar-1',
    themePreference: 'cinematic',
    notificationsEnabled: true,
    autoplayEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    useTVEventHandler.mockClear();
    const {BackHandler} = require('react-native');
    (BackHandler.addEventListener as jest.Mock).mockClear();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile,
      updateProfile: jest.fn().mockResolvedValue(undefined),
      loading: false,
    });

    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: mockActiveProfile,
      profiles: [mockActiveProfile, {id: 'p2', name: 'Other', isKids: false}],
      parentalSettings: {pinEnabled: false},
      isParentAuthorized: false,
      verifyParentPin: jest.fn().mockResolvedValue(true),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      deleteProfile: jest.fn().mockResolvedValue(undefined),
    });
  });

  const sendRemoteEvent = (eventType: string, eventKeyAction: number = 0) => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    useTVEventHandler.mock.calls.forEach(([fn]: any) => {
      try {
        fn({eventType, eventKeyAction});
      } catch {}
    });
  };

  it('closes DeleteProfileDialog on remote Back without leaving screen', () => {
    const screen = render(<EditProfileScreen />);

    // Press delete profile button to open dialog
    const deleteBtn = screen.getByTestId('delete-profile-button');
    act(() => {
      fireEvent.press(deleteBtn);
    });

    expect(screen.getByTestId('delete-profile-dialog-overlay')).toBeTruthy();

    // Send remote Back event
    act(() => {
      sendRemoteEvent('back');
    });

    // Delete dialog should be closed
    expect(screen.queryByTestId('delete-profile-dialog-overlay')).toBeNull();
    // Screen should not have navigated away
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('closes DeleteProfileDialog on hardwareBackPress without leaving screen', () => {
    const {BackHandler} = require('react-native');
    const screen = render(<EditProfileScreen />);

    const deleteBtn = screen.getByTestId('delete-profile-button');
    act(() => {
      fireEvent.press(deleteBtn);
    });

    expect(screen.getByTestId('delete-profile-dialog-overlay')).toBeTruthy();

    const backCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
    const lastBackHandler = [...backCalls]
      .reverse()
      .find((c: any) => c[0] === 'hardwareBackPress')?.[1];

    let result;
    act(() => {
      result = lastBackHandler();
    });

    expect(result).toBe(true);
    expect(screen.queryByTestId('delete-profile-dialog-overlay')).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('closes PinEntryDialog on remote Back without leaving screen', () => {
    // Enable PIN lock so save requires PIN
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: {...mockActiveProfile, isKids: true},
      profiles: [{...mockActiveProfile, isKids: true}, {id: 'p2', name: 'Other'}],
      parentalSettings: {pinEnabled: true},
      isParentAuthorized: false,
      verifyParentPin: jest.fn().mockResolvedValue(true),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      deleteProfile: jest.fn().mockResolvedValue(undefined),
    });

    const screen = render(<EditProfileScreen />);

    const saveBtn = screen.getByTestId('save-profile-button');
    act(() => {
      fireEvent.press(saveBtn);
    });

    expect(screen.getByTestId('edit-profile-pin-dialog-overlay')).toBeTruthy();

    act(() => {
      sendRemoteEvent('back');
    });

    expect(screen.queryByTestId('edit-profile-pin-dialog-overlay')).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('calls leaveEditor when remote Back is pressed and no dialog is open', () => {
    render(<EditProfileScreen />);

    act(() => {
      sendRemoteEvent('back');
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
