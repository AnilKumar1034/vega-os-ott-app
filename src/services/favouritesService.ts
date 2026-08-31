import {firebaseConfig} from '../config/firebaseConfig';
import {HomeContentItem} from '../data/home';
import {authenticatedFirestoreFetch, getStoredSession} from './authService';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const FAVOURITES_COLLECTION = 'favourites';

export type FavouriteRecord = {
  contentId: string;
  title: string;
  imageUri?: string;
  videoUrl?: string;
  updatedAt: string;
};

const readJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const encodeString = (value: string) => ({stringValue: value});

const decodeString = (value: any): string => value?.stringValue ?? '';

const encodeRecord = (record: FavouriteRecord) => ({
  fields: {
    contentId: encodeString(record.contentId),
    title: encodeString(record.title),
    imageUri: encodeString(record.imageUri || ''),
    videoUrl: encodeString(record.videoUrl || ''),
    updatedAt: encodeString(record.updatedAt),
  },
});

const decodeRecord = (doc: any): FavouriteRecord | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  return {
    contentId: decodeString(fields.contentId),
    title: decodeString(fields.title),
    imageUri: decodeString(fields.imageUri) || undefined,
    videoUrl: decodeString(fields.videoUrl) || undefined,
    updatedAt: decodeString(fields.updatedAt),
  };
};

const getUserCollectionUrl = (uid: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/${FAVOURITES_COLLECTION}`;

const getUserDocUrl = (uid: string, contentId: string) =>
  `${getUserCollectionUrl(uid)}/${contentId}`;

export const fetchFavouriteItems = async (): Promise<FavouriteRecord[]> => {
  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return [];
  }

  const response = await authenticatedFirestoreFetch(
    getUserCollectionUrl(session.user.uid),
  );

  if (!response.ok) {
    return [];
  }

  const json = await readJson(response);
  const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
  return docs
    .map((doc: any) => decodeRecord(doc))
    .filter((item): item is FavouriteRecord => Boolean(item));
};

export const fetchFavouriteForContent = async (
  contentId: string,
): Promise<FavouriteRecord | null> => {
  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return null;
  }

  const response = await authenticatedFirestoreFetch(
    getUserDocUrl(session.user.uid, contentId),
  );

  if (!response.ok) {
    return null;
  }

  const json = await readJson(response);
  return decodeRecord(json);
};

type FavouriteSource = Pick<
  HomeContentItem,
  'id' | 'title' | 'image' | 'videoUrl'
>;

export const addFavourite = async (movie: FavouriteSource) => {
  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return;
  }

  const record: FavouriteRecord = {
    contentId: movie.id,
    title: movie.title,
    imageUri:
      movie.image && typeof movie.image === 'object' && 'uri' in movie.image
        ? movie.image.uri
        : undefined,
    videoUrl: movie.videoUrl,
    updatedAt: new Date().toISOString(),
  };

  const response = await authenticatedFirestoreFetch(
    getUserDocUrl(session.user.uid, movie.id),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encodeRecord(record)),
    },
  );

  if (!response.ok) {
    const json = await readJson(response);
    throw new Error(json?.error?.message || 'FIRESTORE_WRITE_FAILED');
  }
};

export const removeFavourite = async (contentId: string) => {
  const session = await getStoredSession();
  if (!session?.user?.uid) {
    return;
  }

  await authenticatedFirestoreFetch(
    getUserDocUrl(session.user.uid, contentId),
    {
      method: 'DELETE',
    },
  );
};
