import {firebaseConfig} from '../config/firebaseConfig';

const getAsyncStorage = () => {
  return require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
    .default as {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
};

export interface UserProfileData {
  uid: string;
  username: string;
  email: string;
  subscription: string;
  city: string;
  country: string;
  avatar?: string;
  themePreference?: string;
  notificationsEnabled?: boolean;
  autoplayEnabled?: boolean;
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
  avatar?: string;
  themePreference?: string;
  notificationsEnabled?: boolean;
  autoplayEnabled?: boolean;
}

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const SESSION_STORAGE_KEY = '@vegaott/auth-session';
const GOOGLE_REACHABILITY_URL = 'https://www.google.com/generate_204';

type StoredSession = {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
};

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
    avatar: encodeString(profile.avatar || 'initial'),
    themePreference: encodeString(profile.themePreference || 'cinematic'),
    notificationsEnabled: {booleanValue: profile.notificationsEnabled ?? true},
    autoplayEnabled: {booleanValue: profile.autoplayEnabled ?? true},
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
    avatar: decodeString(fields.avatar) || 'initial',
    themePreference: decodeString(fields.themePreference) || 'cinematic',
    notificationsEnabled: fields.notificationsEnabled?.booleanValue ?? true,
    autoplayEnabled: fields.autoplayEnabled?.booleanValue ?? true,
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
  avatar: updates.avatar ?? existing?.avatar ?? 'initial',
  themePreference:
    updates.themePreference ?? existing?.themePreference ?? 'cinematic',
  notificationsEnabled:
    updates.notificationsEnabled ?? existing?.notificationsEnabled ?? true,
  autoplayEnabled: updates.autoplayEnabled ?? existing?.autoplayEnabled ?? true,
  createdAt: existing?.createdAt ?? new Date().toISOString(),
});

const saveSession = async (session: {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
}) => {
  try {
    const storage = getAsyncStorage();
    await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.log('Failed to save auth session:', err);
  }
};

type FetchLikeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
};

const readJson = async (response: FetchLikeResponse) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getNetworkErrorMessage = (error: unknown) => {
  if (
    error instanceof TypeError &&
    /Network request failed/i.test(error.message)
  ) {
    return 'NETWORK_REQUEST_FAILED';
  }

  return error instanceof Error && error.message
    ? error.message
    : 'REQUEST_FAILED';
};

const maskEmail = (email: string) => {
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) {
    return email;
  }

  const visibleName = name.slice(0, 2);
  return `${visibleName}${name.length > 2 ? '***' : ''}@${domain}`;
};

const summarizeBody = (body: Record<string, unknown>) => ({
  keys: Object.keys(body),
  hasEmail: typeof body.email === 'string',
  hasPassword: typeof body.password === 'string',
  returnSecureToken: body.returnSecureToken === true,
});

const describeFetchError = (error: unknown) => {
  if (
    error instanceof TypeError &&
    /Network request failed/i.test(error.message)
  ) {
    return {
      message: 'NETWORK_REQUEST_FAILED',
      kind: 'network_request_failed',
      originalMessage: error.message,
    };
  }

  return {
    message:
      error instanceof Error && error.message
        ? error.message
        : 'REQUEST_FAILED',
    kind: 'request_failed',
    originalMessage:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : String(error),
  };
};

export const checkGoogleReachability = async (): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> => {
  try {
    const response = await fetch(GOOGLE_REACHABILITY_URL, {
      method: 'GET',
      headers: {Accept: 'text/plain'},
    });

    return {ok: response.ok, status: response.status};
  } catch (error) {
    const details = describeFetchError(error);
    return {ok: false, error: details.message};
  }
};

export const getStoredSession = async (): Promise<{
  user: AuthUser;
  idToken: string;
  refreshToken: string;
} | null> => {
  try {
    const storage = getAsyncStorage();
    const storedValue = await storage.getItem(SESSION_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }
    return JSON.parse(storedValue) as StoredSession;
  } catch (err) {
    console.log('Failed to parse stored auth session:', err);
    try {
      const storage = getAsyncStorage();
      await storage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
};

const clearSession = async () => {
  try {
    const storage = getAsyncStorage();
    await storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const authRequest = async (
  path: string,
  body: Record<string, unknown>,
): Promise<AuthResponse> => {
  const url = `${AUTH_BASE}/${path}?key=${firebaseConfig.apiKey}`;
  const urlHost = 'identitytoolkit.googleapis.com';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...body, returnSecureToken: true}),
    });

    const json = await readJson(response);

    if (!response.ok) {
      const message = json?.error?.message || 'AUTH_REQUEST_FAILED';
      throw new Error(message);
    }

    return json as AuthResponse;
  } catch (error) {
    const details = describeFetchError(error);
    throw new Error(details.message);
  }
};

const TOKEN_REFRESH_BASE = 'https://securetoken.googleapis.com/v1/token';

export const refreshAuthSession = async (): Promise<StoredSession | null> => {
  const session = await getStoredSession();
  if (!session?.refreshToken) {
    return null;
  }

  try {
    const url = `${TOKEN_REFRESH_BASE}?key=${firebaseConfig.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        session.refreshToken,
      )}`,
    });

    if (!response.ok) {
      console.log('Failed to refresh Firebase token, status:', response.status);
      return null;
    }

    const data = await readJson(response);
    const newIdToken = data.id_token || data.access_token;
    const newRefreshToken = data.refresh_token || session.refreshToken;

    if (!newIdToken) {
      return null;
    }

    const updatedSession: StoredSession = {
      user: session.user,
      idToken: newIdToken,
      refreshToken: newRefreshToken,
    };

    await saveSession(updatedSession);
    return updatedSession;
  } catch (error) {
    console.log('Error refreshing Firebase auth token:', error);
    return null;
  }
};

export const authenticatedFirestoreFetch = async (
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<Response> => {
  let session = await getStoredSession();
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (session?.idToken) {
    headers.Authorization = `Bearer ${session.idToken}`;
  }

  let response = await fetch(url, {...options, headers});

  // If 401 UNAUTHENTICATED or 403 PERMISSION_DENIED, try refreshing token once
  if (
    response &&
    (response.status === 401 || response.status === 403) &&
    session?.refreshToken
  ) {
    const refreshed = await refreshAuthSession();
    if (refreshed?.idToken) {
      headers.Authorization = `Bearer ${refreshed.idToken}`;
      response = await fetch(url, {...options, headers});
    }
  }

  return response;
};

const firestoreWriteProfile = async (
  idToken: string,
  profile: UserProfileData,
) => {
  const url = `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${profile.uid}`;

  try {
    const response = await authenticatedFirestoreFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encodeProfile(profile)),
    });

    if (!response.ok) {
      const json = await readJson(response);
      const message = json?.error?.message || 'FIRESTORE_WRITE_FAILED';
      throw new Error(message);
    }
  } catch (error) {
    const message = getNetworkErrorMessage(error);
    throw new Error(message);
  }
};

const firestoreReadProfile = async (
  idToken: string,
  uid: string,
): Promise<UserProfileData | null> => {
  const url = `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}`;

  try {
    const response = await authenticatedFirestoreFetch(url);

    if (!response.ok) {
      return null;
    }

    const json = await readJson(response);
    return decodeProfile(json);
  } catch (error) {
    const message = getNetworkErrorMessage(error);
    throw new Error(message);
  }
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
  saveSession({
    user,
    idToken: authResult.idToken,
    refreshToken: authResult.refreshToken,
  }).catch(() => {});

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
  saveSession({
    user,
    idToken: authResult.idToken,
    refreshToken: authResult.refreshToken,
  }).catch(() => {});

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

  saveSession({
    ...session,
    user: updatedUser,
  }).catch(() => {});

  return mergedProfile;
};
