/* global globalThis */

import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import {strings} from '../src/constants/strings';
import {CreateProfileScreen} from '../src/profiles/screens/CreateProfileScreen';
import {useProfile} from '../src/profiles/hooks/useProfile';

(globalThis as any).requestAnimationFrame = (cb: (time: number) => void) =>
  setTimeout(() => cb(Date.now()), 0);

if ((globalThis as any).jest) {
  (globalThis as any).jest.now = () => Date.now();
}

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('../src/profiles/hooks/useProfile');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateProfileScreen', () => {
  it('validates empty profile name and shows error', async () => {
    const createProfileMock = jest.fn();
    (useProfile as jest.Mock).mockReturnValue({
      profiles: [],
      createProfile: createProfileMock,
    });

    const screen = render(<CreateProfileScreen />);
    const submitBtn = screen.getByTestId('create-profile-submit-button');

    fireEvent.press(submitBtn);

    expect(createProfileMock).not.toHaveBeenCalled();
    expect(screen.getByText(strings.profiles.nameRequired)).toBeTruthy();
  });

  it('creates profile with entered name, selected avatar, and kids flag', async () => {
    const createProfileMock = jest.fn().mockResolvedValue({
      id: 'new-p1',
      name: 'Family Profile',
      avatarId: 'avatar-2',
      isKids: true,
      createdAt: 1000,
      updatedAt: 1000,
    });

    (useProfile as jest.Mock).mockReturnValue({
      profiles: [],
      createProfile: createProfileMock,
    });

    const screen = render(<CreateProfileScreen />);
    const nameInput = screen.getByTestId('create-profile-name-input');
    const avatarOpt = screen.getByTestId('avatar-option-avatar-2');
    const kidsToggle = screen.getByTestId('kids-profile-toggle');
    const submitBtn = screen.getByTestId('create-profile-submit-button');

    fireEvent.changeText(nameInput, 'Family Profile');
    fireEvent.press(avatarOpt);
    fireEvent.press(kidsToggle);

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(createProfileMock).toHaveBeenCalledWith({
      name: 'Family Profile',
      avatarId: 'avatar-2',
      isKids: true,
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows limit banner when 5 profiles already exist', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profiles: [1, 2, 3, 4, 5].map((n) => ({
        id: `p${n}`,
        name: `User ${n}`,
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: n * 1000,
        updatedAt: n * 1000,
      })),
      createProfile: jest.fn(),
    });

    const screen = render(<CreateProfileScreen />);
    expect(
      screen.getByText(strings.profiles.maxProfilesReached),
    ).toBeTruthy();
    expect(screen.getByTestId('limit-back-button')).toBeTruthy();
  });
});
