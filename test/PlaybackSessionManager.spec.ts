import {
  AnalyticsEvent,
  AnalyticsService,
  AnalyticsContextManager,
  PlaybackSessionManager,
  generatePlaybackSessionId,
} from '../src/analytics';

describe('PlaybackSessionManager (Playback Telemetry Lifecycle)', () => {
  let mockTrack: jest.Mock;
  let mockAnalytics: AnalyticsService;
  let manager: PlaybackSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack = jest.fn().mockResolvedValue(undefined);
    mockAnalytics = {
      trackPlaybackStarted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PLAYBACK_STARTED, params),
      ),
      trackFirstFrame: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.FIRST_FRAME, params),
      ),
      trackPlaybackPaused: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PAUSED, params),
      ),
      trackPlaybackResumed: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.RESUMED, params),
      ),
      trackPlaybackCompleted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.COMPLETED, params),
      ),
      trackPlaybackStopped: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.STOPPED, params),
      ),
    } as unknown as AnalyticsService;

    manager = new PlaybackSessionManager(mockAnalytics);
  });

  describe('1. generatePlaybackSessionId', () => {
    it('generates a unique non-empty string starting with "ps_"', () => {
      const id1 = generatePlaybackSessionId();
      const id2 = generatePlaybackSessionId();

      expect(typeof id1).toBe('string');
      expect(id1.startsWith('ps_')).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe('2. Step 1 & 2: New Content -> Create playbackSessionId -> playback_started', () => {
    it('starts session, creates playbackSessionId, and emits playback_started', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentTitle: 'Interstellar Voyage',
        contentType: 'movie',
        streamType: 'dash',
        isLive: false,
        startPosition: 0,
        duration: 7200,
      });

      expect(sessionId).toBeDefined();
      expect(sessionId.startsWith('ps_')).toBe(true);
      expect(manager.getCurrentSessionId()).toBe(sessionId);
      expect(manager.isSessionActive()).toBe(true);
      expect(manager.hasFirstFrameRendered()).toBe(false);

      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          contentTitle: 'Interstellar Voyage',
          contentType: 'movie',
          streamType: 'dash',
          isLive: false,
          startPosition: 0,
          duration: 7200,
        }),
      );
    });
  });

  describe('3. Step 3: first_frame event', () => {
    it('emits first_frame with timeToFirstFrameMs and transitions state', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentTitle: 'Interstellar Voyage',
      });

      await manager.recordFirstFrame({position: 0.1});

      expect(manager.hasFirstFrameRendered()).toBe(true);
      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 0.1,
          timeToFirstFrameMs: expect.any(Number),
        }),
      );
    });

    it('deduplicates first_frame and ignores subsequent calls for the same session', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });

      await manager.recordFirstFrame({position: 0});
      await manager.recordFirstFrame({position: 0.5});
      await manager.recordFirstFrame({position: 1.0});

      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Step 4: Pause and Resume loop (paused -> resumed)', () => {
    it('emits paused when video is paused and resumed when video is resumed', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Pause playback at 45 seconds
      await manager.recordPause(45);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 45,
        }),
      );

      // Resume playback at 45 seconds
      await manager.recordResume(45);

      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 45,
          pauseDurationMs: expect.any(Number),
        }),
      );
    });

    it('does not emit resumed if playback was not previously paused', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Attempting to resume when state is playing (not paused)
      await manager.recordResume(10);

      expect(mockAnalytics.trackPlaybackResumed).not.toHaveBeenCalled();
    });

    it('does not emit duplicate paused events if already paused', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordPause(30);
      await manager.recordPause(30);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
    });

    it('supports multiple pause and resume cycles within the same session', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Cycle 1
      await manager.recordPause(10);
      await manager.recordResume(10);

      // Cycle 2
      await manager.recordPause(50);
      await manager.recordResume(50);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(2);
    });
  });

  describe('5. Step 5a: completed event (natural playback finish)', () => {
    it('emits completed and terminates active session', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        duration: 6000,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordComplete({duration: 6000});

      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          duration: 6000,
          totalPlayTimeMs: expect.any(Number),
        }),
      );

      expect(manager.isSessionActive()).toBe(false);
      expect(manager.getCurrentSessionId()).toBeNull();
    });

    it('ensures completed and stopped are mutually exclusive (stopped is ignored once completed)', async () => {
      await manager.startSession({
        contentId: 'movie-101',
        duration: 3600,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordComplete({duration: 3600});
      await manager.recordStop({position: 3600, reason: 'user_exit'});

      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).not.toHaveBeenCalled();
    });
  });

  describe('6. Step 5b: stopped event (exit / interruption before completion)', () => {
    it('emits stopped when playback ends before completion', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        duration: 3600,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordStop({
        position: 120,
        duration: 3600,
        reason: 'back_navigation',
      });

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 120,
          duration: 3600,
          reason: 'back_navigation',
          totalPlayTimeMs: expect.any(Number),
        }),
      );

      expect(manager.isSessionActive()).toBe(false);
    });

    it('does not emit completed once stopped has fired', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });

      await manager.recordStop({reason: 'user_exit'});
      await manager.recordComplete({duration: 3600});

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();
    });
  });

  describe('7. Automatic session termination on episode / content change', () => {
    it('automatically stops previous session with reason "episode_switch" when starting a new session', async () => {
      const firstSessionId = await manager.startSession({
        contentId: 'episode-1',
        contentType: 'episode',
      });
      await manager.recordFirstFrame({position: 0});

      // Start new episode without explicitly stopping first episode
      const secondSessionId = await manager.startSession({
        contentId: 'episode-2',
        contentType: 'episode',
      });

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: firstSessionId,
          contentId: 'episode-1',
          reason: 'episode_switch',
        }),
      );

      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenLastCalledWith(
        expect.objectContaining({
          playbackSessionId: secondSessionId,
          contentId: 'episode-2',
        }),
      );
      expect(secondSessionId).not.toBe(firstSessionId);
    });
  });

  describe('8. AnalyticsService integration methods', () => {
    let service: AnalyticsService;
    let serviceContextManager: AnalyticsContextManager;

    beforeEach(() => {
      serviceContextManager = new AnalyticsContextManager();
      service = new AnalyticsService(serviceContextManager);
    });

    it('safely handles missing required params without crashing', async () => {
      // Missing playbackSessionId / contentId
      await service.trackPlaybackStarted({} as any);
      await service.trackFirstFrame({} as any);
      await service.trackPlaybackPaused({} as any);
      await service.trackPlaybackResumed({} as any);
      await service.trackPlaybackCompleted({} as any);
      await service.trackPlaybackStopped({} as any);
    });

    it('tracks full telemetry payload with valid parameters', async () => {
      const trackSpy = jest.spyOn(service, 'track').mockResolvedValue(undefined);

      await service.trackPlaybackStarted({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        contentTitle: 'Test Video',
        contentType: 'movie',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.PLAYBACK_STARTED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
        }),
      );
    });
  });
});
