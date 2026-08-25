/* global globalThis */

import {profileRepository} from '../src/profiles/data/profileRepository';

const mockFetch = jest.fn();
const mockStorage = new Map<string, string>();

jest.mock(
  '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
  () => ({
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
    },
  }),
);

beforeEach(() => {
  (globalThis as any).fetch = mockFetch;
  mockFetch.mockReset();
  mockStorage.clear();
});

describe('profileRepository', () => {
  const uid = 'test-uid-123';

  it('fetches and decodes user profiles from Firestore', async () => {
    mockStorage.set(
      '@vegaott/auth-session',
      JSON.stringify({
        user: {uid},
        idToken: 'test-token',
      }),
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            name: `projects/logixstream-bb177/databases/(default)/documents/users/${uid}/profiles/p1`,
            fields: {
              id: {stringValue: 'p1'},
              name: {stringValue: 'Anil'},
              avatarId: {stringValue: 'avatar-1'},
              isKids: {booleanValue: false},
              createdAt: {integerValue: '1000'},
              updatedAt: {integerValue: '1000'},
            },
          },
          {
            name: `projects/logixstream-bb177/databases/(default)/documents/users/${uid}/profiles/p2`,
            fields: {
              id: {stringValue: 'p2'},
              name: {stringValue: 'Kids Zone'},
              avatarId: {stringValue: 'avatar-kids-1'},
              isKids: {booleanValue: true},
              createdAt: {integerValue: '2000'},
              updatedAt: {integerValue: '2000'},
            },
          },
        ],
      }),
    });

    const profiles = await profileRepository.getProfiles(uid);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].id).toBe('p1');
    expect(profiles[0].name).toBe('Anil');
    expect(profiles[0].isKids).toBe(false);
    expect(profiles[1].id).toBe('p2');
    expect(profiles[1].name).toBe('Kids Zone');
    expect(profiles[1].isKids).toBe(true);
  });

  it('returns empty array when 404 or no profiles exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const profiles = await profileRepository.getProfiles(uid);
    expect(profiles).toEqual([]);
  });

  it('creates a profile document in Firestore', async () => {
    mockStorage.set(
      '@vegaott/auth-session',
      JSON.stringify({
        user: {uid},
        idToken: 'test-token',
      }),
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const newProfile = await profileRepository.createProfile(uid, {
      name: 'Family',
      avatarId: 'avatar-2',
      isKids: false,
    });

    expect(newProfile.name).toBe('Family');
    expect(newProfile.avatarId).toBe('avatar-2');
    expect(newProfile.isKids).toBe(false);
    expect(newProfile.id).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/`);
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body).fields.name.stringValue).toBe('Family');
  });

  it('updates an existing profile in Firestore', async () => {
    mockStorage.set(
      '@vegaott/auth-session',
      JSON.stringify({
        user: {uid},
        idToken: 'test-token',
      }),
    );

    // First call to getProfiles in updateProfile
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          documents: [
            {
              fields: {
                id: {stringValue: 'p1'},
                name: {stringValue: 'Old Name'},
                avatarId: {stringValue: 'avatar-1'},
                isKids: {booleanValue: false},
                createdAt: {integerValue: '1000'},
                updatedAt: {integerValue: '1000'},
              },
            },
          ],
        }),
      })
      // Second call for PATCH
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    const updated = await profileRepository.updateProfile(uid, 'p1', {
      name: 'New Name',
      isKids: true,
    });

    expect(updated.name).toBe('New Name');
    expect(updated.isKids).toBe(true);
    expect(updated.avatarId).toBe('avatar-1');
  });

  it('deletes a profile from Firestore', async () => {
    mockStorage.set(
      '@vegaott/auth-session',
      JSON.stringify({
        user: {uid},
        idToken: 'test-token',
      }),
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await expect(
      profileRepository.deleteProfile(uid, 'p1'),
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/users/${uid}/profiles/p1`);
    expect(options.method).toBe('DELETE');
  });
});
