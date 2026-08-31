import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import {AuthContext} from '../src/context/authContext';
import {
  ProfileProvider,
  ACTIVE_PROFILE_STORAGE_KEY,
} from '../src/profiles/context/ProfileProvider';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {profileRepository} from '../src/profiles/data/profileRepository';
import {UserProfile} from '../src/profiles/types/Profile';

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

jest.mock('../src/profiles/data/profileRepository');

const mockUser = {uid: 'user-123', email: 'test@example.com'};

let latestProfileContext: ReturnType<typeof useProfile> | null = null;

const TestHarness = () => {
  const context = useProfile();
  latestProfileContext = context;

  return (
    <View testID="test-harness">
      <Text testID="loading-state">
        {context.isLoadingProfiles ? 'loading' : 'ready'}
      </Text>
      <Text testID="profiles-count">{context.profiles.length.toString()}</Text>
      <Text testID="active-profile-name">
        {context.activeProfile ? context.activeProfile.name : 'no-active'}
      </Text>
      <Text testID="active-profile-id">
        {context.activeProfile ? context.activeProfile.id : 'no-id'}
      </Text>
      <TouchableOpacity
        testID="btn-create"
        onPress={() =>
          context.createProfile({
            name: 'New Profile',
            avatarId: 'avatar-1',
            isKids: false,
          })
        }
      />
    </View>
  );
};

const renderWithProviders = () => {
  return render(
    <AuthContext.Provider
      value={{
        user: mockUser,
        userProfile: null,
        loading: false,
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
      }}>
      <ProfileProvider>
        <TestHarness />
      </ProfileProvider>
    </AuthContext.Provider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.clear();
  latestProfileContext = null;
});

describe('ProfileContext & ProfileProvider', () => {
  it('handles zero profiles gracefully', async () => {
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([]);

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    expect(screen.getByTestId('profiles-count').props.children).toBe('0');
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'no-active',
    );
  });

  it('creates first profile, updates state, and sets active profile locally', async () => {
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([]);

    const createdProfile: UserProfile = {
      id: 'prof-1',
      name: 'Anil',
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    (profileRepository.createProfile as jest.Mock).mockResolvedValueOnce(
      createdProfile,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    await act(async () => {
      await latestProfileContext?.createProfile({
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
      });
    });

    expect(screen.getByTestId('profiles-count').props.children).toBe('1');
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Anil',
    );
    expect(mockStorage.get(ACTIVE_PROFILE_STORAGE_KEY)).toBe('prof-1');
  });

  it('restores persisted profile from AsyncStorage on mount', async () => {
    const existingProfiles: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'prof-2',
        name: 'Kids Zone',
        avatarId: 'avatar-kids-1',
        isKids: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, 'prof-2');
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      existingProfiles,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    expect(screen.getByTestId('profiles-count').props.children).toBe('2');
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Kids Zone',
    );
  });

  it('clears stale persisted profile if ID no longer exists', async () => {
    const existingProfiles: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, 'deleted-profile-id');
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      existingProfiles,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'no-active',
    );
    expect(mockStorage.get(ACTIVE_PROFILE_STORAGE_KEY)).toBeUndefined();
  });

  it('switches active profile and persists selected profile ID', async () => {
    const existingProfiles: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'prof-2',
        name: 'Family',
        avatarId: 'avatar-2',
        isKids: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, 'prof-1');
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      existingProfiles,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Anil',
    );

    await act(async () => {
      await latestProfileContext?.switchProfile('prof-2');
    });

    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Family',
    );
    expect(mockStorage.get(ACTIVE_PROFILE_STORAGE_KEY)).toBe('prof-2');
  });

  it('updates profile and reflects changes in activeProfile if active', async () => {
    const existingProfiles: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, 'prof-1');
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      existingProfiles,
    );

    const updatedProfile: UserProfile = {
      ...existingProfiles[0],
      name: 'Anil Kumar',
      isKids: true,
      updatedAt: 3000,
    };

    (profileRepository.updateProfile as jest.Mock).mockResolvedValueOnce(
      updatedProfile,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    await act(async () => {
      await latestProfileContext?.updateProfile('prof-1', {
        name: 'Anil Kumar',
        isKids: true,
      });
    });

    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Anil Kumar',
    );
  });

  it('enforces maximum 5 profiles per account limit', async () => {
    const fiveProfiles: UserProfile[] = [1, 2, 3, 4, 5].map((n) => ({
      id: `prof-${n}`,
      name: `User ${n}`,
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: n * 1000,
      updatedAt: n * 1000,
    }));

    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      fiveProfiles,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    await expect(
      latestProfileContext?.createProfile({
        name: 'Sixth User',
        avatarId: 'avatar-2',
      }),
    ).rejects.toThrow('MAX_PROFILES_REACHED');
  });

  it('prevents deletion of the only remaining profile', async () => {
    const singleProfile: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      singleProfile,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });

    await expect(latestProfileContext?.deleteProfile('prof-1')).rejects.toThrow(
      'CANNOT_DELETE_ONLY_PROFILE',
    );
  });

  it('deletes active profile and clears local active profile ID', async () => {
    const twoProfiles: UserProfile[] = [
      {
        id: 'prof-1',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'prof-2',
        name: 'Guest',
        avatarId: 'avatar-2',
        isKids: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, 'prof-1');
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce(
      twoProfiles,
    );
    (profileRepository.deleteProfile as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    const screen = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('ready');
    });
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'Anil',
    );

    await act(async () => {
      await latestProfileContext?.deleteProfile('prof-1');
    });

    expect(screen.getByTestId('profiles-count').props.children).toBe('1');
    expect(screen.getByTestId('active-profile-name').props.children).toBe(
      'no-active',
    );
    expect(mockStorage.get(ACTIVE_PROFILE_STORAGE_KEY)).toBeUndefined();
  });
});
