import 'react-native';
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  findActiveSubtitleCue,
  parseWebVTT,
  parseVttTimestamp,
  getSavedSubtitlePreference,
  saveSubtitlePreference,
  loadSubtitleTrackCues,
} from '../src/services/subtitleService';
import {SubtitleOverlay} from '../src/components/molecules/SubtitleOverlay';
import {SubtitlesModal} from '../src/components/molecules/SubtitlesModal';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import {getSubtitleTracksForContent} from '../src/data/subtitles';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
let mockEventHandlers: Record<string, Function> = {};
let mockTextTracksList: any = [];

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 3600;
    captioning = false;
    textTracks = {
      length: 0,
      addEventListener: jest.fn((event: string, handler: Function) => {
        mockEventHandlers[`texttracks_${event}`] = handler;
      }),
      removeEventListener: jest.fn((event: string) => {
        delete mockEventHandlers[`texttracks_${event}`];
      }),
      emitEvent: jest.fn(),
    };
    initialize = mockInitialize;
    setSurfaceHandle = mockSetSurfaceHandle;
    clearSurfaceHandle = mockClearSurfaceHandle;
    play = mockPlay;
    pause = mockPause;
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    addTextTrack = jest.fn((kind: string, label: string, language: string) => {
      const track = {
        id: `track-${language}`,
        kind,
        label,
        language,
        mode: 'hidden',
      };
      mockTextTracksList.push(track);
      (this.textTracks as any)[this.textTracks.length] = track;
      this.textTracks.length = mockTextTracksList.length;
      return track;
    });
    addEventListener = jest.fn((event: string, handler: Function) => {
      mockEventHandlers[event] = handler;
    });
    removeEventListener = jest.fn((event: string) => {
      delete mockEventHandlers[event];
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

describe('Subtitles Feature', () => {
  describe('subtitleService unit tests', () => {
    it('parses VTT timestamps correctly', () => {
      expect(parseVttTimestamp('00:00:05.500')).toBe(5.5);
      expect(parseVttTimestamp('01:30.000')).toBe(90);
      expect(parseVttTimestamp('01:02:03.000')).toBe(3723);
      expect(parseVttTimestamp('')).toBe(0);
    });

    it('parses WebVTT raw text with styling tags into structured cues', () => {
      const sampleVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
<b>Welcome to LogiXstream</b>

2
00:00:05.000 --> 00:00:09.500
<v Narrator>Enjoy the movie in 4K UHD.</v>`;

      const cues = parseWebVTT(sampleVtt);
      expect(cues).toHaveLength(2);
      expect(cues[0].startTime).toBe(1);
      expect(cues[0].endTime).toBe(4);
      expect(cues[0].text).toBe('Welcome to LogiXstream');

      expect(cues[1].startTime).toBe(5);
      expect(cues[1].endTime).toBe(9.5);
      expect(cues[1].text).toBe('Enjoy the movie in 4K UHD.');
    });

    it('finds active cue for matching timestamp', () => {
      const cues = [
        {startTime: 1, endTime: 5, text: 'First dialogue'},
        {startTime: 6, endTime: 10, text: 'Second dialogue'},
      ];

      expect(findActiveSubtitleCue(cues, 3)?.text).toBe('First dialogue');
      expect(findActiveSubtitleCue(cues, 7)?.text).toBe('Second dialogue');
      expect(findActiveSubtitleCue(cues, 5.5)).toBeNull();
      expect(findActiveSubtitleCue(undefined, 3)).toBeNull();
    });

    it('supports rolling modulo cue lookup for continuous live TV streaming', () => {
      const liveCues = [
        {startTime: 1, endTime: 10, text: 'Live News Anchor: Welcome'},
        {startTime: 11, endTime: 20, text: 'Breaking Update'},
      ];

      // Time within first cycle
      expect(findActiveSubtitleCue(liveCues, 5)?.text).toBe(
        'Live News Anchor: Welcome',
      );
      // Time in next rolling cycle (e.g. time = 25s, cycle = 20s -> effective 5s)
      expect(findActiveSubtitleCue(liveCues, 25)?.text).toBe(
        'Live News Anchor: Welcome',
      );
      // Time in rolling cycle matching second cue (e.g. time = 35s -> effective 15s)
      expect(findActiveSubtitleCue(liveCues, 35)?.text).toBe('Breaking Update');
    });

    it('loads subtitle track cues from static or remote sources', async () => {
      const track = {
        id: 'test-track',
        language: 'en',
        label: 'English',
        cues: [{startTime: 1, endTime: 5, text: 'Static cue'}],
      };
      const loaded = await loadSubtitleTrackCues(track);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].text).toBe('Static cue');
    });

    it('retrieves curated subtitle tracks for known titles or video URLs', () => {
      const sintelTracks = getSubtitleTracksForContent(
        'sample-video',
        'Sintel Trailer',
        'https://media.w3.org/2010/05/sintel/trailer.mp4',
      );
      expect(sintelTracks.length).toBeGreaterThan(0);
      expect(sintelTracks[0].label).toContain('English');

      const oceansTracks = getSubtitleTracksForContent(
        'oceans',
        'Oceans Documentary',
        'https://vjs.zencdn.net/v/oceans.mp4',
      );
      expect(oceansTracks.length).toBeGreaterThan(0);
      expect(oceansTracks[0].label).toContain('English');
    });

    it('dynamically generates live TV subtitles for Telugu, Hindi, and English live channels', () => {
      // Telugu Live TV Channel (e.g. Sakshi / NTV)
      const teluguLiveTracks = getSubtitleTracksForContent(
        'live-sakshi-telugu',
        'Sakshi Telugu Live',
        'https://yuppmedtaorire.akamaized.net/.../playlist.m3u8',
        true,
        'News',
        'News • Telugu',
      );
      expect(teluguLiveTracks.length).toBeGreaterThan(0);
      // Telugu should be default for Telugu Live TV
      const defaultTelugu = teluguLiveTracks.find((t) => t.isDefault);
      expect(defaultTelugu?.language).toBe('te');
      expect(defaultTelugu?.label).toContain('Telugu');
      expect(defaultTelugu?.cues?.[0].text).toContain('Sakshi Telugu');

      // Hindi Live TV Channel (e.g. NDTV India)
      const hindiLiveTracks = getSubtitleTracksForContent(
        'live-ndtv-india',
        'NDTV India Live',
        'https://ndtvindiaelemarchana.akamaized.net/.../master.m3u8',
        true,
        'News',
        'News • Hindi',
      );
      const defaultHindi = hindiLiveTracks.find((t) => t.isDefault);
      expect(defaultHindi?.language).toBe('hi');
      expect(defaultHindi?.label).toContain('Hindi');
      expect(defaultHindi?.cues?.[0].text).toContain('NDTV India');

      // English Live TV Channel (e.g. DW English)
      const englishLiveTracks = getSubtitleTracksForContent(
        'live-dw-english',
        'DW English Live',
        'https://dwamdstream102.akamaized.net/.../index.m3u8',
        true,
        'News',
        'News • English',
      );
      const defaultEnglish = englishLiveTracks.find((t) => t.isDefault);
      expect(defaultEnglish?.language).toBe('en');
      expect(defaultEnglish?.label).toContain('English');
      expect(defaultEnglish?.cues?.[0].text).toContain('DW English');
    });

    it('saves and retrieves subtitle preference for profile', async () => {
      await saveSubtitlePreference('profile-1', 'kalki-te');
      const pref = await getSavedSubtitlePreference('profile-1');
      expect(pref).toBe('kalki-te');
    });
  });

  describe('SubtitleOverlay Component', () => {
    it('renders null when currentCueText is empty', () => {
      const {queryByTestId} = render(
        <SubtitleOverlay currentCueText={null} isControlsVisible={false} />,
      );
      expect(queryByTestId('player-subtitles-overlay')).toBeNull();
    });

    it('renders active cue text when provided', () => {
      const {getByTestId, getByText} = render(
        <SubtitleOverlay
          currentCueText="Ashwatthama: My wait is finally coming to an end."
          isControlsVisible={false}
        />,
      );
      expect(getByTestId('player-subtitles-overlay')).toBeTruthy();
      expect(
        getByText('Ashwatthama: My wait is finally coming to an end.'),
      ).toBeTruthy();
    });
  });

  describe('SubtitlesModal Component', () => {
    const mockTracks = [
      {id: 'track-en', language: 'en', label: 'English [CC]'},
      {id: 'track-te', language: 'te', label: 'Telugu (తెలుగు)'},
    ];

    it('renders modal with all options including Off', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const {getByTestId, getByText} = render(
        <SubtitlesModal
          isOpen={true}
          tracks={mockTracks}
          selectedTrackId="track-en"
          onSelectTrack={onSelect}
          onClose={onClose}
        />,
      );

      expect(getByTestId('subtitles-modal')).toBeTruthy();
      expect(getByTestId('subtitle-track-off')).toBeTruthy();
      expect(getByTestId('subtitle-track-track-en')).toBeTruthy();
      expect(getByTestId('subtitle-track-track-te')).toBeTruthy();
      expect(getByText('English [CC]')).toBeTruthy();
      expect(getByText('Telugu (తెలుగు)')).toBeTruthy();
    });

    it('handles selecting a track and closing', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();

      const {getByTestId} = render(
        <SubtitlesModal
          isOpen={true}
          tracks={mockTracks}
          selectedTrackId="track-en"
          onSelectTrack={onSelect}
          onClose={onClose}
        />,
      );

      fireEvent.press(getByTestId('subtitle-track-track-te'));
      expect(onSelect).toHaveBeenCalledWith('track-te');

      fireEvent.press(getByTestId('subtitles-modal-close'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('VideoPlayerScreen Subtitles Integration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockEventHandlers = {};
      mockTextTracksList = [];
      mockRouteParams = {
        params: {
          movie: {
            id: 'kalki',
            title: 'Kalki 2898 AD',
            genre: 'Sci-Fi',
          },
        },
      };

      jest.spyOn(authContext, 'useAuth').mockReturnValue({
        user: {uid: 'user-123'} as any,
        userProfile: null,
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
      });

      jest.spyOn(profileContext, 'useProfile').mockReturnValue({
        activeProfile: {
          id: 'profile-anil',
          name: 'Anil',
          avatarId: 'avatar-1',
          isKids: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
        profiles: [],
        isLoadingProfiles: false,
        error: null,
        setActiveProfile: jest.fn(),
        switchProfile: jest.fn(),
        refreshProfiles: jest.fn(),
        createProfile: jest.fn(),
        updateProfile: jest.fn(),
        deleteProfile: jest.fn(),
        clearActiveProfile: jest.fn(),
        isParentAuthorized: false,
        parentalSettings: null,
        isLoadingParentalSettings: false,
        setParentAuthorized: jest.fn(),
        refreshParentalSettings: jest.fn().mockResolvedValue(null),
        verifyParentPin: jest.fn().mockResolvedValue(true),
        setParentPin: jest.fn().mockResolvedValue(undefined),
        removeParentPin: jest.fn().mockResolvedValue(undefined),
      });
    });

    it('renders top subtitles button showing selected language status', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-subtitles-button')).toBeTruthy();
        expect(screen.getByText(/Subtitles:/i)).toBeTruthy();
      });
    });

    it('opens subtitles modal when top subtitles button is clicked and allows switching track', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-subtitles-button')).toBeTruthy();
      });

      // Press top subtitles button
      fireEvent.press(screen.getByTestId('player-subtitles-button'));

      await waitFor(() => {
        expect(screen.getByTestId('subtitles-modal')).toBeTruthy();
      });

      // Select Telugu subtitles
      const teluguTrackBtn = screen.getByTestId('subtitle-track-kalki-te');
      fireEvent.press(teluguTrackBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('subtitles-modal')).toBeNull();
        expect(screen.getByText('Subtitles: Telugu (తెలుగు)')).toBeTruthy();
      });
    });

    it('supports dynamic subtitle selection in Live TV playback', async () => {
      mockRouteParams = {
        params: {
          isLive: true,
          videoUrl: 'https://mumbai-edge.smartplaytv.in/NTVTelugu/index.m3u8',
          movie: {
            id: 'live-ntv-telugu',
            title: 'NTV Telugu Live',
            genre: 'News',
            description: 'News • Telugu',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-subtitles-button')).toBeTruthy();
      });

      // Opens modal
      fireEvent.press(screen.getByTestId('player-subtitles-button'));

      await waitFor(() => {
        expect(screen.getByTestId('subtitles-modal')).toBeTruthy();
        expect(screen.getByTestId('subtitle-track-live-te')).toBeTruthy();
        expect(screen.getByTestId('subtitle-track-live-en')).toBeTruthy();
      });
    });

    it('selecting Off turns off subtitle track and updates top button to show Subtitles: Off', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-subtitles-button')).toBeTruthy();
      });

      // Open modal
      fireEvent.press(screen.getByTestId('player-subtitles-button'));

      await waitFor(() => {
        expect(screen.getByTestId('subtitle-track-off')).toBeTruthy();
      });

      // Select Off
      fireEvent.press(screen.getByTestId('subtitle-track-off'));

      await waitFor(() => {
        expect(screen.getByText('Subtitles: Off')).toBeTruthy();
      });
    });
  });
});
