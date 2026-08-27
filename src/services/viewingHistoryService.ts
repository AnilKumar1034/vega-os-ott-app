import {firebaseConfig} from '../config/firebaseConfig';
import {HomeContentItem} from '../data/home';
import {RecordHistoryInput, ViewingHistoryItem} from '../types/history';
import {
  authenticatedFirestoreFetch,
  getStoredSession,
} from './authService';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const HISTORY_COLLECTION = 'history';

const readJson = async (response: any) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const encodeString = (value: string) => ({stringValue: value});
const encodeNumber = (value: number) => ({
  integerValue: String(Math.floor(value)),
});

const decodeString = (value: any): string => value?.stringValue ?? '';
const decodeNumber = (value: any): number => {
  if (value?.integerValue !== undefined) {
    return Number(value.integerValue);
  }
  if (value?.doubleValue !== undefined) {
    return Number(value.doubleValue);
  }
  return 0;
};

const encodeRecord = (record: ViewingHistoryItem) => ({
  fields: {
    contentId: encodeString(record.contentId),
    title: encodeString(record.title),
    image: encodeString(record.image || ''),
    type: encodeString(record.type || 'movie'),
    genre: encodeString(record.genre || ''),
    lastWatchedAt: encodeString(record.lastWatchedAt),
    watchCount: encodeNumber(record.watchCount),
  },
});

const decodeRecord = (doc: any): ViewingHistoryItem | null => {
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
    lastWatchedAt:
      decodeString(fields.lastWatchedAt) || new Date().toISOString(),
    watchCount: decodeNumber(fields.watchCount) || 1,
  };
};

const getProfileCollectionUrl = (uid: string, profileId: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/profiles/${profileId}/${HISTORY_COLLECTION}`;

const getProfileDocUrl = (uid: string, profileId: string, contentId: string) =>
  `${getProfileCollectionUrl(uid, profileId)}/${contentId}`;

export const fetchViewingHistory = async (
  profileId?: string,
): Promise<ViewingHistoryItem[]> => {
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
      .filter((item): item is ViewingHistoryItem => Boolean(item));

    // Sort most recently watched first (lastWatchedAt DESC)
    items.sort((a, b) => {
      const timeA = new Date(a.lastWatchedAt).getTime() || 0;
      const timeB = new Date(b.lastWatchedAt).getTime() || 0;
      return timeB - timeA;
    });

    return items;
  } catch (error) {
    console.log('Error fetching viewing history items:', error);
    return [];
  }
};

export const getViewingHistoryItem = async (
  profileId?: string,
  contentId?: string,
): Promise<ViewingHistoryItem | null> => {
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
    console.log('Error fetching viewing history for content:', error);
    return null;
  }
};

export const recordViewingHistory = async (
  profileId?: string,
  content?: RecordHistoryInput | HomeContentItem,
): Promise<void> => {
  const contentId =
    (content as RecordHistoryInput)?.contentId ||
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

  try {
    const existing = await getViewingHistoryItem(profileId, contentId);
    const newWatchCount = (existing?.watchCount || 0) + 1;

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

    const record: ViewingHistoryItem = {
      contentId,
      title,
      image: imageUri || existing?.image,
      type: (content as any)?.type || existing?.type || 'movie',
      genre: (content as any)?.genre || existing?.genre,
      lastWatchedAt: new Date().toISOString(),
      watchCount: newWatchCount,
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
  } catch (error) {
    console.log('Error recording viewing history:', error);
  }
};

export const clearViewingHistoryItem = async (
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
    await authenticatedFirestoreFetch(
      getProfileDocUrl(session.user.uid, profileId.trim(), contentId),
      {
        method: 'DELETE',
      },
    );
  } catch (error) {
    console.log('Error clearing viewing history record:', error);
  }
};
