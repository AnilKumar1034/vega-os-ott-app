import {firebaseConfig} from '../config/firebaseConfig';
import {ParentalControlsSettings} from '../types/parentalControls';
import {
  hashParentPin,
  isValidPinFormat,
  verifyPinHash,
} from '../utils/cryptoUtils';
import {authenticatedFirestoreFetch} from './authService';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';
const PARENTAL_STORAGE_KEY_PREFIX = '@vegaott/parental-controls-';

const getAsyncStorage = () => {
  try {
    return require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
      .default;
  } catch {
    try {
      return require('@react-native-async-storage/async-storage').default;
    } catch {
      return null;
    }
  }
};

const saveLocalSettings = async (
  uid: string,
  settings: ParentalControlsSettings,
): Promise<void> => {
  try {
    const storage = getAsyncStorage();
    if (storage) {
      await storage.setItem(
        `${PARENTAL_STORAGE_KEY_PREFIX}${uid}`,
        JSON.stringify(settings),
      );
    }
  } catch (err) {
    console.log('Failed to save local parental settings:', err);
  }
};

const readLocalSettings = async (
  uid: string,
): Promise<ParentalControlsSettings | null> => {
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const stored = await storage.getItem(
        `${PARENTAL_STORAGE_KEY_PREFIX}${uid}`,
      );
      if (stored) {
        return JSON.parse(stored) as ParentalControlsSettings;
      }
    }
  } catch (err) {
    console.log('Failed to read local parental settings:', err);
  }
  return null;
};

const readJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const encodeString = (value: string) => ({stringValue: value});
const encodeBoolean = (value: boolean) => ({booleanValue: value});

const decodeString = (value: any): string => value?.stringValue ?? '';
const decodeBoolean = (value: any): boolean => Boolean(value?.booleanValue);

const encodeDocument = (settings: ParentalControlsSettings) => ({
  fields: {
    pinEnabled: encodeBoolean(settings.pinEnabled),
    ...(settings.pinHash ? {pinHash: encodeString(settings.pinHash)} : {}),
    ...(settings.createdAt
      ? {createdAt: encodeString(settings.createdAt)}
      : {createdAt: encodeString(new Date().toISOString())}),
    updatedAt: encodeString(settings.updatedAt || new Date().toISOString()),
  },
});

const decodeDocument = (doc: any): ParentalControlsSettings | null => {
  const fields = doc?.fields;
  if (!fields) {
    return null;
  }

  return {
    pinEnabled: decodeBoolean(fields.pinEnabled),
    pinHash: decodeString(fields.pinHash) || undefined,
    createdAt: decodeString(fields.createdAt) || undefined,
    updatedAt: decodeString(fields.updatedAt) || undefined,
  };
};

const getSettingsDocUrl = (uid: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}/parentalControls/settings`;

const getUserDocUrl = (uid: string) =>
  `${FIRESTORE_BASE}/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}`;

const encodeUserDocParentalPayload = (settings: ParentalControlsSettings) => ({
  fields: {
    parentalControls: {
      mapValue: {
        fields: {
          pinEnabled: encodeBoolean(settings.pinEnabled),
          ...(settings.pinHash ? {pinHash: encodeString(settings.pinHash)} : {}),
          ...(settings.createdAt ? {createdAt: encodeString(settings.createdAt)} : {}),
          updatedAt: encodeString(settings.updatedAt || new Date().toISOString()),
        },
      },
    },
  },
});

const decodeUserDocParentalSettings = (doc: any): ParentalControlsSettings | null => {
  const mapFields = doc?.fields?.parentalControls?.mapValue?.fields;
  if (!mapFields) {
    return null;
  }
  return {
    pinEnabled: decodeBoolean(mapFields.pinEnabled),
    pinHash: decodeString(mapFields.pinHash) || undefined,
    createdAt: decodeString(mapFields.createdAt) || undefined,
    updatedAt: decodeString(mapFields.updatedAt) || undefined,
  };
};

export const parentalControlsService = {
  getSettings: async (uid: string): Promise<ParentalControlsSettings | null> => {
    if (!uid || !uid.trim()) {
      return null;
    }

    try {
      // 1. Try primary path: users/{uid}/parentalControls/settings
      const response = await authenticatedFirestoreFetch(getSettingsDocUrl(uid));
      if (response && response.ok) {
        const json = await readJson(response);
        const decoded = decodeDocument(json);
        if (decoded) {
          await saveLocalSettings(uid, decoded);
          return decoded;
        }
      } else if (response && response.status === 403) {
        // 2. If 403, try reading from user document: users/{uid}
        const userDocResponse = await authenticatedFirestoreFetch(getUserDocUrl(uid));
        if (userDocResponse && userDocResponse.ok) {
          const json = await readJson(userDocResponse);
          const decoded = decodeUserDocParentalSettings(json);
          if (decoded) {
            await saveLocalSettings(uid, decoded);
            return decoded;
          }
        }
      }
    } catch {
      // Network or request error, proceed to local cache fallback
    }

    // 3. Fallback to local storage cache
    return await readLocalSettings(uid);
  },

  setParentPin: async (uid: string, pin: string): Promise<void> => {
    if (!uid || !uid.trim()) {
      throw new Error('NO_AUTHENTICATED_USER');
    }

    if (!isValidPinFormat(pin)) {
      throw new Error('INVALID_PIN_FORMAT');
    }

    const pinHash = hashParentPin(pin, uid);
    const now = new Date().toISOString();

    const existing = await parentalControlsService.getSettings(uid);
    const updatedSettings: ParentalControlsSettings = {
      pinHash,
      pinEnabled: true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    // Save to local storage (hashed only) for offline/immediate resilience
    await saveLocalSettings(uid, updatedSettings);

    try {
      // Try primary path: users/{uid}/parentalControls/settings
      const response = await authenticatedFirestoreFetch(getSettingsDocUrl(uid), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encodeDocument(updatedSettings)),
      });

      if (response && response.ok) {
        return;
      }

      // If 403 or permission denied, write to user document with updateMask
      if (response && response.status === 403) {
        const userDocUrl = `${getUserDocUrl(uid)}?updateMask.fieldPaths=parentalControls`;
        const userDocResponse = await authenticatedFirestoreFetch(userDocUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(encodeUserDocParentalPayload(updatedSettings)),
        });

        if (userDocResponse && userDocResponse.ok) {
          return;
        }
      }
    } catch (err) {
      console.log('Remote Firestore write fallback to local storage:', err);
    }
  },

  verifyPin: async (uid: string, pin: string): Promise<boolean> => {
    if (!uid || !isValidPinFormat(pin)) {
      return false;
    }

    const settings = await parentalControlsService.getSettings(uid);
    if (!settings || !settings.pinEnabled || !settings.pinHash) {
      return false;
    }

    return verifyPinHash(pin, uid, settings.pinHash);
  },

  removeParentPin: async (uid: string): Promise<void> => {
    if (!uid || !uid.trim()) {
      throw new Error('NO_AUTHENTICATED_USER');
    }

    const now = new Date().toISOString();
    const updatedSettings: ParentalControlsSettings = {
      pinHash: '',
      pinEnabled: false,
      updatedAt: now,
    };

    await saveLocalSettings(uid, updatedSettings);

    try {
      const response = await authenticatedFirestoreFetch(getSettingsDocUrl(uid), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encodeDocument(updatedSettings)),
      });

      if (response && response.ok) {
        return;
      }

      if (response && response.status === 403) {
        const userDocUrl = `${getUserDocUrl(uid)}?updateMask.fieldPaths=parentalControls`;
        await authenticatedFirestoreFetch(userDocUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(encodeUserDocParentalPayload(updatedSettings)),
        });
      }
    } catch (err) {
      console.log('Remote Firestore remove fallback to local storage:', err);
    }
  },
};
