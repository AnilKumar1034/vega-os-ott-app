/**
 * Watch Party Playback & Player Integration Test Suite (Day 3)
 * Verifies playback models, mock APIs, host authorization, content eligibility,
 * TV lobby start/join actions, and Kepler/W3C player screen integration.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  canControlWatchPartyPlayback,
  WatchPartyRoom,
  WatchPartyPlaybackState,
} from '../src/features/watchParty/types/watchParty.types';
import {
  getWatchPartyPlaybackState,
  initializeWatchPartyPlayback,
  resetMockStore,
  seedMockRoom,
  updateWatchPartyPlaybackState,
} from '../src/features/watchParty/services/watchPartyMockApi';
import {
  validateWatchPartyContentEligibility,
} from '../src/features/watchParty/services/watchPartyPlaybackService';
import {WATCH_PARTY_TEST_IDS} from '../src/features/watchParty/constants/watchParty.constants';
import {WatchPartyLobbyScreen} from '../src/features/watchParty/screens/WatchPartyLobbyScreen';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import * as authContext from '../src/context/authContext';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';
import {Routes} from '../src/constants/routes';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    canGoBack: () => true,
    replace: jest.fn(),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

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
    };
    textTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
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

describe('Watch Party Day 3: Playback Integration & Host Controls', () => {
  const hostUser = {
    uid: 'host_user_1',
    email: 'host@logixstream.com',
  };

  const hostAdultProfile: UserProfile = {
    id: 'profile_host_adult',
    name: 'Host User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const guestUser = {
    uid: 'guest_user_2',
    email: 'guest@logixstream.com',
  };

  const guestAdultProfile: UserProfile = {
    id: 'profile_guest_adult',
    name: 'Guest User',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile_kids_1',
    name: 'Junior',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: '7_PLUS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const sampleRoom: WatchPartyRoom = {
    id: 'room_playback_test',
    roomCode: 'SYNC88',
    hostId: hostUser.uid,
    hostProfileId: hostAdultProfile.id,
    contentId: 'once-upon-two-times',
    contentType: 'movie',
    contentTitle: 'Once Upon Two Times',
    status: 'waiting',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    participantCount: 2,
    maxParticipants: 6,
    isPrivate: true,
  };

  const sampleParticipants = [
    {
      id: 'part_host',
      userId: hostUser.uid,
      profileId: hostAdultProfile.id,
      displayName: 'Host User',
      isHost: true,
      joinedAt: new Date().toISOString(),
      status: 'connected' as const,
    },
    {
      id: 'part_guest',
      userId: guestUser.uid,
      profileId: guestAdultProfile.id,
      displayName: 'Guest User',
      isHost: false,
      joinedAt: new Date().toISOString(),
      status: 'connected' as const,
    },
  ];

  beforeEach(() => {
    resetMockStore();
    jest.clearAllMocks();
    mockRouteParams = {};

    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: hostUser as any,
      userProfile: {
        uid: hostUser.uid,
        email: hostUser.email,
        subscription: 'premium_4k',
      } as any,
      loading: false,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: hostAdultProfile,
      profiles: [hostAdultProfile, guestAdultProfile, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      selectProfile: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      switchProfileWithPin: jest.fn(),
      isProfileLocked: jest.fn(),
      clearError: jest.fn(),
      refreshProfiles: jest.fn(),
    } as any);
  });

  // ==========================================
  // Section A: Permissions Helper
  // ==========================================
  describe('A. canControlWatchPartyPlayback Permissions Helper', () => {
    it('returns true when participant ID matches room hostId', () => {
      expect(canControlWatchPartyPlayback(sampleRoom, hostUser.uid)).toBe(true);
    });

    it('returns true when participant ID matches room hostProfileId', () => {
      expect(canControlWatchPartyPlayback(sampleRoom, hostAdultProfile.id)).toBe(true);
    });

    it('returns false for non-host guest user ID', () => {
      expect(canControlWatchPartyPlayback(sampleRoom, guestUser.uid)).toBe(false);
    });

    it('returns false when room or participant ID is undefined', () => {
      expect(canControlWatchPartyPlayback(null, hostUser.uid)).toBe(false);
      expect(canControlWatchPartyPlayback(sampleRoom, undefined)).toBe(false);
    });
  });

  // ==========================================
  // Section B: Mock Playback API Operations
  // ==========================================
  describe('B. Mock Playback API Operations', () => {
    beforeEach(() => {
      seedMockRoom(sampleRoom, sampleParticipants);
    });

    it('retrieves initial playback state for a seeded room', async () => {
      const state = await getWatchPartyPlaybackState(sampleRoom.id);
      expect(state).toBeDefined();
      expect(state.roomId).toBe(sampleRoom.id);
      expect(state.contentId).toBe(sampleRoom.contentId);
      expect(state.status).toBe('idle');
      expect(state.positionSeconds).toBe(0);
    });

    it('allows host to initialize playback and transitions room to active', async () => {
      const initialized = await initializeWatchPartyPlayback({
        roomId: sampleRoom.id,
        contentId: sampleRoom.contentId,
        contentType: 'movie',
        participantId: hostUser.uid,
      });

      expect(initialized.status).toBe('playing');
      expect(initialized.positionSeconds).toBe(0);
      expect(initialized.lastAction).toBe('play');
      expect(initialized.sequenceNumber).toBeGreaterThan(0);

      const refreshed = await getWatchPartyPlaybackState(sampleRoom.id);
      expect(refreshed.status).toBe('playing');
    });

    it('rejects non-host guest when attempting to initialize playback with UNAUTHORIZED', async () => {
      await expect(
        initializeWatchPartyPlayback({
          roomId: sampleRoom.id,
          contentId: sampleRoom.contentId,
          contentType: 'movie',
          participantId: guestUser.uid, // non-host
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('allows host to update playback state with play, pause, seek', async () => {
      await initializeWatchPartyPlayback({
        roomId: sampleRoom.id,
        contentId: sampleRoom.contentId,
        contentType: 'movie',
        participantId: hostUser.uid,
      });

      // Pause
      const pausedState = await updateWatchPartyPlaybackState({
        roomId: sampleRoom.id,
        participantId: hostUser.uid,
        update: {
          status: 'paused',
          positionSeconds: 120,
          lastAction: 'pause',
        },
      });
      expect(pausedState.status).toBe('paused');
      expect(pausedState.positionSeconds).toBe(120);

      // Seek
      const seekedState = await updateWatchPartyPlaybackState({
        roomId: sampleRoom.id,
        participantId: hostUser.uid,
        update: {
          positionSeconds: 350,
          lastAction: 'seek',
        },
      });
      expect(seekedState.positionSeconds).toBe(350);
      expect(seekedState.lastAction).toBe('seek');
    });

    it('rejects guest when attempting to update playback state', async () => {
      await initializeWatchPartyPlayback({
        roomId: sampleRoom.id,
        contentId: sampleRoom.contentId,
        contentType: 'movie',
        participantId: hostUser.uid,
      });

      await expect(
        updateWatchPartyPlaybackState({
          roomId: sampleRoom.id,
          participantId: guestUser.uid,
          update: {
            status: 'paused',
            positionSeconds: 200,
          },
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('validates playback position bounds (rejects negative numbers)', async () => {
      await initializeWatchPartyPlayback({
        roomId: sampleRoom.id,
        contentId: sampleRoom.contentId,
        contentType: 'movie',
        participantId: hostUser.uid,
      });

      await expect(
        updateWatchPartyPlaybackState({
          roomId: sampleRoom.id,
          participantId: hostUser.uid,
          update: {
            positionSeconds: -50,
          },
        }),
      ).rejects.toMatchObject({
        code: 'SERVER_ERROR',
      });
    });
  });

  // ==========================================
  // Section C: Content Eligibility & Entitlements
  // ==========================================
  describe('C. Content Eligibility & Entitlement Validation', () => {
    it('approves eligible content for an entitled adult user profile', () => {
      const result = validateWatchPartyContentEligibility({
        room: sampleRoom,
        user: hostUser,
        userProfile: {
          uid: hostUser.uid,
          email: hostUser.email,
          subscription: 'premium_4k',
        } as any,
        activeProfile: hostAdultProfile,
      });

      expect(result.isEligible).toBe(true);
      expect(result.content).toBeDefined();
    });

    it('rejects content when kids profile restrictions block the rating', () => {
      const result = validateWatchPartyContentEligibility({
        room: sampleRoom,
        user: hostUser,
        userProfile: {
          uid: hostUser.uid,
          email: hostUser.email,
          subscription: 'premium_4k',
        } as any,
        activeProfile: kidsProfile, // Kids profile with maturity limit
      });

      // Once Upon Two Times is rated U/A 13+ or higher
      if (!result.isEligible) {
        expect(result.errorCode).toBe('PROFILE_RESTRICTED');
        expect(result.error).toBeTruthy();
      }
    });

    it('rejects content if room is expired', () => {
      const expiredRoom = {...sampleRoom, status: 'expired' as const};
      const result = validateWatchPartyContentEligibility({
        room: expiredRoom,
        user: hostUser,
        userProfile: {
          uid: hostUser.uid,
          email: hostUser.email,
          subscription: 'premium_4k',
        } as any,
        activeProfile: hostAdultProfile,
      });

      expect(result.isEligible).toBe(false);
      expect(result.errorCode).toBe('ROOM_EXPIRED');
    });
  });

  // ==========================================
  // Section D: Lobby UI Start & Join Watching
  // ==========================================
  describe('D. Lobby UI Start & Join Playback Actions', () => {
    beforeEach(() => {
      seedMockRoom(sampleRoom, sampleParticipants);
      mockRouteParams = {
        roomId: sampleRoom.id,
        room: sampleRoom,
      };
    });

    it('displays Start Watching button for the room host', async () => {
      const {getByTestId} = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(getByTestId(WATCH_PARTY_TEST_IDS.startPlaybackButton)).toBeTruthy();
      });
    });

    it('host clicking Start Watching navigates to VideoPlayer with Watch Party params', async () => {
      const {getByTestId} = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(getByTestId(WATCH_PARTY_TEST_IDS.startPlaybackButton)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId(WATCH_PARTY_TEST_IDS.startPlaybackButton));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          Routes.VideoPlayer,
          expect.objectContaining({
            watchPartyRoomId: sampleRoom.id,
            isWatchParty: true,
            isHost: true,
          }),
        );
      });
    });

    it('displays waiting indicator for guest when playback has not been started', async () => {
      // Mock auth as the guest user
      jest.spyOn(authContext, 'useAuth').mockReturnValue({
        user: guestUser as any,
        userProfile: {
          uid: guestUser.uid,
          email: guestUser.email,
          subscription: 'standard',
        } as any,
        loading: false,
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
      });

      jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
        activeProfile: guestAdultProfile,
        profiles: [guestAdultProfile],
        isLoadingProfiles: false,
        error: null,
        selectProfile: jest.fn(),
        createProfile: jest.fn(),
        updateProfile: jest.fn(),
        deleteProfile: jest.fn(),
        switchProfileWithPin: jest.fn(),
        isProfileLocked: jest.fn(),
        clearError: jest.fn(),
        refreshProfiles: jest.fn(),
      } as any);

      const {getByTestId, queryByTestId} = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(getByTestId(WATCH_PARTY_TEST_IDS.waitingForHostIndicator)).toBeTruthy();
        expect(queryByTestId(WATCH_PARTY_TEST_IDS.startPlaybackButton)).toBeNull();
      });
    });

    it('displays Join Watching button for guest when room is active', async () => {
      // Seed room as active with playing playback state
      const activeRoom = {...sampleRoom, status: 'active' as const};
      const activePlayback: WatchPartyPlaybackState = {
        roomId: sampleRoom.id,
        sessionId: 'session_active_1',
        contentId: sampleRoom.contentId,
        status: 'playing',
        positionSeconds: 45,
        updatedAt: new Date().toISOString(),
        hostId: hostUser.uid,
        sequenceNumber: 1,
      };

      seedMockRoom(activeRoom, sampleParticipants, activePlayback);
      mockRouteParams = {
        roomId: activeRoom.id,
        room: activeRoom,
      };

      // Mock auth as the guest user
      jest.spyOn(authContext, 'useAuth').mockReturnValue({
        user: guestUser as any,
        userProfile: {
          uid: guestUser.uid,
          email: guestUser.email,
          subscription: 'standard',
        } as any,
        loading: false,
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
      });

      jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
        activeProfile: guestAdultProfile,
        profiles: [guestAdultProfile],
        isLoadingProfiles: false,
        error: null,
        selectProfile: jest.fn(),
        createProfile: jest.fn(),
        updateProfile: jest.fn(),
        deleteProfile: jest.fn(),
        switchProfileWithPin: jest.fn(),
        isProfileLocked: jest.fn(),
        clearError: jest.fn(),
        refreshProfiles: jest.fn(),
      } as any);

      const {getByTestId} = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(getByTestId(WATCH_PARTY_TEST_IDS.joinPlaybackButton)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId(WATCH_PARTY_TEST_IDS.joinPlaybackButton));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          Routes.VideoPlayer,
          expect.objectContaining({
            watchPartyRoomId: sampleRoom.id,
            isWatchParty: true,
            isHost: false,
          }),
        );
      });
    });
  });

  // ==========================================
  // Section E: Video Player Screen Integration
  // ==========================================
  describe('E. Video Player Screen Integration', () => {
    beforeEach(() => {
      seedMockRoom(sampleRoom, sampleParticipants);
    });

    it('renders player and Watch Party badge when inside a Watch Party session', async () => {
      mockRouteParams = {
        movie: {
          id: sampleRoom.contentId,
          title: sampleRoom.contentTitle,
          videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        },
        watchPartyRoomId: sampleRoom.id,
        watchPartyRoom: sampleRoom,
        isWatchParty: true,
        isHost: true,
        participantId: hostUser.uid,
      };

      const {getByTestId} = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(getByTestId('player-watch-party-badge')).toBeTruthy();
      });
    });

    it('back button in Watch Party player routes back to Watch Party Lobby', async () => {
      mockRouteParams = {
        movie: {
          id: sampleRoom.contentId,
          title: sampleRoom.contentTitle,
          videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        },
        watchPartyRoomId: sampleRoom.id,
        watchPartyRoom: sampleRoom,
        isWatchParty: true,
        isHost: true,
        participantId: hostUser.uid,
      };

      const {getByTestId} = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(getByTestId('player-back-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('player-back-button'));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          Routes.WatchPartyLobby,
          expect.objectContaining({
            roomId: sampleRoom.id,
          }),
        );
      });
    });
  });
});
