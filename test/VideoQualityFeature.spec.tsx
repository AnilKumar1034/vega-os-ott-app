import {AppState} from 'react-native';
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  findMatchingQuality,
  getSavedQualityPreference,
  saveQualityPreference,
  clearQualityPrefCache,
} from '../src/services/videoQualityService';
import {
  getVideoQualitiesForContent,
  extractQualitiesFromShakaVariants,
  STANDARD_VIDEO_QUALITIES,
} from '../src/data/videoQualities';
import {AUTO_QUALITY_ID} from '../src/types/videoQuality';
import {VideoQualityModal} from '../src/components/molecules/VideoQualityModal';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockDeinitializeSync = jest.fn();

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
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = mockDeinitializeSync;
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
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
    KeplerVideoSurfaceView,
    KeplerVideoView: KeplerVideoSurfaceView,
    Video: KeplerVideoSurfaceView,
  };
});

let mockRouteParams: any = {
  params: {
    movie: {
      id: 'kalki',
      title: 'Kalki 2898 AD',
      genre: 'Sci-Fi',
    },
  },
};

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: jest.fn(),
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

describe('Video Quality Selection Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearQualityPrefCache();
  });

  describe('videoQualityService unit tests', () => {
    it('saves and retrieves video quality preference per profile', async () => {
      await saveQualityPreference('profile-quality-1', 'quality-1080p');
      const retrieved = await getSavedQualityPreference('profile-quality-1');
      expect(retrieved).toBe('quality-1080p');
    });

    it('matches quality option by exact ID', () => {
      const option = findMatchingQuality(
        STANDARD_VIDEO_QUALITIES,
        'quality-720p',
      );
      expect(option?.id).toBe('quality-720p');
      expect(option?.height).toBe(720);
    });

    it('matches quality option by height number or resolution text', () => {
      const option1080 = findMatchingQuality(STANDARD_VIDEO_QUALITIES, '1080');
      expect(option1080?.id).toBe('quality-1080p');

      const option4k = findMatchingQuality(STANDARD_VIDEO_QUALITIES, 2160);
      expect(option4k?.id).toBe('quality-2160p');
    });

    it('falls back to Auto when given null, empty or invalid ID', () => {
      const fallback = findMatchingQuality(
        STANDARD_VIDEO_QUALITIES,
        'non-existent-quality',
      );
      expect(fallback?.id).toBe(AUTO_QUALITY_ID);
    });
  });

  describe('data/videoQualities resolution tests', () => {
    it('returns all standard quality tiers including 4K UHD, 1080p, 720p, 480p, and 360p', () => {
      const qualities = getVideoQualitiesForContent(
        'kalki',
        'Kalki 2898 AD',
        'https://example.com/video.mp4',
        false,
        true,
      );

      expect(qualities.length).toBeGreaterThanOrEqual(5);
      expect(qualities.some((q) => q.id === AUTO_QUALITY_ID)).toBe(true);
      expect(qualities.some((q) => q.id === 'quality-2160p')).toBe(true);
      expect(qualities.some((q) => q.id === 'quality-1080p')).toBe(true);
      expect(qualities.some((q) => q.id === 'quality-720p')).toBe(true);
      expect(qualities.some((q) => q.id === 'quality-480p')).toBe(true);
      expect(qualities.some((q) => q.id === 'quality-360p')).toBe(true);
    });

    it('excludes 4K quality when has4KSupport is false', () => {
      const qualities = getVideoQualitiesForContent(
        'sample',
        'Sample',
        'https://example.com/video.mp4',
        false,
        false,
      );
      expect(qualities.some((q) => q.id === 'quality-2160p')).toBe(false);
      expect(qualities.some((q) => q.id === 'quality-1080p')).toBe(true);
    });

    it('returns dynamic live stream quality options for live TV', () => {
      const liveQualities = getVideoQualitiesForContent(
        'live-channel',
        'Live News',
        'https://example.com/live.m3u8',
        true,
      );
      expect(liveQualities[0].id).toBe(AUTO_QUALITY_ID);
      expect(liveQualities[0].badge).toBe('LIVE ABR');
      expect(liveQualities.some((q) => q.id === 'quality-1080p')).toBe(true);
    });

    it('extracts and sorts quality tiers from Shaka variant tracks', () => {
      const variants = [
        {id: 1, width: 640, height: 360, bandwidth: 600000},
        {id: 2, width: 1920, height: 1080, bandwidth: 5000000},
        {id: 3, width: 1280, height: 720, bandwidth: 2500000},
        {id: 4, width: 3840, height: 2160, bandwidth: 15000000},
      ];

      const extracted = extractQualitiesFromShakaVariants(variants);
      expect(extracted[0].id).toBe(AUTO_QUALITY_ID);
      expect(extracted[1].height).toBe(2160);
      expect(extracted[2].height).toBe(1080);
      expect(extracted[3].height).toBe(720);
      expect(extracted[4].height).toBe(360);
      expect(extracted[1].badge).toBe('4K UHD');
    });

    it('extracts all 5 multi-quality tiers from Axinom multi-bitrate mock stream representations', () => {
      // Mock representations mirroring https://media.axprod.net/TestVectors/v7-Clear/Manifest_1080p.mpd
      const axinomVariants = [
        {id: 1, width: 512, height: 288, bandwidth: 386437, videoCodec: 'avc1.64001f'},
        {id: 2, width: 640, height: 360, bandwidth: 761570, videoCodec: 'avc1.64001f'},
        {id: 3, width: 852, height: 480, bandwidth: 1117074, videoCodec: 'avc1.640028'},
        {id: 4, width: 1280, height: 720, bandwidth: 1941893, videoCodec: 'avc1.640032'},
        {id: 5, width: 1920, height: 1080, bandwidth: 2723012, videoCodec: 'avc1.640033'},
        // Alternative HEVC tracks for same heights
        {id: 8, width: 512, height: 288, bandwidth: 395735, videoCodec: 'hev1.2.4.L63.90'},
        {id: 9, width: 640, height: 360, bandwidth: 689212, videoCodec: 'hev1.2.4.L63.90'},
        {id: 10, width: 852, height: 480, bandwidth: 885518, videoCodec: 'hev1.2.4.L90.90'},
        {id: 11, width: 1280, height: 720, bandwidth: 1474186, videoCodec: 'hev1.2.4.L93.90'},
        {id: 12, width: 1920, height: 1080, bandwidth: 1967542, videoCodec: 'hev1.2.4.L120.90'},
      ];

      const qualities = extractQualitiesFromShakaVariants(axinomVariants);
      // Expect Auto + 1080p + 720p + 480p + 360p + 288p = 6 options
      expect(qualities.length).toBe(6);
      expect(qualities[0].id).toBe(AUTO_QUALITY_ID);
      expect(qualities[1].id).toBe('quality-1080p');
      expect(qualities[1].label).toBe('1080p Full HD');
      expect(qualities[1].bitrate).toBe('2.7 Mbps');
      expect(qualities[1].rawTrack.videoCodec).toBe('avc1.640033'); // Prefers AVC on Vega OS

      expect(qualities[2].id).toBe('quality-720p');
      expect(qualities[2].label).toBe('720p HD');
      expect(qualities[2].bitrate).toBe('1.9 Mbps');

      expect(qualities[3].id).toBe('quality-480p');
      expect(qualities[3].label).toBe('480p SD');
      expect(qualities[3].bitrate).toBe('1.1 Mbps');

      expect(qualities[4].id).toBe('quality-360p');
      expect(qualities[4].label).toBe('360p Low');
      expect(qualities[4].bitrate).toBe('762 Kbps');

      expect(qualities[5].id).toBe('quality-288p');
      expect(qualities[5].label).toBe('288p Low');
      expect(qualities[5].bitrate).toBe('386 Kbps');
    });
  });

  describe('VideoQualityModal component tests', () => {
    const mockQualities = [
      {
        id: AUTO_QUALITY_ID,
        label: 'Auto (Recommended)',
        shortLabel: 'Auto',
        badge: 'AUTO',
        isDefault: true,
      },
      {
        id: 'quality-1080p',
        label: '1080p Full HD',
        shortLabel: '1080p FHD',
        resolution: '1920x1080',
        height: 1080,
        bitrate: '5.0 Mbps',
        badge: '1080p',
      },
      {
        id: 'quality-720p',
        label: '720p HD',
        shortLabel: '720p HD',
        resolution: '1280x720',
        height: 720,
        bitrate: '2.5 Mbps',
        badge: '720p',
      },
    ];

    it('renders modal with title, options, resolution, and bitrates when open', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <VideoQualityModal
          isOpen={true}
          qualities={mockQualities}
          selectedQualityId={AUTO_QUALITY_ID}
          onSelectQuality={onSelect}
          onClose={onClose}
        />,
      );

      expect(screen.getByTestId('video-quality-modal')).toBeTruthy();
      expect(screen.getByText('Auto (Recommended)')).toBeTruthy();
      expect(screen.getByText('1080p Full HD')).toBeTruthy();
      expect(screen.getByText('1920x1080')).toBeTruthy();
      expect(screen.getByText('5.0 Mbps')).toBeTruthy();
      expect(screen.getByText('720p HD')).toBeTruthy();
    });

    it('returns null when isOpen is false', () => {
      const screen = render(
        <VideoQualityModal
          isOpen={false}
          qualities={mockQualities}
          selectedQualityId={AUTO_QUALITY_ID}
          onSelectQuality={jest.fn()}
          onClose={jest.fn()}
        />,
      );

      expect(screen.queryByTestId('video-quality-modal')).toBeNull();
    });

    it('invokes onSelectQuality when a quality option is pressed', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <VideoQualityModal
          isOpen={true}
          qualities={mockQualities}
          selectedQualityId={AUTO_QUALITY_ID}
          onSelectQuality={onSelect}
          onClose={onClose}
        />,
      );

      const fhdButton = screen.getByTestId('quality-option-quality-1080p');
      fireEvent.press(fhdButton);

      expect(onSelect).toHaveBeenCalledWith('quality-1080p');
    });

    it('invokes onClose when close button is pressed', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <VideoQualityModal
          isOpen={true}
          qualities={mockQualities}
          selectedQualityId={AUTO_QUALITY_ID}
          onSelectQuality={onSelect}
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByTestId('video-quality-modal-close');
      fireEvent.press(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('VideoPlayerScreen Video Quality Integration', () => {
    beforeEach(() => {
      jest.spyOn(authContext, 'useAuth').mockReturnValue({
        user: {uid: 'test-quality-user'} as any,
        loading: false,
      } as any);
      jest.spyOn(profileContext, 'useProfile').mockReturnValue({
        activeProfile: {
          id: 'profile-quality-primary',
          name: 'Quality Tester',
          isKids: false,
          avatar: 'avatar1',
          createdAt: 1000,
        },
      } as any);
      mockDeinitializeSync.mockClear();
      mockClearSurfaceHandle.mockClear();
      mockPause.mockClear();
      mockInitialize.mockClear();
    });

    it('renders the Top Quality Button and opens VideoQualityModal on click', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      const qualityButton = screen.getByTestId('player-quality-button');
      expect(screen.queryByTestId('video-quality-modal')).toBeNull();

      fireEvent.press(qualityButton);

      await waitFor(() => {
        expect(screen.getByTestId('video-quality-modal')).toBeTruthy();
      });
    });

    it('allows changing video quality, updates the header badge, and saves preference', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      // Open Quality Modal
      fireEvent.press(screen.getByTestId('player-quality-button'));

      await waitFor(() => {
        expect(screen.getByTestId('video-quality-modal')).toBeTruthy();
      });

      // Select 1080p Full HD
      const fhdOption = screen.getByTestId('quality-option-quality-1080p');
      fireEvent.press(fhdOption);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('video-quality-modal')).toBeNull();
      });

      // Header button should reflect the 1080p selection
      expect(screen.getByText('Quality: 1080p FHD')).toBeTruthy();

      // Preference should be saved for the active profile
      const savedPref = await getSavedQualityPreference(
        'profile-quality-primary',
      );
      expect(savedPref).toBe('quality-1080p');
    });

    it('allows switching back to Auto quality mode', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      // Open Quality Modal
      fireEvent.press(screen.getByTestId('player-quality-button'));

      await waitFor(() => {
        expect(screen.getByTestId('video-quality-modal')).toBeTruthy();
      });

      // Select Auto
      const autoOption = screen.getByTestId('quality-option-auto');
      fireEvent.press(autoOption);

      await waitFor(() => {
        expect(screen.queryByTestId('video-quality-modal')).toBeNull();
      });

      expect(screen.getByText('Quality: Auto')).toBeTruthy();
    });

    it('synchronously releases native media resources (deinitializeSync, clearSurfaceHandle) on screen unmount', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      mockDeinitializeSync.mockClear();
      mockClearSurfaceHandle.mockClear();

      // Unmount the player screen
      screen.unmount();

      // Native cleanup must be called on unmount
      await waitFor(() => {
        expect(mockDeinitializeSync).toHaveBeenCalledWith(1000);
        expect(mockClearSurfaceHandle).toHaveBeenCalled();
      });
    });

    it('synchronously releases media resources and pauses playback when AppState changes to background', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      mockDeinitializeSync.mockClear();
      mockClearSurfaceHandle.mockClear();
      mockPause.mockClear();

      // Retrieve AppState change listener
      const appStateCall = (
        AppState.addEventListener as jest.Mock
      ).mock.calls.find((call: any) => call[0] === 'change');
      expect(appStateCall).toBeTruthy();
      const changeHandler = appStateCall[1];

      // Simulate transition to background
      changeHandler('background');

      // Must pause and deinitialize native resources synchronously
      expect(mockPause).toHaveBeenCalled();
      expect(mockDeinitializeSync).toHaveBeenCalledWith(1000);
      expect(mockClearSurfaceHandle).toHaveBeenCalled();
    });

    it('reinitializes player when AppState returns to active', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-quality-button')).toBeTruthy();
      });

      mockInitialize.mockClear();

      const appStateCall = (
        AppState.addEventListener as jest.Mock
      ).mock.calls.find((call: any) => call[0] === 'change');
      const changeHandler = appStateCall[1];

      // Transition to active
      changeHandler('active');

      expect(mockInitialize).toHaveBeenCalled();
    });
  });
});
