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

export interface WatchPartyPlaybackState {
  roomId: string;
  sessionId: string;

  contentId: string;

  status: WatchPartyPlaybackStatus;

  positionSeconds: number;

  updatedAt: string;

  hostId: string;

  sequenceNumber: number;
}

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
