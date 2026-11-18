import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {ShortsScreen} from '../src/features/shorts/screens/ShortsScreen';
import {
  setMockScenario,
  resetMockScenario,
} from '../src/features/shorts/services/shortsMockApi';
import {SHORTS_TEST_IDS} from '../src/features/shorts/constants/shorts.constants';
import {analyticsService} from '../src/analytics';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

describe('ShortsScreen UI & TV Experience', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    resetMockScenario();
    jest.clearAllMocks();
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: adultProfile,
      profiles: [adultProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);
  });

  afterEach(() => {
    resetMockScenario();
  });

  it('renders header, category tabs, preview stage, and bottom feed rail', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.screen)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.header)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.categoryTabs)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.metadata)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.feedRail)).toBeTruthy();
    });

    expect(screen.getByText('LogiXstream Shorts')).toBeTruthy();
  });

  it('renders error state and retries successfully', async () => {
    setMockScenario('network_error');
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.error)).toBeTruthy();
      expect(screen.getByText('Unable to Load Shorts')).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.retryButton)).toBeTruthy();
    });

    // Reset error scenario and trigger retry
    resetMockScenario();
    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.retryButton));
    });

    await waitFor(() => {
      expect(screen.queryByTestId(SHORTS_TEST_IDS.error)).toBeNull();
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  it('renders empty state when no shorts match filter', async () => {
    setMockScenario('empty');
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.empty)).toBeTruthy();
      expect(screen.getByText('No Shorts Found')).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.resetFilterButton)).toBeTruthy();
    });
  });

  it('switches category when category tab is selected', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.categoryTab('Comedy'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.categoryTab('Comedy')));
    });

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.metadata)).toBeTruthy();
    });
  });

  it('navigates with next and previous buttons', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.nextButton)).toBeTruthy();
      expect(screen.getByTestId(SHORTS_TEST_IDS.prevButton)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.nextButton));
    });

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.metadata)).toBeTruthy();
    });
  });

  it('triggers shorts_opened and shorts_impression analytics', async () => {
    const trackOpenedSpy = jest.spyOn(analyticsService, 'trackShortsOpened');
    const trackImpressionSpy = jest.spyOn(analyticsService, 'trackShortsImpression');

    render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(trackOpenedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          source_screen: 'Home',
        }),
      );
      expect(trackImpressionSpy).toHaveBeenCalled();
    });
  });

  it('handles remote Back button to exit screen', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(<ShortsScreen />);
    await act(async () => {});

    const tvHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('navigation.goBack()'));

    expect(tvHandler).toBeDefined();

    act(() => {
      tvHandler({eventType: 'back', eventKeyAction: 0});
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
