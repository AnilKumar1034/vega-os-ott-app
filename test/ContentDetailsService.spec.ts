import {
  resolveContentDetails,
  isSeriesContent,
  getSeriesSeasons,
  getEpisodesForSeries,
  parseCastAndCrew,
  getRelatedContent,
  getResumeStateForContent,
} from '../src/services/contentDetailsService';
import {HomeContentItem} from '../src/data/home';
import {UserProfile} from '../src/profiles/types/Profile';
import {canProfileAccessContent} from '../src/utils/contentAccessPolicy';

jest.mock('../src/services/watchProgressService', () => ({
  fetchContinueWatchForContent: jest.fn().mockImplementation(async (profileId, contentId) => {
    if (contentId === 'resumable-movie') {
      return {
        contentId: 'resumable-movie',
        title: 'Resumable Movie',
        progress: 0.45,
        currentTime: 450,
        updatedAt: new Date().toISOString(),
      };
    }
    if (contentId === 'angel-one-ep-16') {
      return {
        contentId: 'angel-one-ep-16',
        title: 'Too Short a Season',
        progress: 0.6,
        currentTime: 1200,
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }),
  clearContinueWatchProgress: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/episodeService', () => ({
  ...jest.requireActual('../src/services/episodeService'),
  getLastWatchedEpisode: jest.fn().mockImplementation(async (profileId, seriesId) => {
    if (seriesId === 'angel-one' || seriesId === 'series-angel-one') {
      return 'angel-one-ep-16';
    }
    return null;
  }),
}));

describe('ContentDetailsService', () => {
  const sampleMovie: HomeContentItem = {
    id: 'sample-movie-id',
    title: 'Interstellar Odyssey',
    description: 'An epic space voyage beyond the stars.',
    image: {uri: 'https://example.com/poster.jpg'},
    genre: 'Sci-Fi • Adventure • Drama',
    rating: '⭐ 9.2 / 10',
    cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    director: 'Christopher Nolan',
    meta: ['2024', '4K UHD', '2h 49m'],
    contentType: 'movie',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  };

  const sampleSeries: HomeContentItem = {
    id: 'angel-one',
    title: 'Star Trek: The Next Generation',
    description: 'The voyages of the starship Enterprise.',
    image: {uri: 'https://example.com/startrek.jpg'},
    genre: 'Sci-Fi • Space',
    rating: '⭐ 8.9 / 10',
    cast: 'Patrick Stewart, Jonathan Frakes, LeVar Burton',
    director: 'Gene Roddenberry',
    meta: ['2024', 'Series', 'HD'],
    contentType: 'series',
  };

  it('resolves movie metadata accurately from fallback movie or ID', async () => {
    const details = await resolveContentDetails('sample-movie-id', sampleMovie);
    expect(details).toBeTruthy();
    expect(details?.id).toBe('sample-movie-id');
    expect(details?.title).toBe('Interstellar Odyssey');
    expect(details?.genre).toContain('Sci-Fi');
  });

  it('resolves catalog items from findContentById if not passed in fallback', async () => {
    const details = await resolveContentDetails('kalki');
    expect(details).toBeTruthy();
    expect(details?.title).toContain('Kalki');
  });

  it('returns null for an invalid or non-existent content ID without fallback', async () => {
    const details = await resolveContentDetails('non-existent-content-id-12345');
    expect(details).toBeNull();
  });

  it('correctly identifies series content vs standard movie content', () => {
    expect(isSeriesContent(sampleSeries)).toBe(true);
    expect(isSeriesContent(sampleMovie)).toBe(false);

    const seriesWithMeta: HomeContentItem = {
      id: 'custom-series',
      title: 'Custom Series',
      image: {uri: 'https://example.com/pic.jpg'},
      meta: ['2023', 'TV Series'],
    };
    expect(isSeriesContent(seriesWithMeta)).toBe(true);
  });

  it('extracts unique sorted seasons for episodic series content', () => {
    const seasons = getSeriesSeasons(sampleSeries);
    expect(Array.isArray(seasons)).toBe(true);
    expect(seasons.length).toBeGreaterThanOrEqual(1);
    expect(seasons).toContain(1);
  });

  it('retrieves episodes for series and filters by selected season number', () => {
    const allEpisodes = getEpisodesForSeries(sampleSeries);
    expect(allEpisodes.length).toBeGreaterThan(0);

    const season1Episodes = getEpisodesForSeries(sampleSeries, 1);
    expect(season1Episodes.length).toBeGreaterThan(0);
    season1Episodes.forEach((ep) => {
      expect(ep.seasonNumber || 1).toBe(1);
    });

    const season99Episodes = getEpisodesForSeries(sampleSeries, 99);
    expect(season99Episodes.length).toBe(0);
  });

  it('parses cast and director strings into structured CastMember objects', () => {
    const members = parseCastAndCrew(sampleMovie);
    expect(members.length).toBe(4);

    const director = members.find((m) => m.role === 'Director');
    expect(director).toBeTruthy();
    expect(director?.name).toBe('Christopher Nolan');

    const actor = members.find((m) => m.name === 'Matthew McConaughey');
    expect(actor).toBeTruthy();
    expect(actor?.role).toBe('Cast');
  });

  it('handles content with missing cast or director gracefully without errors', () => {
    const emptyCastContent: HomeContentItem = {
      id: 'no-cast',
      title: 'No Cast Title',
      image: {uri: 'https://example.com/no-cast.jpg'},
    };
    const members = parseCastAndCrew(emptyCastContent);
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBe(0);
  });

  it('generates related content excluding the current content and deduplicates', () => {
    const adultProfile: UserProfile = {
      id: 'adult-profile-1',
      name: 'Adult',
      isKids: false,
      avatarId: 'avatar-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const related = getRelatedContent(sampleMovie, adultProfile, 5);
    expect(related.length).toBeGreaterThan(0);
    expect(related.some((item) => item.id === sampleMovie.id)).toBe(false);

    const ids = related.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('respects Kids profile restrictions when recommending related content', () => {
    const kidsProfile: UserProfile = {
      id: 'kids-profile-1',
      name: 'Kids User',
      isKids: true,
      avatarId: 'avatar-kids',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const related = getRelatedContent(sampleMovie, kidsProfile, 10);
    expect(related.length).toBeGreaterThan(0);
    related.forEach((item) => {
      expect(canProfileAccessContent(kidsProfile, item)).toBe(true);
      expect(['ALL', 'KIDS', '7_PLUS']).toContain(item.maturityRating);
    });
  });

  it('resolves resumable progress and primary action label for an in-progress movie', async () => {
    const resumableMovie: HomeContentItem = {
      id: 'resumable-movie',
      title: 'Resumable Movie',
      image: {uri: 'https://example.com/resumable.jpg'},
      contentType: 'movie',
    };

    const state = await getResumeStateForContent(resumableMovie, 'user-prof-1');
    expect(state.isResumable).toBe(true);
    expect(state.progress).toBe(0.45);
    expect(state.primaryActionLabel).toBe('▶ Resume');
  });

  it('resolves next/resumable episode for series with prior watch progress', async () => {
    const state = await getResumeStateForContent(sampleSeries, 'user-prof-1');
    expect(state.isResumable).toBe(true);
    expect(state.resumableEpisode).toBeTruthy();
    expect(state.resumableEpisode?.id).toBe('angel-one-ep-16');
    expect(state.primaryActionLabel).toContain('Resume S1:E16');
  });

  it('provides default Play label for brand new un-watched content', async () => {
    const freshMovie: HomeContentItem = {
      id: 'fresh-movie-123',
      title: 'Brand New Movie',
      image: {uri: 'https://example.com/fresh.jpg'},
      contentType: 'movie',
    };

    const state = await getResumeStateForContent(freshMovie, 'user-prof-1');
    expect(state.isResumable).toBe(false);
    expect(state.progress).toBeNull();
    expect(state.primaryActionLabel).toBe('▶ Watch');
  });
});
