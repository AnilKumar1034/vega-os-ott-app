import {firebaseConfig} from '../config/firebaseConfig';
import {HomeContentItem} from '../data/home';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const SESSION_STORAGE_KEY = '@vegaott/auth-session';
const CONTINUE_WATCH_COLLECTION = 'continueWatching';
const WATCHED_RATIO_THRESHOLD = 0.02;

type StoredSession = {
  user: {uid: string};
  idToken: string;
};

export type ContinueWatchRecord = {
  contentId: string;
  title: string;
  imageUri?: string;
  videoUrl?: string;
  progress: number;
  currentTime: number;
  duration?: number;
  updatedAt: string;
};

const readJson = async (response: any) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getSession = async (): Promise<StoredSession | null> => {
  const AsyncStorage =
    require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
      .default as {
      getItem: (key: string) => Promise<string | null>;
    };
  const storedValue = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StoredSession;
  } catch {
    return null;
  }
};

const encodeString = (value: string) => ({stringValue: value});
const encodeNumber = (value: number) => ({doubleValue: value});

const decodeString = (value: any): string => value?.stringValue ?? '';
const decodeNumber = (value: any): number =>
  Number(value?.doubleValue ?? value?.integerValue ?? 0);

const encodeRecord = (record: ContinueWatchRecord) => ({
  fields: {
    contentId: encodeString(record.contentId),
    title: encodeString(record.title),
    imageUri: encodeString(record.imageUri || ''),
    videoUrl: encodeString(record.videoUrl || ''),
    progress: encodeNumber(record.progress),
    currentTime: encodeNumber(record.currentTime),
    duration: encodeNumber(record.duration ?? 0),
    updatedAt: encodeString(record.updatedAt),
  },
});

const decodeRecord = (doc: any): ContinueWatchRecord | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  return {
    contentId: decodeString(fields.contentId),
    title: decodeString(fields.title),
    imageUri: decodeString(fields.imageUri) || undefined,
    videoUrl: decodeString(fields.videoUrl) || undefined,
    progress: decodeNumber(fields.progress),
    currentTime: decodeNumber(fields.currentTime),
    duration: decodeNumber(fields.duration) || undefined,
    updatedAt: decodeString(fields.updatedAt),
  };
};

const getProfileCollectionUrl = (uid: string, profileId: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/profiles/${profileId}/${CONTINUE_WATCH_COLLECTION}`;

const getProfileDocUrl = (uid: string, profileId: string, contentId: string) =>
  `${getProfileCollectionUrl(uid, profileId)}/${contentId}`;

export const fetchContinueWatchItems = async (
  profileId?: string,
): Promise<ContinueWatchRecord[]> => {
  if (!profileId || typeof profileId !== 'string' || !profileId.trim()) {
    return [];
  }

  const session = await getSession();
  if (!session?.user?.uid) {
    return [];
  }

  try {
    const response = await fetch(
      getProfileCollectionUrl(session.user.uid, profileId.trim()),
      {
        headers: {Authorization: `Bearer ${session.idToken}`},
      },
    );

    if (!response.ok) {
      return [];
    }

    const json = await readJson(response);
    const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
    const records = docs
      .map((doc: any) => decodeRecord(doc))
      .filter((item): item is ContinueWatchRecord => Boolean(item))
      .filter(
        (item: ContinueWatchRecord) =>
          item.progress >= WATCHED_RATIO_THRESHOLD && item.progress < 1,
      );

    // Sort most recently watched first
    records.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime() || 0;
      const timeB = new Date(b.updatedAt).getTime() || 0;
      return timeB - timeA;
    });

    return records;
  } catch (error) {
    console.log('Error fetching continue watching items:', error);
    return [];
  }
};

export const fetchContinueWatching = fetchContinueWatchItems;

export const fetchContinueWatchForContent = async (
  profileId?: string,
  contentId?: string,
): Promise<ContinueWatchRecord | null> => {
  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !contentId
  ) {
    return null;
  }

  const session = await getSession();
  if (!session?.user?.uid) {
    return null;
  }

  try {
    const response = await fetch(
      getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
      {
        headers: {Authorization: `Bearer ${session.idToken}`},
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = await readJson(response);
    return decodeRecord(json);
  } catch (error) {
    console.log('Error fetching continue watch record for content:', error);
    return null;
  }
};

export const saveContinueWatchProgress = async (
  profileId?: string,
  movie?: HomeContentItem,
  currentTime?: number,
  duration?: number,
) => {
  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !movie?.id ||
    currentTime === undefined ||
    !Number.isFinite(currentTime) ||
    currentTime < 0
  ) {
    return;
  }

  const safeDuration =
    duration !== undefined && Number.isFinite(duration) && duration > 0
      ? duration
      : undefined;

  const progress =
    safeDuration && safeDuration > 0
      ? Math.min(Math.max(0, currentTime / safeDuration), 1)
      : 0;

  if (progress < WATCHED_RATIO_THRESHOLD || progress >= 1) {
    return;
  }

  const session = await getSession();
  if (!session?.user?.uid) {
    return;
  }

  const record: ContinueWatchRecord = {
    contentId: movie.id,
    title: movie.title,
    imageUri:
      movie.image && typeof movie.image === 'object' && 'uri' in movie.image
        ? movie.image.uri
        : undefined,
    videoUrl: movie.videoUrl,
    progress,
    currentTime,
    duration: safeDuration,
    updatedAt: new Date().toISOString(),
  };

  const response = await fetch(
    getProfileDocUrl(session.user.uid, profileId.trim(), movie.id),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.idToken}`,
      },
      body: JSON.stringify(encodeRecord(record)),
    },
  );

  if (!response.ok) {
    const json = await readJson(response);
    throw new Error(json?.error?.message || 'FIRESTORE_WRITE_FAILED');
  }
};

export const clearContinueWatchProgress = async (
  profileId?: string,
  contentId?: string,
) => {
  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !contentId
  ) {
    return;
  }

  const session = await getSession();
  if (!session?.user?.uid) {
    return;
  }

  try {
    await fetch(
      getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
      {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${session.idToken}`},
      },
    );
  } catch (error) {
    console.log('Error clearing continue watch record:', error);
  }
};
