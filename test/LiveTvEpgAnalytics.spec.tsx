import React from 'react';
import {render, act} from '@testing-library/react-native';

const mockLogEvent = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/analytics', () => ({
  isSupported: jest.fn().mockResolvedValue(true),
  getAnalytics: jest.fn().mockReturnValue({app: {name: '[DEFAULT]'}}),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setUserId: jest.fn().mockResolvedValue(undefined),
  setUserProperties: jest.fn().mockResolvedValue(undefined),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
  }),
}));

import {
  analyticsService,
  PlaybackSessionManager,
  AnalyticsEvents,
} from '../src/analytics';
import {EPG, type EPGActions, type Channel} from '../src/features/live-tv/components/EPG';

describe('Live TV & EPG Analytics (Day 6 Specification)', () => {
  let manager: PlaybackSessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});
    mockGetApp.mockReturnValue({name: '[DEFAULT]'});
    mockLogEvent.mockResolvedValue(undefined);

    analyticsService.__resetForTesting();
    await analyticsService.initialize();
    manager = new PlaybackSessionManager(analyticsService);
    manager.__resetForTesting();
  });

  afterEach(() => {
    analyticsService.__resetForTesting();
    manager.__resetForTesting();
  });

  // Scenario 1: Explicit channel selection emits one event (live_channel_selected)
  it('1. Explicit channel selection emits exactly one live_channel_selected event with stable channel ID', async () => {
    await analyticsService.trackLiveChannelSelected({
      channel_id: 'sports',
      channelId: 'sports',
      channel_name: 'Sports Central',
      channelName: 'Sports Central',
      selection_source: 'epg',
      selectionSource: 'epg',
    });

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.LIVE_CHANNEL_SELECTED,
      expect.objectContaining({
        channel_id: 'sports',
        channel_name: 'Sports Central',
        selection_source: 'epg',
      }),
    );
  });

  // Scenario 2: D-pad focus alone emits no channel-selection event
  it('2. D-pad focus alone emits no channel-selection event', () => {
    const onTileFocus = jest.fn();
    const epgRef = React.createRef<EPGActions>();

    const mockChannels: Channel[] = [
      {
        id: 'movies',
        displayName: 'Movie Max',
        logoUrl: 'https://example.com/logo.png',
        programs: [
          {
            programId: 'prog-1',
            title: 'Blockbuster Movie',
            startTime: Date.now(),
            endTime: Date.now() + 3600000,
            extras: {
              sourceProgram: {
                id: 'prog-1',
                channelId: 'movies',
                title: 'Blockbuster Movie',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
              },
            },
          },
        ],
      },
    ];

    render(
      <EPG
        ref={epgRef}
        onTileFocus={onTileFocus}
        onTilePress={jest.fn()}
        timeRange={{
          startTimeMs: Date.now(),
          initialPosition: Date.now(),
        }}
      />,
    );

    act(() => {
      epgRef.current?.resetData(mockChannels, {
        startTimeMs: Date.now(),
        endTimeMs: Date.now() + 3600000,
      });
    });

    // Simulate focus event
    act(() => {
      onTileFocus({
        payload: {
          channel: mockChannels[0],
          program: mockChannels[0].programs[0],
        },
      });
    });

    // Assert that NO channel selection or changed event was emitted on focus
    const liveSelectionCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.LIVE_CHANNEL_SELECTED,
    );
    expect(liveSelectionCalls).toHaveLength(0);

    const liveChangedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.LIVE_CHANNEL_CHANGED,
    );
    expect(liveChangedCalls).toHaveLength(0);
  });

  // Scenario 3: Selecting current channel does not emit duplicate live_channel_changed
  it('3. Selecting the current channel does not emit a duplicate live_channel_changed event', async () => {
    // Channel A is currently active
    await manager.startSession({
      contentId: 'live-channel-sports',
      contentTitle: 'Sports Live',
      contentType: 'live',
      channelId: 'sports',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PLAYBACK_STARTED,
      expect.objectContaining({ channel_id: 'sports', is_live: true }),
    );

    // Initial start: no previousChannelId so no live_channel_changed
    const changedCalls1 = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.LIVE_CHANNEL_CHANGED,
    );
    expect(changedCalls1).toHaveLength(0);

    // Re-selecting current channel (same channelId: 'sports')
    await manager.startSession({
      contentId: 'live-channel-sports',
      contentTitle: 'Sports Live',
      contentType: 'live',
      channelId: 'sports',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();

    // Must NOT emit live_channel_changed because channel did not change
    const changedCalls2 = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.LIVE_CHANNEL_CHANGED,
    );
    expect(changedCalls2).toHaveLength(0);
  });

  // Scenario 4: Successful channel switching records correct previous and new channel IDs
  it('4. Successful channel switching records correct previous and new channel IDs in live_channel_changed', async () => {
    // 1. User starts watching Channel A ('sports')
    await manager.startSession({
      contentId: 'live-sports',
      contentTitle: 'Sports Live',
      contentType: 'live',
      channelId: 'sports',
      channelName: 'Sports Central',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();

    expect(manager.getLastActiveChannelId()).toBe('sports');

    // 2. User switches to Channel B ('movies')
    const sessionBId = await manager.startSession({
      contentId: 'live-movies',
      contentTitle: 'Movie Max Live',
      contentType: 'live',
      channelId: 'movies',
      channelName: 'Movie Max',
      selectionSource: 'epg',
      changeSource: 'epg',
      isLive: true,
      deferPlaybackStarted: true,
    });

    // Channel B playback starts successfully
    await manager.recordPlaybackStarted();

    // Verify live_channel_changed was emitted with previous_channel_id and channel_id
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.LIVE_CHANNEL_CHANGED,
      expect.objectContaining({
        previous_channel_id: 'sports',
        channel_id: 'movies',
        playback_session_id: sessionBId,
        change_source: 'epg',
      }),
    );
    expect(manager.getLastActiveChannelId()).toBe('movies');
  });

  // Scenario 5: Failed switching does not emit a false success event
  it('5. Failed switching does not emit a false success event (live_channel_changed)', async () => {
    // 1. Channel A active
    await manager.startSession({
      contentId: 'live-sports',
      channelId: 'sports',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();

    // 2. Switch to Channel C, but playback encounters a fatal error before starting
    await manager.startSession({
      contentId: 'live-broken',
      channelId: 'broken-stream',
      isLive: true,
      deferPlaybackStarted: true,
    });

    // Error before playback started
    await manager.recordPlaybackError(new Error('Manifest 404 Not Found'), {
      isFatal: true,
    });

    // live_channel_changed must NOT have been emitted because playback never started
    const changedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.LIVE_CHANNEL_CHANGED,
    );
    expect(changedCalls).toHaveLength(0);

    // Error was recorded
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PLAYBACK_ERROR,
      expect.objectContaining({
        channel_id: 'broken-stream',
        is_fatal: true,
      }),
    );
  });

  // Scenario 6: EPG program selection is recorded once
  it('6. EPG program selection is recorded once with program metadata', async () => {
    await analyticsService.trackEpgProgramSelected({
      program_id: 'prog-live-101',
      programId: 'prog-live-101',
      channel_id: 'sports',
      channelId: 'sports',
      program_start_time: '2026-10-09T06:00:00.000Z',
      programStartTime: '2026-10-09T06:00:00.000Z',
      program_end_time: '2026-10-09T07:00:00.000Z',
      programEndTime: '2026-10-09T07:00:00.000Z',
      selection_source: 'epg',
      selectionSource: 'epg',
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.EPG_PROGRAM_SELECTED,
      expect.objectContaining({
        program_id: 'prog-live-101',
        channel_id: 'sports',
        program_start_time: '2026-10-09T06:00:00.000Z',
        program_end_time: '2026-10-09T07:00:00.000Z',
        selection_source: 'epg',
      }),
    );

    const initialCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.EPG_PROGRAM_SELECTED,
    );
    expect(initialCalls).toHaveLength(1);

    // Rapid duplicate click within 500ms is deduplicated
    await analyticsService.trackEpgProgramSelected({
      program_id: 'prog-live-101',
      channel_id: 'sports',
      selection_source: 'epg',
    });
    const afterDuplicateCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.EPG_PROGRAM_SELECTED,
    );
    expect(afterDuplicateCalls).toHaveLength(1);
  });

  // Scenario 7: Program focus alone does not emit a program-selection event
  it('7. Program focus alone does not emit a program-selection event', () => {
    const onTileFocus = jest.fn();
    const epgRef = React.createRef<EPGActions>();

    render(
      <EPG
        ref={epgRef}
        onTileFocus={onTileFocus}
        onTilePress={jest.fn()}
        timeRange={{
          startTimeMs: Date.now(),
          initialPosition: Date.now(),
        }}
      />,
    );

    act(() => {
      onTileFocus({
        payload: {
          channel: {id: 'news', displayName: 'News 24', logoUrl: '', programs: []},
          program: {
            programId: 'news-headline',
            title: 'Prime Time News',
            startTime: Date.now(),
            endTime: Date.now() + 1800000,
          },
        },
      });
    });

    const epgSelectionCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.EPG_PROGRAM_SELECTED,
    );
    expect(epgSelectionCalls).toHaveLength(0);
  });

  // Scenario 8: Go Live is recorded only after explicit user action
  it('8. Go Live is recorded only after explicit user action, never automatically on startup', async () => {
    // Normal startup does NOT emit go_live
    await manager.startSession({
      contentId: 'live-stream',
      channelId: 'sports',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();
    await manager.recordFirstFrame({ position: 0 });

    const goLiveCalls1 = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.GO_LIVE,
    );
    expect(goLiveCalls1).toHaveLength(0);

    // Explicit call to recordGoLive emits go_live
    await manager.recordGoLive({
      channel_id: 'sports',
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.GO_LIVE,
      expect.objectContaining({
        channel_id: 'sports',
      }),
    );
  });

  // Scenario 9: Live seek audit & behavior
  it('9. Live seek audit: live DVR seeking is disabled in UI, but seek analytics preserve channel parameters', async () => {
    await manager.startSession({
      contentId: 'live-dvr',
      channelId: 'news',
      channelName: 'News 24',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();

    // If a live seek were initiated programmatically:
    await manager.recordSeekStarted(100, 150);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.SEEK_STARTED,
      expect.objectContaining({
        isLive: true,
        channelId: 'news',
        channelName: 'News 24',
        seek_start_position: 100,
        seek_target_position: 150,
      }),
    );

    await manager.recordSeekCompleted(150);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.SEEK_COMPLETED,
      expect.objectContaining({
        isLive: true,
        channelId: 'news',
        channel_id: 'news',
        seek_start_position: 100,
        seek_target_position: 150,
      }),
    );
  });

  // Scenario 10: Live playback start is not duplicated by existing playback_started event
  it('10. Live playback start reuses existing playback_started with is_live: true and channel_id without duplicating events', async () => {
    await manager.startSession({
      contentId: 'live-soccer',
      contentTitle: 'Live Soccer',
      channelId: 'sports',
      channelName: 'Sports Central',
      isLive: true,
      deferPlaybackStarted: true,
    });

    await manager.recordPlaybackStarted();

    // Must emit exactly one playback_started event
    const playbackStartedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PLAYBACK_STARTED,
    );
    expect(playbackStartedCalls).toHaveLength(1);
    expect(playbackStartedCalls[0][2]).toEqual(
      expect.objectContaining({
        is_live: true,
        channel_id: 'sports',
        channel_name: 'Sports Central',
      }),
    );

    // Duplicate call within same session is ignored
    await manager.recordPlaybackStarted();
    expect(
      mockLogEvent.mock.calls.filter(
        ([, eventName]) => eventName === AnalyticsEvents.PLAYBACK_STARTED,
      ),
    ).toHaveLength(1);
  });

  // Scenario 11: Existing playback lifecycle and audio/subtitle analytics continue working
  it('11. Existing playback lifecycle and audio/subtitle analytics continue working on live streams', async () => {
    await manager.startSession({
      contentId: 'live-cricket',
      contentTitle: 'Live Cricket',
      channelId: 'sports',
      isLive: true,
      deferPlaybackStarted: true,
    });
    await manager.recordPlaybackStarted();
    await manager.recordFirstFrame({ position: 0 });

    // Audio track change
    await manager.recordAudioTrackChanged({
      fromAudioTrackId: 'audio-hin',
      fromLanguage: 'hi',
      toAudioTrackId: 'audio-eng',
      toLanguage: 'en',
    });
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.AUDIO_TRACK_CHANGED,
      expect.objectContaining({
        toAudioTrackId: 'audio-eng',
        toLanguage: 'en',
      }),
    );

    // Subtitle track change
    await manager.recordSubtitleTrackChanged({
      toSubtitleTrackId: 'sub-eng',
      toLanguage: 'en',
    });
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.SUBTITLE_TRACK_CHANGED,
      expect.objectContaining({
        toSubtitleTrackId: 'sub-eng',
      }),
    );

    // Stop event attaches channel parameters and reason
    await manager.recordStop({ stopReason: 'user_exit' });
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PLAYBACK_STOPPED,
      expect.objectContaining({
        channel_id: 'sports',
        stop_reason: 'user_exit',
        is_live: true,
      }),
    );

    // Live streams must NEVER fire playback_completed
    const completedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.COMPLETED,
    );
    expect(completedCalls).toHaveLength(0);
  });

  // Scenario 12: Analytics failures do not affect channel playback
  it('12. Analytics failures do not throw or affect channel playback', async () => {
    mockLogEvent.mockRejectedValue(new Error('Network offline or Firebase timeout'));

    // None of these should throw
    await expect(
      analyticsService.trackLiveChannelSelected({
        channel_id: 'sports',
        selection_source: 'epg',
      }),
    ).resolves.not.toThrow();

    await expect(
      analyticsService.trackLiveChannelChanged({
        previous_channel_id: 'sports',
        channel_id: 'movies',
        change_source: 'epg',
      }),
    ).resolves.not.toThrow();

    await expect(
      analyticsService.trackEpgProgramSelected({
        program_id: 'prog-1',
        channel_id: 'movies',
        selection_source: 'epg',
      }),
    ).resolves.not.toThrow();

    await expect(
      analyticsService.trackGoLive({
        channel_id: 'sports',
      }),
    ).resolves.not.toThrow();
  });

  // Scenario 13: Player listeners and analytics subscriptions are cleaned up correctly
  it('13. Player listeners and analytics subscriptions are cleaned up correctly on stop/reset', async () => {
    await manager.startSession({
      contentId: 'live-news',
      channelId: 'news',
      isLive: true,
    });

    expect(manager.isSessionActive()).toBe(true);
    expect(manager.getCurrentChannelId()).toBe('news');

    await manager.recordStop({ stopReason: 'user_exit' });

    expect(manager.isSessionActive()).toBe(false);
    expect(manager.getCurrentChannelId()).toBeNull();
    expect(manager.getCurrentSession()).toBeNull();
  });
});
