import {createContext, useContext} from 'react';
import {ParentalControlsSettings} from '../../types/parentalControls';
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
  isParentAuthorized: boolean;
  parentalSettings: ParentalControlsSettings | null;
  isLoadingParentalSettings: boolean;
  setParentAuthorized: (authorized: boolean) => void;
  setActiveProfile: (profile: UserProfile | null) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  refreshProfiles: () => Promise<UserProfile[]>;
  refreshParentalSettings: () => Promise<ParentalControlsSettings | null>;
  verifyParentPin: (pin: string) => Promise<boolean>;
  setParentPin: (pin: string) => Promise<void>;
  removeParentPin: () => Promise<void>;
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
  isParentAuthorized: false,
  parentalSettings: null,
  isLoadingParentalSettings: false,
  setParentAuthorized: () => {},
  setActiveProfile: async () => {},
  switchProfile: async () => {},
  refreshProfiles: async () => [],
  refreshParentalSettings: async () => null,
  verifyParentPin: async () => false,
  setParentPin: async () => {},
  removeParentPin: async () => {},
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
