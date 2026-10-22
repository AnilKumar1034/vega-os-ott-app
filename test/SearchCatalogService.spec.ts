import {
  addRecentSearch,
  buildUnifiedCatalog,
  calculateMatchScore,
  clearCatalogCache,
  clearRecentSearches,
  getRecentSearches,
  getSearchSuggestions,
  matchesFilters,
  normalizeSearchQuery,
  removeRecentSearch,
  resetRecentSearchesCache,
  searchCatalog,
  DEFAULT_SEARCH_FILTERS,
} from '../src/services/searchCatalogService';
import {UserProfile} from '../src/profiles/types/Profile';

describe('SearchCatalogService - Advanced Search & Content Discovery Logic', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult-1',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids-1',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(async () => {
    clearCatalogCache();
    resetRecentSearchesCache();
    await clearRecentSearches('profile-1');
    await clearRecentSearches('profile-2');
  });

  describe('1. normalizeSearchQuery', () => {
    it('normalizes queries by trimming, lowercasing, and collapsing whitespace', () => {
      expect(normalizeSearchQuery('   KaLki   2898   AD  ')).toBe('kalki 2898 ad');
      expect(normalizeSearchQuery('Interstellar')).toBe('interstellar');
      expect(normalizeSearchQuery('')).toBe('');
      expect(normalizeSearchQuery('   ')).toBe('');
      expect(normalizeSearchQuery(undefined)).toBe('');
      expect(normalizeSearchQuery(null as any)).toBe('');
    });
  });

  describe('2. buildUnifiedCatalog & Metadata Normalization', () => {
    it('builds a unified deduplicated catalog containing movies, series, episodes, and live TV', () => {
      const catalog = buildUnifiedCatalog();
      expect(catalog.length).toBeGreaterThan(30);

      // Verify movies exist
      const movies = catalog.filter((i) => i.contentType === 'movie');
      expect(movies.length).toBeGreaterThan(10);
      expect(movies.some((m) => m.id === 'kalki' || m.title.includes('Kalki'))).toBe(true);

      // Verify series/episodes exist
      const episodes = catalog.filter((i) => i.contentType === 'episode');
      expect(episodes.length).toBeGreaterThan(0);
      expect(episodes.some((e) => e.id.includes('angel-one'))).toBe(true);

      // Verify live channels exist
      const live = catalog.filter((i) => i.contentType === 'live');
      expect(live.length).toBeGreaterThan(0);
      expect(live.some((l) => l.badge?.includes('LIVE'))).toBe(true);
    });

    it('ensures all catalog items have valid fallback artwork and essential metadata', () => {
      const catalog = buildUnifiedCatalog();
      for (const item of catalog) {
        expect(item.id).toBeTruthy();
        expect(item.title).toBeTruthy();
        expect(item.image).toBeDefined();
        expect(item.contentType).toMatch(/^(movie|series|episode|live)$/);
        expect(Array.isArray(item.genres)).toBe(true);
      }
    });

    it('caches catalog across multiple invocations until cleared', () => {
      const first = buildUnifiedCatalog();
      const second = buildUnifiedCatalog();
      expect(first).toBe(second);

      clearCatalogCache();
      const third = buildUnifiedCatalog();
      expect(third).not.toBe(first);
      expect(third.length).toBe(first.length);
    });
  });

  describe('3. calculateMatchScore & Relevance Matching', () => {
    const catalog = buildUnifiedCatalog();
    const kalkiItem = catalog.find((i) => i.id === 'kalki')!;
    const interstellarItem = catalog.find((i) => i.id === 'interstellar')!;

    it('scores exact title matches higher than partial matches', () => {
      const exactScore = calculateMatchScore(kalkiItem, 'kalki 2898 ad');
      const partialScore = calculateMatchScore(kalkiItem, 'kalki');
      expect(exactScore).toBeGreaterThan(partialScore);
      expect(partialScore).toBeGreaterThan(0);
    });

    it('matches by actor/cast member', () => {
      // Prabhas stars in Kalki
      const score = calculateMatchScore(kalkiItem, 'prabhas');
      expect(score).toBeGreaterThan(0);
    });

    it('matches by director name', () => {
      // Christopher Nolan directed Interstellar
      const score = calculateMatchScore(interstellarItem, 'nolan');
      expect(score).toBeGreaterThan(0);
    });

    it('matches by release year', () => {
      const score = calculateMatchScore(kalkiItem, '2024');
      expect(score).toBeGreaterThan(0);
    });

    it('matches multi-token queries when all tokens are present in metadata', () => {
      // "nolan 2014" or "matthew interstellar"
      const multiScore = calculateMatchScore(interstellarItem, 'nolan 2014');
      expect(multiScore).toBeGreaterThan(0);

      // If one token does not match, score is 0
      const noMatchMulti = calculateMatchScore(interstellarItem, 'nolan dinosaurs');
      expect(noMatchMulti).toBe(0);
    });

    it('returns 0 score for completely irrelevant search queries', () => {
      const score = calculateMatchScore(kalkiItem, 'xyznonexistentkeyword');
      expect(score).toBe(0);
    });
  });

  describe('4. matchesFilters - Discovery Filtering', () => {
    const catalog = buildUnifiedCatalog();
    const kalkiItem = catalog.find((i) => i.id === 'kalki')!;
    const liveItem = catalog.find((i) => i.contentType === 'live')!;
    const episodeItem = catalog.find((i) => i.contentType === 'episode')!;

    it('filters by content type correctly', () => {
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, contentType: 'movie'})).toBe(true);
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, contentType: 'live'})).toBe(false);

      expect(matchesFilters(liveItem, {...DEFAULT_SEARCH_FILTERS, contentType: 'live'})).toBe(true);
      expect(matchesFilters(liveItem, {...DEFAULT_SEARCH_FILTERS, contentType: 'movie'})).toBe(false);

      // 'series' filter matches both series and episode content
      expect(matchesFilters(episodeItem, {...DEFAULT_SEARCH_FILTERS, contentType: 'series'})).toBe(true);
    });

    it('filters by genre correctly', () => {
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, genre: 'sci-fi'})).toBe(true);
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, genre: 'comedy'})).toBe(false);
    });

    it('filters by language correctly', () => {
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, language: 'telugu'})).toBe(true);
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, language: 'french'})).toBe(false);
    });

    it('filters by release year correctly', () => {
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, year: '2024'})).toBe(true);
      expect(matchesFilters(kalkiItem, {...DEFAULT_SEARCH_FILTERS, year: '2022'})).toBe(false);
    });
  });

  describe('5. searchCatalog - Query Execution, Sorting & Protection', () => {
    it('returns all profile-accessible items when query is empty and no filters applied', () => {
      const result = searchCatalog({
        query: '',
        activeProfile: adultProfile,
      });

      expect(result.totalCount).toBeGreaterThan(20);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.hasActiveFilters).toBe(false);
    });

    it('executes text search and ranks matching results', () => {
      const result = searchCatalog({
        query: 'Interstellar',
        activeProfile: adultProfile,
      });

      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.items[0].title.toLowerCase()).toContain('interstellar');
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it('sorts results by newest release year when requested', () => {
      const result = searchCatalog({
        query: '',
        filters: {sortBy: 'newest'},
        activeProfile: adultProfile,
      });

      expect(result.items.length).toBeGreaterThan(1);
      const firstYear = result.items[0].releaseYear || 0;
      const lastYear = result.items[result.items.length - 1].releaseYear || 0;
      expect(firstYear).toBeGreaterThanOrEqual(lastYear);
    });

    it('sorts results by rating score when requested', () => {
      const result = searchCatalog({
        query: '',
        filters: {sortBy: 'rating'},
        activeProfile: adultProfile,
      });

      expect(result.items.length).toBeGreaterThan(1);
      const topRating = result.items[0].ratingScore || 0;
      const bottomRating = result.items[result.items.length - 1].ratingScore || 0;
      expect(topRating).toBeGreaterThanOrEqual(bottomRating);
    });

    it('gracefully handles excessively long queries (> 100 characters)', () => {
      const longQuery = 'a'.repeat(120);
      const result = searchCatalog({
        query: longQuery,
        activeProfile: adultProfile,
      });

      expect(result.isQueryTooLong).toBe(true);
      expect(result.normalizedQuery.length).toBeLessThanOrEqual(100);
    });

    it('returns empty result when no item matches query or active filters', () => {
      const result = searchCatalog({
        query: 'completelyUnknownTitle123456789',
        activeProfile: adultProfile,
      });

      expect(result.totalCount).toBe(0);
      expect(result.items.length).toBe(0);
      expect(result.rows.length).toBe(0);
    });

    it('STRICTLY enforces Kids profile catalog protection: mature content is blocked', () => {
      const adultResult = searchCatalog({
        query: 'Kalki',
        activeProfile: adultProfile,
      });
      expect(adultResult.totalCount).toBeGreaterThanOrEqual(1);

      // Now run identical query under Kids profile
      const kidsResult = searchCatalog({
        query: 'Kalki',
        activeProfile: kidsProfile,
      });
      // Kalki is 13_PLUS, so it must NOT be accessible to Kids profile
      expect(kidsResult.totalCount).toBe(0);

      // But Kid-safe content like The Lion King is accessible
      const lionKingResult = searchCatalog({
        query: 'Lion King',
        activeProfile: kidsProfile,
      });
      expect(lionKingResult.totalCount).toBeGreaterThanOrEqual(1);
      for (const item of lionKingResult.items) {
        expect(item.maturityRating).toBe('KIDS');
      }
    });
  });

  describe('6. getSearchSuggestions', () => {
    it('returns empty array when query is shorter than 2 characters', () => {
      expect(getSearchSuggestions('', adultProfile)).toEqual([]);
      expect(getSearchSuggestions('a', adultProfile)).toEqual([]);
    });

    it('returns bounded suggestions matching query prefix', () => {
      const suggestions = getSearchSuggestions('int', adultProfile, 5);
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions.length).toBeLessThanOrEqual(5);
      expect(suggestions.some((s) => s.toLowerCase().includes('interstellar'))).toBe(true);
    });

    it('does NOT suggest restricted titles when activeProfile is Kids', () => {
      // "Kal" would match Kalki for adult
      const adultSuggestions = getSearchSuggestions('kal', adultProfile);
      expect(adultSuggestions.some((s) => s.toLowerCase().includes('kalki'))).toBe(true);

      // Under Kids profile, Kalki must NOT be suggested
      const kidsSuggestions = getSearchSuggestions('kal', kidsProfile);
      expect(kidsSuggestions.some((s) => s.toLowerCase().includes('kalki'))).toBe(false);
    });
  });

  describe('7. Recent Searches Persistence (Profile Isolated)', () => {
    it('saves, retrieves, and isolates recent searches per profile ID', async () => {
      await addRecentSearch('profile-1', 'Interstellar');
      await addRecentSearch('profile-1', 'Kalki');

      await addRecentSearch('profile-2', 'The Lion King');

      const profile1History = await getRecentSearches('profile-1');
      expect(profile1History).toEqual(['Kalki', 'Interstellar']);

      const profile2History = await getRecentSearches('profile-2');
      expect(profile2History).toEqual(['The Lion King']);
    });

    it('deduplicates queries and places most recent query at the top', async () => {
      await addRecentSearch('profile-1', 'Inception');
      await addRecentSearch('profile-1', 'Avatar');
      await addRecentSearch('profile-1', 'inception'); // duplicate with different casing

      const history = await getRecentSearches('profile-1');
      expect(history[0]).toBe('inception');
      expect(history.filter((q) => q.toLowerCase() === 'inception').length).toBe(1);
    });

    it('limits history to max 8 recent queries', async () => {
      for (let i = 1; i <= 12; i++) {
        await addRecentSearch('profile-1', `Movie ${i}`);
      }
      const history = await getRecentSearches('profile-1');
      expect(history.length).toBe(8);
      expect(history[0]).toBe('Movie 12');
    });

    it('supports clearing individual entry and clearing all recent searches', async () => {
      await addRecentSearch('profile-1', 'Movie A');
      await addRecentSearch('profile-1', 'Movie B');

      const afterRemove = await removeRecentSearch('profile-1', 'Movie A');
      expect(afterRemove).toEqual(['Movie B']);

      await clearRecentSearches('profile-1');
      const afterClear = await getRecentSearches('profile-1');
      expect(afterClear).toEqual([]);
    });
  });
});
