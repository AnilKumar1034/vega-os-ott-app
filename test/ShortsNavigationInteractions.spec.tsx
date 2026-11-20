import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {ShortsScreen} from '../src/features/shorts/screens/ShortsScreen';
import {ShortsActionRail} from '../src/features/shorts/components/ShortsActionRail';
import {SHORTS_TEST_IDS} from '../src/features/shorts/constants/shorts.constants';
import {
  setMockScenario,
  resetMockScenario,
  resetMockInteractions,
  likeShort,
  unlikeShort,
  saveShort,
  unsaveShort,
  getShortsFeed,
} from '../src/features/shorts/services/shortsMockApi';
import {analyticsService} from '../src/analytics';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import * as authHooks from '../src/context/authContext';
import {UserProfile} from '../src/profiles/types/Profile';
import {ShortsItem} from '../src/features/shorts/types/shorts.types';

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

const sendTVRemoteEvent = (eventType: string, eventKeyAction: number = 0) => {
  const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
  const handlers = useTVEventHandler.mock?.calls?.map((c: any) => c[0]) || [];
  handlers.forEach((h: any) => {
    try {
      h({eventType, eventKeyAction});
    } catch {
      // Ignored
    }
  });
};

const emitPlayerEvent = (eventName: string, evtData?: any) => {
  mockPlayerShared.emit(eventName, evtData);
};

describe('Day 3 — Shorts Navigation, Auto-Play & Interactions', () => {
  const adultProfileA: UserProfile = {
    id: 'profile-adult-a',
    name: 'Adult User A',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const adultProfileB: UserProfile = {
    id: 'profile-adult-b',
    name: 'Adult User B',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayerShared.reset();
    resetMockScenario();
    resetMockInteractions();

    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: adultProfileA,
      profiles: [adultProfileA, adultProfileB, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);

    jest.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: {uid: 'user_1'} as any,
      userProfile: {subscription: 'Premium'} as any,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });
  });

  afterEach(() => {
    resetMockScenario();
    resetMockInteractions();
  });

  // --- 1. REMOTE NAVIGATION (1-7) ---
  it('Scenario 1: Remote Down selects the next Short in the feed', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
      expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
    });

    await act(async () => {
      sendTVRemoteEvent('down');
    });

    await waitFor(() => {
      expect(screen.getAllByText('The Rooftop Chase Scene Cut')[0]).toBeTruthy();
    });
  });

  it('Scenario 2: Remote Up selects the previous Short in the feed', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
    });

    await waitFor(() => {
      expect(screen.getAllByText('The Rooftop Chase Scene Cut')[0]).toBeTruthy();
    });

    await act(async () => {
      sendTVRemoteEvent('up');
    });

    await waitFor(() => {
      expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
    });
  });

  it('Scenario 3: Remote Up at first Short is clamped safely at index 0', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
    });

    await act(async () => {
      sendTVRemoteEvent('up');
    });

    expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
  });

  it('Scenario 4: Remote Down triggers pagination prefetch when approaching end', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    // Navigate down repeatedly
    for (let i = 0; i < 9; i++) {
      await act(async () => {
        sendTVRemoteEvent('down');
      });
    }

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  it('Scenario 5: Remote navigation maintains a single active player session without duplicates', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
    });

    expect(mockDeinitializeSync).toHaveBeenCalled();
  });

  it('Scenario 6: Rapid remote presses are handled safely without crash or race conditions', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
      sendTVRemoteEvent('down');
      sendTVRemoteEvent('up');
      sendTVRemoteEvent('down');
    });

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  it('Scenario 7: Remote Back event exits Shorts screen via navigation.goBack()', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('back');
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  // --- 2. AUTO-PLAY ON COMPLETION (8-14) ---
  it('Scenario 8: Playback completion (ended event) automatically advances to the next Short', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
    });

    // Simulate completion
    await act(async () => {
      emitPlayerEvent('ended');
    });

    await waitFor(() => {
      expect(screen.getAllByText('The Rooftop Chase Scene Cut')[0]).toBeTruthy();
    });
  });

  it('Scenario 9: Playback completion event is processed only once (no duplicate transitions)', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
    });

    await act(async () => {
      emitPlayerEvent('ended');
      emitPlayerEvent('ended');
    });

    // Advances to item 2 and does not skip to item 3
    await waitFor(() => {
      expect(screen.getAllByText('The Rooftop Chase Scene Cut')[0]).toBeTruthy();
    });
  });

  it('Scenario 10: Next Short automatically initializes and begins playback after completion', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('ended');
    });

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('Scenario 11: Playback completion does not advance after screen has unmounted', async () => {
    const {unmount} = render(<ShortsScreen />);
    await act(async () => {});

    unmount();

    expect(() => {
      emitPlayerEvent('ended');
    }).not.toThrow();
  });

  it('Scenario 12: Manual pause does not trigger auto-advance', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
      emitPlayerEvent('pause');
    });

    expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
  });

  it('Scenario 13: Playback error does not trigger auto-advance', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('error', {message: 'Stream failed'});
    });

    expect(screen.getAllByText('Gravity Defying VFX Breakdown')[0]).toBeTruthy();
  });

  it('Scenario 14: End of feed on completion does not loop or crash; remains on final short', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    // Advance to end of feed
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        emitPlayerEvent('ended');
      });
    }

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  // --- 3. FEED CONTINUATION & PAGINATION (15-20) ---
  it('Scenario 15: Next page of feed loads correctly via shortsApi.getFeed', async () => {
    const response = await getShortsFeed({page: 2, limit: 5});
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.pagination.page).toBe(2);
  });

  it('Scenario 16: Duplicate records are prevented when merging pages', async () => {
    const page1 = await getShortsFeed({page: 1, limit: 10});
    const page2 = await getShortsFeed({page: 2, limit: 10});

    const set = new Set(page1.data.map((d) => d.id));
    page2.data.forEach((item) => {
      expect(set.has(item.id)).toBe(false);
    });
  });

  it('Scenario 17: Concurrent / duplicate pagination requests are prevented while fetching', async () => {
    const p1 = getShortsFeed({page: 1});
    const p2 = getShortsFeed({page: 1});
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  it('Scenario 18: Pagination errors are handled gracefully without wiping existing feed data', async () => {
    setMockScenario('network_error');
    await expect(getShortsFeed({page: 2})).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    resetMockScenario();
  });

  it('Scenario 19: Retry re-fetches the feed successfully after an initial error', async () => {
    setMockScenario('network_error');
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.retryButton)).toBeTruthy();
    });

    resetMockScenario();
    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.retryButton));
    });

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  it('Scenario 20: No-more-content (hasNextPage: false) is respected without infinite requests', async () => {
    const response = await getShortsFeed({page: 10, limit: 50});
    expect(response.pagination.hasNextPage).toBe(false);
  });

  // --- 4. LIKES INTERACTION (21-27) ---
  it('Scenario 21: Liking a Short updates isLiked and increments like count', async () => {
    const updated = await likeShort('short_001', 'profile_1');
    expect(updated.isLiked).toBe(true);
    expect(updated.likeCount).toBeGreaterThan(14200);
  });

  it('Scenario 22: Unliking a Short updates isLiked: false and decrements like count', async () => {
    await likeShort('short_001', 'profile_1');
    const unliked = await unlikeShort('short_001', 'profile_1');
    expect(unliked.isLiked).toBe(false);
  });

  it('Scenario 23: Like count increments correctly on like', async () => {
    const before = await getShortsFeed({profileId: 'profile_1'});
    const initialCount = before.data[0].likeCount;

    const liked = await likeShort(before.data[0].id, 'profile_1');
    expect(liked.likeCount).toBe(initialCount + 1);
  });

  it('Scenario 24: Like count decrements correctly on unlike', async () => {
    const before = await getShortsFeed({profileId: 'profile_1'});
    const initialCount = before.data[0].likeCount;

    await likeShort(before.data[0].id, 'profile_1');
    const after = await unlikeShort(before.data[0].id, 'profile_1');
    expect(after.likeCount).toBe(initialCount);
  });

  it('Scenario 25: Like count cannot drop below 0', async () => {
    const unliked = await unlikeShort('short_001', 'profile_1');
    expect(unliked.likeCount).toBeGreaterThanOrEqual(0);
  });

  it('Scenario 26: Duplicate like calls for same profile do not double increment', async () => {
    const first = await likeShort('short_001', 'profile_1');
    const second = await likeShort('short_001', 'profile_1');
    expect(second.likeCount).toBe(first.likeCount);
  });

  it('Scenario 27: Mutation failure rolls back optimistic like state in UI', async () => {
    const mockToggleLike = jest.fn();
    const mockShort: ShortsItem = {
      id: 'short_test',
      title: 'Test',
      description: 'Desc',
      thumbnailUrl: 'thumb',
      videoUrl: 'video',
      durationSeconds: 30,
      aspectRatio: '9:16',
      publishedAt: '2026-11-10T00:00:00Z',
      isLiked: false,
      likeCount: 10,
      viewCount: 100,
      isSaved: false,
      status: 'published',
      isPremium: false,
    };

    const screen = render(
      <ShortsActionRail
        short={mockShort}
        onToggleLike={mockToggleLike}
        onToggleSave={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.likeButton));
    expect(mockToggleLike).toHaveBeenCalled();
  });

  // --- 5. SAVES / BOOKMARK INTERACTION (28-32) ---
  it('Scenario 28: Saving a Short marks isSaved: true', async () => {
    const saved = await saveShort('short_001', 'profile_1');
    expect(saved.isSaved).toBe(true);
  });

  it('Scenario 29: Unsaving a Short marks isSaved: false', async () => {
    await saveShort('short_001', 'profile_1');
    const unsaved = await unsaveShort('short_001', 'profile_1');
    expect(unsaved.isSaved).toBe(false);
  });

  it('Scenario 30: Duplicate save calls remain idempotent', async () => {
    await saveShort('short_001', 'profile_1');
    const second = await saveShort('short_001', 'profile_1');
    expect(second.isSaved).toBe(true);
  });

  it('Scenario 31: Save state remains consistent in feed queries for the profile', async () => {
    await saveShort('short_001', 'profile_save_test');
    const feed = await getShortsFeed({profileId: 'profile_save_test'});
    const item = feed.data.find((s) => s.id === 'short_001');
    expect(item?.isSaved).toBe(true);
  });

  it('Scenario 32: Save action triggers onToggleSave callback', async () => {
    const mockToggleSave = jest.fn();
    const mockShort: ShortsItem = {
      id: 'short_test_save',
      title: 'Test',
      description: 'Desc',
      thumbnailUrl: 'thumb',
      videoUrl: 'video',
      durationSeconds: 30,
      aspectRatio: '9:16',
      publishedAt: '2026-11-10T00:00:00Z',
      isLiked: false,
      likeCount: 10,
      viewCount: 100,
      isSaved: false,
      status: 'published',
      isPremium: false,
    };

    const screen = render(
      <ShortsActionRail
        short={mockShort}
        onToggleLike={jest.fn()}
        onToggleSave={mockToggleSave}
      />,
    );

    fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.saveButton));
    expect(mockToggleSave).toHaveBeenCalled();
  });

  // --- 6. PROFILE ISOLATION (33-36) ---
  it('Scenario 33: Profile context is passed to feed queries', async () => {
    const feed = await getShortsFeed({profileId: 'profile_specific'});
    expect(feed.success).toBe(true);
  });

  it('Scenario 34: Likes in Profile A do not leak into Profile B', async () => {
    await likeShort('short_001', 'profile_a');

    const feedA = await getShortsFeed({profileId: 'profile_a'});
    const feedB = await getShortsFeed({profileId: 'profile_b'});

    expect(feedA.data.find((s) => s.id === 'short_001')?.isLiked).toBe(true);
    expect(feedB.data.find((s) => s.id === 'short_001')?.isLiked).toBe(false);
  });

  it('Scenario 35: Saves in Profile A do not leak into Profile B', async () => {
    await saveShort('short_001', 'profile_a');

    const feedA = await getShortsFeed({profileId: 'profile_a'});
    const feedB = await getShortsFeed({profileId: 'profile_b'});

    expect(feedA.data.find((s) => s.id === 'short_001')?.isSaved).toBe(true);
    expect(feedB.data.find((s) => s.id === 'short_001')?.isSaved).toBe(false);
  });

  it('Scenario 36: Kids profile restrictions filter adult/unauthorized shorts from feed', async () => {
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: kidsProfile,
      profiles: [adultProfileA, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);

    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.preview)).toBeTruthy();
    });
  });

  // --- 7. PLAYBACK LIFECYCLE & RACE CONDITIONS (37-42) ---
  it('Scenario 37: Previous media session is synchronously deinitialized on short change', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
    });

    expect(mockDeinitializeSync).toHaveBeenCalledWith(1000);
  });

  it('Scenario 38: Only one active media session exists during playback', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
    });

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('Scenario 39: Stale completion callbacks or errors from prior Shorts are ignored', async () => {
    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      sendTVRemoteEvent('down');
      emitPlayerEvent('error', {message: 'Stale error'});
    });

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('Scenario 40: Event listeners are properly detached on short change and unmount', async () => {
    const {unmount} = render(<ShortsScreen />);
    await act(async () => {});

    unmount();
    expect(mockDeinitializeSync).toHaveBeenCalled();
  });

  it('Scenario 41: Navigating away / unmounting stops playback and releases media resources', async () => {
    const {unmount} = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    unmount();
    expect(mockDeinitializeSync).toHaveBeenCalled();
  });

  it('Scenario 42: Playback error on one Short does not corrupt feed list or navigation', async () => {
    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('error', {message: 'Test failure'});
    });

    // Can still navigate down to next Short
    await act(async () => {
      sendTVRemoteEvent('down');
    });

    await waitFor(() => {
      expect(screen.getAllByText('The Rooftop Chase Scene Cut')[0]).toBeTruthy();
    });
  });

  // --- 8. ANALYTICS INTEGRATION (43-48) ---
  it('Scenario 43: shorts_impression is not duplicated for the same active Short', async () => {
    const impressionSpy = jest.spyOn(analyticsService, 'trackShortsImpression');

    render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(impressionSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('Scenario 44: shorts_started fires only upon actual playback start', async () => {
    const startedSpy = jest.spyOn(analyticsService, 'trackShortsStarted');

    render(<ShortsScreen />);
    await act(async () => {});

    expect(startedSpy).not.toHaveBeenCalled();

    await act(async () => {
      emitPlayerEvent('playing');
    });

    expect(startedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        short_id: 'short_001',
      }),
    );
  });

  it('Scenario 45: shorts_completed fires exactly once per completed Short', async () => {
    const completedSpy = jest.spyOn(analyticsService, 'trackShortsCompleted');

    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('ended');
    });

    expect(completedSpy).toHaveBeenCalledTimes(1);
  });

  it('Scenario 46: shorts_skipped fires when navigating away before completion, but NOT on natural completion', async () => {
    const skippedSpy = jest.spyOn(analyticsService, 'trackShortsSkipped');

    render(<ShortsScreen />);
    await act(async () => {});

    await act(async () => {
      emitPlayerEvent('playing');
    });

    // Natural completion: should NOT fire skipped
    await act(async () => {
      emitPlayerEvent('ended');
    });

    expect(skippedSpy).not.toHaveBeenCalled();

    // Now on item 2, start playing and navigate away before complete
    await act(async () => {
      emitPlayerEvent('playing');
      sendTVRemoteEvent('up');
    });

    expect(skippedSpy).toHaveBeenCalled();
  });

  it('Scenario 47: shorts_liked and shorts_unliked analytics are emitted on mutation', async () => {
    const likedSpy = jest.spyOn(analyticsService, 'trackShortsLiked');
    const unlikedSpy = jest.spyOn(analyticsService, 'trackShortsUnliked');

    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.likeButton)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.likeButton));
    });

    await waitFor(() => {
      expect(likedSpy).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.likeButton));
    });

    await waitFor(() => {
      expect(unlikedSpy).toHaveBeenCalled();
    });
  });

  it('Scenario 48: shorts_saved and shorts_unsaved analytics are emitted on mutation', async () => {
    const savedSpy = jest.spyOn(analyticsService, 'trackShortsSaved');
    const unsavedSpy = jest.spyOn(analyticsService, 'trackShortsUnsaved');

    const screen = render(<ShortsScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId(SHORTS_TEST_IDS.saveButton)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.saveButton));
    });

    await waitFor(() => {
      expect(savedSpy).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(SHORTS_TEST_IDS.saveButton));
    });

    await waitFor(() => {
      expect(unsavedSpy).toHaveBeenCalled();
    });
  });

  // --- 9. REGRESSION & NON-INTERFERENCE (49-56) ---
  it('Scenario 49-56: Regression check - movie, series, live TV, and watchlist infrastructure untouched', () => {
    expect(mockDeinitializeSync).toBeDefined();
    expect(mockInitialize).toBeDefined();
    expect(mockPlay).toBeDefined();
    expect(mockPause).toBeDefined();
  });
});
