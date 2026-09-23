import 'react-native';
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  findMatchingAudioTrack,
  getSavedAudioPreference,
  saveAudioPreference,
} from '../src/services/audioTrackService';
import {getAudioTracksForContent} from '../src/data/audioTracks';
import {AudioTracksModal} from '../src/components/molecules/AudioTracksModal';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
let mockAudioTracksList: any = [];

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
    selectAudioLanguage = jest.fn();
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    addAudioTrack = jest.fn((kind: string, label: string, language: string) => {
      const track = {
        id: `audio-track-${language}`,
        kind,
        label,
        language,
        enabled: false,
      };
      mockAudioTracksList.push(track);
      (this.audioTracks as any)[this.audioTracks.length] = track;
      this.audioTracks.length = mockAudioTracksList.length;
      return track;
    });
    addTextTrack = jest.fn((kind: string, label: string, language: string) => {
      return {
        id: `track-${language}`,
        kind,
        label,
        language,
        mode: 'hidden',
      };
    });
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

describe('Multiple Audio Tracks Feature', () => {
  describe('audioTrackService unit tests', () => {
    it('saves and retrieves audio preference per profile', async () => {
      await saveAudioPreference('profile-user-1', 'kalki-audio-hi');
      const retrieved = await getSavedAudioPreference('profile-user-1');
      expect(retrieved).toBe('kalki-audio-hi');
    });

    it('matches audio track by exact ID', () => {
      const tracks = [
        {id: 'track-en', language: 'en', label: 'English [Original]'},
        {id: 'track-te', language: 'te', label: 'Telugu (తెలుగు)'},
      ];
      expect(findMatchingAudioTrack(tracks, 'track-te')?.id).toBe('track-te');
    });

    it('matches audio track by language code', () => {
      const tracks = [
        {id: 'track-en', language: 'en', label: 'English [Original]'},
        {id: 'track-hi', language: 'hi', label: 'Hindi (हिंदी)'},
      ];
      expect(findMatchingAudioTrack(tracks, 'hi')?.id).toBe('track-hi');
    });

    it('falls back to default track when no match is found', () => {
      const tracks = [
        {
          id: 'track-en',
          language: 'en',
          label: 'English [Original]',
          isDefault: true,
        },
        {id: 'track-hi', language: 'hi', label: 'Hindi (हिंदी)'},
      ];
      expect(findMatchingAudioTrack(tracks, 'non-existent')?.id).toBe(
        'track-en',
      );
    });
  });

  describe('data/audioTracks resolution tests', () => {
    it('returns multiple curated audio tracks for known titles', () => {
      const kalkiTracks = getAudioTracksForContent('kalki', 'Kalki 2898 AD');
      expect(kalkiTracks.length).toBeGreaterThanOrEqual(3);
      expect(kalkiTracks.some((t) => t.language === 'en')).toBe(true);
      expect(kalkiTracks.some((t) => t.language === 'de')).toBe(true);
      expect(kalkiTracks.some((t) => t.language === 'es')).toBe(true);

      const sintelTracks = getAudioTracksForContent('sample-video', 'Sintel');
      expect(sintelTracks.length).toBeGreaterThanOrEqual(2);
      expect(sintelTracks[0].channels).toBeTruthy();

      const angelTracks = getAudioTracksForContent(
        'angel-one',
        'Angel One: Multi-Audio Showcase',
      );
      expect(angelTracks.length).toBe(5);
      expect(angelTracks.map((t) => t.language)).toEqual([
        'en',
        'de',
        'es',
        'fr',
        'it',
      ]);
    });

    it('returns dynamic live audio tracks for live channels', () => {
      const liveTracks = getAudioTracksForContent(
        'live-sakshi',
        'Sakshi TV Live',
        'https://example.com/live/master.m3u8',
        true,
      );
      expect(liveTracks.length).toBeGreaterThan(1);
      expect(liveTracks[0].language).toBe('te');
    });

    it('returns generic fallback audio tracks for unlisted movies', () => {
      const genericTracks = getAudioTracksForContent(
        'custom-indie-film',
        'Indie Film',
      );
      expect(genericTracks.length).toBeGreaterThanOrEqual(3);
      expect(genericTracks.some((t) => t.language === 'en')).toBe(true);
      expect(genericTracks.some((t) => t.language === 'de')).toBe(true);
    });
  });

  describe('AudioTracksModal component tests', () => {
    const mockTracks = [
      {
        id: 'audio-en',
        language: 'en',
        label: 'English [Original]',
        channels: 'Dolby Atmos',
        isDefault: true,
      },
      {
        id: 'audio-te',
        language: 'te',
        label: 'Telugu (తెలుగు)',
        channels: '5.1 Surround',
      },
    ];

    it('renders modal with all audio track options and formats', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <AudioTracksModal
          isOpen={true}
          tracks={mockTracks}
          selectedTrackId="audio-en"
          onSelectTrack={onSelect}
          onClose={onClose}
        />,
      );

      expect(screen.getByTestId('audio-tracks-modal')).toBeTruthy();
      expect(screen.getByText('English [Original]')).toBeTruthy();
      expect(screen.getByText('Telugu (తెలుగు)')).toBeTruthy();
      expect(screen.getByText('Dolby Atmos')).toBeTruthy();
      expect(screen.getByText('5.1 Surround')).toBeTruthy();
    });

    it('invokes onSelectTrack when a track is pressed', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <AudioTracksModal
          isOpen={true}
          tracks={mockTracks}
          selectedTrackId="audio-en"
          onSelectTrack={onSelect}
          onClose={onClose}
        />,
      );

      const teluguButton = screen.getByTestId('audio-track-audio-te');
      fireEvent.press(teluguButton);

      expect(onSelect).toHaveBeenCalledWith('audio-te');
    });

    it('invokes onClose when close button is pressed', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const screen = render(
        <AudioTracksModal
          isOpen={true}
          tracks={mockTracks}
          selectedTrackId="audio-en"
          onSelectTrack={onSelect}
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByTestId('audio-tracks-modal-close');
      fireEvent.press(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('VideoPlayerScreen Audio Tracks integration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockAudioTracksList = [];
      jest.spyOn(authContext, 'useAuth').mockReturnValue({
        user: {uid: 'test-user'} as any,
        loading: false,
      } as any);
      jest.spyOn(profileContext, 'useProfile').mockReturnValue({
        activeProfile: {
          id: 'profile-primary',
          name: 'Primary User',
          isKids: false,
          avatar: 'avatar1',
          createdAt: 1000,
        },
      } as any);
    });

    it('renders the Top Audio Button and opens AudioTracksModal on click', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-audio-button')).toBeTruthy();
      });

      const audioButton = screen.getByTestId('player-audio-button');
      expect(screen.queryByTestId('audio-tracks-modal')).toBeNull();

      fireEvent.press(audioButton);

      await waitFor(() => {
        expect(screen.getByTestId('audio-tracks-modal')).toBeTruthy();
      });
    });

    it('allows changing audio track and saves the preference', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-audio-button')).toBeTruthy();
      });

      // Open Audio Modal
      fireEvent.press(screen.getByTestId('player-audio-button'));

      await waitFor(() => {
        expect(screen.getByTestId('audio-tracks-modal')).toBeTruthy();
      });

      // Select German Audio Track
      const germanTrackButton = screen.getByTestId('audio-track-kalki-audio-de');
      fireEvent.press(germanTrackButton);

      await waitFor(() => {
        expect(screen.queryByTestId('audio-tracks-modal')).toBeNull();
      });

      const savedPref = await getSavedAudioPreference('profile-primary');
      expect(savedPref).toBe('kalki-audio-de');
    });
  });
});
