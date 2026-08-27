/* global globalThis */
import {
  addToWatchlist,
  fetchWatchlist,
  getWatchlistItem,
  isInWatchlist,
  removeFromWatchlist,
} from '../src/services/watchlistService';
import {HomeContentItem} from '../src/data/home';

const mockStorage = new Map<string, string>();

jest.mock(
  '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
  () => ({
    default: {
      getItem: jest.fn(async (key: string) => mockStorage.get(key) || null),
      setItem: jest.fn(async (key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
    },
  }),
);

const uid = 'user-test-456';
const token = 'test-token-xyz';

const mockMovieA: HomeContentItem = {
  id: 'kalki',
  title: 'Kalki 2898 AD',
  genre: 'Sci-Fi',
  rating: '⭐ 7.7 / 10',
  image: {uri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg'},
  videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
};

const mockMovieB: HomeContentItem = {
  id: 'jawan',
  title: 'Jawan',
  genre: 'Action',
  rating: '⭐ 7.0 / 10',
  image: {uri: 'https://image.tmdb.org/t/p/w780/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg'},
  videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
};

describe('watchlistService (Profile-Specific Watchlist / My List)', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockStorage.set(
      '@vegaott/auth-session',
      JSON.stringify({
        user: {uid},
        idToken: token,
      }),
    );

    mockFetch = jest.fn();
    (globalThis as any).fetch = mockFetch;
  });

  it('1. Profile A adds Movie A under Profile A Firestore path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await addToWatchlist('profile-a', mockMovieA);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-a/watchlist/kalki`,
    );
    expect(options.method).toBe('PATCH');

    const body = JSON.parse(options.body);
    expect(body.fields.contentId.stringValue).toBe('kalki');
    expect(body.fields.title.stringValue).toBe('Kalki 2898 AD');
    expect(body.fields.genre.stringValue).toBe('Sci-Fi');
    expect(options.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('2. Profile A adding duplicate Movie A uses deterministic document ID without duplicates (idempotent)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await addToWatchlist('profile-a', mockMovieA);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-a/watchlist/kalki`,
    );
  });

  it('3. Profile A removes Movie A from Firestore', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await removeFromWatchlist('profile-a', 'kalki');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-a/watchlist/kalki`,
    );
    expect(options.method).toBe('DELETE');
  });

  it('4. Profile B does not see Profile A Movie A (Profile B query returns empty)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({documents: []}),
    });

    const items = await fetchWatchlist('profile-b');

    expect(items).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/profile-b/watchlist`);
  });

  it('5. Profile B can independently add Movie A', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await addToWatchlist('profile-b', mockMovieA);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/profile-b/watchlist/kalki`);
  });

  it('6. Sorting: returns watchlist items sorted newest first (addedAt DESC)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            fields: {
              contentId: {stringValue: 'older-movie'},
              title: {stringValue: 'Older Movie'},
              addedAt: {stringValue: '2026-08-20T10:00:00.000Z'},
            },
          },
          {
            fields: {
              contentId: {stringValue: 'newer-movie'},
              title: {stringValue: 'Newer Movie'},
              addedAt: {stringValue: '2026-08-25T12:00:00.000Z'},
            },
          },
        ],
      }),
    });

    const results = await fetchWatchlist('profile-a');

    expect(results).toHaveLength(2);
    expect(results[0].contentId).toBe('newer-movie');
    expect(results[1].contentId).toBe('older-movie');
  });

  it('7. isInWatchlist correctly checks presence of item', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        fields: {
          contentId: {stringValue: 'kalki'},
          title: {stringValue: 'Kalki 2898 AD'},
          addedAt: {stringValue: '2026-08-25T10:00:00.000Z'},
        },
      }),
    });

    const isPresent = await isInWatchlist('profile-a', 'kalki');
    expect(isPresent).toBe(true);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const isAbsent = await isInWatchlist('profile-a', 'not-present');
    expect(isAbsent).toBe(false);
  });

  it('8. Missing or empty profileId returns safe empty result without calling Firestore', async () => {
    const empty1 = await fetchWatchlist('');
    const empty2 = await fetchWatchlist(undefined as any);
    const item1 = await getWatchlistItem('', 'kalki');
    const inList1 = await isInWatchlist('', 'kalki');

    await addToWatchlist('', mockMovieA);
    await removeFromWatchlist('', 'kalki');

    expect(empty1).toEqual([]);
    expect(empty2).toEqual([]);
    expect(item1).toBeNull();
    expect(inList1).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('9. Firebase network errors do not crash fetchWatchlist or getWatchlistItem', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network offline'));
    const items = await fetchWatchlist('profile-a');
    expect(items).toEqual([]);

    mockFetch.mockRejectedValueOnce(new Error('Network offline'));
    const item = await getWatchlistItem('profile-a', 'kalki');
    expect(item).toBeNull();
  });

  it('10. Firebase write error in addToWatchlist throws descriptive error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({error: {message: 'PERMISSION_DENIED'}}),
    });

    await expect(addToWatchlist('profile-a', mockMovieA)).rejects.toThrow(
      'PERMISSION_DENIED',
    );
  });

  it('11. Unauthenticated session safely returns without making network requests', async () => {
    mockStorage.delete('@vegaott/auth-session');

    const items = await fetchWatchlist('profile-a');
    expect(items).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();

    await addToWatchlist('profile-a', mockMovieA);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
