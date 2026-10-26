import {NavigationState, PartialState} from '@react-navigation/native';
import {Routes} from '../constants/routes';
import {
  analyticsService,
  AnalyticsService,
  NavigationSource,
  ScreenViewEventParams,
} from '../analytics';
import {deeplinkManager, DeeplinkManager} from '../utils/deeplink';
import {SCREEN_CLASS_MAP} from '../analytics/analyticsService';

export {SCREEN_CLASS_MAP};

/**
 * Routes that strictly require an authenticated user.
 * Unauthenticated access triggers immediate navigation.replace(Routes.Login).
 * To prevent reporting inaccessible destinations as active (Rule 4.C / 7.7),
 * the tracker suppresses screen views for these routes when user is unauthenticated.
 */
export const PROTECTED_ROUTES: ReadonlySet<string> = new Set([
  Routes.Profile,
  Routes.EditProfile,
  Routes.VideoPlayer,
  Routes.Settings,
  Routes.Subscription,
]);

export interface ActiveRouteInfo {
  name: string;
  key?: string;
  params?: any;
}

/**
 * Recursively resolves the currently active leaf route from React Navigation state,
 * properly supporting nested navigators (Rule 4.A / 7.5).
 */
export const getActiveRouteInfo = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): ActiveRouteInfo | null => {
  if (!state || !state.routes || state.routes.length === 0) {
    return null;
  }
  const index =
    typeof state.index === 'number' && state.index >= 0 && state.index < state.routes.length
      ? state.index
      : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) {
    return null;
  }
  if (route.state) {
    return (
      getActiveRouteInfo(route.state as NavigationState) || {
        name: route.name,
        key: route.key,
        params: route.params as Record<string, unknown> | undefined,
      }
    );
  }
  return {
    name: route.name,
    key: route.key,
    params: route.params as Record<string, unknown> | undefined,
  };
};

export interface RouteTransitionOptions {
  user?: unknown | null;
  authLoading?: boolean;
  isInitial?: boolean;
}

export class ScreenNavigationTracker {
  private lastTrackedScreen: string | null = null;
  private lastTrackedRouteKey: string | null = null;
  private lastAttemptedRoute: string | null = null;
  private readonly analytics: AnalyticsService;
  private readonly deeplink: DeeplinkManager;

  constructor(
    analytics: AnalyticsService = analyticsService,
    deeplink: DeeplinkManager = deeplinkManager,
  ) {
    this.analytics = analytics;
    this.deeplink = deeplink;
  }

  /**
   * Evaluates active destination candidate and records authorized, deduplicated screen view.
   */
  public async handleRoute(
    route: ActiveRouteInfo | null | undefined,
    options: RouteTransitionOptions = {},
  ): Promise<void> {
    if (!route || !route.name || typeof route.name !== 'string') {
      return;
    }

    const routeName = route.name;
    const routeKey = route.key || routeName;

    // 1. Accessibility & Authentication Protection Check (Rule 4.C / 7.7)
    // Do not count a protected destination as viewed before it is actually accessible and active.
    if (PROTECTED_ROUTES.has(routeName)) {
      if (options.authLoading) {
        // Auth resolution is in-flight; wait until auth state is settled.
        return;
      }
      if (!options.user) {
        // User is unauthenticated. This screen will immediately replace to Login.
        // Record attempted route so that redirect attribution is preserved for Login.
        this.lastAttemptedRoute = routeName;
        return;
      }
    }

    // 2. Deduplication check (Rule 4.B / 7.4 / 7.8)
    // Re-selecting the currently active route or component re-renders must not emit duplicate events.
    if (
      this.lastTrackedRouteKey === routeKey &&
      this.lastTrackedScreen === routeName
    ) {
      return;
    }

    // 3. Determine Navigation Source (Rule 1 / 4.C / 7.6 / 7.7)
    let navigationSource: NavigationSource = 'user_action';

    const pendingDeeplink = this.deeplink.getActivePendingDeeplink();
    const isDeeplinkMatch = Boolean(
      pendingDeeplink &&
        (pendingDeeplink.routeName === routeName ||
          (pendingDeeplink.destinationType === 'player' &&
            routeName === Routes.VideoPlayer) ||
          (pendingDeeplink.destinationType === 'details' &&
            routeName === Routes.MovieDetail) ||
          (pendingDeeplink.destinationType === 'search' &&
            routeName === Routes.Search) ||
          (pendingDeeplink.destinationType === 'settings' &&
            routeName === Routes.Settings) ||
          (pendingDeeplink.destinationType === 'profile' &&
            routeName === Routes.Profile) ||
          (pendingDeeplink.destinationType === 'profiles' &&
            routeName === Routes.ProfileSelection) ||
          (pendingDeeplink.destinationType === 'my_list' &&
            routeName === Routes.MyList) ||
          (pendingDeeplink.destinationType === 'home' &&
            routeName === Routes.Home) ||
          (pendingDeeplink.destinationType === 'movies' &&
            routeName === Routes.Movies) ||
          (pendingDeeplink.destinationType === 'live_tv' &&
            routeName === Routes.LiveTV)),
    );

    if (isDeeplinkMatch) {
      navigationSource = 'deep_link';
    } else if (options.isInitial || this.lastTrackedScreen === null) {
      navigationSource = 'initial_launch';
    } else if (
      (routeName === Routes.Login && route.params?.redirectTo) ||
      this.lastAttemptedRoute !== null ||
      (this.lastTrackedScreen === Routes.Login &&
        !options.authLoading &&
        options.user)
    ) {
      navigationSource = 'auth_redirect';
    } else {
      navigationSource = 'user_action';
    }

    // Clear attempted route after it has informed navigationSource
    this.lastAttemptedRoute = null;

    // 4. Previous Screen Attribution (Rule 4.D / 7.9)
    const previousScreen = options.isInitial
      ? undefined
      : this.lastTrackedScreen || undefined;

    // 5. Screen Class Normalization
    const screenClass = SCREEN_CLASS_MAP[routeName] || `${routeName}Screen`;

    // 6. Extract content parameters safely when navigating to content or player screens
    let contentId: string | undefined;
    let contentType: string | undefined;
    let contentTitle: string | undefined;
    let sourceScreen: string | undefined;
    let seriesId: string | undefined;
    let episodeId: string | undefined;

    if (
      (routeName === Routes.MovieDetail || routeName === Routes.VideoPlayer) &&
      route.params &&
      typeof route.params === 'object'
    ) {
      const p = route.params as Record<string, any>;
      const movie = p.movie;
      if (movie && typeof movie === 'object') {
        contentId = movie.id || movie.contentId || movie.content_id;
        contentType =
          movie.type ||
          movie.contentType ||
          movie.content_type ||
          (p.isLive ? 'live' : 'movie');
        contentTitle =
          movie.title ||
          movie.name ||
          movie.contentTitle ||
          movie.content_title;
        seriesId = movie.seriesId || movie.series_id;
        episodeId = movie.episodeId || movie.episode_id;
      }
      contentId = contentId || p.contentId || p.content_id || p.id;
      contentType =
        contentType ||
        p.contentType ||
        p.content_type ||
        (p.isLive ? 'live' : undefined);
      contentTitle =
        contentTitle || p.contentTitle || p.content_title || p.title;
      sourceScreen = p.sourceScreen || p.source_screen || p.source;
      seriesId = seriesId || p.seriesId || p.series_id;
      episodeId = episodeId || p.episodeId || p.episode_id;
    }

    if (typeof contentTitle === 'string' && contentTitle.length > 100) {
      contentTitle = contentTitle.substring(0, 100);
    }

    // 7. Update tracking state before async dispatch to prevent duplicate calls
    this.lastTrackedScreen = routeName;
    this.lastTrackedRouteKey = routeKey;

    // 8. Dispatch via Centralized Analytics Service
    try {
      const params: ScreenViewEventParams = {
        screen_name: routeName,
        screen_class: screenClass,
        previous_screen: previousScreen,
        navigation_source: navigationSource,
        route_key: routeKey,
        ...(contentId ? {content_id: String(contentId)} : {}),
        ...(contentType ? {content_type: String(contentType)} : {}),
        ...(contentTitle ? {content_title: String(contentTitle)} : {}),
        ...(sourceScreen ? {source_screen: String(sourceScreen)} : {}),
        ...(seriesId ? {series_id: String(seriesId)} : {}),
        ...(episodeId ? {episode_id: String(episodeId)} : {}),
      };

      await this.analytics.trackScreenView(params);
    } catch {
      // Analytics failures must NEVER interrupt navigation (Rule 5 / 7.10)
    }
  }

  public getLastTrackedScreen(): string | null {
    return this.lastTrackedScreen;
  }

  public getLastTrackedRouteKey(): string | null {
    return this.lastTrackedRouteKey;
  }

  public getLastAttemptedRoute(): string | null {
    return this.lastAttemptedRoute;
  }

  public reset(): void {
    this.lastTrackedScreen = null;
    this.lastTrackedRouteKey = null;
    this.lastAttemptedRoute = null;
    this.analytics.resetScreenTracking();
  }
}

export const screenNavigationTracker = new ScreenNavigationTracker();
