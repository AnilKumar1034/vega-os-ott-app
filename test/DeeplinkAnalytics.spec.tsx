import {
  deeplinkManager,
  parseDeeplink,
  buildVideoDeeplinkUrl,
} from '../src/utils/deeplink';
import {analyticsService} from '../src/analytics';
import {Routes} from '../src/constants/routes';

// Mock analytics track methods to spy on invocations
describe('Day 9 — Deep-Link Analytics (LogiXstream)', () => {
  let trackSpy: jest.SpyInstance;
  let trackDeeplinkReceivedSpy: jest.SpyInstance;
  let trackDeeplinkResolvedSpy: jest.SpyInstance;
  let trackDeeplinkFailedSpy: jest.SpyInstance;
  let trackDeeplinkContentOpenedSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    deeplinkManager.resetForTesting();

    trackSpy = jest.spyOn(analyticsService, 'track').mockResolvedValue(undefined);
    trackDeeplinkReceivedSpy = jest.spyOn(analyticsService, 'trackDeeplinkReceived');
    trackDeeplinkResolvedSpy = jest.spyOn(analyticsService, 'trackDeeplinkResolved');
    trackDeeplinkFailedSpy = jest.spyOn(analyticsService, 'trackDeeplinkFailed');
    trackDeeplinkContentOpenedSpy = jest.spyOn(analyticsService, 'trackDeeplinkContentOpened');
  });

  afterEach(() => {
    trackSpy.mockRestore();
    trackDeeplinkReceivedSpy.mockRestore();
    trackDeeplinkResolvedSpy.mockRestore();
    trackDeeplinkFailedSpy.mockRestore();
    trackDeeplinkContentOpenedSpy.mockRestore();
    deeplinkManager.resetForTesting();
  });

  describe('1. Supported link emits deeplink_received once', () => {
    it('emits deeplink_received once on arrival with privacy-safe parameters', async () => {
      const url = 'logixstream://play/horizon';
      await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          link_type: 'content',
          link_source: 'warm_start',
        }),
      );

      // Verify raw URL is strictly excluded from payload
      expect(trackDeeplinkReceivedSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.anything(),
          rawUrl: expect.anything(),
        }),
      );
    });

    it('emits deeplink_received for search deep link with link_type search', async () => {
      const url = 'logixstream://search?q=comedy';
      await deeplinkManager.handleIncomingUrl(url, 'cold_start');

      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          link_type: 'search',
          link_source: 'cold_start',
          app_state: 'cold_start',
        }),
      );
    });
  });

  describe('2. Successfully parsed and validated link emits deeplink_resolved once', () => {
    it('emits deeplink_resolved once with destination_type player and content_type movie', async () => {
      const url = 'logixstream://play/horizon';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(true);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'player',
          content_type: 'movie',
          resolution_source: 'deeplink_resolver',
        }),
      );
    });

    it('emits deeplink_resolved once for movie details destination', async () => {
      const url = 'logixstream://movie/horizon';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(true);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'details',
          content_type: 'movie',
          resolution_source: 'deeplink_resolver',
        }),
      );
    });

    it('emits deeplink_resolved once for search destination', async () => {
      const url = 'logixstream://search?q=action';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(true);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'search',
          resolution_source: 'deeplink_resolver',
        }),
      );
    });
  });

  describe('3. Successfully opened destination emits deeplink_content_opened once', () => {
    it('emits deeplink_content_opened once when target destination opens', async () => {
      await deeplinkManager.handleIncomingUrl('logixstream://play/horizon', 'warm_start');

      // First open call (screen mount)
      await deeplinkManager.onDestinationOpened('player', 'movie');

      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'player',
          content_type: 'movie',
          open_source: 'deeplink',
        }),
      );

      // Subsequent call (e.g. re-render, playback progress, pause/play) must NOT emit again
      await deeplinkManager.onDestinationOpened('player', 'movie');
      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledTimes(1);
    });

    it('emits deeplink_content_opened once for details screen', async () => {
      await deeplinkManager.handleIncomingUrl('logixstream://movie/horizon', 'warm_start');
      await deeplinkManager.onDestinationOpened('details', 'movie');

      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'details',
          content_type: 'movie',
          open_source: 'deeplink',
        }),
      );
    });
  });

  describe('4. Invalid or unsupported link emits safe, normalized deeplink_failed event', () => {
    it('emits deeplink_failed for unsupported URL scheme', async () => {
      const url = 'https://google.com/search';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(false);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'validation',
          failure_reason: 'unsupported_scheme',
        }),
      );
      expect(trackDeeplinkResolvedSpy).not.toHaveBeenCalled();
      expect(trackDeeplinkContentOpenedSpy).not.toHaveBeenCalled();
    });

    it('emits deeplink_failed for malformed URL path', async () => {
      const url = 'logixstream://%E0%A4%A';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(false);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'parsing',
          failure_reason: 'malformed_url',
        }),
      );
      expect(trackDeeplinkResolvedSpy).not.toHaveBeenCalled();
    });

    it('emits deeplink_failed for unsupported route', async () => {
      const url = 'logixstream://unsupported_route_123';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(false);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'parsing',
          failure_reason: 'unsupported_route',
        }),
      );
      expect(trackDeeplinkResolvedSpy).not.toHaveBeenCalled();
    });

    it('emits deeplink_failed for missing content ID on content routes', async () => {
      const url = 'logixstream://play';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(false);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'validation',
          failure_reason: 'missing_content_id',
          link_type: 'content',
        }),
      );
      expect(trackDeeplinkResolvedSpy).not.toHaveBeenCalled();
    });

    it('emits deeplink_failed for content lookup failure when movie is not in catalog', async () => {
      const url = 'logixstream://play/nonexistent_movie_id_999';
      const result = await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(result?.success).toBe(false);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'content_lookup',
          failure_reason: 'content_not_found',
          link_type: 'content',
        }),
      );
      expect(trackDeeplinkResolvedSpy).not.toHaveBeenCalled();
      expect(trackDeeplinkContentOpenedSpy).not.toHaveBeenCalled();
    });
  });

  describe('5. Navigation failure does not emit a success event', () => {
    it('emits deeplink_failed and does not emit deeplink_content_opened when navigation fails', async () => {
      await deeplinkManager.handleIncomingUrl('logixstream://play/horizon', 'warm_start');

      // Navigation fails before reaching destination
      await deeplinkManager.onNavigationFailed('navigation_failed');

      expect(trackDeeplinkFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_stage: 'navigation_preparation',
          failure_reason: 'navigation_failed',
        }),
      );
      expect(trackDeeplinkContentOpenedSpy).not.toHaveBeenCalled();

      // Ensure that if a screen subsequently mounts, it cannot open the failed deep link
      await deeplinkManager.onDestinationOpened('player', 'movie');
      expect(trackDeeplinkContentOpenedSpy).not.toHaveBeenCalled();
    });
  });

  describe('6. Protected destination redirect through authentication flow', () => {
    it('does not emit deeplink_content_opened when unauthenticated, and emits once after user authenticates', async () => {
      // Step 1: Deep link arrives and resolves to player
      await deeplinkManager.handleIncomingUrl('logixstream://play/horizon', 'warm_start');
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);

      // Step 2: VideoPlayer mounts while unauthenticated; user is redirected to Login
      // VideoPlayer does NOT call onDestinationOpened while unauthenticated!
      // Login screen mounts; Login does NOT call onDestinationOpened for player
      expect(trackDeeplinkContentOpenedSpy).not.toHaveBeenCalled();

      // Step 3: User logs in successfully and is redirected to VideoPlayer
      // VideoPlayer mounts with authenticated user -> onDestinationOpened is called
      await deeplinkManager.onDestinationOpened('player', 'movie');

      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          destination_type: 'player',
          content_type: 'movie',
          open_source: 'deeplink',
        }),
      );

      // Ensure no duplicate on subsequent render
      await deeplinkManager.onDestinationOpened('player', 'movie');
      expect(trackDeeplinkContentOpenedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Cold-start and warm-start deduplication', () => {
    it('deduplicates identical cold-start delivery attempts', async () => {
      const url = 'logixstream://play/horizon';
      await deeplinkManager.handleIncomingUrl(url, 'cold_start');
      await deeplinkManager.handleIncomingUrl(url, 'cold_start');

      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);
    });

    it('deduplicates rapid repeated warm-start delivery of the exact same link', async () => {
      const url = 'logixstream://search?q=space';
      await deeplinkManager.handleIncomingUrl(url, 'warm_start');
      await deeplinkManager.handleIncomingUrl(url, 'warm_start');

      expect(trackDeeplinkReceivedSpy).toHaveBeenCalledTimes(1);
      expect(trackDeeplinkResolvedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('8. Search and playback links preserve their existing behavior', () => {
    it('correctly maps search query in parseDeeplink', () => {
      const parsed = parseDeeplink('logixstream://search?q=action');
      expect(parsed.success).toBe(true);
      expect(parsed.linkType).toBe('search');
      expect(parsed.destinationType).toBe('search');
      expect(parsed.routeName).toBe(Routes.Search);
      expect(parsed.params.q).toBe('action');
    });

    it('correctly maps playback route with movieId and seek position', () => {
      const parsed = parseDeeplink('logixstream://play/horizon?seek=90');
      expect(parsed.success).toBe(true);
      expect(parsed.linkType).toBe('content');
      expect(parsed.destinationType).toBe('player');
      expect(parsed.routeName).toBe(Routes.VideoPlayer);
      expect(parsed.movieId).toBe('horizon');
      expect(parsed.seek).toBe(90);
      expect(parsed.params.seek).toBe(90);
    });
  });

  describe('9. Playback-position parameter remains functional', () => {
    it('extracts positive finite seek target and ignores invalid negative/NaN values', () => {
      const valid = parseDeeplink('logixstream://play/horizon?seek=150');
      expect(valid.seek).toBe(150);

      const negative = parseDeeplink('logixstream://play/horizon?seek=-20');
      expect(negative.seek).toBeUndefined();

      const nonNumeric = parseDeeplink('logixstream://play/horizon?seek=abc');
      expect(nonNumeric.seek).toBeUndefined();
    });

    it('buildVideoDeeplinkUrl generates correct seek parameter', () => {
      const url = buildVideoDeeplinkUrl({movieId: 'horizon', seek: 45.7});
      expect(url).toBe('logixstream://play/horizon?seek=45');

      const urlNoSeek = buildVideoDeeplinkUrl({movieId: 'horizon'});
      expect(urlNoSeek).toBe('logixstream://play/horizon');
    });
  });

  describe('10. Analytics failures do not prevent destination from opening', () => {
    it('handles analytics track failures gracefully without throwing', async () => {
      trackDeeplinkReceivedSpy.mockRejectedValueOnce(new Error('Firebase offline'));
      trackDeeplinkResolvedSpy.mockRejectedValueOnce(new Error('Network error'));
      trackDeeplinkContentOpenedSpy.mockRejectedValueOnce(new Error('Storage failure'));

      // Link arrival & resolution should not throw
      const result = await deeplinkManager.handleIncomingUrl('logixstream://play/horizon', 'warm_start');
      expect(result?.success).toBe(true);

      // Destination opening should not throw
      await expect(
        deeplinkManager.onDestinationOpened('player', 'movie'),
      ).resolves.not.toThrow();
    });
  });

  describe('11. Privacy safety: payloads never contain raw URLs, tokens, or PII', () => {
    it('ensures deeplink_received payload contains no raw URLs, queries, or tokens', async () => {
      const sensitiveUrl =
        'logixstream://play/horizon?token=secret123&auth=tokenabc&email=user@test.com&seek=50';
      await deeplinkManager.handleIncomingUrl(sensitiveUrl, 'warm_start');

      const payload = trackDeeplinkReceivedSpy.mock.calls[0][0];
      const serialized = JSON.stringify(payload).toLowerCase();

      expect(serialized).not.toContain('secret123');
      expect(serialized).not.toContain('tokenabc');
      expect(serialized).not.toContain('user@test.com');
      expect(serialized).not.toContain('logixstream');
      expect(serialized).not.toContain('http');
      expect(payload).toEqual({
        link_type: 'content',
        link_source: 'warm_start',
        app_state: expect.any(String),
      });
    });

    it('ensures deeplink_failed payload contains no raw URLs or exception objects', async () => {
      const malformedUrl = 'logixstream://unknown?token=secretXYZ&pass=1234';
      await deeplinkManager.handleIncomingUrl(malformedUrl, 'warm_start');

      const payload = trackDeeplinkFailedSpy.mock.calls[0][0];
      const serialized = JSON.stringify(payload).toLowerCase();

      expect(serialized).not.toContain('secretxyz');
      expect(serialized).not.toContain('1234');
      expect(serialized).not.toContain('logixstream');
      expect(payload).toEqual({
        failure_stage: 'parsing',
        failure_reason: 'unsupported_route',
        link_type: 'unknown',
      });
    });
  });
});
