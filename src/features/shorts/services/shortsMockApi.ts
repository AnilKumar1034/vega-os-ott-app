import {MOCK_SHORTS_DATA} from '../mocks/shorts.mock';
import {
  MockScenarioType,
  ShortsApiError,
  ShortsFeedParams,
  ShortsItem,
  ShortsListResponse,
  ShortsRecommendationsParams,
  ShortsSearchParams,
} from '../types/shorts.types';
import {SHORTS_API_CONFIG, SHORTS_CATEGORIES} from '../constants/shorts.constants';

declare const process: any;

let currentScenario: MockScenarioType = 'default';
let forcedDelayMs: number | null = null;

const isTestEnvironment = () => {
  return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test';
};

const getEffectiveDelay = (defaultDelay = SHORTS_API_CONFIG.SIMULATED_LATENCY_MS): number => {
  if (forcedDelayMs !== null) {
    return forcedDelayMs;
  }
  if (currentScenario === 'delayed') {
    return 1500;
  }
  return isTestEnvironment() ? 0 : defaultDelay;
};

const delay = async (ms?: number): Promise<void> => {
  const waitTime = ms ?? getEffectiveDelay();
  if (waitTime <= 0) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

const cloneShort = (item: ShortsItem): ShortsItem => ({
  ...item,
  creator: item.creator ? {...item.creator} : undefined,
  tags: item.tags ? [...item.tags] : undefined,
  availableForProfiles: item.availableForProfiles
    ? [...item.availableForProfiles]
    : undefined,
});

const cloneList = (items: ShortsItem[]): ShortsItem[] => items.map(cloneShort);

// In-memory profile interaction store
// Key: `${profileId || 'default'}:${shortId}`
const profileInteractions = new Map<
  string,
  {isLiked?: boolean; isSaved?: boolean}
>();

// Delta tracking for like counts per short: shortId -> delta
const likeCountDeltas = new Map<string, number>();

/**
 * Applies profile-specific interaction state and like-count deltas over a base short record.
 */
export const applyProfileInteractions = (
  item: ShortsItem,
  profileId?: string,
): ShortsItem => {
  const cloned = cloneShort(item);
  const effectiveProfileId = profileId || 'default';
  const key = `${effectiveProfileId}:${item.id}`;
  const interaction = profileInteractions.get(key);
  const delta = likeCountDeltas.get(item.id) || 0;

  if (interaction) {
    if (interaction.isLiked !== undefined) {
      cloned.isLiked = interaction.isLiked;
    }
    if (interaction.isSaved !== undefined) {
      cloned.isSaved = interaction.isSaved;
    }
  }

  cloned.likeCount = Math.max(0, cloned.likeCount + delta);
  return cloned;
};

export const resetMockInteractions = () => {
  profileInteractions.clear();
  likeCountDeltas.clear();
};

const evaluateScenario = async (): Promise<void> => {
  await delay();
  if (currentScenario === 'network_error') {
    const error: ShortsApiError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
    };
    throw error;
  }
  if (currentScenario === 'server_error') {
    const error: ShortsApiError = {
      code: 'SERVER_ERROR',
      message: 'Internal server error encountered while fetching Shorts.',
    };
    throw error;
  }
};

/**
 * Controlled testing / scenario switches for development and automated testing.
 */
export const setMockScenario = (scenario: MockScenarioType, delayMs?: number) => {
  currentScenario = scenario;
  forcedDelayMs = delayMs !== undefined ? delayMs : null;
};

export const getMockScenario = (): MockScenarioType => currentScenario;

export const resetMockScenario = () => {
  currentScenario = 'default';
  forcedDelayMs = null;
  resetMockInteractions();
};

/**
 * Filter unpublished records from all user-facing views.
 */
const getPublishedShorts = (): ShortsItem[] => {
  return MOCK_SHORTS_DATA.filter((item) => item.status === 'published');
};

/**
 * API 1: Get Shorts feed
 * GET /api/v1/shorts?page=1&limit=10&category=all&profileId=default
 */
export const getShortsFeed = async (
  params?: ShortsFeedParams,
): Promise<ShortsListResponse> => {
  await evaluateScenario();

  if (currentScenario === 'empty') {
    return {
      success: true,
      data: [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT,
        total: 0,
        hasNextPage: false,
      },
    };
  }

  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, params?.limit || SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT);
  const category = params?.category?.trim();
  const profileId = params?.profileId;

  let filtered = getPublishedShorts();

  // Category filter
  if (category && category.toLowerCase() !== 'all') {
    const targetCat = category.toLowerCase();
    filtered = filtered.filter(
      (item) => item.category?.toLowerCase() === targetCat,
    );
  }

  // Profile-specific filter if profileId restriction exists on item
  if (profileId) {
    filtered = filtered.filter((item) => {
      if (item.availableForProfiles && item.availableForProfiles.length > 0) {
        return item.availableForProfiles.includes(profileId);
      }
      return true;
    });
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageData = filtered.slice(startIndex, endIndex);
  const hasNextPage = endIndex < total;

  return {
    success: true,
    data: pageData.map((item) => applyProfileInteractions(item, profileId)),
    pagination: {
      page,
      limit,
      total,
      hasNextPage,
    },
  };
};

/**
 * API 2: Get Shorts details
 * GET /api/v1/shorts/:shortId
 */
export const getShortsDetails = async (
  shortId: string,
  profileId?: string,
): Promise<ShortsItem> => {
  await evaluateScenario();

  if (!shortId || typeof shortId !== 'string') {
    const error: ShortsApiError = {
      code: 'INVALID_ID',
      message: 'Invalid Short ID provided.',
    };
    throw error;
  }

  const record = MOCK_SHORTS_DATA.find((item) => item.id === shortId);

  if (!record) {
    const error: ShortsApiError = {
      code: 'NOT_FOUND',
      message: `Short with ID "${shortId}" was not found.`,
    };
    throw error;
  }

  if (record.status !== 'published') {
    const error: ShortsApiError = {
      code: 'UNPUBLISHED_CONTENT',
      message: 'This Short is not published or is currently unavailable.',
    };
    throw error;
  }

  return applyProfileInteractions(record, profileId);
};

/**
 * API 3: Get Shorts categories
 * GET /api/v1/shorts/categories
 */
export const getShortsCategories = async (): Promise<string[]> => {
  await evaluateScenario();

  if (currentScenario === 'empty') {
    return ['All'];
  }

  // Extract dynamically from published records, ensuring 'All' is at the start
  const categoriesSet = new Set<string>();
  getPublishedShorts().forEach((item) => {
    if (item.category) {
      categoriesSet.add(item.category);
    }
  });

  // Ensure established standard categories are included in order
  const standardList = Array.from(SHORTS_CATEGORIES);
  standardList.forEach((cat) => {
    if (cat !== 'All') categoriesSet.add(cat);
  });

  return ['All', ...Array.from(categoriesSet)];
};

/**
 * API 4: Get Shorts by category
 * GET /api/v1/shorts?category=:category&page=1&limit=10
 */
export const getShortsByCategory = async (
  category: string,
  page: number = 1,
  limit: number = SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT,
): Promise<ShortsListResponse> => {
  return getShortsFeed({category, page, limit});
};

/**
 * API 5: Get Shorts recommendations
 * GET /api/v1/shorts/recommendations?shortId=:shortId&limit=5
 */
export const getShortsRecommendations = async (
  params: ShortsRecommendationsParams | string,
  limitParam: number = SHORTS_API_CONFIG.MAX_RECOMMENDATIONS,
): Promise<ShortsItem[]> => {
  await evaluateScenario();

  const shortId = typeof params === 'string' ? params : params.shortId;
  const limit =
    typeof params === 'object' && params.limit !== undefined
      ? params.limit
      : limitParam;

  if (currentScenario === 'empty') {
    return [];
  }

  const allPublished = getPublishedShorts();
  const currentShort = allPublished.find((s) => s.id === shortId);

  // Exclude current short
  const candidates = allPublished.filter((s) => s.id !== shortId);

  if (!currentShort) {
    return cloneList(candidates.slice(0, limit));
  }

  // Rank candidates by matching category, shared tags, or same creator
  const scored = candidates.map((item) => {
    let score = 0;
    if (item.category === currentShort.category) {
      score += 4;
    }
    if (item.creator?.id === currentShort.creator?.id) {
      score += 2;
    }
    if (item.tags && currentShort.tags) {
      const commonTags = item.tags.filter((t) =>
        currentShort.tags?.includes(t),
      );
      score += commonTags.length;
    }
    return {item, score};
  });

  scored.sort((a, b) => b.score - a.score);

  return cloneList(scored.slice(0, limit).map((s) => s.item));
};

/**
 * API 6: Search Shorts
 * GET /api/v1/shorts/search?q=:query&page=1&limit=10
 */
export const searchShorts = async (
  params: ShortsSearchParams,
): Promise<ShortsListResponse> => {
  await evaluateScenario();

  if (currentScenario === 'empty') {
    return {
      success: true,
      data: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT,
        total: 0,
        hasNextPage: false,
      },
    };
  }

  const query = (params.q || '').trim().toLowerCase();
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT);

  if (!query) {
    return getShortsFeed({page, limit, profileId: params.profileId});
  }

  const published = getPublishedShorts();

  const matched = published.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(query);
    const descMatch = item.description.toLowerCase().includes(query);
    const catMatch = item.category?.toLowerCase().includes(query) ?? false;
    const tagMatch =
      item.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;
    const creatorMatch =
      item.creator?.name.toLowerCase().includes(query) ?? false;

    return titleMatch || descMatch || catMatch || tagMatch || creatorMatch;
  });

  const total = matched.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageData = matched.slice(startIndex, endIndex);
  const hasNextPage = endIndex < total;

  return {
    success: true,
    data: cloneList(pageData),
    pagination: {
      page,
      limit,
      total,
      hasNextPage,
    },
  };
};

/**
 * API 7: Like Short
 * POST /api/v1/shorts/:shortId/like
 */
export const likeShort = async (
  shortId: string,
  profileId?: string,
): Promise<ShortsItem> => {
  await evaluateScenario();

  if (!shortId || typeof shortId !== 'string') {
    const error: ShortsApiError = {
      code: 'INVALID_ID',
      message: 'Invalid Short ID provided.',
    };
    throw error;
  }

  const record = MOCK_SHORTS_DATA.find((item) => item.id === shortId);
  if (!record) {
    const error: ShortsApiError = {
      code: 'NOT_FOUND',
      message: `Short with ID "${shortId}" was not found.`,
    };
    throw error;
  }

  const effectiveProfileId = profileId || 'default';
  const key = `${effectiveProfileId}:${shortId}`;
  const existing = profileInteractions.get(key);

  // If not already liked by this profile, mark liked and increment like count
  if (!existing?.isLiked) {
    profileInteractions.set(key, {
      ...existing,
      isLiked: true,
    });
    const delta = likeCountDeltas.get(shortId) || 0;
    likeCountDeltas.set(shortId, delta + 1);
  }

  return applyProfileInteractions(record, profileId);
};

/**
 * API 8: Unlike Short
 * DELETE /api/v1/shorts/:shortId/like
 */
export const unlikeShort = async (
  shortId: string,
  profileId?: string,
): Promise<ShortsItem> => {
  await evaluateScenario();

  if (!shortId || typeof shortId !== 'string') {
    const error: ShortsApiError = {
      code: 'INVALID_ID',
      message: 'Invalid Short ID provided.',
    };
    throw error;
  }

  const record = MOCK_SHORTS_DATA.find((item) => item.id === shortId);
  if (!record) {
    const error: ShortsApiError = {
      code: 'NOT_FOUND',
      message: `Short with ID "${shortId}" was not found.`,
    };
    throw error;
  }

  const effectiveProfileId = profileId || 'default';
  const key = `${effectiveProfileId}:${shortId}`;
  const existing = profileInteractions.get(key);

  // If currently liked (or undefined and default record was liked), mark unliked and decrement
  const isCurrentlyLiked =
    existing?.isLiked !== undefined ? existing.isLiked : record.isLiked;

  if (isCurrentlyLiked) {
    profileInteractions.set(key, {
      ...existing,
      isLiked: false,
    });
    const delta = likeCountDeltas.get(shortId) || 0;
    if (record.likeCount + delta > 0) {
      likeCountDeltas.set(shortId, delta - 1);
    }
  }

  return applyProfileInteractions(record, profileId);
};

/**
 * API 9: Save Short
 * POST /api/v1/shorts/:shortId/save
 */
export const saveShort = async (
  shortId: string,
  profileId?: string,
): Promise<ShortsItem> => {
  await evaluateScenario();

  if (!shortId || typeof shortId !== 'string') {
    const error: ShortsApiError = {
      code: 'INVALID_ID',
      message: 'Invalid Short ID provided.',
    };
    throw error;
  }

  const record = MOCK_SHORTS_DATA.find((item) => item.id === shortId);
  if (!record) {
    const error: ShortsApiError = {
      code: 'NOT_FOUND',
      message: `Short with ID "${shortId}" was not found.`,
    };
    throw error;
  }

  const effectiveProfileId = profileId || 'default';
  const key = `${effectiveProfileId}:${shortId}`;
  const existing = profileInteractions.get(key);

  profileInteractions.set(key, {
    ...existing,
    isSaved: true,
  });

  return applyProfileInteractions(record, profileId);
};

/**
 * API 10: Unsave Short
 * DELETE /api/v1/shorts/:shortId/save
 */
export const unsaveShort = async (
  shortId: string,
  profileId?: string,
): Promise<ShortsItem> => {
  await evaluateScenario();

  if (!shortId || typeof shortId !== 'string') {
    const error: ShortsApiError = {
      code: 'INVALID_ID',
      message: 'Invalid Short ID provided.',
    };
    throw error;
  }

  const record = MOCK_SHORTS_DATA.find((item) => item.id === shortId);
  if (!record) {
    const error: ShortsApiError = {
      code: 'NOT_FOUND',
      message: `Short with ID "${shortId}" was not found.`,
    };
    throw error;
  }

  const effectiveProfileId = profileId || 'default';
  const key = `${effectiveProfileId}:${shortId}`;
  const existing = profileInteractions.get(key);

  profileInteractions.set(key, {
    ...existing,
    isSaved: false,
  });

  return applyProfileInteractions(record, profileId);
};
