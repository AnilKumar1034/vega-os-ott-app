import {createContext, useContext} from 'react';
import {
  CreateProfileInput,
  UpdateProfileInput,
  UserProfile,
} from '../types/Profile';

export interface ProfileContextType {
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  isLoadingProfiles: boolean;
  error: string | null;
  setActiveProfile: (profile: UserProfile | null) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  refreshProfiles: () => Promise<UserProfile[]>;
  createProfile: (input: CreateProfileInput) => Promise<UserProfile>;
  updateProfile: (
    profileId: string,
    input: UpdateProfileInput,
  ) => Promise<UserProfile>;
  deleteProfile: (profileId: string) => Promise<void>;
  clearActiveProfile: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  profiles: [],
  isLoadingProfiles: false,
  error: null,
  setActiveProfile: async () => {},
  switchProfile: async () => {},
  refreshProfiles: async () => [],
  createProfile: async () => {
    throw new Error('ProfileProvider not found');
  },
  updateProfile: async () => {
    throw new Error('ProfileProvider not found');
  },
  deleteProfile: async () => {},
  clearActiveProfile: async () => {},
});

export const useProfile = () => useContext(ProfileContext);
