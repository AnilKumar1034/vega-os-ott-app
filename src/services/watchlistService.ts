import {firebaseConfig} from '../config/firebaseConfig';
import {HomeContentItem} from '../data/home';
import {AddToWatchlistInput, WatchlistItem} from '../types/watchlist';
import {authenticatedFirestoreFetch, getStoredSession} from './authService';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const WATCHLIST_COLLECTION = 'watchlist';

const readJson = async (response: any) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const encodeString = (value: string) => ({stringValue: value});

const decodeString = (value: any): string => value?.stringValue ?? '';

const encodeRecord = (record: WatchlistItem) => ({
  fields: {
    contentId: encodeString(record.contentId),
    title: encodeString(record.title),
    image: encodeString(record.image || ''),
    type: encodeString(record.type || 'movie'),
    genre: encodeString(record.genre || ''),
    addedAt: encodeString(record.addedAt),
  },
});

const decodeRecord = (doc: any): WatchlistItem | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  const nameParts = (doc?.name || '').split('/');
  const docId = nameParts[nameParts.length - 1] || '';
  const contentId = decodeString(fields.contentId) || docId;
  const title = decodeString(fields.title);

  if (!contentId || !title) {
    return null;
  }

  return {
    contentId,
    title,
    image: decodeString(fields.image) || undefined,
    type: decodeString(fields.type) || 'movie',
    genre: decodeString(fields.genre) || undefined,
    addedAt: decodeString(fields.addedAt) || new Date().toISOString(),
  };
};

const getProfileCollectionUrl = (uid: string, profileId: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/profiles/${profileId}/${WATCHLIST_COLLECTION}`;

const getProfileDocUrl = (uid: string, profileId: string, contentId: string) =>
  `${getProfileCollectionUrl(uid, profileId)}/${contentId}`;

export const fetchWatchlist = async (
  profileId?: string,
): Promise<WatchlistItem[]> => {
  if (!profileId || typeof profileId !== 'string' || !profileId.trim()) {
    return [];
  }

  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return [];
  }

  try {
    const response = await authenticatedFirestoreFetch(
      getProfileCollectionUrl(session.user.uid, profileId.trim()),
    );

    if (!response.ok) {
      return [];
    }

    const json = await readJson(response);
    const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
    const items = docs
      .map((doc: any) => decodeRecord(doc))
      .filter((item): item is WatchlistItem => Boolean(item));

    // Sort newest additions first (addedAt DESC)
    items.sort((a, b) => {
      const timeA = new Date(a.addedAt).getTime() || 0;
      const timeB = new Date(b.addedAt).getTime() || 0;
      return timeB - timeA;
    });

    return items;
  } catch (error) {
    console.log('Error fetching watchlist items:', error);
    return [];
  }
};

export const getWatchlistItem = async (
  profileId?: string,
  contentId?: string,
): Promise<WatchlistItem | null> => {
  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !contentId
  ) {
    return null;
  }

  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return null;
  }

  try {
    const response = await authenticatedFirestoreFetch(
      getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
    );

    if (!response.ok) {
      return null;
    }

    const json = await readJson(response);
    return decodeRecord(json);
  } catch (error) {
    console.log('Error fetching watchlist item for content:', error);
    return null;
  }
};

export const isInWatchlist = async (
  profileId?: string,
  contentId?: string,
): Promise<boolean> => {
  const item = await getWatchlistItem(profileId, contentId);
  return Boolean(item);
};

export const addToWatchlist = async (
  profileId?: string,
  content?: AddToWatchlistInput | HomeContentItem,
): Promise<void> => {
  const contentId =
    (content as AddToWatchlistInput)?.contentId ||
    (content as HomeContentItem)?.id;
  const title = content?.title;

  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !contentId ||
    !title
  ) {
    return;
  }

  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return;
  }

  let imageUri: string | undefined;
  if (typeof content.image === 'string') {
    imageUri = content.image;
  } else if (
    content.image &&
    typeof content.image === 'object' &&
    'uri' in content.image
  ) {
    imageUri = (content.image as {uri: string}).uri;
  }

  const record: WatchlistItem = {
    contentId,
    title,
    image: imageUri,
    type: (content as any)?.type || 'movie',
    genre: (content as any)?.genre,
    addedAt: new Date().toISOString(),
  };

  const response = await authenticatedFirestoreFetch(
    getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encodeRecord(record)),
    },
  );

  if (response && !response.ok) {
    const json = await readJson(response);
    throw new Error(json?.error?.message || 'FIRESTORE_WRITE_FAILED');
  }
};

export const removeFromWatchlist = async (
  profileId?: string,
  contentId?: string,
): Promise<void> => {
  if (
    !profileId ||
    typeof profileId !== 'string' ||
    !profileId.trim() ||
    !contentId
  ) {
    return;
  }

  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return;
  }

  try {
    const response = await authenticatedFirestoreFetch(
      getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
      {
        method: 'DELETE',
      },
    );

    if (!response.ok && response.status !== 404) {
      const json = await readJson(response);
      throw new Error(json?.error?.message || 'FIRESTORE_DELETE_FAILED');
    }
  } catch (error) {
    console.log('Error removing watchlist record:', error);
    throw error;
  }
};
