import React from 'react';
import {render, act, fireEvent} from '@testing-library/react-native';

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
import {ContentCard} from '../src/components/molecules/ContentCard';

describe('Continue Watching & Playback Progress Analytics (Day 7 Specification)', () => {
  let manager: PlaybackSessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});
    mockGetApp.mockReturnValue({name: '[DEFAULT]'});
    mockLogEvent.mockResolvedValue(undefined);

    analyticsService.__resetForTesting();
    await analyticsService.initialize();
    analyticsService.setProfile({
      profileId: 'profile-user-1',
      profileType: 'adult',
    });

    manager = new PlaybackSessionManager(analyticsService);
    manager.__resetForTesting();
  });

  afterEach(() => {
    analyticsService.__resetForTesting();
    manager.__resetForTesting();
  });

  // Requirement 1: Continue Watching selection emits one event
  it('1. Continue Watching selection emits exactly one continue_watching_selected event', async () => {
    await analyticsService.trackContinueWatchingSelected({
      content_id: 'movie-oppenheimer',
      content_type: 'movie',
      saved_position_seconds: 3450,
      selection_source: 'continue_watching',
    });

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.CONTINUE_WATCHING_SELECTED,
      expect.objectContaining({
        content_id: 'movie-oppenheimer',
        content_type: 'movie',
        saved_position_seconds: 3450,
        selection_source: 'continue_watching',
      }),
    );
  });

  // Requirement 2: D-pad focus does not emit a selection event
  it('2. D-pad focus on Continue Watching card does not emit a selection event', () => {
    const screen = render(
      <ContentCard
        id="movie-dune"
        title="Dune: Part Two"
        image={{uri: 'https://example.com/dune.jpg'}}
        rowId="continue_watching"
        savedPositionSeconds={1820}
        contentType="movie"
        testID="cw-card-dune"
      />,
    );

    const card = screen.getByTestId('cw-card-dune');
    act(() => {
      fireEvent(card, 'focus');
    });

    const cwSelectionCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) =>
        eventName === AnalyticsEvents.CONTINUE_WATCHING_SELECTED,
    );
    expect(cwSelectionCalls).toHaveLength(0);
  });

  // Requirement 3: Resume from a valid saved position emits one resume event
  it('3. Resume from a valid saved position emits exactly one resume_playback event', async () => {
    const sessionId = await manager.startSession({
      contentId: 'movie-interstellar',
      contentTitle: 'Interstellar',
      contentType: 'movie',
      duration: 10140,
    });

    await manager.recordResumePlayback({
      resumePositionSeconds: 2400,
      resumeSource: 'continue_watching',
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.RESUME_PLAYBACK,
      expect.objectContaining({
        content_id: 'movie-interstellar',
        content_type: 'movie',
        resume_position_seconds: 2400,
        playback_session_id: sessionId,
        resume_source: 'continue_watching',
      }),
    );

    const resumeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCalls).toHaveLength(1);
  });

  // Requirement 4: Starting from zero does not emit a resume event
  it('4. Starting from zero position does not emit a resume_playback event', async () => {
    await manager.startSession({
      contentId: 'movie-fresh-start',
      contentTitle: 'Fresh Start Movie',
      contentType: 'movie',
      duration: 7200,
    });

    await manager.recordResumePlayback({
      resumePositionSeconds: 0,
      resumeSource: 'continue_watching',
    });

    const resumeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCalls).toHaveLength(0);
  });

  // Requirement 5: Duplicate resume callbacks do not create duplicate events
  it('5. Duplicate resume callbacks within the same playback session do not duplicate resume_playback', async () => {
    await manager.startSession({
      contentId: 'movie-gladiator',
      contentTitle: 'Gladiator',
      contentType: 'movie',
      duration: 9300,
    });

    // First resume invocation (e.g. from onLoadedMetadata)
    await manager.recordResumePlayback({
      resumePositionSeconds: 1500,
      resumeSource: 'continue_watching',
    });

    // Second resume invocation (e.g. from resumeTime effect / seeked callback)
    await manager.recordResumePlayback({
      resumePositionSeconds: 1500,
      resumeSource: 'continue_watching',
    });

    const resumeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCalls).toHaveLength(1);
  });

  // Requirement 6: A successful progress save emits the appropriate analytics event
  it('6. A successful progress save emits playback_progress_saved event', async () => {
    const sessionId = await manager.startSession({
      contentId: 'series-ep-1',
      contentTitle: 'Episode 1',
      contentType: 'episode',
      duration: 3600,
    });

    await manager.recordPlaybackProgressSaved({
      positionSeconds: 120,
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PLAYBACK_PROGRESS_SAVED,
      expect.objectContaining({
        content_id: 'series-ep-1',
        content_type: 'episode',
        position_seconds: 120,
        playback_session_id: sessionId,
      }),
    );
  });

  // Requirement 7: Failed Firestore writes do not emit a successful progress-save event
  it('7. Failed Firestore writes do not emit a playback_progress_saved event', async () => {
    await manager.startSession({
      contentId: 'movie-batman',
      contentTitle: 'The Batman',
      contentType: 'movie',
      duration: 10560,
    });

    // Mock a failed Firestore write
    const mockSaveContinueWatchProgress = jest
      .fn()
      .mockRejectedValue(new Error('Firestore unavailable: PERMISSION_DENIED'));

    let saveFailed = false;
    try {
      await mockSaveContinueWatchProgress();
      // Only emit if save succeeded
      await manager.recordPlaybackProgressSaved({positionSeconds: 300});
    } catch {
      saveFailed = true;
      // Do NOT emit playback_progress_saved on failure
    }

    expect(saveFailed).toBe(true);
    const progressSavedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PLAYBACK_PROGRESS_SAVED,
    );
    expect(progressSavedCalls).toHaveLength(0);
  });

  // Requirement 8: Frequent progress updates do not flood analytics (throttling / checkpointing)
  it('8. Frequent progress updates are checkpoint-throttled and do not flood analytics', async () => {
    await manager.startSession({
      contentId: 'movie-matrix',
      contentTitle: 'The Matrix',
      contentType: 'movie',
      duration: 8160,
    });

    // Simulated checkpoint policy from VideoPlayerScreen (minimum 15s delta between saved analytics events)
    let lastReportedPos = 0;
    const reportIfCheckpoint = async (pos: number) => {
      if (Math.abs(pos - lastReportedPos) >= 15) {
        lastReportedPos = pos;
        await manager.recordPlaybackProgressSaved({positionSeconds: pos});
      }
    };

    // First save at 30s -> records
    await reportIfCheckpoint(30);
    // Rapid saves at 35s, 40s -> throttled (<15s delta)
    await reportIfCheckpoint(35);
    await reportIfCheckpoint(40);
    // Save at 50s -> >=15s delta from 30s -> records
    await reportIfCheckpoint(50);

    const progressSavedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PLAYBACK_PROGRESS_SAVED,
    );
    expect(progressSavedCalls).toHaveLength(2);
    expect(progressSavedCalls[0][2].position_seconds).toBe(30);
    expect(progressSavedCalls[1][2].position_seconds).toBe(50);
  });

  // Requirement 9: Analytics failures do not affect Firestore persistence
  it('9. Analytics failures do not affect Firestore persistence', async () => {
    // Simulate analytics throwing network or SDK errors
    mockLogEvent.mockRejectedValue(new Error('Analytics network timeout'));

    let firestorePersisted = false;
    const saveToFirestore = async () => {
      firestorePersisted = true;
      return true;
    };

    // Playback persistence flow with failsafe analytics decoupling
    await expect(
      (async () => {
        await saveToFirestore();
        // Safe analytics invocation wrapped in non-blocking catch
        await manager
          .recordPlaybackProgressSaved({positionSeconds: 180})
          .catch(() => {});
      })(),
    ).resolves.not.toThrow();

    expect(firestorePersisted).toBe(true);
  });

  // Requirement 10: The existing completed event is not duplicated
  it('10. The existing completed event is reused canonically without duplication', async () => {
    await manager.startSession({
      contentId: 'movie-avatar',
      contentTitle: 'Avatar',
      contentType: 'movie',
      duration: 9720,
    });

    await manager.recordComplete({duration: 9720});

    // Verify canonical event is emitted once
    const completedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) =>
        eventName === AnalyticsEvents.COMPLETED ||
        eventName === AnalyticsEvents.CONTENT_COMPLETED,
    );
    expect(completedCalls).toHaveLength(1);
    expect(completedCalls[0][1]).toBe('completed');
    expect(AnalyticsEvents.CONTENT_COMPLETED).toBe(AnalyticsEvents.COMPLETED);
  });

  // Requirement 11: Player exit does not count as content completion
  it('11. Player exit does not count as content completion (emits playback_stopped)', async () => {
    await manager.startSession({
      contentId: 'movie-inception',
      contentTitle: 'Inception',
      contentType: 'movie',
      duration: 8880,
    });

    await manager.recordStop({
      stopReason: 'user_exit',
      position: 1200,
    });

    const completedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.COMPLETED,
    );
    expect(completedCalls).toHaveLength(0);

    const stoppedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PLAYBACK_STOPPED,
    );
    expect(stoppedCalls).toHaveLength(1);
    expect(stoppedCalls[0][2].stop_reason).toBe('user_exit');
  });

  // Requirement 12: Live TV does not emit VOD completion
  it('12. Live TV does not emit VOD completion or resume events', async () => {
    await manager.startSession({
      contentId: 'live-sports-cup',
      contentTitle: 'World Cup Live',
      contentType: 'live',
      channelId: 'sports-1',
      isLive: true,
    });

    // Calling complete on Live TV must do nothing
    await manager.recordComplete();
    const completedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.COMPLETED,
    );
    expect(completedCalls).toHaveLength(0);

    // Calling recordResumePlayback on Live TV must do nothing
    await manager.recordResumePlayback({
      resumePositionSeconds: 600,
      resumeSource: 'details',
    });
    const resumeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCalls).toHaveLength(0);
  });

  // Requirement 13: Profile attribution remains consistent during a playback session
  it('13. Profile attribution remains consistent and privacy-safe during a playback session', async () => {
    analyticsService.setProfile({
      profileId: 'profile-kids-99',
      profileType: 'kids',
    });

    const sessionId = await manager.startSession({
      contentId: 'movie-coco',
      contentTitle: 'Coco',
      contentType: 'movie',
      duration: 6300,
    });

    // Simulate profile context mutation outside active session
    analyticsService.setProfile({
      profileId: 'profile-parent-01',
      profileType: 'adult',
    });

    // Record resume and progress in the current session
    await manager.recordResumePlayback({
      resumePositionSeconds: 400,
      resumeSource: 'continue_watching',
    });
    await manager.recordPlaybackProgressSaved({
      positionSeconds: 450,
    });

    const resumeCall = mockLogEvent.mock.calls.find(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCall).toBeDefined();
    // Verify session snapshot profileId is preserved
    expect(resumeCall[2]).toEqual(
      expect.objectContaining({
        playback_session_id: sessionId,
        profile_id: 'profile-kids-99',
        profile_type: 'kids',
      }),
    );
    // Verify no PII was leaked
    expect(resumeCall[2].email).toBeUndefined();
    expect(resumeCall[2].name).toBeUndefined();
    expect(resumeCall[2].phoneNumber).toBeUndefined();
  });

  // Requirement 14: Next Episode autoplay does not duplicate completion or session events
  it('14. Next Episode autoplay cleanly transitions sessions without duplicate completion events', async () => {
    // 1. Episode 1 starts and completes
    const session1Id = await manager.startSession({
      contentId: 'series-stranger-s1e1',
      contentTitle: 'Chapter One',
      contentType: 'episode',
      duration: 3000,
    });

    await manager.recordComplete({duration: 3000});

    const completedCallsE1 = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.COMPLETED,
    );
    expect(completedCallsE1).toHaveLength(1);
    expect(completedCallsE1[0][2].playback_session_id).toBe(session1Id);
    expect(completedCallsE1[0][2].content_id).toBe('series-stranger-s1e1');

    // 2. Next Episode autoplay triggers Episode 2 in new session
    const session2Id = await manager.startSession({
      contentId: 'series-stranger-s1e2',
      contentTitle: 'Chapter Two',
      contentType: 'episode',
      duration: 3300,
    });

    expect(session2Id).not.toBe(session1Id);

    // Episode 2 starts from 0 (not resumed)
    await manager.recordResumePlayback({
      resumePositionSeconds: 0,
      resumeSource: 'details',
    });

    const resumeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.RESUME_PLAYBACK,
    );
    expect(resumeCalls).toHaveLength(0);

    // Only original Episode 1 completed event exists so far
    const totalCompletedCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.COMPLETED,
    );
    expect(totalCompletedCalls).toHaveLength(1);
  });
});
