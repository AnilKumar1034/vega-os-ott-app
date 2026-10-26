import {AppState} from 'react-native';
import {homeContentRows, homeHeroSlides, HomeContentItem} from '../data/home';
import {Routes} from '../constants/routes';
import {
  AnalyticsService,
  analyticsService,
  DeeplinkType,
  DeeplinkSource,
  DeeplinkAppState,
  DeeplinkDestinationType,
  DeeplinkFailureStage,
  DeeplinkFailureReason,
} from '../analytics';

export const DEEPLINK_PREFIX = 'logixstream://';

export const DeeplinkRoutes = {
  Home: 'home',
  Movies: 'movies',
  LiveTV: 'live-tv',
  Search: 'search',
  Details: 'movie',
  Player: 'play',
  Profile: 'profile',
  Profiles: 'profiles',
  Settings: 'settings',
  MyList: 'my-list',
  Subscription: 'subscription',
} as const;

export const findContentById = (contentId?: string): HomeContentItem | null => {
  if (!contentId) {
    return null;
  }

  const allItems = [
    ...homeHeroSlides.map((slide) => ({
      id: slide.id,
      maturityRating: slide.maturityRating,
      title: slide.title,
      image: slide.image,
      badge: slide.badge,
      rating: slide.rating,
      genre: slide.genre,
      cast: slide.cast,
      director: slide.director,
      videoUrl: slide.videoUrl,
      description: slide.description,
      meta: slide.meta,
      seekbarType: slide.seekbarType,
      thumbnails: slide.thumbnails,
    })),
    ...homeContentRows.flatMap((row) => row.items),
  ];

  return allItems.find((item) => item.id === contentId) || null;
};

export const buildDeeplinkUrl = (path: string) =>
  `${DEEPLINK_PREFIX}${path.replace(/^\/+/, '')}`;

export const buildVideoDeeplinkUrl = ({
  movieId,
  seek,
}: {
  movieId: string;
  seek?: number;
}) => {
  const searchParams =
    typeof seek === 'number' && Number.isFinite(seek) && seek > 0
      ? `?seek=${Math.floor(seek)}`
      : '';
  return buildDeeplinkUrl(`${DeeplinkRoutes.Player}/${movieId}${searchParams}`);
};

export const getInitialLinkType = (url: string): DeeplinkType => {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }
  const lower = url.toLowerCase();
  if (
    lower.includes('://play') ||
    lower.includes('://movie') ||
    lower.includes('/play') ||
    lower.includes('/movie')
  ) {
    return 'content';
  }
  if (lower.includes('://search') || lower.includes('/search')) {
    return 'search';
  }
  if (
    lower.includes('://home') ||
    lower.includes('://movies') ||
    lower.includes('://live-tv') ||
    lower.includes('://my-list')
  ) {
    return 'navigation';
  }
  if (lower.includes('://settings')) {
    return 'settings';
  }
  if (
    lower.includes('://profile') ||
    lower.includes('://profiles') ||
    lower.includes('edit-profile') ||
    lower.includes('create-profile')
  ) {
    return 'profile';
  }
  if (lower.includes('://login') || lower.includes('://register')) {
    return 'auth';
  }
  return 'unknown';
};

export interface ParsedDeeplinkResult {
  success: boolean;
  linkType: DeeplinkType;
  destinationType?: DeeplinkDestinationType;
  contentType?: 'movie' | 'episode' | 'live' | 'series';
  routeName?: string;
  params: Record<string, any>;
  movieId?: string;
  seek?: number;
  query?: string;
  failureStage?: DeeplinkFailureStage;
  failureReason?: DeeplinkFailureReason;
  contentItem?: HomeContentItem | null;
}

export const parseDeeplink = (url: unknown): ParsedDeeplinkResult => {
  if (typeof url !== 'string' || !url.trim()) {
    return {
      success: false,
      linkType: 'unknown',
      failureStage: 'validation',
      failureReason: 'invalid_url',
      params: {},
    };
  }

  const trimmed = url.trim();
  const initialLinkType = getInitialLinkType(trimmed);

  if (!trimmed.startsWith(DEEPLINK_PREFIX)) {
    return {
      success: false,
      linkType: initialLinkType,
      failureStage: 'validation',
      failureReason: 'unsupported_scheme',
      params: {},
    };
  }

  const remainder = trimmed.slice(DEEPLINK_PREFIX.length);
  const [pathPart, queryPart] = remainder.split('?');

  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(pathPart || '');
  } catch {
    return {
      success: false,
      linkType: initialLinkType,
      failureStage: 'parsing',
      failureReason: 'malformed_url',
      params: {},
    };
  }

  const cleanPath = decodedPath.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) {
    return {
      success: false,
      linkType: initialLinkType,
      failureStage: 'parsing',
      failureReason: 'unsupported_route',
      params: {},
    };
  }

  const queryParams: Record<string, string> = {};
  if (queryPart) {
    const pairs = queryPart.split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const [key, val] = pair.split('=');
      try {
        const decodedKey = decodeURIComponent(key || '');
        const decodedVal = decodeURIComponent(val || '');
        if (decodedKey) {
          queryParams[decodedKey] = decodedVal;
        }
      } catch {
        // Ignore unparseable parameter pairs
      }
    }
  }

  const segments = cleanPath.split('/').filter(Boolean);
  const routeSegment = segments[0]?.toLowerCase();

  switch (routeSegment) {
    case DeeplinkRoutes.Player: {
      if (segments.length < 2 || !segments[1]) {
        return {
          success: false,
          linkType: 'content',
          failureStage: 'validation',
          failureReason: 'missing_content_id',
          params: {},
        };
      }
      const movieId = segments[1];
      const content = findContentById(movieId);
      if (!content) {
        return {
          success: false,
          linkType: 'content',
          failureStage: 'content_lookup',
          failureReason: 'content_not_found',
          params: {movieId},
        };
      }
      const seekNum = queryParams.seek ? Number(queryParams.seek) : undefined;
      const validSeek =
        typeof seekNum === 'number' && Number.isFinite(seekNum) && seekNum >= 0
          ? seekNum
          : undefined;

      return {
        success: true,
        linkType: 'content',
        destinationType: 'player',
        contentType: content.contentType || 'movie',
        routeName: Routes.VideoPlayer,
        movieId,
        seek: validSeek,
        contentItem: content,
        params: {
          movieId,
          seek: validSeek,
          fromDeeplink: true,
        },
      };
    }

    case DeeplinkRoutes.Details: {
      if (segments.length < 2 || !segments[1]) {
        return {
          success: false,
          linkType: 'content',
          failureStage: 'validation',
          failureReason: 'missing_content_id',
          params: {},
        };
      }
      const movieId = segments[1];
      const content = findContentById(movieId);
      if (!content) {
        return {
          success: false,
          linkType: 'content',
          failureStage: 'content_lookup',
          failureReason: 'content_not_found',
          params: {movieId},
        };
      }

      return {
        success: true,
        linkType: 'content',
        destinationType: 'details',
        contentType: content.contentType || 'movie',
        routeName: Routes.MovieDetail,
        movieId,
        contentItem: content,
        params: {
          movieId,
          fromDeeplink: true,
        },
      };
    }

    case DeeplinkRoutes.Search: {
      const q = queryParams.q || '';
      return {
        success: true,
        linkType: 'search',
        destinationType: 'search',
        routeName: Routes.Search,
        query: q,
        params: {
          q,
          fromDeeplink: true,
        },
      };
    }

    case DeeplinkRoutes.Home:
      return {
        success: true,
        linkType: 'navigation',
        destinationType: 'home',
        routeName: Routes.Home,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.Movies:
      return {
        success: true,
        linkType: 'navigation',
        destinationType: 'movies',
        routeName: Routes.Movies,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.LiveTV:
      return {
        success: true,
        linkType: 'navigation',
        destinationType: 'live_tv',
        routeName: Routes.LiveTV,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.MyList:
      return {
        success: true,
        linkType: 'navigation',
        destinationType: 'my_list',
        routeName: Routes.MyList,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.Settings:
      return {
        success: true,
        linkType: 'settings',
        destinationType: 'settings',
        routeName: Routes.Settings,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.Profile:
      return {
        success: true,
        linkType: 'profile',
        destinationType: 'profile',
        routeName: Routes.Profile,
        params: {fromDeeplink: true},
      };

    case DeeplinkRoutes.Profiles:
      return {
        success: true,
        linkType: 'profile',
        destinationType: 'profiles',
        routeName: Routes.ProfileSelection,
        params: {fromDeeplink: true},
      };

    case 'edit-profile':
      return {
        success: true,
        linkType: 'profile',
        destinationType: 'profile',
        routeName: Routes.EditProfile,
        params: {fromDeeplink: true},
      };

    case 'create-profile':
      return {
        success: true,
        linkType: 'profile',
        destinationType: 'profile',
        routeName: Routes.CreateProfile,
        params: {fromDeeplink: true},
      };

    case 'login':
      return {
        success: true,
        linkType: 'auth',
        destinationType: 'login',
        routeName: Routes.Login,
        params: {fromDeeplink: true},
      };

    case 'register':
      return {
        success: true,
        linkType: 'auth',
        destinationType: 'register',
        routeName: Routes.Register,
        params: {fromDeeplink: true},
      };

    default:
      return {
        success: false,
        linkType: initialLinkType,
        failureStage: 'parsing',
        failureReason: 'unsupported_route',
        params: {},
      };
  }
};

export interface ActivePendingDeeplink {
  destinationType: DeeplinkDestinationType;
  contentType?: 'movie' | 'episode' | 'live' | 'series';
  contentId?: string;
  routeName?: string;
  timestamp: number;
}

export class DeeplinkManager {
  private static instance: DeeplinkManager;
  private analytics: AnalyticsService;
  private pendingDeeplink: ActivePendingDeeplink | null = null;
  private lastProcessedUrl: string | null = null;
  private lastProcessedSource: DeeplinkSource | null = null;
  private lastProcessedTimestamp = 0;
  private lastResult: ParsedDeeplinkResult | null = null;

  constructor(analytics: AnalyticsService = analyticsService) {
    this.analytics = analytics;
  }

  public static getInstance(): DeeplinkManager {
    if (!DeeplinkManager.instance) {
      DeeplinkManager.instance = new DeeplinkManager();
    }
    return DeeplinkManager.instance;
  }

  public async handleIncomingUrl(
    url: string | null | undefined,
    source: DeeplinkSource = 'warm_start',
  ): Promise<ParsedDeeplinkResult | null> {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return null;
    }

    const trimmedUrl = url.trim();
    const now = Date.now();

    // Deduplication check: repeated delivery of the exact same deep-link within 1.5 seconds is not counted as a separate user arrival
    if (
      this.lastProcessedUrl === trimmedUrl &&
      this.lastProcessedSource === source &&
      now - this.lastProcessedTimestamp < 1500
    ) {
      return this.lastResult;
    }

    this.lastProcessedUrl = trimmedUrl;
    this.lastProcessedSource = source;
    this.lastProcessedTimestamp = now;

    const linkType = getInitialLinkType(trimmedUrl);
    const appState = this.resolveAppState(source);

    // 1. Emit deeplink_received
    try {
      await this.analytics.trackDeeplinkReceived({
        link_type: linkType,
        link_source: source,
        app_state: appState,
      });
    } catch {
      // Analytics failure must NEVER break deep link processing
    }

    // 2. Parse & Validate
    const parsed = parseDeeplink(trimmedUrl);
    this.lastResult = parsed;

    if (!parsed.success) {
      this.pendingDeeplink = null;
      try {
        await this.analytics.trackDeeplinkFailed({
          failure_stage: parsed.failureStage || 'parsing',
          failure_reason: parsed.failureReason || 'invalid_url',
          link_type: parsed.linkType || linkType,
        });
      } catch {}
      return parsed;
    }

    // 3. Emit deeplink_resolved
    try {
      await this.analytics.trackDeeplinkResolved({
        destination_type: parsed.destinationType!,
        content_type: parsed.contentType,
        resolution_source: 'deeplink_resolver',
      });
    } catch {}

    // 4. Mark active pending destination
    this.pendingDeeplink = {
      destinationType: parsed.destinationType!,
      contentType: parsed.contentType,
      contentId: parsed.movieId,
      routeName: parsed.routeName,
      timestamp: now,
    };

    return parsed;
  }

  public async onDestinationOpened(
    destinationType: DeeplinkDestinationType | string,
    contentType?: string,
  ): Promise<void> {
    if (!this.pendingDeeplink) {
      return;
    }

    // Verify destination matches
    if (
      this.pendingDeeplink.destinationType !== destinationType &&
      this.pendingDeeplink.destinationType !== 'unknown'
    ) {
      return;
    }

    const effectiveDestinationType = this.pendingDeeplink.destinationType;
    const effectiveContentType = contentType || this.pendingDeeplink.contentType;

    // Clear immediately to prevent any re-render from firing duplicate events
    this.pendingDeeplink = null;

    try {
      await this.analytics.trackDeeplinkContentOpened({
        destination_type: effectiveDestinationType,
        content_type: effectiveContentType,
        open_source: 'deeplink',
      });
    } catch {}
  }

  public async onNavigationFailed(
    reason: DeeplinkFailureReason | string = 'navigation_failed',
  ): Promise<void> {
    if (!this.pendingDeeplink) {
      return;
    }
    const linkType = this.pendingDeeplink.contentType ? 'content' : 'navigation';
    this.pendingDeeplink = null;

    try {
      await this.analytics.trackDeeplinkFailed({
        failure_stage: 'navigation_preparation',
        failure_reason: (reason as DeeplinkFailureReason) || 'navigation_failed',
        link_type: linkType,
      });
    } catch {}
  }

  public getActivePendingDeeplink(): ActivePendingDeeplink | null {
    return this.pendingDeeplink;
  }

  private testInitialUrl: string | null = null;

  public setTestInitialUrl(url: string | null): void {
    this.testInitialUrl = url;
  }

  public getTestInitialUrl(): string | null {
    return this.testInitialUrl;
  }

  public resetForTesting(): void {
    this.pendingDeeplink = null;
    this.lastProcessedUrl = null;
    this.lastProcessedSource = null;
    this.lastProcessedTimestamp = 0;
    this.lastResult = null;
    this.testInitialUrl = null;
  }

  private resolveAppState(source: DeeplinkSource): DeeplinkAppState {
    if (source === 'cold_start') {
      return 'cold_start';
    }
    try {
      const state = AppState.currentState;
      if (
        state === 'active' ||
        state === 'background' ||
        state === 'inactive'
      ) {
        return state;
      }
    } catch {}
    return 'active';
  }
}

export const deeplinkManager = DeeplinkManager.getInstance();

