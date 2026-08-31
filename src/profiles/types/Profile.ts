import {strings} from '../../constants/strings';
import {ContentMaturityRating} from '../../types/maturity';

export interface UserProfile {
  id: string;
  name: string;
  avatarId: string;
  isKids: boolean;
  kidsMaturityLimit?: ContentMaturityRating;
  createdAt: number;
  updatedAt: number;
  maturityRating?: string;
  language?: string;
  autoplay?: boolean;
  preferredGenres?: string[];
  pinProtected?: boolean;
}

export interface CreateProfileInput {
  name: string;
  avatarId: string;
  isKids?: boolean;
  kidsMaturityLimit?: ContentMaturityRating;
}

export interface UpdateProfileInput {
  name?: string;
  avatarId?: string;
  isKids?: boolean;
  kidsMaturityLimit?: ContentMaturityRating;
  maturityRating?: string;
  language?: string;
  autoplay?: boolean;
  preferredGenres?: string[];
  pinProtected?: boolean;
}

export const PROFILE_NAME_MIN_LENGTH = 1;
export const PROFILE_NAME_MAX_LENGTH = 20;
export const MAX_PROFILES_PER_ACCOUNT = 5;

export const validateProfileName = (
  name: string,
): {isValid: boolean; error?: string} => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < PROFILE_NAME_MIN_LENGTH) {
    return {isValid: false, error: strings.profiles.nameRequired};
  }
  if (trimmed.length > PROFILE_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: strings.profiles.nameTooLong,
    };
  }
  return {isValid: true};
};
