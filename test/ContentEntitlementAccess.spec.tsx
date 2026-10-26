import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';
import {analyticsService} from '../src/analytics';
import {entitlementService} from '../src/services/entitlementService';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 3600;
    captioning = false;
    audioTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    textTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    initialize = mockInitialize;
    setSurfaceHandle = mockSetSurfaceHandle;
    clearSurfaceHandle = mockClearSurfaceHandle;
    play = mockPlay;
    pause = mockPause;
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
  }

  const KeplerVideoSurfaceView = ReactLib.forwardRef((props: any, ref: any) =>
    ReactLib.createElement(View, {
      ...props,
      ref,
      testID: props.testID || 'w3c-video-surface',
    }),
  );

  return {
    VideoPlayer: MockVideoPlayer,
    KeplerVideoSurfaceView,
    KeplerVideoView: KeplerVideoSurfaceView,
    Video: KeplerVideoSurfaceView,
  };
});

let mockRouteParams: any = {
  params: {
    movie: {
      id: 'movie-101',
      title: 'Inception',
      genre: 'Sci-Fi',
      videoUrl: 'https://cdn.example.com/inception.mp4',
    },
  },
};

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

describe('Content-Level Entitlement Enforcement in VideoPlayerScreen', () => {
  const mockUser = {uid: 'user-777'};
  const mockAdultProfile = {
    id: 'profile-adult',
    name: 'Adult Profile',
    isKids: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    entitlementService.clearCache();

    mockRouteParams = {
      params: {
        movie: {
          id: 'movie-101',
          title: 'Inception',
          genre: 'Sci-Fi',
          videoUrl: 'https://cdn.example.com/inception.mp4',
        },
      },
    };

    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: mockAdultProfile,
    } as any);

    jest.spyOn(analyticsService, 'trackSubscriptionAccessGranted').mockResolvedValue(undefined);
    jest.spyOn(analyticsService, 'trackSubscriptionAccessDenied').mockResolvedValue(undefined);
  });

  it('allows entitled user with active Premium subscription to play protected movie', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Premium',
        subscriptionStatus: 'active',
      },
      loading: false,
    } as any);

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(analyticsService.trackSubscriptionAccessGranted).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'movie-101',
          content_title: 'Inception',
          user_plan: 'Premium',
          source_screen: 'VideoPlayer',
        }),
      );
    });

    expect(screen.queryByText(/subscription is required/i)).toBeNull();
  });

  it('blocks user without active subscription from playing protected movie and reports access denial', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Free',
        subscriptionStatus: 'none',
      },
      loading: false,
    } as any);

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(analyticsService.trackSubscriptionAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'movie-101',
          content_title: 'Inception',
          reason: 'not_entitled',
          source_screen: 'VideoPlayer',
        }),
      );
    });

    expect(screen.getByText('A subscription is required to watch this title. Choose a plan to start streaming.')).toBeTruthy();
    expect(analyticsService.trackSubscriptionAccessGranted).not.toHaveBeenCalled();
  });

  it('blocks user with expired subscription and displays expiry message', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Standard',
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: new Date(Date.now() - 3600000).toISOString(),
      },
      loading: false,
    } as any);

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(analyticsService.trackSubscriptionAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'movie-101',
          content_title: 'Inception',
          reason: 'expired',
          source_screen: 'VideoPlayer',
        }),
      );
    });

    expect(screen.getByText('Your subscription has expired. Please renew your plan to continue watching.')).toBeTruthy();
    expect(analyticsService.trackSubscriptionAccessGranted).not.toHaveBeenCalled();
  });

  it('allows free/unsubscribed user to watch Live TV channels without subscription check block', async () => {
    mockRouteParams = {
      params: {
        isLive: true,
        channel: {
          id: 'live-news-24',
          name: 'Global News 24/7',
        },
        movie: {
          id: 'live-news-24',
          title: 'Global News 24/7',
          videoUrl: 'https://cdn.example.com/live.m3u8',
          isLive: true,
        },
      },
    };

    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Free',
        subscriptionStatus: 'none',
      },
      loading: false,
    } as any);

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(analyticsService.trackSubscriptionAccessGranted).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'live-news-24',
          content_title: 'Global News 24/7',
          source_screen: 'VideoPlayer',
        }),
      );
    });

    expect(screen.queryByText(/subscription/i)).toBeNull();
  });

  it('blocks user with Basic plan from playing 4K UHD exclusive content and asks to upgrade', async () => {
    mockRouteParams = {
      params: {
        movie: {
          id: 'movie-4k-exclusive',
          title: 'Avatar UHD',
          genre: 'Sci-Fi',
          badge: '4K UHD',
          quality: '4K',
          requiredTier: 'premium',
          videoUrl: 'https://cdn.example.com/avatar4k.mp4',
        },
      },
    };

    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: mockUser,
      userProfile: {
        subscription: 'Basic',
        subscriptionStatus: 'active',
      },
      loading: false,
    } as any);

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(analyticsService.trackSubscriptionAccessDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'movie-4k-exclusive',
          reason: 'upgrade_required',
          required_plan: 'Premium',
          source_screen: 'VideoPlayer',
        }),
      );
    });

    expect(screen.getByText('This title is in 4K Ultra HD. Upgrade to the Premium plan to enjoy 4K streaming.')).toBeTruthy();
  });
});
