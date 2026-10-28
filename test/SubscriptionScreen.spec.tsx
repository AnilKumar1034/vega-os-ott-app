import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {SubscriptionScreen} from '../src/screens/SubscriptionScreen';
import {useAuth} from '../src/context/authContext';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {analyticsService} from '../src/analytics';
import {Routes} from '../src/constants/routes';
import {mockEntitlementService, mockIapConfig, mockIapService} from '../src/iap';

jest.mock('../src/context/authContext');
jest.mock('../src/profiles/hooks/useProfile');
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

describe('SubscriptionScreen UI & Vega OS Navigation with Mock IAP', () => {
  const mockLogout = jest.fn();
  const mockUpdateProfile = jest.fn();
  const mockClearActiveProfile = jest.fn();

  const mockUser = {
    uid: 'u123',
    email: 'subscriber@logixstream.com',
  };

  const mockUserProfile: any = {
    uid: 'u123',
    username: 'Subscriber User',
    email: 'subscriber@logixstream.com',
    subscription: 'Free',
    subscriptionStatus: 'none',
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIapConfig.reset();
    mockIapConfig.setEnabled(true);
    mockIapConfig.setSimulatedDelayMs(200);
    mockIapService.resetState();
    mockEntitlementService.clearMemoryCache();

    const storage = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native').default;
    if (storage?.clear) {
      await storage.clear();
    }

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
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders header, step counter, dev scenario toggle, and billing cycle toggle with "Best value" badge', () => {
    const {getByText, getByTestId} = render(<SubscriptionScreen />);

    expect(getByText('STEP 1 OF 2')).toBeTruthy();
    expect(getByText("Choose the plan that's right for you")).toBeTruthy();
    expect(getByText('Best value')).toBeTruthy();
    expect(getByText('Annually')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByTestId('cycle-toggle-button')).toBeTruthy();
    expect(getByTestId('subscription-sign-out-button')).toBeTruthy();
    expect(getByTestId('dev-scenario-toggle')).toBeTruthy();
    expect(getByText('SUCCESS')).toBeTruthy();
  });

  it('cycles through dev test scenarios (SUCCESS -> CANCEL -> FAILURE) on toggle press', () => {
    const {getByTestId, getByText} = render(<SubscriptionScreen />);
    const devToggle = getByTestId('dev-scenario-toggle');

    expect(mockIapConfig.getScenario()).toBe('success');

    // Toggle 1: success -> cancel
    act(() => {
      fireEvent.press(devToggle);
    });
    expect(mockIapConfig.getScenario()).toBe('cancel');
    expect(getByText('CANCEL')).toBeTruthy();

    // Toggle 2: cancel -> failure
    act(() => {
      fireEvent.press(devToggle);
    });
    expect(mockIapConfig.getScenario()).toBe('failure');
    expect(getByText('FAILURE')).toBeTruthy();

    // Toggle 3: failure -> success
    act(() => {
      fireEvent.press(devToggle);
    });
    expect(mockIapConfig.getScenario()).toBe('success');
    expect(getByText('SUCCESS')).toBeTruthy();
  });

  it('renders all 4 subscription plan cards matching design specs', () => {
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

  it('handles selecting a plan, granting mock entitlement, and displaying active entitlement banner', async () => {
    mockIapConfig.setScenario('success');
    const purchaseSpy = jest.spyOn(mockIapService, 'purchase');
    const grantSpy = jest.spyOn(mockEntitlementService, 'grantEntitlement');

    const {getByTestId, getByText} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');

    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(purchaseSpy).toHaveBeenCalledWith('premium_monthly');

    // Advance timer to finish simulated payment delay
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(grantSpy).toHaveBeenCalledWith(
      'u123',
      expect.objectContaining({id: 'premium'}),
      'monthly',
      expect.stringMatching(/^mock_dev_txn_/),
    );

    expect(analyticsService.trackSubscriptionPlanSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'premium',
        plan_name: 'Premium',
        billing_cycle: 'monthly',
        price: 649,
      }),
    );

    expect(getByText(/\[SIMULATED\] Purchase successful for Premium/)).toBeTruthy();
    expect(getByTestId('dev-entitlement-banner')).toBeTruthy();
    expect(getByTestId('dev-reset-button')).toBeTruthy();
  });

  it('resets test entitlement when RESET TEST SUB button is pressed', async () => {
    mockIapConfig.setScenario('success');
    const {getByTestId, getByText, queryByTestId} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');

    // Purchase
    await act(async () => {
      fireEvent.press(premiumCard);
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(getByTestId('dev-reset-button')).toBeTruthy();

    // Press reset
    const resetBtn = getByTestId('dev-reset-button');
    await act(async () => {
      fireEvent.press(resetBtn);
    });

    expect(getByText('Mock entitlement reset to Free tier.')).toBeTruthy();
    expect(queryByTestId('dev-reset-button')).toBeNull();
  });

  it('handles user cancellation scenario gracefully without granting entitlement', async () => {
    mockIapConfig.setScenario('cancel');
    const purchaseSpy = jest.spyOn(mockIapService, 'purchase');

    const {getByTestId, getByText, queryByTestId} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');

    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(purchaseSpy).toHaveBeenCalledWith('premium_monthly');

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(analyticsService.trackSubscriptionPlanSelected).not.toHaveBeenCalled();
    expect(getByText('Purchase cancelled by user.')).toBeTruthy();
    expect(queryByTestId('dev-entitlement-banner')).toBeNull();
  });

  it('handles payment failure scenario gracefully without granting entitlement', async () => {
    mockIapConfig.setScenario('failure');
    const purchaseSpy = jest.spyOn(mockIapService, 'purchase');

    const {getByTestId, getByText, queryByTestId} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');

    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(purchaseSpy).toHaveBeenCalledWith('premium_monthly');

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(analyticsService.trackSubscriptionPlanSelected).not.toHaveBeenCalled();
    expect(getByText(/Simulated payment was declined/)).toBeTruthy();
    expect(queryByTestId('dev-entitlement-banner')).toBeNull();
  });

  it('prevents re-selecting current active plan', async () => {
    // Give user an active Premium subscription
    await mockEntitlementService.grantEntitlement(
      mockUser.uid,
      {
        id: 'premium',
        name: 'Premium',
        tier: 'premium',
        monthlyPrice: 649,
        annualPrice: 5841,
        monthlyPriceFormatted: '₹649',
        annualPriceFormatted: '₹5,841',
        savePercent: 25,
        qualityLabel: 'Great Video & sound quality',
        resolution: '4K',
        maxQuality: '4K',
        features: [],
        accentColor: '#E50914',
        badgeColor: '#E50914',
      },
      'monthly',
    );

    const purchaseSpy = jest.spyOn(mockIapService, 'purchase');

    const {getByTestId, getByText} = render(<SubscriptionScreen />);
    const premiumCard = getByTestId('plan-card-premium');

    await act(async () => {
      fireEvent.press(premiumCard);
    });

    expect(purchaseSpy).not.toHaveBeenCalled();
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

  it('handles TV remote D-pad navigation to dev scenario toggle and cycling it', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const {getByText} = render(<SubscriptionScreen />);

    // Starts on card-premium, navigate 'up' to cycle-toggle
    act(() => {
      const handler =
        useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1][0];
      handler({eventType: 'up', eventKeyAction: 0});
    });

    // Navigate 'up' from cycle-toggle to dev-scenario
    act(() => {
      const handler =
        useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1][0];
      handler({eventType: 'up', eventKeyAction: 0});
    });

    // Press 'select' on dev-scenario toggle
    act(() => {
      const handler =
        useTVEventHandler.mock.calls[useTVEventHandler.mock.calls.length - 1][0];
      handler({eventType: 'select', eventKeyAction: 0});
    });

    expect(getByText('CANCEL')).toBeTruthy();
  });
});
