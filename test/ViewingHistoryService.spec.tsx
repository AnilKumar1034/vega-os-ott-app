/* global globalThis */
import {
  clearViewingHistoryItem,
  fetchViewingHistory,
  getViewingHistoryItem,
  recordViewingHistory,
} from '../src/services/viewingHistoryService';
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

const uid = 'user-history-789';
const token = 'history-token-abc';

const mockMovie: HomeContentItem = {
  id: 'kalki',
  title: 'Kalki 2898 AD',
  genre: 'Sci-Fi',
  rating: '⭐ 7.7 / 10',
  image: {
    uri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
  },
  videoUrl:
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
};

describe('viewingHistoryService (Profile-Specific Viewing History)', () => {
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

  it('1. Initial watch records history document with watchCount = 1', async () => {
    // 1st call: getViewingHistoryItem returns 404 (not exists yet)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
    // 2nd call: PATCH to save document
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await recordViewingHistory('profile-anil', mockMovie);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [getUrl] = mockFetch.mock.calls[0];
    expect(getUrl).toContain(
      `/users/${uid}/profiles/profile-anil/history/kalki`,
    );

    const [patchUrl, patchOptions] = mockFetch.mock.calls[1];
    expect(patchUrl).toContain(
      `/users/${uid}/profiles/profile-anil/history/kalki`,
    );
    expect(patchOptions.method).toBe('PATCH');

    const body = JSON.parse(patchOptions.body);
    expect(body.fields.contentId.stringValue).toBe('kalki');
    expect(body.fields.title.stringValue).toBe('Kalki 2898 AD');
    expect(body.fields.watchCount.integerValue).toBe('1');
    expect(body.fields.lastWatchedAt.stringValue).toBeDefined();
  });

  it('2. Subsequent watch increments watchCount on existing history document', async () => {
    // 1st call: getViewingHistoryItem returns existing document with watchCount = 2
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        fields: {
          contentId: {stringValue: 'kalki'},
          title: {stringValue: 'Kalki 2898 AD'},
          watchCount: {integerValue: '2'},
          lastWatchedAt: {stringValue: '2026-08-25T10:00:00.000Z'},
        },
      }),
    });
    // 2nd call: PATCH to update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await recordViewingHistory('profile-anil', mockMovie);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, patchOptions] = mockFetch.mock.calls[1];
    const body = JSON.parse(patchOptions.body);
    expect(body.fields.watchCount.integerValue).toBe('3');
  });

  it('3. Viewing History is profile-specific (Profile A history does not leak to Profile B)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({documents: []}),
    });

    const items = await fetchViewingHistory('profile-kids');

    expect(items).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/profile-kids/history`);
  });

  it('4. fetchViewingHistory sorts items by lastWatchedAt DESC (most recently watched first)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            fields: {
              contentId: {stringValue: 'older-watched'},
              title: {stringValue: 'Older Watched'},
              watchCount: {integerValue: '1'},
              lastWatchedAt: {stringValue: '2026-08-20T10:00:00.000Z'},
            },
          },
          {
            fields: {
              contentId: {stringValue: 'recent-watched'},
              title: {stringValue: 'Recent Watched'},
              watchCount: {integerValue: '4'},
              lastWatchedAt: {stringValue: '2026-08-25T15:00:00.000Z'},
            },
          },
        ],
      }),
    });

    const items = await fetchViewingHistory('profile-anil');

    expect(items).toHaveLength(2);
    expect(items[0].contentId).toBe('recent-watched');
    expect(items[1].contentId).toBe('older-watched');
  });

  it('5. clearViewingHistoryItem deletes record from Firestore', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await clearViewingHistoryItem('profile-anil', 'kalki');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/profile-anil/history/kalki`);
    expect(options.method).toBe('DELETE');
  });

  it('6. Missing profileId returns safe empty results without network call', async () => {
    const items = await fetchViewingHistory('');
    const item = await getViewingHistoryItem('', 'kalki');
    await recordViewingHistory('', mockMovie);
    await clearViewingHistoryItem('', 'kalki');

    expect(items).toEqual([]);
    expect(item).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('7. Network failure does not throw or crash recordViewingHistory', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network disconnected'));

    await expect(
      recordViewingHistory('profile-anil', mockMovie),
    ).resolves.toBeUndefined();
  });
});
