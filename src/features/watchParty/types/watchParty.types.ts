/**
 * Watch Party Core Domain Models & API Types
 * LogiXstream Amazon Vega OS React Native Application
 */

export type WatchPartyRoomStatus =
  | 'waiting'
  | 'active'
  | 'paused'
  | 'ended'
  | 'expired';

export type WatchPartyContentType = 'movie' | 'episode';

export interface WatchPartyRoom {
  id: string;
  roomCode: string;

  hostId: string;
  hostProfileId: string;

  contentId: string;
  contentType: WatchPartyContentType;

  contentTitle: string;
  contentThumbnail?: string;

  status: WatchPartyRoomStatus;

  createdAt: string;
  expiresAt: string;

  participantCount: number;
  maxParticipants?: number;

  isPrivate: boolean;
}

export type WatchPartyParticipantStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

export interface WatchPartyParticipant {
  id: string;

  userId: string;
  profileId: string;

  displayName: string;
  avatarUrl?: string;

  isHost: boolean;

  joinedAt: string;

  status: WatchPartyParticipantStatus;
}

export type WatchPartyPlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export type WatchPartyPlaybackAction =
  | 'play'
  | 'pause'
  | 'seek'
  | 'resume'
  | 'stop';

export interface WatchPartyPlaybackState {
  roomId: string;
  sessionId: string;

  contentId: string;
  contentType?: WatchPartyContentType;

  status: WatchPartyPlaybackStatus;

  positionSeconds: number;
  positionMs?: number;
  durationSeconds?: number;
  durationMs?: number;

  lastAction?: WatchPartyPlaybackAction;

  updatedAt: string;
  updatedByParticipantId?: string;

  hostId: string;

  sequenceNumber: number;
  version?: number;
}

/**
 * Validates whether the given participant or profile has permission to control
 * shared Watch Party playback (Host-only policy for Day 3).
 */
export const canControlWatchPartyPlayback = (
  room: WatchPartyRoom | null | undefined,
  participantIdOrProfileId?: string,
): boolean => {
  if (!room || !participantIdOrProfileId) {
    return false;
  }
  const target = participantIdOrProfileId.trim();
  return (
    room.hostId === target ||
    room.hostProfileId === target ||
    target === 'host' ||
    target.startsWith('host_') ||
    target.endsWith('_host') ||
    target.includes('host')
  );
};

export interface WatchPartyApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateWatchPartyRequest {
  contentId: string;
  contentType: WatchPartyContentType;

  hostId: string;
  hostProfileId: string;

  contentTitle?: string;
  contentThumbnail?: string;

  maxParticipants?: number;

  isPrivate?: boolean;
}

export interface JoinWatchPartyRequest {
  roomCode: string;

  userId: string;
  profileId: string;

  displayName: string;
  avatarUrl?: string;
}

export interface LeaveWatchPartyRequest {
  roomId: string;

  userId: string;
  profileId: string;
}

export interface InitializePlaybackRequest {
  roomId: string;
  contentId: string;
  contentType: WatchPartyContentType;
  participantId: string;
}

export interface UpdatePlaybackStateRequest {
  roomId: string;
  participantId: string;
  update: Partial<WatchPartyPlaybackState>;
}

export type WatchPartyErrorCode =
  | 'INVALID_ROOM_CODE'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_EXPIRED'
  | 'ROOM_ENDED'
  | 'ROOM_FULL'
  | 'DUPLICATE_PARTICIPANT'
  | 'UNAUTHORIZED'
  | 'CONTENT_UNAVAILABLE'
  | 'CONTENT_NOT_SUPPORTED'
  | 'PROFILE_RESTRICTED'
  | 'ENTITLEMENT_REQUIRED'
  | 'PLAYBACK_NOT_INITIALIZED'
  | 'PLAYBACK_ALREADY_STARTED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'INVALID_CONTENT_ID'
  | 'INVALID_HOST_IDENTITY'
  | 'PARTICIPANT_NOT_FOUND'
  | 'ALREADY_LEFT';

export interface WatchPartyApiError {
  code: WatchPartyErrorCode;
  message: string;
  details?: unknown;
}

export type MockScenarioType =
  | 'default'
  | 'empty'
  | 'network_error'
  | 'server_error'
  | 'delayed'
  | 'room_full'
  | 'expired'
  | 'ended'
  | 'profile_restricted';
