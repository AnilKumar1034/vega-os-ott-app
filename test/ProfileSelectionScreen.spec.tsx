import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {strings} from '../src/constants/strings';
import {ProfileSelectionScreen} from '../src/profiles/screens/ProfileSelectionScreen';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';

jest.mock('../src/profiles/hooks/useProfile');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('ProfileSelectionScreen', () => {
  const mockProfiles: UserProfile[] = [
    {
      id: 'p1',
      name: 'Anil',
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'p2',
      name: 'Kids Club',
      avatarId: 'avatar-kids-1',
      isKids: true,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  it('renders Who\'s Watching title and profile cards', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profiles: mockProfiles,
      activeProfile: mockProfiles[0],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      refreshProfiles: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);
    expect(screen.getByText(strings.profiles.whosWatching)).toBeTruthy();
    expect(screen.getByText('Anil')).toBeTruthy();
    expect(screen.getByText('Kids Club')).toBeTruthy();
    expect(screen.getByText(strings.profiles.kidsBadge)).toBeTruthy();
    expect(screen.getByText(strings.profiles.addProfile)).toBeTruthy();
  });

  it('calls switchProfile when profile is pressed', async () => {
    const switchProfileMock = jest.fn().mockResolvedValue(undefined);
    (useProfile as jest.Mock).mockReturnValue({
      profiles: mockProfiles,
      activeProfile: null,
      isLoadingProfiles: false,
      error: null,
      switchProfile: switchProfileMock,
      refreshProfiles: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);
    const profileCard = screen.getByTestId('profile-card-p1');
    fireEvent.press(profileCard);

    expect(switchProfileMock).toHaveBeenCalledWith('p1');
  });

  it('hides Add Profile when 5 profiles already exist', () => {
    const fiveProfiles: UserProfile[] = [1, 2, 3, 4, 5].map((n) => ({
      id: `p${n}`,
      name: `User ${n}`,
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: n * 1000,
      updatedAt: n * 1000,
    }));

    (useProfile as jest.Mock).mockReturnValue({
      profiles: fiveProfiles,
      activeProfile: fiveProfiles[0],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      refreshProfiles: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);
    expect(screen.queryByTestId('add-profile-card')).toBeNull();
  });

  it('renders loading indicator while loading profiles', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profiles: [],
      activeProfile: null,
      isLoadingProfiles: true,
      error: null,
      switchProfile: jest.fn(),
      refreshProfiles: jest.fn(),
    });

    const screen = render(<ProfileSelectionScreen />);
    expect(screen.getByText(strings.profiles.loadingProfiles)).toBeTruthy();
  });
});
