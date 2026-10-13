import React from 'react';
import {render, act} from '@testing-library/react-native';

const mockLogEvent = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/analytics', () => ({
  isSupported: jest.fn().mockResolvedValue(true),
  getAnalytics: jest.fn().mockReturnValue({app: {name: '[DEFAULT]'}}),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setUserId: jest.fn().mockResolvedValue(undefined),
  setUserProperties: jest.fn().mockResolvedValue(undefined),
}));

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

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    goBack: mockGoBack,
    canGoBack: () => true,
    dispatch: jest.fn(),
  }),
}));

jest.mock('../src/profiles/data/profileRepository');
jest.mock('../src/services/parentalControlsService', () => ({
  parentalControlsService: {
    getSettings: jest.fn().mockResolvedValue(null),
    verifyPin: jest.fn().mockResolvedValue(true),
    updateSettings: jest.fn().mockResolvedValue(null),
  },
}));

import {
  analyticsService,
  AnalyticsEvents,
} from '../src/analytics';
import {AuthContext} from '../src/context/authContext';
import {
  ProfileProvider,
  ACTIVE_PROFILE_STORAGE_KEY,
} from '../src/profiles/context/ProfileProvider';
import {useProfile} from '../src/profiles/hooks/useProfile';
import {profileRepository} from '../src/profiles/data/profileRepository';
import {UserProfile} from '../src/profiles/types/Profile';

const mockUser = {uid: 'user-day8-test', email: 'test@example.com'};

let latestProfileContext: ReturnType<typeof useProfile> | null = null;

const ContextConsumerHarness = () => {
  const context = useProfile();
  latestProfileContext = context;
  return null;
};

const renderWithProfileProvider = async () => {
  const screen = render(
    <AuthContext.Provider
      value={{
        user: mockUser,
        userProfile: null,
        loading: false,
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn().mockResolvedValue(undefined),
      }}>
      <ProfileProvider>
        <ContextConsumerHarness />
      </ProfileProvider>
    </AuthContext.Provider>,
  );
  await act(async () => {});
  return screen;
};

describe('Day 8 — Profile Analytics (LogiXstream Specification)', () => {
  const adultProfile1: UserProfile = {
    id: 'prof-adult-1',
    name: 'Primary Adult',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const adultProfile2: UserProfile = {
    id: 'prof-adult-2',
    name: 'Secondary Adult',
    avatarId: 'avatar-2',
    isKids: false,
    createdAt: 2000,
    updatedAt: 2000,
  };

  const kidsProfile1: UserProfile = {
    id: 'prof-kids-1',
    name: 'Junior Kids',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 3000,
    updatedAt: 3000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.clear();
    latestProfileContext = null;

    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});
    mockGetApp.mockReturnValue({name: '[DEFAULT]'});
    mockLogEvent.mockResolvedValue(undefined);

    analyticsService.__resetForTesting();
    await analyticsService.initialize();
  });

  afterEach(() => {
    analyticsService.__resetForTesting();
  });

  // Requirement 1: Successful profile creation emits profile_created exactly once
  it('1. Successful profile creation emits profile_created exactly once with privacy-safe parameters', async () => {
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
    ]);
    (profileRepository.createProfile as jest.Mock).mockResolvedValueOnce(
      kidsProfile1,
    );

    await renderWithProfileProvider();

    await act(async () => {
      await latestProfileContext?.createProfile({
        name: 'Junior Kids',
        avatarId: 'avatar-kids',
        isKids: true,
      });
    });

    const createCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_CREATED,
    );
    expect(createCalls).toHaveLength(1);
    expect(createCalls[0][2]).toEqual(
      expect.objectContaining({
        profile_type: 'kids',
        is_kids_profile: true,
        creation_source: 'create_profile',
      }),
    );
    // Verify no personal data is sent
    expect(createCalls[0][2].name).toBeUndefined();
    expect(createCalls[0][2].email).toBeUndefined();
    expect(createCalls[0][2].profile_name).toBeUndefined();
  });

  // Requirement 2: Successful profile selection emits expected selection event
  it('2. Successful initial profile selection emits profile_selected with selection_source', async () => {
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      kidsProfile1,
    ]);

    await renderWithProfileProvider();

    // User selects adultProfile1 when no profile was active yet
    await act(async () => {
      await latestProfileContext?.switchProfile(adultProfile1.id, {
        source: 'profile_picker',
      });
    });

    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SELECTED,
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0][2]).toEqual(
      expect.objectContaining({
        profile_type: 'adult',
        is_kids_profile: false,
        selection_source: 'profile_picker',
      }),
    );

    // Initial selection must NOT fire profile_switched
    const switchCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SWITCHED,
    );
    expect(switchCalls).toHaveLength(0);
  });

  // Requirement 3: A real profile change emits profile_switched according to defined semantics
  it('3. A real profile change emits profile_switched with previous and new profile types', async () => {
    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, adultProfile1.id);
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      kidsProfile1,
    ]);

    await renderWithProfileProvider();

    // Verify active profile was loaded without emitting false events on startup
    expect(latestProfileContext?.activeProfile?.id).toBe(adultProfile1.id);
    expect(mockLogEvent).not.toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PROFILE_SWITCHED,
      expect.anything(),
    );

    // User switches from Adult to Kids
    await act(async () => {
      await latestProfileContext?.switchProfile(kidsProfile1.id, {
        source: 'profile_picker',
      });
    });

    const switchCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SWITCHED,
    );
    expect(switchCalls).toHaveLength(1);
    expect(switchCalls[0][2]).toEqual(
      expect.objectContaining({
        previous_profile_type: 'adult',
        new_profile_type: 'kids',
        switch_source: 'profile_picker',
      }),
    );

    // Context also registers profile_selected for the newly selected profile
    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SELECTED,
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0][2]).toEqual(
      expect.objectContaining({
        profile_type: 'kids',
        is_kids_profile: true,
      }),
    );
  });

  // Requirement 4: Selecting the already-active profile does not generate a false switch event
  it('4. Selecting the already-active profile emits selection but does NOT generate a false profile_switched event', async () => {
    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, adultProfile1.id);
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      adultProfile2,
    ]);

    await renderWithProfileProvider();

    // User taps adultProfile1 again (the currently active profile)
    await act(async () => {
      await latestProfileContext?.switchProfile(adultProfile1.id, {
        source: 'profile_picker',
      });
    });

    // Must NOT emit profile_switched
    const switchCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SWITCHED,
    );
    expect(switchCalls).toHaveLength(0);

    // Emits profile_selected for the explicit selection action
    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_SELECTED,
    );
    expect(selectCalls).toHaveLength(1);
  });

  // Requirement 5: Successful deletion emits profile_deleted exactly once
  it('5. Successful deletion emits profile_deleted exactly once with was_active_profile', async () => {
    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, adultProfile1.id);
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      kidsProfile1,
    ]);
    (profileRepository.deleteProfile as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    await renderWithProfileProvider();

    // Delete the active adult profile
    await act(async () => {
      await latestProfileContext?.deleteProfile(adultProfile1.id);
    });

    const deleteCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.PROFILE_DELETED,
    );
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0][2]).toEqual(
      expect.objectContaining({
        deleted_profile_type: 'adult',
        was_active_profile: true,
      }),
    );
  });

  // Requirement 6: Cancelled or failed operations do not emit success events
  it('6. Failed operations and cancelled actions do not emit success events', async () => {
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      adultProfile2,
    ]);
    (profileRepository.createProfile as jest.Mock).mockRejectedValueOnce(
      new Error('Network error writing to Firestore'),
    );
    (profileRepository.deleteProfile as jest.Mock).mockRejectedValueOnce(
      new Error('Firestore permission denied'),
    );

    await renderWithProfileProvider();

    // Failed profile creation
    await expect(
      latestProfileContext?.createProfile({
        name: 'Fail User',
        avatarId: 'avatar-1',
        isKids: false,
      }),
    ).rejects.toThrow();

    expect(
      mockLogEvent.mock.calls.filter(
        ([, eventName]) => eventName === AnalyticsEvents.PROFILE_CREATED,
      ),
    ).toHaveLength(0);

    // Failed profile deletion
    await expect(
      latestProfileContext?.deleteProfile(adultProfile2.id),
    ).rejects.toThrow();

    expect(
      mockLogEvent.mock.calls.filter(
        ([, eventName]) => eventName === AnalyticsEvents.PROFILE_DELETED,
      ),
    ).toHaveLength(0);
  });

  // Requirement 7: Component re-renders and restoring profile on startup do not create duplicate events
  it('7. Restoring saved profile from storage on app launch does not emit selection or switch events', async () => {
    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, adultProfile1.id);
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
    ]);

    await renderWithProfileProvider();

    // Expect active profile restored
    expect(latestProfileContext?.activeProfile?.id).toBe(adultProfile1.id);

    // No selection or switch events fired on mount
    expect(
      mockLogEvent.mock.calls.filter(
        ([, eventName]) =>
          eventName === AnalyticsEvents.PROFILE_SELECTED ||
          eventName === AnalyticsEvents.PROFILE_SWITCHED,
      ),
    ).toHaveLength(0);
  });

  // Requirement 8: Analytics failures do not break profile creation, selection, switching, deletion, or navigation
  it('8. Analytics failures do not break profile creation, switching, or deletion', async () => {
    mockLogEvent.mockRejectedValue(new Error('Firebase offline'));

    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      adultProfile2,
    ]);
    (profileRepository.createProfile as jest.Mock).mockResolvedValueOnce(
      kidsProfile1,
    );
    (profileRepository.deleteProfile as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    await renderWithProfileProvider();

    // None of these should throw even when analytics throws
    await expect(
      latestProfileContext?.createProfile({
        name: 'Kid Profile',
        avatarId: 'avatar-kids',
        isKids: true,
      }),
    ).resolves.toBeDefined();

    await expect(
      latestProfileContext?.switchProfile(adultProfile2.id),
    ).resolves.not.toThrow();

    await expect(
      latestProfileContext?.deleteProfile(adultProfile2.id),
    ).resolves.not.toThrow();
  });

  // Requirement 9: No sensitive data is sent in analytics parameters
  it('9. No sensitive personal data (names, emails, phones, tokens) is sent in any profile event', async () => {
    await analyticsService.trackProfileCreated({
      profile_type: 'adult',
      is_kids_profile: false,
      creation_source: 'create_profile',
    });

    await analyticsService.trackProfileSwitched({
      previous_profile_type: 'adult',
      new_profile_type: 'kids',
      switch_source: 'profile_picker',
    });

    await analyticsService.trackProfileDeleted({
      deleted_profile_type: 'kids',
      was_active_profile: false,
    });

    await analyticsService.trackProfileEditCompleted({
      profile_type: 'adult',
      is_kids_profile: false,
    });

    for (const call of mockLogEvent.mock.calls) {
      const payload = call[2];
      expect(payload.email).toBeUndefined();
      expect(payload.name).toBeUndefined();
      expect(payload.profilename).toBeUndefined();
      expect(payload.phone).toBeUndefined();
      expect(payload.token).toBeUndefined();
    }
  });

  // Requirement 10: Successful profile editing emits profile_edit_completed
  it('10. Successful profile edit emits profile_edit_completed', async () => {
    await analyticsService.trackProfileEditCompleted({
      profile_type: 'kids',
      is_kids_profile: true,
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.PROFILE_EDIT_COMPLETED,
      expect.objectContaining({
        profile_type: 'kids',
        is_kids_profile: true,
      }),
    );
  });

  // Requirement 11: Deletion of active profile clears active profile context in analytics
  it('11. Deletion of active profile clears active profile context in analytics service', async () => {
    mockStorage.set(ACTIVE_PROFILE_STORAGE_KEY, adultProfile1.id);
    (profileRepository.getProfiles as jest.Mock).mockResolvedValueOnce([
      adultProfile1,
      adultProfile2,
    ]);
    (profileRepository.deleteProfile as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    await renderWithProfileProvider();

    // Verify context was set
    expect(analyticsService.getContext().profileId).toBe(adultProfile1.id);

    // Delete active profile
    await act(async () => {
      await latestProfileContext?.deleteProfile(adultProfile1.id);
    });

    // Profile context must now be null (no stale profile context)
    expect(analyticsService.getContext().profileId).toBeUndefined();
  });
});
