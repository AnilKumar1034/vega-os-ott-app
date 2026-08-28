import React, {ReactNode, useCallback, useEffect, useState} from 'react';
import {useAuth} from '../../context/authContext';
import {parentalControlsService} from '../../services/parentalControlsService';
import {ParentalControlsSettings} from '../../types/parentalControls';
import {profileRepository} from '../data/profileRepository';
import {
  CreateProfileInput,
  MAX_PROFILES_PER_ACCOUNT,
  UpdateProfileInput,
  UserProfile,
  validateProfileName,
} from '../types/Profile';
import {ProfileContext} from './profileContext';

export const ACTIVE_PROFILE_STORAGE_KEY = 'logixstream.activeProfileId';

const getAsyncStorage = () => {
  return require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
    .default as {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
};

export const ProfileProvider = ({children}: {children: ReactNode}) => {
  const {user, loading: authLoading} = useAuth();
  const [activeProfile, setActiveProfileState] = useState<UserProfile | null>(
    null,
  );
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // In-memory only parent authorization session (not persisted)
  const [isParentAuthorized, setIsParentAuthorized] = useState<boolean>(false);
  const [parentalSettings, setParentalSettings] =
    useState<ParentalControlsSettings | null>(null);
  const [isLoadingParentalSettings, setIsLoadingParentalSettings] =
    useState<boolean>(false);

  const loadParentalSettingsForUser = useCallback(async (uid: string) => {
    setIsLoadingParentalSettings(true);
    try {
      const settings = await parentalControlsService.getSettings(uid);
      setParentalSettings(settings);
      return settings;
    } catch (err) {
      console.log('Error loading parental settings:', err);
      return null;
    } finally {
      setIsLoadingParentalSettings(false);
    }
  }, []);

  const loadProfilesForUser = useCallback(async (uid: string) => {
    setIsLoadingProfiles(true);
    setError(null);
    try {
      const userProfiles = await profileRepository.getProfiles(uid);
      setProfiles(userProfiles);

      const AsyncStorage = getAsyncStorage();
      const savedProfileId = await AsyncStorage.getItem(
        ACTIVE_PROFILE_STORAGE_KEY,
      );

      if (savedProfileId) {
        const matched = userProfiles.find((p) => p.id === savedProfileId);
        if (matched) {
          setActiveProfileState(matched);
        } else {
          // Stale profile ID found, remove it and reset active profile
          await AsyncStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
          setActiveProfileState(null);
        }
      } else {
        setActiveProfileState(null);
      }

      return userProfiles;
    } catch (err: any) {
      console.log('Error loading user profiles:', err);
      setError(err?.message || 'FAILED_TO_LOAD_PROFILES');
      return [];
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (authLoading) {
      return;
    }

    if (!user) {
      setActiveProfileState(null);
      setProfiles([]);
      setIsLoadingProfiles(false);
      setIsParentAuthorized(false);
      setParentalSettings(null);
      return;
    }

    (async () => {
      if (isMounted) {
        await Promise.all([
          loadProfilesForUser(user.uid),
          loadParentalSettingsForUser(user.uid),
        ]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, loadProfilesForUser, loadParentalSettingsForUser]);

  const setActiveProfile = async (profile: UserProfile | null) => {
    const AsyncStorage = getAsyncStorage();
    if (profile) {
      // Switching to a Kids profile clears in-memory parent authorization session
      if (profile.isKids) {
        setIsParentAuthorized(false);
      }
      setActiveProfileState(profile);
      await AsyncStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profile.id);
    } else {
      setIsParentAuthorized(false);
      setActiveProfileState(null);
      await AsyncStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  };

  const switchProfile = async (profileId: string) => {
    const matched = profiles.find((p) => p.id === profileId);
    if (!matched) {
      throw new Error(`Profile ${profileId} not found.`);
    }
    await setActiveProfile(matched);
  };

  const refreshProfiles = async (): Promise<UserProfile[]> => {
    if (!user) {
      return [];
    }
    return loadProfilesForUser(user.uid);
  };

  const refreshParentalSettings = async (): Promise<ParentalControlsSettings | null> => {
    if (!user) {
      return null;
    }
    return loadParentalSettingsForUser(user.uid);
  };

  const verifyParentPin = async (pin: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    const isValid = await parentalControlsService.verifyPin(user.uid, pin);
    if (isValid) {
      setIsParentAuthorized(true);
    }
    return isValid;
  };

  const setParentPin = async (pin: string): Promise<void> => {
    if (!user) {
      throw new Error('NO_AUTHENTICATED_USER');
    }
    await parentalControlsService.setParentPin(user.uid, pin);
    setIsParentAuthorized(true);
    await refreshParentalSettings();
  };

  const removeParentPin = async (): Promise<void> => {
    if (!user) {
      throw new Error('NO_AUTHENTICATED_USER');
    }
    await parentalControlsService.removeParentPin(user.uid);
    setIsParentAuthorized(false);
    await refreshParentalSettings();
  };

  const createProfile = async (
    input: CreateProfileInput,
  ): Promise<UserProfile> => {
    if (!user) {
      throw new Error('NO_AUTHENTICATED_USER');
    }

    const validation = validateProfileName(input.name);
    if (!validation.isValid) {
      throw new Error(validation.error || 'INVALID_PROFILE_NAME');
    }

    if (profiles.length >= MAX_PROFILES_PER_ACCOUNT) {
      throw new Error('MAX_PROFILES_REACHED');
    }

    setIsLoadingProfiles(true);
    setError(null);
    try {
      const created = await profileRepository.createProfile(user.uid, input);
      const updatedProfiles = [...profiles, created];
      setProfiles(updatedProfiles);
      await setActiveProfile(created);
      return created;
    } catch (err: any) {
      console.log('Error creating profile:', err);
      setError(err?.message || 'FAILED_TO_CREATE_PROFILE');
      throw err;
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const updateProfile = async (
    profileId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> => {
    if (!user) {
      throw new Error('NO_AUTHENTICATED_USER');
    }

    if (input.name !== undefined) {
      const validation = validateProfileName(input.name);
      if (!validation.isValid) {
        throw new Error(validation.error || 'INVALID_PROFILE_NAME');
      }
    }

    setIsLoadingProfiles(true);
    setError(null);
    try {
      const updated = await profileRepository.updateProfile(
        user.uid,
        profileId,
        input,
      );
      const updatedProfiles = profiles.map((p) =>
        p.id === profileId ? updated : p,
      );
      setProfiles(updatedProfiles);
      if (activeProfile?.id === profileId) {
        if (updated.isKids) {
          setIsParentAuthorized(false);
        }
        setActiveProfileState(updated);
      }
      return updated;
    } catch (err: any) {
      console.log('Error updating profile:', err);
      setError(err?.message || 'FAILED_TO_UPDATE_PROFILE');
      throw err;
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const deleteProfile = async (profileId: string): Promise<void> => {
    if (!user) {
      throw new Error('NO_AUTHENTICATED_USER');
    }

    if (profiles.length <= 1) {
      throw new Error('CANNOT_DELETE_ONLY_PROFILE');
    }

    setIsLoadingProfiles(true);
    setError(null);
    try {
      await profileRepository.deleteProfile(user.uid, profileId);
      const updatedProfiles = profiles.filter((p) => p.id !== profileId);
      setProfiles(updatedProfiles);

      if (activeProfile?.id === profileId) {
        await setActiveProfile(null);
      }
    } catch (err: any) {
      console.log('Error deleting profile:', err);
      setError(err?.message || 'FAILED_TO_DELETE_PROFILE');
      throw err;
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const clearActiveProfile = async (): Promise<void> => {
    await setActiveProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        isLoadingProfiles,
        error,
        isParentAuthorized,
        parentalSettings,
        isLoadingParentalSettings,
        setParentAuthorized: setIsParentAuthorized,
        setActiveProfile,
        switchProfile,
        refreshProfiles,
        refreshParentalSettings,
        verifyParentPin,
        setParentPin,
        removeParentPin,
        createProfile,
        updateProfile,
        deleteProfile,
        clearActiveProfile,
      }}>
      {children}
    </ProfileContext.Provider>
  );
};
