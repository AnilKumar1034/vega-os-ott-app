import {View} from 'react-native';
import {canProfileAccessContent} from '../../../utils/contentAccessPolicy';
import {ShortsItem} from '../types/shorts.types';
import {UserProfile} from '../../../profiles/types/Profile';
import {UserProfileData} from '../../../services/authService';

let KeplerVideoViewComponent: any = View;
let VideoPlayerClass: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const w3cMedia = require('@amazon-devices/react-native-w3cmedia');
  if (w3cMedia) {
    KeplerVideoViewComponent =
      w3cMedia.KeplerVideoView ||
      w3cMedia.KeplerVideoSurfaceView ||
      w3cMedia.Video ||
      View;
    VideoPlayerClass = w3cMedia.VideoPlayer || w3cMedia.Video || null;
  }
} catch {
  KeplerVideoViewComponent = View;
  VideoPlayerClass = null;
}

export {KeplerVideoViewComponent, VideoPlayerClass};

/**
 * Creates a new W3C Media VideoPlayer instance if supported on the platform.
 */
export const createVideoPlayerInstance = (): any => {
  if (!VideoPlayerClass) {
    return null;
  }
  try {
    return new VideoPlayerClass();
  } catch (e) {
    console.warn('[ShortsPlaybackService] Failed to instantiate VideoPlayer:', e);
    return null;
  }
};

/**
 * Synchronously releases Kepler / W3C media resources to avoid hardware crash/reclaim leaks.
 */
export const releasePlayerResourcesSync = (player: any): void => {
  if (!player) return;
  try {
    player.pause?.();
    if (player.clearSurfaceHandle) {
      player.clearSurfaceHandle?.('');
    }
    player.deinitializeSync?.(1000);
  } catch (err) {
    console.log('[ShortsPlaybackService] Synchronous media release notice:', err);
  }
};

/**
 * Verifies profile maturity and subscription entitlement before playback starts.
 */
export const checkShortPlaybackEligibility = (
  short: ShortsItem | null,
  activeProfile: UserProfile | null,
  userProfile?: UserProfileData | null,
): {allowed: boolean; errorReason?: string} => {
  if (!short) {
    return {allowed: false, errorReason: 'No Short selected'};
  }
  if (!short.videoUrl || typeof short.videoUrl !== 'string') {
    return {allowed: false, errorReason: 'Video stream URL is unavailable or invalid'};
  }

  // Check maturity rating restriction against active profile
  if (activeProfile) {
    const rating = short.maturityRating || short.ageRating;
    const canAccess = canProfileAccessContent(activeProfile, {
      maturityRating: rating,
    });
    if (!canAccess) {
      return {
        allowed: false,
        errorReason:
          'This Short is restricted by parental controls for the active profile.',
      };
    }
  }

  // Check premium entitlement
  if (short.isPremium && userProfile) {
    const isSubscribed =
      userProfile.subscription === 'Premium' ||
      userProfile.subscription === 'Basic';
    if (!isSubscribed) {
      return {
        allowed: false,
        errorReason:
          'This Short is available exclusively to Premium subscribers.',
      };
    }
  }

  return {allowed: true};
};
