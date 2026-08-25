/* global globalThis */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {strings} from '../src/constants/strings';
import {DeleteProfileDialog} from '../src/profiles/components/DeleteProfileDialog';
import {UserProfile} from '../src/profiles/types/Profile';

(globalThis as any).requestAnimationFrame = (cb: (time: number) => void) =>
  setTimeout(() => cb(Date.now()), 0);

if ((globalThis as any).jest) {
  (globalThis as any).jest.now = () => Date.now();
}

describe('DeleteProfileDialog', () => {
  const mockProfile: UserProfile = {
    id: 'p1',
    name: 'Anil',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  it('renders confirmation dialog with profile details', () => {
    const screen = render(
      <DeleteProfileDialog
        visible={true}
        profile={mockProfile}
        isOnlyProfile={false}
        isDeleting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      screen.getByText(strings.profiles.deleteProfileConfirmTitle),
    ).toBeTruthy();
    expect(
      screen.getByText(
        strings.profiles.deleteProfileConfirmMessage(mockProfile.name),
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('delete-dialog-cancel-button')).toBeTruthy();
    expect(screen.getByTestId('delete-dialog-confirm-button')).toBeTruthy();
  });

  it('prevents deletion when isOnlyProfile is true and shows warning', () => {
    const onConfirmMock = jest.fn();
    const screen = render(
      <DeleteProfileDialog
        visible={true}
        profile={mockProfile}
        isOnlyProfile={true}
        isDeleting={false}
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />,
    );

    expect(
      screen.getByText(strings.profiles.cannotDeleteLastProfile),
    ).toBeTruthy();
    expect(screen.queryByTestId('delete-dialog-confirm-button')).toBeNull();
  });

  it('calls onConfirm when delete is confirmed', () => {
    const onConfirmMock = jest.fn();
    const screen = render(
      <DeleteProfileDialog
        visible={true}
        profile={mockProfile}
        isOnlyProfile={false}
        isDeleting={false}
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('delete-dialog-confirm-button'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel is pressed', () => {
    const onCancelMock = jest.fn();
    const screen = render(
      <DeleteProfileDialog
        visible={true}
        profile={mockProfile}
        isOnlyProfile={false}
        isDeleting={false}
        onConfirm={jest.fn()}
        onCancel={onCancelMock}
      />,
    );

    fireEvent.press(screen.getByTestId('delete-dialog-cancel-button'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
