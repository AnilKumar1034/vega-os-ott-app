import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {SettingsScreen} from '../src/screens/SettingsScreen';
import {useAuth} from '../src/context/authContext';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {Routes} from '../src/constants/routes';

jest.mock('../src/context/authContext');
jest.mock('../src/profiles/hooks/useProfile');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
    replace: jest.fn(),
    dispatch: jest.fn(),
  }),
}));

describe('SettingsScreen TV Remote Navigation', () => {
  const mockLogout = jest.fn();
  const mockUpdateProfile = jest.fn();
  const mockClearActiveProfile = jest.fn();
  const mockVerifyParentPin = jest.fn();

  const mockUser = {
    uid: 'u1',
    email: 'user@example.com',
    displayName: 'Test User',
  };

  const mockUserProfile = {
    username: 'Test User',
    email: 'user@example.com',
    subscription: 'Premium UHD',
    city: 'Hyderabad',
    country: 'India',
    avatar: 'avatar-1',
    themePreference: 'cinematic',
    notificationsEnabled: true,
    autoplayEnabled: true,
  };

  const mockActiveProfile = {
    id: 'p1',
    name: 'Test Profile',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    useTVEventHandler.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile,
      logout: mockLogout,
      updateProfile: mockUpdateProfile,
      loading: false,
    });
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: mockActiveProfile,
      clearActiveProfile: mockClearActiveProfile,
      parentalSettings: {pinEnabled: false},
      isParentAuthorized: false,
      verifyParentPin: mockVerifyParentPin,
    });
  });

  const sendRemoteEvent = (eventType: string, eventKeyAction: number = 0) => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const handlers = useTVEventHandler.mock.calls.map((c: any) => c[0]);
    handlers.forEach((h: any) => {
      try {
        h({eventType, eventKeyAction});
      } catch {}
    });
  };

  it('1. Gives TV preferred focus to View Profile button by default, not theme card', () => {
    const screen = render(<SettingsScreen />);

    const profileBtn = screen.getByTestId('settings-profile-button');
    expect(profileBtn.props.hasTVPreferredFocus).toBe(true);

    const themeCard = screen.getByTestId('settings-theme-cinematic');
    expect(themeCard.props.hasTVPreferredFocus).toBeFalsy();
  });

  it('2. Opens side menu when remote left is pressed on account panel items', () => {
    const screen = render(<SettingsScreen />);

    const profileBtn = screen.getByTestId('settings-profile-button');
    act(() => {
      fireEvent(profileBtn, 'focus');
    });

    act(() => {
      sendRemoteEvent('left');
    });

    // Side menu should be expanded
    expect(screen.getByTestId('side-menu-label-Home')).toBeTruthy();
  });

  it('3. Navigates D-pad down from switch-profile to logout across the footer gap', () => {
    const screen = render(<SettingsScreen />);

    const switchBtn = screen.getByTestId('settings-switch-profile-button');
    act(() => {
      fireEvent(switchBtn, 'focus');
    });

    act(() => {
      sendRemoteEvent('down');
    });

    const logoutBtn = screen.getByTestId('logout-button');
    expect(logoutBtn.props.hasTVPreferredFocus).toBe(true);
  });

  it('4. Navigates D-pad up from logout to switch-profile', () => {
    const screen = render(<SettingsScreen />);

    const logoutBtn = screen.getByTestId('logout-button');
    act(() => {
      fireEvent(logoutBtn, 'focus');
    });

    act(() => {
      sendRemoteEvent('up');
    });

    const switchBtn = screen.getByTestId('settings-switch-profile-button');
    expect(switchBtn.props.hasTVPreferredFocus).toBe(true);
  });

  it('5. Navigates D-pad right from View Profile to Theme selection', () => {
    const screen = render(<SettingsScreen />);

    const profileBtn = screen.getByTestId('settings-profile-button');
    act(() => {
      fireEvent(profileBtn, 'focus');
    });

    act(() => {
      sendRemoteEvent('right');
    });

    const cinematicTheme = screen.getByTestId('settings-theme-cinematic');
    expect(cinematicTheme.props.hasTVPreferredFocus).toBe(true);
  });

  it('6. Navigates D-pad left from first theme card back to account panel', () => {
    const screen = render(<SettingsScreen />);

    const cinematicTheme = screen.getByTestId('settings-theme-cinematic');
    act(() => {
      fireEvent(cinematicTheme, 'focus');
    });

    act(() => {
      sendRemoteEvent('left');
    });

    const profileBtn = screen.getByTestId('settings-profile-button');
    expect(profileBtn.props.hasTVPreferredFocus).toBe(true);
  });

  it('7. Navigates D-pad down from Theme row to Toggle row and up back to Theme', () => {
    const screen = render(<SettingsScreen />);

    const cinematicTheme = screen.getByTestId('settings-theme-cinematic');
    act(() => {
      fireEvent(cinematicTheme, 'focus');
    });

    act(() => {
      sendRemoteEvent('down');
    });

    const notificationsToggle = screen.getByTestId('settings-toggle-notifications');
    expect(notificationsToggle.props.hasTVPreferredFocus).toBe(true);

    act(() => {
      sendRemoteEvent('up');
    });

    expect(cinematicTheme.props.hasTVPreferredFocus).toBe(true);
  });

  it('8. Handles Select remote key to trigger actions and toggle preferences', async () => {
    const screen = render(<SettingsScreen />);

    // Select on notifications toggle
    const notificationsToggle = screen.getByTestId('settings-toggle-notifications');
    act(() => {
      fireEvent(notificationsToggle, 'focus');
    });

    await act(async () => {
      sendRemoteEvent('select');
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({notificationsEnabled: false});
  });

  it('9. Handles remote Back button to close side menu when expanded', () => {
    const screen = render(<SettingsScreen />);

    // Expand side menu via left on profile
    const profileBtn = screen.getByTestId('settings-profile-button');
    act(() => {
      fireEvent(profileBtn, 'focus');
    });
    act(() => {
      sendRemoteEvent('left');
    });

    expect(screen.getByTestId('side-menu-label-Home')).toBeTruthy();

    // Press Back on remote
    act(() => {
      sendRemoteEvent('back');
    });

    // Should collapse menu instead of navigating back immediately
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('10. Handles remote Back button to navigate back when menu is not expanded', () => {
    render(<SettingsScreen />);

    act(() => {
      sendRemoteEvent('back');
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('11. Handles remote Back button to close ParentalControlsModal when visible', () => {
    const screen = render(<SettingsScreen />);

    const parentalBtn = screen.getByTestId('settings-parental-controls-button');
    fireEvent.press(parentalBtn);

    expect(screen.getByTestId('parental-controls-modal-overlay')).toBeTruthy();

    // Press remote Back
    act(() => {
      sendRemoteEvent('back');
    });

    expect(screen.queryByTestId('parental-controls-modal-overlay')).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('12. Handles remote Back button to close PinEntryDialog when visible', () => {
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: {id: 'kids', name: 'Kid', isKids: true},
      clearActiveProfile: mockClearActiveProfile,
      parentalSettings: {pinEnabled: true},
      isParentAuthorized: false,
      verifyParentPin: mockVerifyParentPin,
    });

    const screen = render(<SettingsScreen />);

    const parentalBtn = screen.getByTestId('settings-parental-controls-button');
    fireEvent.press(parentalBtn);

    expect(screen.getByTestId('settings-pin-auth-dialog-overlay')).toBeTruthy();

    // Press remote Back
    act(() => {
      sendRemoteEvent('back');
    });

    expect(screen.queryByTestId('settings-pin-auth-dialog-overlay')).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('13. Handles remote navigation when signed out', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      userProfile: null,
      logout: mockLogout,
      updateProfile: mockUpdateProfile,
      loading: false,
    });

    const screen = render(<SettingsScreen />);

    const loginBtn = screen.getByTestId('settings-login-button');
    const registerBtn = screen.getByTestId('settings-register-button');

    expect(loginBtn.props.hasTVPreferredFocus).toBe(true);

    act(() => {
      fireEvent(loginBtn, 'focus');
    });

    // Press Right to focus Register
    act(() => {
      sendRemoteEvent('right');
    });
    expect(registerBtn.props.hasTVPreferredFocus).toBe(true);

    // Press Left to focus Login
    act(() => {
      sendRemoteEvent('left');
    });
    expect(loginBtn.props.hasTVPreferredFocus).toBe(true);

    // Press Left on Login to open side menu
    act(() => {
      sendRemoteEvent('left');
    });
    expect(screen.getByTestId('side-menu-label-Home')).toBeTruthy();
  });

  it('14. Handles Select remote key on account action buttons to navigate', () => {
    const screen = render(<SettingsScreen />);

    const editBtn = screen.getByTestId('settings-edit-profile-button');
    act(() => {
      fireEvent(editBtn, 'focus');
    });

    act(() => {
      sendRemoteEvent('select');
    });

    expect(mockNavigate).toHaveBeenCalledWith(Routes.EditProfile);
  });
});

