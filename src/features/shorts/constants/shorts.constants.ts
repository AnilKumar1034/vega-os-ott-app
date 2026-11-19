export const SHORTS_API_CONFIG = {
  USE_MOCK_API: true,
  DEFAULT_PAGE_LIMIT: 10,
  SIMULATED_LATENCY_MS: 80,
  MAX_RECOMMENDATIONS: 5,
};

export const SHORTS_CATEGORIES = [
  'All',
  'Movie Highlights',
  'Behind the Scenes',
  'Comedy',
  'Action',
  'Entertainment',
  'Music',
  'Trailers',
  'TV Moments',
  'Interviews',
] as const;

export type ShortsCategory = (typeof SHORTS_CATEGORIES)[number];

export const SHORTS_TEST_IDS = {
  screen: 'shorts-screen',
  header: 'shorts-header',
  loading: 'shorts-loading',
  empty: 'shorts-empty-state',
  error: 'shorts-error-state',
  retryButton: 'shorts-retry-button',
  resetFilterButton: 'shorts-reset-filter-button',
  categoryTabs: 'shorts-category-tabs',
  categoryTab: (category: string) => `shorts-category-${category.toLowerCase().replace(/\s+/g, '-')}`,
  card: (id: string) => `shorts-card-${id}`,
  metadata: 'shorts-metadata',
  preview: 'shorts-preview',
  nextButton: 'shorts-next-button',
  prevButton: 'shorts-prev-button',
  feedRail: 'shorts-feed-rail',
  player: 'shorts-player',
  playerSurface: 'shorts-player-surface',
  playerControls: 'shorts-player-controls',
  playPauseButton: 'shorts-play-pause-button',
  replayButton: 'shorts-replay-button',
  playerErrorRetryButton: 'shorts-player-error-retry-button',
  playerBuffering: 'shorts-player-buffering',
};

export const DEFAULT_SHORTS_FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=720&q=80';
