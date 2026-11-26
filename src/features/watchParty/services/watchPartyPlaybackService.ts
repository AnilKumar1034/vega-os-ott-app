/**
 * Watch Party Playback Service
 * Validates content eligibility, entitlements, and coordinates playback transitions.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartyContentType,
  WatchPartyErrorCode,
  WatchPartyPlaybackState,
  WatchPartyRoom,
  canControlWatchPartyPlayback,
} from '../types/watchParty.types';
import {watchPartyApi} from './watchPartyApi';
import {findContentById} from '../../../utils/deeplink';
import {canProfileAccessContent} from '../../../utils/contentAccessPolicy';
import {entitlementService} from '../../../services/entitlementService';
import {analyticsService} from '../../../analytics';

export interface ContentEligibilityResult {
  isEligible: boolean;
  error?: string;
  errorCode?: WatchPartyErrorCode;
  content?: any;
}

export interface ValidateEligibilityParams {
  room: WatchPartyRoom | null | undefined;
  user: any;
  userProfile: any;
  activeProfile: any;
  resolvedContent?: any;
}

/**
 * Validates whether the active user and profile can access and play the room's content.
 * Strictly respects existing DRM, content rating, parental controls, and subscription entitlements.
 */
export const validateWatchPartyContentEligibility = ({
  room,
  user,
  userProfile,
  activeProfile,
  resolvedContent,
}: ValidateEligibilityParams): ContentEligibilityResult => {
  if (!room) {
    return {
      isEligible: false,
      error: 'Room details unavailable.',
      errorCode: 'ROOM_NOT_FOUND',
    };
  }

  if (room.status === 'expired') {
    return {
      isEligible: false,
      error: 'This Watch Party room has expired.',
      errorCode: 'ROOM_EXPIRED',
    };
  }

  if (room.status === 'ended') {
    return {
      isEligible: false,
      error: 'This Watch Party room has ended.',
      errorCode: 'ROOM_ENDED',
    };
  }

  const content = resolvedContent || findContentById(room.contentId);
  if (!content) {
    return {
      isEligible: false,
      error: 'The requested movie or episode could not be found in the catalog.',
      errorCode: 'CONTENT_UNAVAILABLE',
    };
  }

  // 1. Parental Controls / Kids Profile Access Policy
  const isAllowedForProfile = canProfileAccessContent(activeProfile, content);
  if (!isAllowedForProfile) {
    return {
      isEligible: false,
      error: 'This content is restricted for the current profile rating settings.',
      errorCode: 'PROFILE_RESTRICTED',
      content,
    };
  }

  // 2. Entitlement Access Check
  const entitlementAccess = entitlementService.checkContentAccess(
    userProfile,
    activeProfile,
    content,
  );
  if (!entitlementAccess.isEntitled) {
    return {
      isEligible: false,
      error: 'An active subscription is required to stream this content.',
      errorCode: 'ENTITLEMENT_REQUIRED',
      content,
    };
  }

  return {
    isEligible: true,
    content,
  };
};

/**
 * Initiates shared playback for the host after validating permissions and content eligibility.
 */
export const startHostWatchPartyPlayback = async (
  room: WatchPartyRoom,
  participantId: string,
  contentType: WatchPartyContentType,
): Promise<WatchPartyPlaybackState> => {
  if (!canControlWatchPartyPlayback(room, participantId)) {
    throw new Error('Only the room host can start Watch Party playback.');
  }

  analyticsService
    .track('watch_party_start_playback_pressed' as any, {
      roomId: room.id,
      contentId: room.contentId,
      hostId: room.hostId,
    })
    .catch(() => {});

  const response = await watchPartyApi.initializePlayback({
    roomId: room.id,
    contentId: room.contentId,
    contentType,
    participantId,
  });

  analyticsService
    .track('watch_party_playback_started' as any, {
      roomId: room.id,
      contentId: room.contentId,
      role: 'host',
      positionSeconds: response.data.positionSeconds,
    })
    .catch(() => {});

  return response.data;
};

/**
 * Validates participant entry into an ongoing playback session.
 */
export const recordParticipantPlaybackEntry = (
  room: WatchPartyRoom,
  participantId: string,
): void => {
  analyticsService
    .track('watch_party_participant_playback_entered' as any, {
      roomId: room.id,
      contentId: room.contentId,
      participantId,
      role: 'participant',
    })
    .catch(() => {});
};
