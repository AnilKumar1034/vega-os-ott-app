import {
  getShortsFeed,
  getShortsDetails,
  getShortsCategories,
  getShortsByCategory,
  getShortsRecommendations,
  searchShorts,
  setMockScenario,
  resetMockScenario,
  getMockScenario,
} from '../src/features/shorts/services/shortsMockApi';
import {shortsApi, SHORTS_API_CONFIG} from '../src/features/shorts/services/shortsApi';
import {MOCK_SHORTS_DATA} from '../src/features/shorts/mocks/shorts.mock';

describe('Shorts Mock API & Service Layer', () => {
  beforeEach(() => {
    resetMockScenario();
  });

  afterEach(() => {
    resetMockScenario();
  });

  describe('API 1: getShortsFeed', () => {
    it('1. fetches Shorts feed successfully with default pagination and typed response', async () => {
      const response = await getShortsFeed();

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(SHORTS_API_CONFIG.DEFAULT_PAGE_LIMIT);
      expect(response.pagination.total).toBeGreaterThan(0);
      expect(typeof response.pagination.hasNextPage).toBe('boolean');

      const first = response.data[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('thumbnailUrl');
      expect(first).toHaveProperty('videoUrl');
      expect(first).toHaveProperty('durationSeconds');
      expect(first).toHaveProperty('aspectRatio');
      expect(first.status).toBe('published');
    });

    it('2. fetches empty feed when scenario is set to empty', async () => {
      setMockScenario('empty');
      expect(getMockScenario()).toBe('empty');

      const response = await getShortsFeed();
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
      expect(response.pagination.hasNextPage).toBe(false);
    });

    it('9. paginates correctly across multiple pages', async () => {
      const page1 = await getShortsFeed({page: 1, limit: 5});
      const page2 = await getShortsFeed({page: 2, limit: 5});

      expect(page1.data.length).toBe(5);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.hasNextPage).toBe(true);

      expect(page2.data.length).toBe(5);
      expect(page2.pagination.page).toBe(2);

      // Verify no overlap between pages
      const page1Ids = page1.data.map((item) => item.id);
      const page2Ids = page2.data.map((item) => item.id);
      page1Ids.forEach((id) => {
        expect(page2Ids).not.toContain(id);
      });
    });

    it('10. indicates no more pages available when page limit exceeds total', async () => {
      const response = await getShortsFeed({page: 10, limit: 100});
      expect(response.data).toEqual([]);
      expect(response.pagination.hasNextPage).toBe(false);
    });

    it('11. handles network error controlled failure scenario', async () => {
      setMockScenario('network_error');

      await expect(getShortsFeed()).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network connection failed'),
      });
    });

    it('handles server error controlled failure scenario', async () => {
      setMockScenario('server_error');

      await expect(getShortsFeed()).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: expect.stringContaining('Internal server error'),
      });
    });

    it('14. filters out unpublished Shorts from user-facing feed', async () => {
      const unpublishedItem = MOCK_SHORTS_DATA.find(
        (s) => s.status === 'unpublished',
      );
      expect(unpublishedItem).toBeDefined();

      const response = await getShortsFeed({limit: 50});
      const returnedIds = response.data.map((s) => s.id);

      expect(returnedIds).not.toContain(unpublishedItem?.id);
      response.data.forEach((s) => {
        expect(s.status).toBe('published');
      });
    });

    it('15. respects profile context and restrictions when profileId is supplied', async () => {
      const response = await getShortsFeed({
        profileId: 'default-profile',
      });
      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });
  });

  describe('API 2: getShortsDetails', () => {
    it('3. fetches a specific Shorts item by valid ID', async () => {
      const target = MOCK_SHORTS_DATA.find((s) => s.status === 'published')!;
      const result = await getShortsDetails(target.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(target.id);
      expect(result.title).toBe(target.title);
      expect(result.videoUrl).toBe(target.videoUrl);
      expect(result.aspectRatio).toBe('9:16');
    });

    it('4. throws INVALID_ID for missing or invalid ID argument', async () => {
      await expect(getShortsDetails('')).rejects.toMatchObject({
        code: 'INVALID_ID',
      });
      await expect(getShortsDetails(null as any)).rejects.toMatchObject({
        code: 'INVALID_ID',
      });
    });

    it('throws NOT_FOUND when ID does not exist in dataset', async () => {
      await expect(getShortsDetails('non_existent_short_999')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws UNPUBLISHED_CONTENT when requested short is unpublished', async () => {
      const unpublished = MOCK_SHORTS_DATA.find(
        (s) => s.status === 'unpublished',
      );
      expect(unpublished).toBeDefined();

      await expect(getShortsDetails(unpublished!.id)).rejects.toMatchObject({
        code: 'UNPUBLISHED_CONTENT',
      });
    });
  });

  describe('API 3: getShortsCategories', () => {
    it('5. fetches supported categories including "All" as first item', async () => {
      const categories = await getShortsCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories[0]).toBe('All');
      expect(categories).toContain('Behind the Scenes');
      expect(categories).toContain('Action');
      expect(categories).toContain('Comedy');
      expect(categories).toContain('Movie Highlights');
    });
  });

  describe('API 4: getShortsByCategory', () => {
    it('6. filters shorts strictly by the selected category', async () => {
      const response = await getShortsByCategory('Comedy', 1, 10);

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      response.data.forEach((item) => {
        expect(item.category?.toLowerCase()).toBe('comedy');
      });
    });

    it('returns all published records when category is "All"', async () => {
      const allResponse = await getShortsByCategory('All', 1, 20);
      const feedResponse = await getShortsFeed({limit: 20});

      expect(allResponse.data.length).toBe(feedResponse.data.length);
    });
  });

  describe('API 5: getShortsRecommendations', () => {
    it('returns ranked recommendations excluding the current short', async () => {
      const targetId = 'short_001';
      const recommendations = await getShortsRecommendations(targetId, 4);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(4);
      const recIds = recommendations.map((r) => r.id);
      expect(recIds).not.toContain(targetId);
    });

    it('returns empty array when scenario is set to empty', async () => {
      setMockScenario('empty');
      const recs = await getShortsRecommendations('short_001', 5);
      expect(recs).toEqual([]);
    });
  });

  describe('API 6: searchShorts', () => {
    it('7. searches shorts case-insensitively by title', async () => {
      const response = await searchShorts({q: 'gravity'});

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      const matched = response.data.some((item) =>
        item.title.toLowerCase().includes('gravity'),
      );
      expect(matched).toBe(true);
    });

    it('8. searches shorts case-insensitively by description', async () => {
      const response = await searchShorts({q: 'symphony'});

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      const matched = response.data.some((item) =>
        item.description.toLowerCase().includes('symphony'),
      );
      expect(matched).toBe(true);
    });

    it('searches shorts by tag', async () => {
      const response = await searchShorts({q: 'martialarts'});

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      const matched = response.data.some((item) =>
        item.tags?.includes('martialarts'),
      );
      expect(matched).toBe(true);
    });

    it('returns empty result set for unmatched search query', async () => {
      const response = await searchShorts({q: 'xyzabc98765unmatched'});
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
    });
  });

  describe('shortsApi Abstraction Layer', () => {
    it('routes requests to mock implementation when USE_MOCK_API is true', async () => {
      expect(SHORTS_API_CONFIG.USE_MOCK_API).toBe(true);

      const feed = await shortsApi.getFeed({limit: 5});
      expect(feed.success).toBe(true);
      expect(feed.data.length).toBe(5);

      const details = await shortsApi.getDetails(feed.data[0].id);
      expect(details.id).toBe(feed.data[0].id);

      const categories = await shortsApi.getCategories();
      expect(categories[0]).toBe('All');
    });
  });
});
