import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {PinEntryDialog} from '../src/components/molecules/PinEntryDialog';

(jest as any).now = Date.now;

describe('PinEntryDialog Component', () => {
  it('renders numeric keypad and 4 digit dots', () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();

    const screen = render(
      <PinEntryDialog
        visible={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    expect(screen.getByTestId('pin-entry-dialog-overlay')).toBeTruthy();
    expect(screen.getByTestId('pin-digit-0')).toBeTruthy();
    expect(screen.getByTestId('pin-digit-1')).toBeTruthy();
    expect(screen.getByTestId('pin-digit-2')).toBeTruthy();
    expect(screen.getByTestId('pin-digit-3')).toBeTruthy();

    // Check number pad keys
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByTestId(`pin-key-${i}`)).toBeTruthy();
    }
    expect(screen.getByTestId('pin-key-clear')).toBeTruthy();
    expect(screen.getByTestId('pin-key-cancel')).toBeTruthy();
  });

  it('collects 4 digits and triggers onSuccess in verification mode', async () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();

    const screen = render(
      <PinEntryDialog
        visible={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-3'));
    fireEvent.press(screen.getByTestId('pin-key-4'));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith('1234');
    });
  });

  it('displays error and clears digits when validatePin fails', async () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();
    const validatePin = jest.fn().mockResolvedValue(false);

    const screen = render(
      <PinEntryDialog
        visible={true}
        validatePin={validatePin}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    fireEvent.press(screen.getByTestId('pin-key-9'));
    fireEvent.press(screen.getByTestId('pin-key-8'));
    fireEvent.press(screen.getByTestId('pin-key-7'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('pin-key-6'));
    });

    await waitFor(() => {
      expect(validatePin).toHaveBeenCalledWith('9876');
      expect(handleSuccess).not.toHaveBeenCalled();
      expect(screen.getByTestId('pin-error-banner')).toBeTruthy();
    });
  });

  it('handles PIN setup confirmation mode with match', async () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();

    const screen = render(
      <PinEntryDialog
        visible={true}
        isConfirmMode={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    // Step 1: enter 5555
    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));

    // Step 2: confirm 5555
    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 2/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));
    fireEvent.press(screen.getByTestId('pin-key-5'));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith('5555');
    });
  });

  it('handles PIN setup confirmation mismatch and resets', async () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();

    const screen = render(
      <PinEntryDialog
        visible={true}
        isConfirmMode={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    // Step 1: enter 1111
    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-1'));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 2/i)).toBeTruthy();
    });

    // Step 2: mismatch 2222
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-2'));

    await waitFor(() => {
      expect(handleSuccess).not.toHaveBeenCalled();
      expect(screen.getByTestId('pin-error-banner')).toBeTruthy();
      expect(screen.getByText(/Step 1 of 2/i)).toBeTruthy();
    });
  });

  it('clears digits when Clear button is pressed', () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();

    const screen = render(
      <PinEntryDialog
        visible={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    fireEvent.press(screen.getByTestId('pin-key-1'));
    fireEvent.press(screen.getByTestId('pin-key-2'));
    fireEvent.press(screen.getByTestId('pin-key-clear'));

    // 4th digit not reached
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('calls onCancel when TV remote Back event is received', () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');

    render(
      <PinEntryDialog
        visible={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    const tvHandlers = useTVEventHandler.mock.calls.map((c: any) => c[0]);
    act(() => {
      tvHandlers.forEach((h: any) => {
        try {
          h({eventType: 'back', eventKeyAction: 0});
        } catch {}
      });
    });

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel and returns true when hardwareBackPress is triggered', () => {
    const handleSuccess = jest.fn();
    const handleCancel = jest.fn();
    const {BackHandler} = require('react-native');

    render(
      <PinEntryDialog
        visible={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />,
    );

    const backCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
    const lastBackHandler = [...backCalls]
      .reverse()
      .find((c: any) => c[0] === 'hardwareBackPress')?.[1];

    expect(lastBackHandler).toBeDefined();
    let result;
    act(() => {
      result = lastBackHandler();
    });

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('does not invoke onCancel when visible is false', () => {
    const handleCancel = jest.fn();
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');

    render(
      <PinEntryDialog
        visible={false}
        onSuccess={jest.fn()}
        onCancel={handleCancel}
      />,
    );

    const tvHandlers = useTVEventHandler.mock.calls.map((c: any) => c[0]);
    act(() => {
      tvHandlers.forEach((h: any) => {
        try {
          h({eventType: 'back', eventKeyAction: 0});
        } catch {}
      });
    });

    expect(handleCancel).not.toHaveBeenCalled();
  });
});

