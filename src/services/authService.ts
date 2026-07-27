import {firebaseConfig} from '../config/firebaseConfig';

export interface UserProfileData {
  uid: string;
  username: string;
  email: string;
  subscription: string;
  city: string;
  country: string;
  createdAt?: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  subscription: string;
  city: string;
  country: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface UpdateProfileParams {
  username?: string;
  city?: string;
  country?: string;
  subscription?: string;
}

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
let inMemorySession: {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
} | null = null;

type AuthResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
};

const encodeString = (value: string) => ({stringValue: value});

const encodeProfile = (profile: UserProfileData) => ({
  fields: {
    uid: encodeString(profile.uid),
    username: encodeString(profile.username),
    email: encodeString(profile.email),
    subscription: encodeString(profile.subscription),
    city: encodeString(profile.city),
    country: encodeString(profile.country),
    createdAt: encodeString(profile.createdAt || new Date().toISOString()),
  },
});

const decodeString = (value: any): string => value?.stringValue ?? '';

const decodeProfile = (doc: any): UserProfileData | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  return {
    uid: decodeString(fields.uid),
    username: decodeString(fields.username),
    email: decodeString(fields.email),
    subscription: decodeString(fields.subscription),
    city: decodeString(fields.city),
    country: decodeString(fields.country),
    createdAt: decodeString(fields.createdAt) || undefined,
  };
};

const mergeProfile = (
  existing: UserProfileData | null,
  updates: UpdateProfileParams,
  uid: string,
  email: string,
): UserProfileData => ({
  uid,
  username: updates.username ?? existing?.username ?? '',
  email: existing?.email ?? email,
  subscription: updates.subscription ?? existing?.subscription ?? 'Standard',
  city: updates.city ?? existing?.city ?? '',
  country: updates.country ?? existing?.country ?? '',
  createdAt: existing?.createdAt ?? new Date().toISOString(),
});

const saveSession = async (session: {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
}) => {
  inMemorySession = session;
};

export const getStoredSession = async (): Promise<{
  user: AuthUser;
  idToken: string;
  refreshToken: string;
} | null> => {
  return inMemorySession;
};

const clearSession = async () => {
  inMemorySession = null;
};

const authRequest = async (
  path: string,
  body: Record<string, unknown>,
): Promise<AuthResponse> => {
  const response = await fetch(
    `${AUTH_BASE}/${path}?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...body, returnSecureToken: true}),
    },
  );

  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message || 'AUTH_REQUEST_FAILED';
    throw new Error(message);
  }

  return json as AuthResponse;
};

const firestoreWriteProfile = async (
  idToken: string,
  profile: UserProfileData,
) => {
  const url = `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${profile.uid}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(encodeProfile(profile)),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const message = json?.error?.message || 'FIRESTORE_WRITE_FAILED';
    throw new Error(message);
  }
};

const firestoreReadProfile = async (
  idToken: string,
  uid: string,
): Promise<UserProfileData | null> => {
  const url = `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  return decodeProfile(json);
};

export const registerUser = async (
  params: RegisterParams,
): Promise<{user: AuthUser; profile: UserProfileData}> => {
  const authResult = await authRequest('accounts:signUp', {
    email: params.email.trim(),
    password: params.password,
  });

  const user = {
    uid: authResult.localId,
    email: authResult.email,
    displayName: params.username,
  };

  const profileData: UserProfileData = {
    uid: authResult.localId,
    username: params.username,
    email: authResult.email,
    subscription: params.subscription,
    city: params.city,
    country: params.country,
    createdAt: new Date().toISOString(),
  };

  await firestoreWriteProfile(authResult.idToken, profileData);
  await saveSession({
    user,
    idToken: authResult.idToken,
    refreshToken: authResult.refreshToken,
  });

  return {user, profile: profileData};
};

export const loginUser = async (
  params: LoginParams,
): Promise<{user: AuthUser; profile: UserProfileData | null}> => {
  const authResult = await authRequest('accounts:signInWithPassword', {
    email: params.email.trim(),
    password: params.password,
  });

  const user = {
    uid: authResult.localId,
    email: authResult.email,
  };

  const profile = await firestoreReadProfile(
    authResult.idToken,
    authResult.localId,
  );
  await saveSession({
    user,
    idToken: authResult.idToken,
    refreshToken: authResult.refreshToken,
  });

  return {user, profile};
};

export const getUserProfile = async (
  uid: string,
): Promise<UserProfileData | null> => {
  const session = await getStoredSession();
  if (!session) {
    return null;
  }
  return firestoreReadProfile(session.idToken, uid);
};

export const logoutUser = async (): Promise<void> => {
  await clearSession();
};

export const updateUserProfile = async (
  updates: UpdateProfileParams,
): Promise<UserProfileData> => {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('NO_ACTIVE_SESSION');
  }

  const currentProfile = await getUserProfile(session.user.uid);
  const mergedProfile = mergeProfile(
    currentProfile,
    updates,
    session.user.uid,
    session.user.email,
  );

  await firestoreWriteProfile(session.idToken, mergedProfile);

  const updatedUser = {
    ...session.user,
    displayName: updates.username ?? session.user.displayName,
  };

  await saveSession({
    ...session,
    user: updatedUser,
  });

  return mergedProfile;
};
