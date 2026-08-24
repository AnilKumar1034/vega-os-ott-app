import {requestMediaKeySystemAccess} from '@amazon-devices/react-native-w3cmedia';

const WIDEVINE_KEY_SYSTEM = 'com.widevine.alpha';

/**
 * Verifies that the device can create a software Widevine session before
 * Shaka parses a manifest or contacts a license server.  Keeping this probe
 * separate from the player makes DRM capability failures actionable in logs.
 */
export const verifyWidevineSupport = async (): Promise<boolean> => {
  try {
    const access = await requestMediaKeySystemAccess(WIDEVINE_KEY_SYSTEM, [
      {
        initDataTypes: ['cenc'],
        videoCapabilities: [
          {
            contentType: 'video/mp4; codecs="avc1.42E01E"',
            robustness: 'SW_SECURE_CRYPTO',
          },
        ],
        audioCapabilities: [
          {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            robustness: 'SW_SECURE_CRYPTO',
          },
        ],
      },
    ]);

    console.log('WIDEVINE SUPPORTED:', access);
    console.log('WIDEVINE CONFIG:', access.getConfiguration());
    return true;
  } catch (error) {
    console.error('WIDEVINE NOT AVAILABLE:', error);
    return false;
  }
};
