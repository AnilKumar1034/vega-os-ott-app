import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {ParentalControlsModal} from '../src/components/molecules/ParentalControlsModal';
import {useProfile} from '../src/profiles/hooks/useProfile';

(jest as any).now = Date.now;

jest.mock('../src/profiles/hooks/useProfile');

describe('ParentalControlsModal Remote Control Handling', () => {
  const mockSetParentPin = jest.fn();
  const mockRemoveParentPin = jest.fn();
  const mockVerifyParentPin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    useTVEventHandler.mockClear();
    const {BackHandler} = require('react-native');
    (BackHandler.addEventListener as jest.Mock).mockClear();

    (useProfile as jest.Mock).mockReturnValue({
      parentalSettings: {pinEnabled: false},
      setParentPin: mockSetParentPin,
      removeParentPin: mockRemoveParentPin,
      verifyParentPin: mockVerifyParentPin,
    });
  });

  const sendRemoteEvent = (eventType: string, eventKeyAction: number = 0) => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const lastHandler =
      useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1]?.[0];
    if (lastHandler) {
      lastHandler({eventType, eventKeyAction});
    }
  };

  it('renders modal when visible is true and shows Set PIN button when PIN is disabled', () => {
    const onCloseMock = jest.fn();
    const screen = render(
      <ParentalControlsModal visible={true} onClose={onCloseMock} />,
    );

    expect(
      screen.getByTestId('parental-controls-modal-overlay'),
    ).toBeTruthy();
    expect(screen.getByTestId('parental-setup-pin-button')).toBeTruthy();
  });

  it('calls onClose when remote Back button is pressed in default state', () => {
    const onCloseMock = jest.fn();
    render(<ParentalControlsModal visible={true} onClose={onCloseMock} />);

    act(() => {
      sendRemoteEvent('back');
    });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose and returns true on hardwareBackPress in default state', () => {
    const onCloseMock = jest.fn();
    const {BackHandler} = require('react-native');

    render(<ParentalControlsModal visible={true} onClose={onCloseMock} />);

    const backCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
    const lastBackHandler = [...backCalls]
      .reverse()
      .find((c: any) => c[0] === 'hardwareBackPress')?.[1];

    expect(lastBackHandler).toBeDefined();
    let result;
    act(() => {
      result = lastBackHandler();
    });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('first remote Back closes sub-dialog without closing the modal; second remote Back closes modal', () => {
    const onCloseMock = jest.fn();
    const screen = render(
      <ParentalControlsModal visible={true} onClose={onCloseMock} />,
    );

    // Open setup PIN dialog
    const setupBtn = screen.getByTestId('parental-setup-pin-button');
    fireEvent.press(setupBtn);

    // Pin dialog overlay should be visible
    expect(screen.getByTestId('setup-pin-dialog-overlay')).toBeTruthy();

    // 1st remote Back: cancels setup pin dialog back to parental modal
    act(() => {
      sendRemoteEvent('back');
    });

    expect(screen.queryByTestId('setup-pin-dialog-overlay')).toBeNull();
    expect(screen.getByTestId('parental-controls-modal-overlay')).toBeTruthy();
    expect(onCloseMock).not.toHaveBeenCalled();

    // 2nd remote Back: closes parental modal
    act(() => {
      sendRemoteEvent('back');
    });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('first hardwareBackPress closes sub-dialog without closing the modal; second hardwareBackPress closes modal', () => {
    const onCloseMock = jest.fn();
    const {BackHandler} = require('react-native');
    const screen = render(
      <ParentalControlsModal visible={true} onClose={onCloseMock} />,
    );

    const setupBtn = screen.getByTestId('parental-setup-pin-button');
    fireEvent.press(setupBtn);

    expect(screen.getByTestId('setup-pin-dialog-overlay')).toBeTruthy();

    const backCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
    // The parental modal's handler was registered first (index 0)
    const parentalBackHandler = backCalls[0]?.[1];
    // The pin entry dialog's handler was registered second (last)
    const pinBackHandler = backCalls[backCalls.length - 1]?.[1];

    let result1;
    act(() => {
      result1 = pinBackHandler();
    });

    expect(result1).toBe(true);
    expect(screen.queryByTestId('setup-pin-dialog-overlay')).toBeNull();
    expect(onCloseMock).not.toHaveBeenCalled();

    // Second back press on parental modal
    let result2;
    act(() => {
      result2 = parentalBackHandler();
    });

    expect(result2).toBe(true);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal is not visible', () => {
    const onCloseMock = jest.fn();
    render(<ParentalControlsModal visible={false} onClose={onCloseMock} />);

    act(() => {
      sendRemoteEvent('back');
    });

    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
