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

const readJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getSession = async (): Promise<StoredSession | null> => {
  const AsyncStorage = require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
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
const decodeNumber = (value: any): number => Number(value?.doubleValue ?? value?.integerValue ?? 0);

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

const getUserCollectionUrl = (uid: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/${CONTINUE_WATCH_COLLECTION}`;

const getUserDocUrl = (uid: string, contentId: string) =>
  `${getUserCollectionUrl(uid)}/${contentId}`;

export const fetchContinueWatchItems = async (): Promise<ContinueWatchRecord[]> => {
  const session = await getSession();
  if (!session?.user?.uid) {
    return [];
  }

  const response = await fetch(getUserCollectionUrl(session.user.uid), {
    headers: {Authorization: `Bearer ${session.idToken}`},
  });

  if (!response.ok) {
    return [];
  }

  const json = await readJson(response);
  const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
  return docs
    .map((doc: any) => decodeRecord(doc))
    .filter((item): item is ContinueWatchRecord => Boolean(item))
    .filter(
      (item: ContinueWatchRecord) =>
        item.progress >= WATCHED_RATIO_THRESHOLD && item.progress < 1,
    );
};

export const fetchContinueWatchForContent = async (
  contentId: string,
): Promise<ContinueWatchRecord | null> => {
  const session = await getSession();
  if (!session?.user?.uid) {
    return null;
  }

  const response = await fetch(getUserDocUrl(session.user.uid, contentId), {
    headers: {Authorization: `Bearer ${session.idToken}`},
  });

  if (!response.ok) {
    return null;
  }

  const json = await readJson(response);
  return decodeRecord(json);
};

export const saveContinueWatchProgress = async (
  movie: HomeContentItem,
  currentTime: number,
  duration?: number,
) => {
  const session = await getSession();
  if (!session?.user?.uid) {
    return;
  }

  const safeDuration = duration && duration > 0 ? duration : undefined;
  const progress =
    safeDuration && safeDuration > 0
      ? Math.min(currentTime / safeDuration, 1)
      : 0;

  if (progress < WATCHED_RATIO_THRESHOLD || progress >= 1) {
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

  const response = await fetch(getUserDocUrl(session.user.uid, movie.id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.idToken}`,
    },
    body: JSON.stringify(encodeRecord(record)),
  });

  if (!response.ok) {
    const json = await readJson(response);
    throw new Error(json?.error?.message || 'FIRESTORE_WRITE_FAILED');
  }
};

export const clearContinueWatchProgress = async (contentId: string) => {
  const session = await getSession();
  if (!session?.user?.uid) {
    return;
  }

  await fetch(getUserDocUrl(session.user.uid, contentId), {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${session.idToken}`},
  });
};
