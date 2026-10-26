import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {SubscriptionScreen} from '../src/screens/SubscriptionScreen';
import {useAuth} from '../src/context/authContext';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {selectSubscriptionPlan} from '../src/services/subscriptionService';
import {entitlementService} from '../src/services/entitlementService';
import {analyticsService} from '../src/analytics';
import {Routes} from '../src/constants/routes';

jest.mock('../src/context/authContext');
jest.mock('../src/profiles/hooks/useProfile');
jest.mock('../src/services/subscriptionService', () => {
  const actual = jest.requireActual('../src/services/subscriptionService');
  return {
    ...actual,
    selectSubscriptionPlan: jest.fn(),
  };
});
jest.mock('../src/services/entitlementService', () => ({
  entitlementService: {
    refreshEntitlement: jest.fn().mockResolvedValue({
      status: 'active',
      tier: 'premium',
    }),
  },
}));
jest.mock('../src/analytics', () => ({
  analyticsService: {
    trackSubscriptionStatusViewed: jest.fn().mockResolvedValue(undefined),
    trackSubscriptionPlanSelected: jest.fn().mockResolvedValue(undefined),
    trackSubscriptionStatusRefreshed: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({
    params: {sourceScreen: 'Settings'},
  }),
}));

describe('SubscriptionScreen UI & Vega OS Navigation', () => {
  const mockLogout = jest.fn();
  const mockUpdateProfile = jest.fn();
  const mockClearActiveProfile = jest.fn();

  const mockUser = {
    uid: 'u123',
    email: 'subscriber@logixstream.com',
  };

  const mockUserProfile: any = {
    username: 'Subscriber User',
    email: 'subscriber@logixstream.com',
    subscription: 'Basic',
    subscriptionStatus: 'active',
  };

  beforeEach(() => {
    jest.useFakeTimers();
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
      clearActiveProfile: mockClearActiveProfile,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it('renders header, step counter, and billing cycle toggle with "Best value" badge', () => {
    const {getByText, getByTestId} = render(<SubscriptionScreen />);

    expect(getByText('STEP 1 OF 2')).toBeTruthy();
    expect(getByText("Choose the plan that's right for you")).toBeTruthy();
    expect(getByText('Best value')).toBeTruthy();
    expect(getByText('Annually')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByTestId('cycle-toggle-button')).toBeTruthy();
    expect(getByTestId('subscription-sign-out-button')).toBeTruthy();
  });

  it('renders all 4 subscription plan cards matching the design screenshot', () => {
    const {getByTestId, getByText} = render(<SubscriptionScreen />);

    expect(getByTestId('plan-card-premium')).toBeTruthy();
    expect(getByTestId('plan-card-standard')).toBeTruthy();
    expect(getByTestId('plan-card-basic')).toBeTruthy();
    expect(getByTestId('plan-card-mobile')).toBeTruthy();

    expect(getByText('Most recommended')).toBeTruthy();
    expect(getByText('₹649')).toBeTruthy();
    expect(getByText('₹499')).toBeTruthy();
    expect(getByText('₹299')).toBeTruthy();
    expect(getByText('₹149')).toBeTruthy();
  });

  it('toggles billing cycle between monthly and annually and updates prices', () => {
    const {getByTestId, getByText, queryByText} = render(<SubscriptionScreen />);

    // Initially monthly
    expect(getByText('₹649')).toBeTruthy();
    const toggleButton = getByTestId('cycle-toggle-button');

    // Switch to annually
    fireEvent.press(toggleButton);

    expect(getByText('₹5,841')).toBeTruthy();
    expect(getByText('₹5,089')).toBeTruthy();
    expect(getByText('₹3,229')).toBeTruthy();
    expect(getByText('₹1,699')).toBeTruthy();
    expect(queryByText('₹649')).toBeNull();

    // Switch back to monthly
    fireEvent.press(toggleButton);
    expect(getByText('₹649')).toBeTruthy();
  });

  it('handles selecting a plan, calling selectSubscriptionPlan and refreshing entitlement', async () => {
    (selectSubscriptionPlan as jest.Mock).mockResolvedValue({
      subscription: 'Premium',
      subscriptionStatus: 'active',
    });

    const {getByTestId, getByText} = render(<SubscriptionScreen />);

    const premiumCard = getByTestId('plan-card-premium');
    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(selectSubscriptionPlan).toHaveBeenCalledWith('premium', 'monthly');
    expect(entitlementService.refreshEntitlement).toHaveBeenCalledWith('u123');
    expect(analyticsService.trackSubscriptionPlanSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'premium',
        plan_name: 'Premium',
        billing_cycle: 'monthly',
        price: 649,
      }),
    );
    expect(getByText('Successfully subscribed to Premium!')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('prevents re-selecting current active plan', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Premium',
        subscriptionStatus: 'active',
      },
      logout: mockLogout,
      updateProfile: mockUpdateProfile,
      loading: false,
    });

    const {getByTestId, getByText} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');
    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(selectSubscriptionPlan).not.toHaveBeenCalled();
    expect(getByText('You are already subscribed to Premium.')).toBeTruthy();
  });

  it('logs out and clears profile when Sign out is pressed', async () => {
    const {getByTestId} = render(<SubscriptionScreen />);
    const signOutBtn = getByTestId('subscription-sign-out-button');

    await act(async () => {
      fireEvent.press(signOutBtn);
    });

    expect(mockClearActiveProfile).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(Routes.Login);
  });

  it('handles TV remote D-pad Back button', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(<SubscriptionScreen />);

    const handler = useTVEventHandler.mock.calls[0][0];

    act(() => {
      handler({eventType: 'back', eventKeyAction: 0});
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('handles TV remote D-pad navigation: up to cycle-toggle then select', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const {getByText} = render(<SubscriptionScreen />);

    // Starts on card-premium, navigate 'up' to cycle-toggle
    act(() => {
      const handler =
        useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1][0];
      handler({eventType: 'up', eventKeyAction: 0});
    });

    // Select to toggle billing cycle
    act(() => {
      const handler =
        useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1][0];
      handler({eventType: 'select', eventKeyAction: 0});
    });

    // Should switch to annually
    expect(getByText('₹5,841')).toBeTruthy();
  });
});
