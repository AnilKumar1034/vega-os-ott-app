import {useCallback, useEffect, useRef, useState} from 'react';
import {shortsApi} from '../services/shortsApi';
import {
  ShortsApiError,
  ShortsItem,
  ShortsPagination,
} from '../types/shorts.types';
import {SHORTS_API_CONFIG} from '../constants/shorts.constants';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {canProfileAccessContent} from '../../../utils/contentAccessPolicy';

export interface UseShortsOptions {
  initialCategory?: string;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseShortsReturn {
  shorts: ShortsItem[];
  selectedShort: ShortsItem | null;
  selectedIndex: number;
  categories: string[];
  selectedCategory: string;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: ShortsApiError | null;
  pagination: ShortsPagination;
  isEmpty: boolean;
  fetchFeed: (reset?: boolean, categoryOverride?: string) => Promise<void>;
  fetchMore: () => Promise<void>;
  selectCategory: (category: string) => Promise<void>;
  selectShort: (target: ShortsItem | number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  retry: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export const useShorts = (options: UseShortsOptions = {}): UseShortsReturn => {
  const {
    initialCategory = 'All',
    limit = SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT,
    autoFetch = true,
  } = options;

  const {activeProfile} = useProfile();
  const [shorts, setShorts] = useState<ShortsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<ShortsApiError | null>(null);
  const [pagination, setPagination] = useState<ShortsPagination>({
    page: 1,
    limit,
    total: 0,
    hasNextPage: false,
  });

  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const activeProfileRef = useRef(activeProfile);
  activeProfileRef.current = activeProfile;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filter content by active profile's maturity/parental access
  const filterForProfile = useCallback((items: ShortsItem[]): ShortsItem[] => {
    const profile = activeProfileRef.current;
    if (!profile) {
      return items;
    }
    return items.filter((item) =>
      canProfileAccessContent(profile, {
        maturityRating: item.maturityRating || item.ageRating,
      }),
    );
  }, []);

  // Fetch supported categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await shortsApi.getCategories();
      if (isMountedRef.current && cats.length > 0) {
        setCategories(cats);
      }
    } catch {
      // Non-fatal fallback
    }
  }, []);

  // Main feed fetch
  const fetchFeed = useCallback(
    async (reset: boolean = true, categoryOverride?: string) => {
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;
      const currentRequestId = ++requestIdRef.current;

      const targetCategory = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const targetPage = 1;

      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await shortsApi.getFeed({
          page: targetPage,
          limit,
          category: targetCategory,
          profileId: activeProfileRef.current?.id,
        });

        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }

        const filtered = filterForProfile(response.data);

        setShorts(filtered);
        setPagination(response.pagination);
        setSelectedIndex(0);
        setError(null);
      } catch (err: any) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }
        const apiError: ShortsApiError = {
          code: err?.code || 'UNKNOWN_ERROR',
          message: err?.message || 'Failed to load Shorts. Please try again.',
          details: err,
        };
        setError(apiError);
      } finally {
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          isFetchingRef.current = false;
        } else {
          isFetchingRef.current = false;
        }
      }
    },
    [filterForProfile, limit, selectedCategory],
  );

  // Pagination: fetch next page
  const fetchMore = useCallback(async () => {
    if (
      isFetchingRef.current ||
      loading ||
      loadingMore ||
      !pagination.hasNextPage
    ) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMore(true);
    const currentRequestId = ++requestIdRef.current;
    const nextPage = pagination.page + 1;

    try {
      const response = await shortsApi.getFeed({
        page: nextPage,
        limit,
        category: selectedCategory,
        profileId: activeProfileRef.current?.id,
      });

      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      const filtered = filterForProfile(response.data);

      setShorts((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const nonDuplicateNew = filtered.filter((s) => !existingIds.has(s.id));
        return [...prev, ...nonDuplicateNew];
      });

      setPagination(response.pagination);
    } catch (err: any) {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        // Log pagination error without completely destroying the current feed
        console.warn('Shorts pagination error:', err);
      }
    } finally {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setLoadingMore(false);
      }
      isFetchingRef.current = false;
    }
  }, [filterForProfile, limit, loading, loadingMore, pagination, selectedCategory]);

  // Category switching
  const selectCategory = useCallback(
    async (category: string) => {
      if (category === selectedCategory && !error) {
        return;
      }
      setSelectedCategory(category);
      setSelectedIndex(0);
      await fetchFeed(true, category);
    },
    [error, fetchFeed, selectedCategory],
  );

  // Search
  const search = useCallback(
    async (query: string) => {
      isFetchingRef.current = true;
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await shortsApi.search({
          q: query,
          page: 1,
          limit,
          profileId: activeProfileRef.current?.id,
        });

        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }

        const filtered = filterForProfile(response.data);
        setShorts(filtered);
        setPagination(response.pagination);
        setSelectedIndex(0);
      } catch (err: any) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }
        setError({
          code: err?.code || 'SEARCH_ERROR',
          message: err?.message || 'Failed to search Shorts.',
        });
      } finally {
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    [filterForProfile, limit],
  );

  // Selection navigation
  const selectShort = useCallback(
    (target: ShortsItem | number) => {
      if (typeof target === 'number') {
        if (target >= 0 && target < shorts.length) {
          setSelectedIndex(target);
        }
      } else {
        const idx = shorts.findIndex((s) => s.id === target.id);
        if (idx >= 0) {
          setSelectedIndex(idx);
        }
      }
    },
    [shorts],
  );

  const selectNext = useCallback(() => {
    if (shorts.length === 0) return;
    setSelectedIndex((prev) => {
      const next = prev + 1;
      if (next < shorts.length) {
        // Pre-fetch next page if approaching end
        if (next >= shorts.length - 2 && pagination.hasNextPage) {
          fetchMore();
        }
        return next;
      }
      return prev;
    });
  }, [fetchMore, pagination.hasNextPage, shorts.length]);

  const selectPrevious = useCallback(() => {
    if (shorts.length === 0) return;
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, [shorts.length]);

  // Retry action
  const retry = useCallback(async () => {
    await fetchFeed(true, selectedCategory);
  }, [fetchFeed, selectedCategory]);

  // Refetch when active profile changes
  useEffect(() => {
    if (autoFetch) {
      loadCategories();
      fetchFeed(true, selectedCategory);
    }
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedShort = shorts[selectedIndex] ?? null;
  const isEmpty = !loading && !error && shorts.length === 0;

  return {
    shorts,
    selectedShort,
    selectedIndex,
    categories,
    selectedCategory,
    loading,
    loadingMore,
    refreshing,
    error,
    pagination,
    isEmpty,
    fetchFeed,
    fetchMore,
    selectCategory,
    selectShort,
    selectNext,
    selectPrevious,
    retry,
    search,
  };
};
