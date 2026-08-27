import {firebaseConfig} from '../../config/firebaseConfig';
import {authenticatedFirestoreFetch} from '../../services/authService';
import {
  CreateProfileInput,
  UpdateProfileInput,
  UserProfile,
} from '../types/Profile';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

const readJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const encodeString = (value: string) => ({stringValue: value});
const encodeBoolean = (value: boolean) => ({booleanValue: value});
const encodeNumber = (value: number) => ({integerValue: String(Math.floor(value))});

const decodeString = (value: any): string => value?.stringValue ?? '';
const decodeBoolean = (value: any): boolean => Boolean(value?.booleanValue);
const decodeNumber = (value: any): number => {
  if (value?.integerValue !== undefined) {
    return Number(value.integerValue);
  }
  if (value?.doubleValue !== undefined) {
    return Number(value.doubleValue);
  }
  return 0;
};

const encodeProfileDocument = (profile: UserProfile) => ({
  fields: {
    id: encodeString(profile.id),
    name: encodeString(profile.name),
    avatarId: encodeString(profile.avatarId),
    isKids: encodeBoolean(profile.isKids),
    createdAt: encodeNumber(profile.createdAt),
    updatedAt: encodeNumber(profile.updatedAt),
    ...(profile.maturityRating ? {maturityRating: encodeString(profile.maturityRating)} : {}),
    ...(profile.language ? {language: encodeString(profile.language)} : {}),
    ...(profile.autoplay !== undefined ? {autoplay: encodeBoolean(profile.autoplay)} : {}),
    ...(profile.pinProtected !== undefined ? {pinProtected: encodeBoolean(profile.pinProtected)} : {}),
  },
});

const decodeProfileDocument = (doc: any): UserProfile | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  const nameParts = (doc?.name || '').split('/');
  const docId = nameParts[nameParts.length - 1] || '';
  const id = decodeString(fields.id) || docId;
  const name = decodeString(fields.name);

  if (!id || !name) {
    return null;
  }

  const avatarId = decodeString(fields.avatarId) || 'avatar-1';
  const isKids = decodeBoolean(fields.isKids);
  const createdAt = decodeNumber(fields.createdAt) || Date.now();
  const updatedAt = decodeNumber(fields.updatedAt) || Date.now();

  const profile: UserProfile = {
    id,
    name,
    avatarId,
    isKids,
    createdAt,
    updatedAt,
  };

  if (fields.maturityRating) {
    profile.maturityRating = decodeString(fields.maturityRating);
  }
  if (fields.language) {
    profile.language = decodeString(fields.language);
  }
  if (fields.autoplay) {
    profile.autoplay = decodeBoolean(fields.autoplay);
  }
  if (fields.pinProtected) {
    profile.pinProtected = decodeBoolean(fields.pinProtected);
  }

  return profile;
};

const getCollectionUrl = (uid: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/profiles`;

const getDocumentUrl = (uid: string, profileId: string) =>
  `${getCollectionUrl(uid)}/${profileId}`;

export const profileRepository = {
  getProfiles: async (uid: string): Promise<UserProfile[]> => {
    const response = await authenticatedFirestoreFetch(getCollectionUrl(uid));

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      const json = await readJson(response);
      throw new Error(json?.error?.message || 'FAILED_TO_FETCH_PROFILES');
    }

    const json = await readJson(response);
    const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
    const profiles = docs
      .map((doc) => decodeProfileDocument(doc))
      .filter((p): p is UserProfile => p !== null);

    profiles.sort((a, b) => a.createdAt - b.createdAt);
    return profiles;
  },

  createProfile: async (
    uid: string,
    input: CreateProfileInput,
  ): Promise<UserProfile> => {
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const newProfile: UserProfile = {
      id: profileId,
      name: input.name.trim(),
      avatarId: input.avatarId,
      isKids: input.isKids ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const response = await authenticatedFirestoreFetch(
      getDocumentUrl(uid, profileId),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encodeProfileDocument(newProfile)),
      },
    );

    if (!response.ok) {
      const json = await readJson(response);
      throw new Error(json?.error?.message || 'FAILED_TO_CREATE_PROFILE');
    }

    return newProfile;
  },

  updateProfile: async (
    uid: string,
    profileId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> => {
    const existingProfiles = await profileRepository.getProfiles(uid);
    const existing = existingProfiles.find((p) => p.id === profileId);

    if (!existing) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const updatedProfile: UserProfile = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      avatarId: input.avatarId !== undefined ? input.avatarId : existing.avatarId,
      isKids: input.isKids !== undefined ? input.isKids : existing.isKids,
      maturityRating: input.maturityRating !== undefined ? input.maturityRating : existing.maturityRating,
      language: input.language !== undefined ? input.language : existing.language,
      autoplay: input.autoplay !== undefined ? input.autoplay : existing.autoplay,
      preferredGenres: input.preferredGenres !== undefined ? input.preferredGenres : existing.preferredGenres,
      pinProtected: input.pinProtected !== undefined ? input.pinProtected : existing.pinProtected,
      updatedAt: Date.now(),
    };

    const response = await authenticatedFirestoreFetch(
      getDocumentUrl(uid, profileId),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encodeProfileDocument(updatedProfile)),
      },
    );

    if (!response.ok) {
      const json = await readJson(response);
      throw new Error(json?.error?.message || 'FAILED_TO_UPDATE_PROFILE');
    }

    return updatedProfile;
  },

  deleteProfile: async (uid: string, profileId: string): Promise<void> => {
    // Clean up known subcollections for this profile to prevent orphaned documents
    const subcollections = ['continueWatching', 'watchlist', 'history'];
    for (const subcol of subcollections) {
      try {
        const subcolUrl = `${getDocumentUrl(uid, profileId)}/${subcol}`;
        const subcolRes = await authenticatedFirestoreFetch(subcolUrl);
        if (subcolRes?.ok) {
          const json = await readJson(subcolRes);
          const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
          for (const doc of docs) {
            if (doc?.name) {
              const docUrl = `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/${doc.name}`;
              await authenticatedFirestoreFetch(docUrl, {method: 'DELETE'});
            }
          }
        }
      } catch (subcolErr) {
        console.log(`Failed to clean up subcollection ${subcol}:`, subcolErr);
      }
    }

    const response = await authenticatedFirestoreFetch(
      getDocumentUrl(uid, profileId),
      {
        method: 'DELETE',
      },
    );

    if (response && !response.ok && response.status !== 404) {
      const json = await readJson(response);
      throw new Error(json?.error?.message || 'FAILED_TO_DELETE_PROFILE');
    }
  },
};
