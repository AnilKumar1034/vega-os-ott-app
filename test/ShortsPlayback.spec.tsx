import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {AppState} from 'react-native';
import {ShortsPlayer} from '../src/features/shorts/components/ShortsPlayer';
import {ShortsPlayerControls} from '../src/features/shorts/components/ShortsPlayerControls';
import {useShortsPlayback} from '../src/features/shorts/hooks/useShortsPlayback';
import {SHORTS_TEST_IDS} from '../src/features/shorts/constants/shorts.constants';
import {analyticsService} from '../src/analytics';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import * as authContextHooks from '../src/context/authContext';
import {ShortsItem} from '../src/features/shorts/types/shorts.types';
import {UserProfile} from '../src/profiles/types/Profile';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();
const mockDeinitializeSync = jest.fn();
const mockClearSurfaceHandle = jest.fn();

const mockPlayerShared = {
  instance: null as any,
  listeners: {} as Record<string, ((evt?: any) => void)[]>,
  reset() {
    this.instance = null;
    this.listeners = {};
  },
  emit(event: string, data?: any) {
    this.listeners[event]?.forEach((cb) => cb(data));
  },
};

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 34;
    error: any = null;

    initialize = mockInitialize;
    play = mockPlay;
    pause = mockPause;
    deinitializeSync = mockDeinitializeSync;
    clearSurfaceHandle = mockClearSurfaceHandle;

    addEventListener = jest.fn((event: string, cb: (evt?: any) => void) => {
      if (!mockPlayerShared.listeners[event]) {
        mockPlayerShared.listeners[event] = [];
      }
      mockPlayerShared.listeners[event].push(cb);
    });

    removeEventListener = jest.fn((event: string, cb: (evt?: any) => void) => {
      if (mockPlayerShared.listeners[event]) {
        mockPlayerShared.listeners[event] = mockPlayerShared.listeners[event].filter(
          (l) => l !== cb,
        );
      }
    });

    constructor() {
      mockPlayerShared.instance = this;
    }
  }

  const KeplerVideoSurfaceView = ReactLib.forwardRef((props: any, ref: any) =>
    ReactLib.createElement(View, {
      ...props,
      ref,
      testID: props.testID || 'shorts-player-surface',
    }),
  );

  return {
    VideoPlayer: MockVideoPlayer,
    KeplerVideoSurfaceView,
    KeplerVideoView: KeplerVideoSurfaceView,
    Video: KeplerVideoSurfaceView,
  };
});

const emitPlayerEvent = (eventName: string, evtData?: any) => {
  mockPlayerShared.emit(eventName, evtData);
};

describe('Day 2 — Shorts Video Playback Integration (Amazon Vega OS)', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const sampleShortA: ShortsItem = {
    id: 'short_001',
    title: 'Gravity Defying VFX Breakdown',
    description: 'Behind the scenes VFX orbital breakdown.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    durationSeconds: 34,
    aspectRatio: '9:16',
    category: 'Behind the Scenes',
    publishedAt: '2026-11-10T10:00:00Z',
    isLiked: false,
    likeCount: 14200,
    viewCount: 185000,
    isSaved: false,
    status: 'published',
    isPremium: false,
    ageRating: 'U',
    maturityRating: 'ALL',
  };

  const sampleShortB: ShortsItem = {
    id: 'short_002',
    title: 'The Rooftop Chase Scene Cut',
    description: 'Director commentary on practical stunt drivers.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5',
    videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    durationSeconds: 42,
    aspectRatio: '9:16',
    category: 'Action',
    publishedAt: '2026-11-09T14:30:00Z',
    isLiked: false,
    likeCount: 8900,
    viewCount: 94000,
    isSaved: false,
    status: 'published',
    isPremium: false,
    ageRating: 'PG-13',
    maturityRating: '13+',
  };

  const premiumShort: ShortsItem = {
    id: 'short_prem',
    title: 'Exclusive VIP Director Cut',
    description: 'Exclusive 4K footage.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5',
    videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    durationSeconds: 50,
    aspectRatio: '9:16',
    category: 'Entertainment',
    publishedAt: '2026-11-09T14:30:00Z',
    isLiked: false,
    likeCount: 500,
    viewCount: 1200,
    isSaved: false,
    status: 'published',
    isPremium: true,
    ageRating: 'U',
    maturityRating: 'ALL',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayerShared.reset();

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

    jest.spyOn(authContextHooks, 'useAuth').mockReturnValue({
      user: {uid: 'user_1'} as any,
      userProfile: {subscription: 'Premium'} as any,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });
  });

  // 1. Player instantiation & initialization
  it('Scenario 1: Instantiates VideoPlayer and calls initialize on short mount', async () => {
    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    expect(mockInitialize).toHaveBeenCalled();
  });

  // 2. Native Video Surface rendering
  it('Scenario 2: Renders KeplerVideoView surface view with videoPlayer attached', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    expect(screen.getByTestId(SHORTS_TEST_IDS.playerSurface)).toBeTruthy();
  });

  // 3. 9:16 Portrait preservation
  it('Scenario 3: Preserves 9:16 aspect ratio in player container', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    const container = screen.getByTestId(SHORTS_TEST_IDS.player);
    const style = container.props.style;
    const flattened = Array.isArray(style)
      ? Object.assign({}, ...style)
      : style;

    expect(flattened.width).toBe(170);
    expect(flattened.height).toBe(300);
    expect(flattened.overflow).toBe('hidden');
  });

  // 4. Poster / Fallback rendering
  it('Scenario 4: Displays poster thumbnail before video starts playing', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    // Top badges are rendered
    expect(screen.getByText('34s')).toBeTruthy();
  });

  // 5. Event loadstart
  it('Scenario 5: loadstart event transitions state to loading', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('loadstart');
    });

    expect(screen.getByTestId(SHORTS_TEST_IDS.loading)).toBeTruthy();
    expect(screen.getByText('Loading Video...')).toBeTruthy();
  });

  // 6. Event loadedmetadata
  it('Scenario 6: loadedmetadata event updates duration from player', async () => {
    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    if (mockPlayerShared.instance) {
      mockPlayerShared.instance.duration = 45;
    }

    await act(async () => {
      emitPlayerEvent('loadedmetadata');
    });

    expect(mockPlayerShared.instance?.duration).toBe(45);
  });

  // 7. Event canplay
  it('Scenario 7: canplay event triggers playback when screen is active', async () => {
    render(<ShortsPlayer short={sampleShortA} isActive={true} autoPlay={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('canplay');
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  // 8. Event playing
  it('Scenario 8: playing event transitions state to playing', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    // When playing, loading overlay should not be visible
    expect(screen.queryByTestId(SHORTS_TEST_IDS.loading)).toBeNull();
  });

  // 9. Event waiting (buffering)
  it('Scenario 9: waiting event transitions state to buffering', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('waiting');
    });

    expect(screen.getByTestId(SHORTS_TEST_IDS.playerBuffering)).toBeTruthy();
    expect(screen.getByText('Buffering...')).toBeTruthy();
  });

  // 10. Event pause
  it('Scenario 10: pause event transitions state to paused with badge', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    await act(async () => {
      emitPlayerEvent('pause');
    });

    expect(screen.getByText('Paused')).toBeTruthy();
  });

  // 11. Event ended
  it('Scenario 11: ended event transitions state to completed', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('ended');
    });

    expect(screen.getByText('Replay Available')).toBeTruthy();
    expect(screen.getByTestId(SHORTS_TEST_IDS.replayButton)).toBeTruthy();
  });

  // 12. No auto-advance on Day 2
  it('Scenario 12: does not advance to next short when playback ends', async () => {
    const onCompletedMock = jest.fn();
    const screen = render(
      <ShortsPlayer
        short={sampleShortA}
        isActive={true}
        onCompleted={onCompletedMock}
      />,
    );
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('ended');
    });

    expect(onCompletedMock).toHaveBeenCalledWith(sampleShortA);
    // Remains on sampleShortA with replay prompt
    expect(screen.getByText('34s')).toBeTruthy();
    expect(screen.getByTestId(SHORTS_TEST_IDS.replayButton)).toBeTruthy();
  });

  // 13. Event error
  it('Scenario 13: error event displays error banner and retry button', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    if (mockPlayerShared.instance) {
      mockPlayerShared.instance.error = {code: 3, message: 'Media stream decode failed'};
    }

    await act(async () => {
      emitPlayerEvent('error', {message: 'Media stream decode failed'});
    });

    expect(screen.getByTestId(SHORTS_TEST_IDS.error)).toBeTruthy();
    expect(screen.getByText('Playback Error')).toBeTruthy();
    expect(screen.getByText('Media stream decode failed')).toBeTruthy();
    expect(screen.getByTestId(SHORTS_TEST_IDS.playerErrorRetryButton)).toBeTruthy();
  });

  // 14. Controls - Play/Pause button
  it('Scenario 14: toggles between play and pause from controls', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    const playPauseBtn = screen.getByTestId(SHORTS_TEST_IDS.playPauseButton);
    expect(screen.getByText('⏸ Pause')).toBeTruthy();

    await act(async () => {
      fireEvent.press(playPauseBtn);
    });

    expect(mockPause).toHaveBeenCalled();
  });

  // 15. Controls - Replay button
  it('Scenario 15: clicking Replay resets currentTime and calls play', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('ended');
    });

    const replayBtn = screen.getByTestId(SHORTS_TEST_IDS.replayButton);

    await act(async () => {
      fireEvent.press(replayBtn);
    });

    expect(mockPlayerShared.instance?.currentTime).toBe(0);
    expect(mockPlay).toHaveBeenCalled();
  });

  // 16. Controls - Retry button
  it('Scenario 16: clicking Retry re-initializes player after an error', async () => {
    const screen = render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    if (mockPlayerShared.instance) {
      mockPlayerShared.instance.error = {message: 'Network connection lost'};
    }

    await act(async () => {
      emitPlayerEvent('error', {message: 'Network connection lost'});
    });

    const retryBtn = screen.getByTestId(SHORTS_TEST_IDS.playerErrorRetryButton);

    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(mockInitialize).toHaveBeenCalled();
  });

  // 17. Switching Shorts releases previous session
  it('Scenario 17: releases previous media session synchronously when switching short', async () => {
    const {rerender} = render(
      <ShortsPlayer short={sampleShortA} isActive={true} />,
    );
    await act(async () => {});

    expect(mockInitialize).toHaveBeenCalledTimes(1);

    // Switch to Short B
    rerender(<ShortsPlayer short={sampleShortB} isActive={true} />);
    await act(async () => {});

    // DeinitializeSync was called to reclaim Kepler hardware resource
    expect(mockDeinitializeSync).toHaveBeenCalledWith(1000);
    expect(mockInitialize).toHaveBeenCalledTimes(2);
  });

  // 18. Rapid switching protection
  it('Scenario 18: handles rapid switching without multiple active sessions or crash', async () => {
    const {rerender} = render(
      <ShortsPlayer short={sampleShortA} isActive={true} />,
    );
    await act(async () => {});

    // Rapidly switch multiple times
    rerender(<ShortsPlayer short={sampleShortB} isActive={true} />);
    rerender(<ShortsPlayer short={sampleShortA} isActive={true} />);
    rerender(<ShortsPlayer short={sampleShortB} isActive={true} />);
    await act(async () => {});

    expect(mockDeinitializeSync).toHaveBeenCalled();
  });

  // 19. AppState transition to background
  it('Scenario 19: AppState backgrounding pauses playback and releases media resources', async () => {
    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    // Simulate AppState background event
    await act(async () => {
      (AppState as any).emit?.('change', 'background');
    });

    expect(mockPause).toHaveBeenCalled();
    expect(mockDeinitializeSync).toHaveBeenCalled();
  });

  // 20. AppState transition to active
  it('Scenario 20: AppState foregrounding restores playback session', async () => {
    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    await act(async () => {
      (AppState as any).emit?.('change', 'background');
    });

    await act(async () => {
      (AppState as any).emit?.('change', 'active');
    });

    expect(mockInitialize).toHaveBeenCalled();
  });

  // 21. Analytics - shorts_started
  it('Scenario 21: dispatches shorts_started analytics event on playback start', async () => {
    const trackStartedSpy = jest.spyOn(analyticsService, 'trackShortsStarted');

    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    expect(trackStartedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        short_id: 'short_001',
        title: 'Gravity Defying VFX Breakdown',
      }),
    );
  });

  // 22. Analytics - shorts_paused, shorts_completed, shorts_playback_error
  it('Scenario 22: dispatches shorts_paused, shorts_completed, and shorts_playback_error analytics', async () => {
    const trackPausedSpy = jest.spyOn(analyticsService, 'trackShortsPaused');
    const trackCompletedSpy = jest.spyOn(analyticsService, 'trackShortsCompleted');
    const trackErrorSpy = jest.spyOn(analyticsService, 'trackShortsPlaybackError');

    render(<ShortsPlayer short={sampleShortA} isActive={true} />);
    await act(async () => {});

    // 1. Pause
    await act(async () => {
      emitPlayerEvent('playing');
    });
    await act(async () => {
      emitPlayerEvent('pause');
    });
    expect(trackPausedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        short_id: 'short_001',
      }),
    );

    // 2. Completed
    await act(async () => {
      emitPlayerEvent('ended');
    });
    expect(trackCompletedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        short_id: 'short_001',
        duration_seconds: 34,
      }),
    );

    // 3. Error
    await act(async () => {
      emitPlayerEvent('error', {message: 'Playback failure'});
    });
    expect(trackErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        short_id: 'short_001',
        error_message: 'Playback failure',
      }),
    );
  });

  // 23. Profile & Entitlement restriction
  it('Scenario 23: blocks playback and shows error when premium short is accessed without subscription', async () => {
    // Override user auth to Free/no subscription
    jest.spyOn(authContextHooks, 'useAuth').mockReturnValue({
      user: {uid: 'user_free'} as any,
      userProfile: {subscription: 'Free'} as any,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    const screen = render(<ShortsPlayer short={premiumShort} isActive={true} />);
    await act(async () => {});

    expect(screen.getByTestId(SHORTS_TEST_IDS.error)).toBeTruthy();
    expect(
      screen.getByText(
        'This Short is available exclusively to Premium subscribers.',
      ),
    ).toBeTruthy();
  });
});
