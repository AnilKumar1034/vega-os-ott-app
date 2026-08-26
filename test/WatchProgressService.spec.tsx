/* global globalThis */
import {
  clearContinueWatchProgress,
  fetchContinueWatchForContent,
  fetchContinueWatchItems,
  fetchContinueWatching,
  saveContinueWatchProgress,
} from '../src/services/watchProgressService';
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

const uid = 'user-abc-123';
const token = 'test-id-token';

const mockMovieA: HomeContentItem = {
  id: 'kalki',
  title: 'Kalki 2898 AD',
  genre: 'Sci-Fi',
  rating: '8.5',
  image: {uri: 'https://example.com/kalki.jpg'},
  videoUrl: 'https://example.com/kalki.mp4',
};

describe('watchProgressService (Profile-Specific Continue Watching)', () => {
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

  it('1. Profile A saves Movie A progress under Profile A Firestore path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await saveContinueWatchProgress('profile-anil', mockMovieA, 1930, 10700);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-anil/continueWatching/kalki`,
    );
    expect(options.method).toBe('PATCH');

    const body = JSON.parse(options.body);
    expect(body.fields.contentId.stringValue).toBe('kalki');
    expect(body.fields.title.stringValue).toBe('Kalki 2898 AD');
    expect(body.fields.currentTime.doubleValue).toBe(1930);
    expect(body.fields.duration.doubleValue).toBe(10700);
    expect(body.fields.progress.doubleValue).toBeCloseTo(1930 / 10700, 4);
    expect(options.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('2. Profile B has no Movie A progress (returns empty when querying Profile B)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({documents: []}),
    });

    const records = await fetchContinueWatchItems('profile-family');

    expect(records).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-family/continueWatching`,
    );
  });

  it('3. Profile B saves separate Movie A progress with independent position', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await saveContinueWatchProgress('profile-family', mockMovieA, 500, 10700);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-family/continueWatching/kalki`,
    );
    const body = JSON.parse(options.body);
    expect(body.fields.currentTime.doubleValue).toBe(500);
  });

  it('4. Switching back to A restores Profile A progress', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        fields: {
          contentId: {stringValue: 'kalki'},
          title: {stringValue: 'Kalki 2898 AD'},
          currentTime: {doubleValue: 1930},
          duration: {doubleValue: 10700},
          progress: {doubleValue: 0.18},
          updatedAt: {stringValue: '2026-08-25T10:00:00.000Z'},
        },
      }),
    });

    const record = await fetchContinueWatchForContent('profile-anil', 'kalki');

    expect(record).not.toBeNull();
    expect(record?.contentId).toBe('kalki');
    expect(record?.currentTime).toBe(1930);
    expect(record?.progress).toBe(0.18);
    expect(mockFetch.mock.calls[0][0]).toContain(
      `/users/${uid}/profiles/profile-anil/continueWatching/kalki`,
    );
  });

  it('5. Switching back to B restores Profile B progress', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        fields: {
          contentId: {stringValue: 'kalki'},
          title: {stringValue: 'Kalki 2898 AD'},
          currentTime: {doubleValue: 500},
          duration: {doubleValue: 10700},
          progress: {doubleValue: 0.046},
          updatedAt: {stringValue: '2026-08-25T10:15:00.000Z'},
        },
      }),
    });

    const record = await fetchContinueWatchForContent(
      'profile-family',
      'kalki',
    );

    expect(record).not.toBeNull();
    expect(record?.contentId).toBe('kalki');
    expect(record?.currentTime).toBe(500);
    expect(mockFetch.mock.calls[0][0]).toContain(
      `/users/${uid}/profiles/profile-family/continueWatching/kalki`,
    );
  });

  it('6. fetchContinueWatching is an alias for fetchContinueWatchItems and sorts by updatedAt DESC', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            fields: {
              contentId: {stringValue: 'older-movie'},
              title: {stringValue: 'Older Movie'},
              currentTime: {doubleValue: 300},
              duration: {doubleValue: 1000},
              progress: {doubleValue: 0.3},
              updatedAt: {stringValue: '2026-08-20T10:00:00.000Z'},
            },
          },
          {
            fields: {
              contentId: {stringValue: 'newer-movie'},
              title: {stringValue: 'Newer Movie'},
              currentTime: {doubleValue: 600},
              duration: {doubleValue: 1000},
              progress: {doubleValue: 0.6},
              updatedAt: {stringValue: '2026-08-25T12:00:00.000Z'},
            },
          },
        ],
      }),
    });

    const results = await fetchContinueWatching('profile-anil');

    expect(results).toHaveLength(2);
    expect(results[0].contentId).toBe('newer-movie');
    expect(results[1].contentId).toBe('older-movie');
  });

  it('7. Returns safe empty result and does not crash if profileId is missing or empty', async () => {
    const emptyItems1 = await fetchContinueWatchItems('');
    const emptyItems2 = await fetchContinueWatchItems(undefined as any);
    const emptyContent1 = await fetchContinueWatchForContent('', 'kalki');
    const emptyContent2 = await fetchContinueWatchForContent(
      undefined as any,
      'kalki',
    );

    expect(emptyItems1).toEqual([]);
    expect(emptyItems2).toEqual([]);
    expect(emptyContent1).toBeNull();
    expect(emptyContent2).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('8. Playback with no active profile does not write progress', async () => {
    await saveContinueWatchProgress('', mockMovieA, 500, 1000);
    await saveContinueWatchProgress(undefined as any, mockMovieA, 500, 1000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('9. ended clears only the active profile record', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await clearContinueWatchProgress('profile-anil', 'kalki');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      `/users/${uid}/profiles/profile-anil/continueWatching/kalki`,
    );
    expect(options.method).toBe('DELETE');
  });

  it('10. Invalid currentTime and duration are rejected and not stored', async () => {
    // Negative currentTime
    await saveContinueWatchProgress('profile-anil', mockMovieA, -10, 1000);
    // NaN currentTime
    await saveContinueWatchProgress('profile-anil', mockMovieA, NaN, 1000);
    // Infinity currentTime
    await saveContinueWatchProgress('profile-anil', mockMovieA, Infinity, 1000);
    // Progress < 2% threshold
    await saveContinueWatchProgress('profile-anil', mockMovieA, 10, 1000);
    // Progress >= 100%
    await saveContinueWatchProgress('profile-anil', mockMovieA, 1000, 1000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('11. Firebase failures do not throw or crash fetch functions', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const items = await fetchContinueWatchItems('profile-anil');
    expect(items).toEqual([]);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const single = await fetchContinueWatchForContent('profile-anil', 'kalki');
    expect(single).toBeNull();
  });

  it('12. Logout does not delete remote profile progress', async () => {
    mockStorage.delete('@vegaott/auth-session');

    // Trying to save after logout safely returns without error and does not touch remote data
    await saveContinueWatchProgress('profile-anil', mockMovieA, 500, 1000);
    expect(mockFetch).not.toHaveBeenCalled();

    // Fetching after logout returns empty safely
    const items = await fetchContinueWatchItems('profile-anil');
    expect(items).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
