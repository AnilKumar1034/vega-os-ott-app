import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  applyPlaybackSpeed,
  calculateBackoffDelay,
  DEFAULT_PLAYBACK_SPEED,
  extractIntroInterval,
  extractRecapInterval,
  isPlaybackSpeedSupported,
  isPositionInInterval,
  isRecoverablePlaybackError,
  MAX_RECOVERY_ATTEMPTS,
  SUPPORTED_PLAYBACK_SPEEDS,
  validateInterval,
} from '../src/services/playerFeatureService';
import {
  getSavedSubtitleAppearancePreference,
  getSubtitleStyleForAppearance,
  saveSubtitleAppearancePreference,
} from '../src/services/subtitleService';
import {SkipIntervalPrompt} from '../src/components/molecules/SkipIntervalPrompt';
import {PlaybackSpeedModal} from '../src/components/molecules/PlaybackSpeedModal';
import {SubtitleOverlay} from '../src/components/molecules/SubtitleOverlay';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import {playbackSessionManager} from '../src/analytics';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();

let mockRouteParams: any = {
  params: {
    movieId: 'intro-recap-movie',
    movie: {
      id: 'intro-recap-movie',
      title: 'Intro & Recap Test Feature',
      videoUrl: 'https://example.com/video.mp4',
      intro: {start: 10, end: 30},
      recap: {start: 2, end: 8},
      duration: '3600',
    },
  },
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
    }),
    useRoute: () => mockRouteParams,
  };
});

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 3600;
    playbackRate = 1.0;
    captioning = false;
    audioTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    videoTracks = {
      length: 0,
      selectedIndex: 0,
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
    setPlaybackRate = jest.fn((rate: number) => {
      this.playbackRate = rate;
    });
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    eventListeners: Record<string, Function[]> = {};

    addEventListener = jest.fn((event: string, cb: Function) => {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(cb);
    });

    removeEventListener = jest.fn((event: string, cb: Function) => {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          (fn) => fn !== cb,
        );
      }
    });

    emit = (event: string, data?: any) => {
      const listeners = this.eventListeners[event] || [];
      listeners.forEach((fn) => fn(data));
    };

    getVideoPlaybackQuality = jest.fn().mockReturnValue({
      creationTime: 1000,
      droppedVideoFrames: 0,
      totalVideoFrames: 600,
    });
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
    Video: MockVideoPlayer,
    KeplerVideoView: KeplerVideoSurfaceView,
    KeplerVideoSurfaceView,
  };
});

describe('Advanced Player Experience Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    playbackSessionManager.__resetForTesting();
    mockRouteParams = {
      params: {
        movieId: 'intro-recap-movie',
        movie: {
          id: 'intro-recap-movie',
          title: 'Intro & Recap Test Feature',
          videoUrl: 'https://example.com/video.mp4',
          intro: {start: 10, end: 30},
          recap: {start: 2, end: 8},
          duration: '3600',
        },
      },
    };
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'test-user-1', email: 'test@example.com'} as any,
      userProfile: {id: 'test-user-1', email: 'test@example.com'} as any,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: {
        id: 'prof-adult-1',
        name: 'Alex Adult',
        isKids: false,
        avatarId: 'avatar-1',
      } as any,
      profiles: [],
      isLoadingProfiles: false,
      error: null,
      isParentAuthorized: true,
      parentalSettings: null,
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      setActiveProfile: jest.fn(),
      switchProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      refreshParentalSettings: jest.fn(),
      verifyParentPin: jest.fn(),
      setParentPin: jest.fn(),
      removeParentPin: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      clearActiveProfile: jest.fn(),
    });
  });

  // ==========================================
  // 1. SKIP INTRO & SKIP RECAP UNIT & COMPONENT TESTS
  // ==========================================
  describe('Skip Intro and Skip Recap feature', () => {
    it('validates intervals correctly', () => {
      expect(validateInterval({start: 10, end: 30})).toEqual({start: 10, end: 30});
      expect(validateInterval({start: 0, end: 15})).toEqual({start: 0, end: 15});
      expect(validateInterval(null)).toBeNull();
      expect(validateInterval(undefined)).toBeNull();
      expect(validateInterval({start: -5, end: 10})).toBeNull();
      expect(validateInterval({start: 30, end: 10})).toBeNull(); // reversed
      expect(validateInterval({start: 20, end: 20})).toBeNull(); // zero duration
      expect(validateInterval({start: NaN, end: 30})).toBeNull();
      expect(validateInterval({start: 0, end: Infinity})).toBeNull();
    });

    it('determines if playback position is in interval', () => {
      const interval = {start: 10, end: 30};
      expect(isPositionInInterval(5, interval)).toBe(false);
      expect(isPositionInInterval(10, interval)).toBe(true);
      expect(isPositionInInterval(20.5, interval)).toBe(true);
      expect(isPositionInInterval(29.9, interval)).toBe(true);
      expect(isPositionInInterval(30, interval)).toBe(false);
      expect(isPositionInInterval(35, interval)).toBe(false);
      expect(isPositionInInterval(-1, interval)).toBe(false);
      expect(isPositionInInterval(15, null)).toBe(false);
    });

    it('extracts intro interval from diverse content metadata models', () => {
      // 1. Nested object
      expect(extractIntroInterval({intro: {start: 15, end: 45}})).toEqual({start: 15, end: 45});
      // 2. Separate start/end fields
      expect(extractIntroInterval({introStart: 12, introEnd: 40})).toEqual({start: 12, end: 40});
      // 3. Markers array
      expect(
        extractIntroInterval({
          markers: [
            {type: 'intro', start: 5, end: 25},
            {type: 'ad', start: 100, end: 120},
          ],
        }),
      ).toEqual({start: 5, end: 25});
      // 4. Content without intro
      expect(extractIntroInterval({})).toBeNull();
      expect(extractIntroInterval(null)).toBeNull();
    });

    it('extracts recap interval from diverse content metadata models', () => {
      // 1. Nested object
      expect(extractRecapInterval({recap: {start: 0, end: 30}})).toEqual({start: 0, end: 30});
      // 2. Separate start/end fields
      expect(extractRecapInterval({recapStart: 5, recapEnd: 25})).toEqual({start: 5, end: 25});
      // 3. Markers array
      expect(
        extractRecapInterval({
          markers: [
            {type: 'recap', start: 0, end: 20},
            {type: 'intro', start: 25, end: 55},
          ],
        }),
      ).toEqual({start: 0, end: 20});
      // 4. Content without recap
      expect(extractRecapInterval({})).toBeNull();
    });

    it('renders SkipIntervalPrompt for intro and handles skip press', () => {
      const mockOnSkip = jest.fn();
      const mockOnInteraction = jest.fn();

      const screen = render(
        <SkipIntervalPrompt
          isVisible={true}
          type="intro"
          targetPosition={35}
          onSkip={mockOnSkip}
          onInteraction={mockOnInteraction}
        />,
      );

      const promptButton = screen.getByTestId('player-skip-interval-prompt');
      expect(promptButton).toBeTruthy();
      expect(screen.getByTestId('skip-intro-prompt')).toBeTruthy();
      expect(screen.getByText('Skip Intro')).toBeTruthy();

      fireEvent.press(promptButton);
      expect(mockOnInteraction).toHaveBeenCalled();
      expect(mockOnSkip).toHaveBeenCalledWith(35);
    });

    it('renders SkipIntervalPrompt for recap and handles focus & press', () => {
      const mockOnSkip = jest.fn();

      const screen = render(
        <SkipIntervalPrompt
          isVisible={true}
          type="recap"
          targetPosition={20}
          onSkip={mockOnSkip}
        />,
      );

      expect(screen.getByTestId('skip-recap-prompt')).toBeTruthy();
      expect(screen.getByText('Skip Recap')).toBeTruthy();

      fireEvent(screen.getByTestId('player-skip-interval-prompt'), 'focus');
      fireEvent.press(screen.getByTestId('player-skip-interval-prompt'));
      expect(mockOnSkip).toHaveBeenCalledWith(20);
    });

    it('does NOT render SkipIntervalPrompt when isVisible is false', () => {
      const screen = render(
        <SkipIntervalPrompt
          isVisible={false}
          type="intro"
          targetPosition={30}
          onSkip={jest.fn()}
        />,
      );

      expect(screen.queryByTestId('player-skip-interval-prompt')).toBeNull();
    });
  });

  // ==========================================
  // 2. PLAYBACK SPEED UNIT & COMPONENT TESTS
  // ==========================================
  describe('Playback Speed feature', () => {
    it('verifies supported playback speeds', () => {
      expect(SUPPORTED_PLAYBACK_SPEEDS).toEqual([0.5, 0.75, 1.0, 1.25, 1.5, 2.0]);
      expect(DEFAULT_PLAYBACK_SPEED).toBe(1.0);
    });

    it('detects if player supports playback speed', () => {
      const playerWithProp = {playbackRate: 1.0};
      expect(isPlaybackSpeedSupported(playerWithProp)).toBe(true);

      const playerWithMethod = {setPlaybackRate: jest.fn()};
      expect(isPlaybackSpeedSupported(playerWithMethod)).toBe(true);

      const playerWithShakaController = {playRateController: {set: jest.fn()}};
      expect(isPlaybackSpeedSupported(playerWithShakaController)).toBe(true);

      expect(isPlaybackSpeedSupported(null)).toBe(false);
      expect(isPlaybackSpeedSupported(undefined)).toBe(false);
    });

    it('applies supported playback rate to player and Shaka', () => {
      const mockPlayer = {playbackRate: 1.0, setPlaybackRate: jest.fn()};
      const mockShaka = {trickPlay: jest.fn()};

      const applied = applyPlaybackSpeed(mockPlayer, 1.5, mockShaka);
      expect(applied).toBe(true);
      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(1.5);
      expect(mockShaka.trickPlay).toHaveBeenCalledWith(1.5);
    });

    it('rejects unsupported playback speed rates', () => {
      const mockPlayer = {playbackRate: 1.0};
      expect(applyPlaybackSpeed(mockPlayer, 3.5 as any)).toBe(false);
      expect(applyPlaybackSpeed(mockPlayer, -1 as any)).toBe(false);
      expect(mockPlayer.playbackRate).toBe(1.0);
    });

    it('renders PlaybackSpeedModal and allows selecting rate', () => {
      const mockSelectSpeed = jest.fn();
      const mockClose = jest.fn();

      const screen = render(
        <PlaybackSpeedModal
          isOpen={true}
          currentSpeed={1.0}
          onSelectSpeed={mockSelectSpeed}
          onClose={mockClose}
        />,
      );

      expect(screen.getByTestId('playback-speed-modal')).toBeTruthy();
      expect(screen.getByText('Playback Speed')).toBeTruthy();
      expect(screen.getByTestId('speed-option-1.5')).toBeTruthy();

      fireEvent.press(screen.getByTestId('speed-option-1.5'));
      expect(mockSelectSpeed).toHaveBeenCalledWith(1.5);

      fireEvent.press(screen.getByTestId('speed-modal-close-button'));
      expect(mockClose).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. SUBTITLE APPEARANCE TESTS
  // ==========================================
  describe('Subtitle Appearance feature', () => {
    it('returns custom styling for font size and contrast presets', () => {
      const standardMed = getSubtitleStyleForAppearance({fontSize: 'medium', contrast: 'standard'});
      expect(standardMed.fontSize).toBe(12);
      expect(standardMed.backgroundColor).toBe('rgba(0, 0, 0, 0.82)');

      const smallHigh = getSubtitleStyleForAppearance({fontSize: 'small', contrast: 'high'});
      expect(smallHigh.fontSize).toBe(10);
      expect(smallHigh.backgroundColor).toBe('#000000');
      expect(smallHigh.borderColor).toBe('#FFFF00');
      expect(smallHigh.textColor).toBe('#FFFF00');

      const largeTrans = getSubtitleStyleForAppearance({fontSize: 'large', contrast: 'translucent'});
      expect(largeTrans.fontSize).toBe(15);
      expect(largeTrans.backgroundColor).toBe('rgba(0, 0, 0, 0.50)');
    });

    it('renders SubtitleOverlay with custom appearance options', () => {
      const screen = render(
        <SubtitleOverlay
          currentCueText="This is a test subtitle cue"
          isControlsVisible={false}
          appearance={{fontSize: 'large', contrast: 'high'}}
        />,
      );

      expect(screen.getByTestId('player-subtitles-overlay')).toBeTruthy();
      const textElem = screen.getByTestId('player-subtitle-text');
      expect(textElem.props.children).toBe('This is a test subtitle cue');
      expect(textElem.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({fontSize: 15, color: '#FFFF00'})]),
      );
    });

    it('saves and loads subtitle appearance preferences', async () => {
      await saveSubtitleAppearancePreference('prof-1', {fontSize: 'large', contrast: 'high'});
      const loaded = await getSavedSubtitleAppearancePreference('prof-1');
      expect(loaded).toEqual({fontSize: 'large', contrast: 'high'});
    });
  });

  // ==========================================
  // 4. PLAYBACK ERROR RECOVERY TESTS
  // ==========================================
  describe('Playback Error Recovery feature', () => {
    it('distinguishes recoverable errors from fatal errors', () => {
      // Recoverable
      expect(isRecoverablePlaybackError({message: 'Network request timed out'})).toBe(true);
      expect(isRecoverablePlaybackError({message: 'Failed to fetch chunk'})).toBe(true);
      expect(isRecoverablePlaybackError({code: 'MEDIA_ERR_NETWORK'})).toBe(true);
      expect(isRecoverablePlaybackError({category: 1})).toBe(true); // Shaka network

      // Fatal (DRM / Entitlement / PIN)
      expect(isRecoverablePlaybackError({message: 'Widevine DRM license request failed'})).toBe(false);
      expect(isRecoverablePlaybackError({message: 'HDCP output restricted'})).toBe(false);
      expect(isRecoverablePlaybackError({message: 'User is not entitled to this content'})).toBe(false);
      expect(isRecoverablePlaybackError({message: 'Parental controls PIN blocked'})).toBe(false);
      expect(isRecoverablePlaybackError({category: 6})).toBe(false); // Shaka DRM
    });

    it('calculates exponential backoff delay within boundaries', () => {
      expect(calculateBackoffDelay(1)).toBe(1000);
      expect(calculateBackoffDelay(2)).toBe(2000);
      expect(calculateBackoffDelay(3)).toBe(4000);
      expect(calculateBackoffDelay(4)).toBe(4000); // capped at MAX_RECOVERY_DELAY_MS
    });

    it('verifies max recovery attempts limit', () => {
      expect(MAX_RECOVERY_ATTEMPTS).toBe(3);
    });
  });

  // ==========================================
  // 5. VIDEO PLAYER SCREEN INTEGRATION TESTS
  // ==========================================
  describe('VideoPlayerScreen Advanced Player Integration', () => {
    it('renders Playback Speed button in top header for VOD content and opens modal', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-speed-button')).toBeTruthy();
        expect(screen.getByText('Speed: 1x')).toBeTruthy();
      });

      // Press speed button to open modal
      fireEvent.press(screen.getByTestId('player-speed-button'));

      await waitFor(() => {
        expect(screen.getByTestId('playback-speed-modal')).toBeTruthy();
      });

      // Select 1.5x
      const speed15 = screen.getByTestId('speed-option-1.5');
      fireEvent.press(speed15);

      await waitFor(() => {
        expect(screen.queryByTestId('playback-speed-modal')).toBeNull();
        expect(screen.getByText('Speed: 1.5x')).toBeTruthy();
      });
    });

    it('does NOT render Playback Speed button for Live TV content', async () => {
      mockRouteParams = {
        params: {
          movieId: 'channel-live-news',
          isLive: true,
          channel: {id: 'channel-live-news', title: 'Live News 24/7'},
        },
      };

      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.queryByTestId('player-speed-button')).toBeNull();
      });
    });

    it('records skip_intro_selected and skip_recap_selected in playbackSessionManager', async () => {
      await playbackSessionManager.startSession({
        contentId: 'intro-movie',
        contentTitle: 'Intro Movie',
        contentType: 'movie',
      });

      const recordIntroSpy = jest.spyOn(playbackSessionManager, 'recordSkipIntroSelected');
      const recordRecapSpy = jest.spyOn(playbackSessionManager, 'recordSkipRecapSelected');

      await playbackSessionManager.recordSkipIntroSelected({
        position: 12,
        targetPosition: 30,
        introStart: 10,
        introEnd: 30,
      });

      expect(recordIntroSpy).toHaveBeenCalledWith({
        position: 12,
        targetPosition: 30,
        introStart: 10,
        introEnd: 30,
      });

      await playbackSessionManager.recordSkipRecapSelected({
        position: 4,
        targetPosition: 8,
        recapStart: 2,
        recapEnd: 8,
      });

      expect(recordRecapSpy).toHaveBeenCalledWith({
        position: 4,
        targetPosition: 8,
        recapStart: 2,
        recapEnd: 8,
      });
    });

    it('records playback recovery lifecycle telemetry in playbackSessionManager', async () => {
      await playbackSessionManager.startSession({
        contentId: 'rec-movie',
        contentTitle: 'Recovery Movie',
        contentType: 'movie',
      });

      const startSpy = jest.spyOn(playbackSessionManager, 'recordPlaybackRecoveryStarted');
      const succSpy = jest.spyOn(playbackSessionManager, 'recordPlaybackRecoverySucceeded');
      const failSpy = jest.spyOn(playbackSessionManager, 'recordPlaybackRecoveryFailed');

      await playbackSessionManager.recordPlaybackRecoveryStarted({
        attempt: 1,
        maxAttempts: 3,
        position: 120,
        error: 'Network connection timeout',
      });
      expect(startSpy).toHaveBeenCalledWith({
        attempt: 1,
        maxAttempts: 3,
        position: 120,
        error: 'Network connection timeout',
      });

      await playbackSessionManager.recordPlaybackRecoverySucceeded({
        attempt: 1,
        position: 120,
      });
      expect(succSpy).toHaveBeenCalledWith({
        attempt: 1,
        position: 120,
      });

      await playbackSessionManager.recordPlaybackRecoveryFailed({
        attempts: 3,
        error: 'Retries exhausted',
        isFatal: true,
      });
      expect(failSpy).toHaveBeenCalledWith({
        attempts: 3,
        error: 'Retries exhausted',
        isFatal: true,
      });
    });

    it('records next episode telemetry events in playbackSessionManager', async () => {
      await playbackSessionManager.startSession({
        contentId: 'series-ep-1',
        contentTitle: 'Episode 1',
        contentType: 'episode',
      });

      const impressionSpy = jest.spyOn(playbackSessionManager, 'recordNextEpisodeImpression');
      const selectedSpy = jest.spyOn(playbackSessionManager, 'recordNextEpisodeSelected');
      const autoplaySpy = jest.spyOn(playbackSessionManager, 'recordAutoplayStarted');

      await playbackSessionManager.recordNextEpisodeImpression({
        nextEpisodeId: 'series-ep-2',
        countdownSeconds: 60,
        isAutoplay: true,
      });
      expect(impressionSpy).toHaveBeenCalled();

      await playbackSessionManager.recordNextEpisodeSelected({
        nextEpisodeId: 'series-ep-2',
        selectionType: 'play_now',
      });
      expect(selectedSpy).toHaveBeenCalled();

      await playbackSessionManager.recordAutoplayStarted({
        nextEpisodeId: 'series-ep-2',
        seriesId: 'series-1',
      });
      expect(autoplaySpy).toHaveBeenCalled();
    });

    it('records audio_preference_applied and subtitle_preference_applied', async () => {
      await playbackSessionManager.startSession({
        contentId: 'pref-movie',
        contentTitle: 'Pref Movie',
        contentType: 'movie',
      });

      const audioPrefSpy = jest.spyOn(playbackSessionManager, 'recordAudioPreferenceApplied');
      const subPrefSpy = jest.spyOn(playbackSessionManager, 'recordSubtitlePreferenceApplied');

      await playbackSessionManager.recordAudioPreferenceApplied({
        trackId: 'audio-es',
        language: 'es',
      });
      expect(audioPrefSpy).toHaveBeenCalledWith({
        trackId: 'audio-es',
        language: 'es',
      });

      await playbackSessionManager.recordSubtitlePreferenceApplied({
        trackId: 'sub-es',
        language: 'es',
        isOff: false,
      });
      expect(subPrefSpy).toHaveBeenCalledWith({
        trackId: 'sub-es',
        language: 'es',
        isOff: false,
      });
    });
  });
});
