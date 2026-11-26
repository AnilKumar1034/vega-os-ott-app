/**
 * Watch Party Mock API Service
 * In-memory simulated asynchronous backend for Watch Party rooms, participants, and playback state.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  CreateWatchPartyRequest,
  InitializePlaybackRequest,
  JoinWatchPartyRequest,
  LeaveWatchPartyRequest,
  MockScenarioType,
  UpdatePlaybackStateRequest,
  WatchPartyApiError,
  WatchPartyErrorCode,
  WatchPartyParticipant,
  WatchPartyPlaybackState,
  WatchPartyRoom,
  canControlWatchPartyPlayback,
} from '../types/watchParty.types';
import {
  DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
  WATCH_PARTY_ERROR_MESSAGES,
  WATCH_PARTY_ROOM_CONFIG,
  WATCH_PARTY_API_CONFIG,
} from '../constants/watchParty.constants';
import {PRESET_TEST_ROOMS} from '../mocks/watchParty.mock';
import {findContentById} from '../../../utils/deeplink';
import {resolveContentDetails} from '../../../services/contentDetailsService';
import {canProfileAccessContent} from '../../../utils/contentAccessPolicy';

declare const process: any;

let currentScenario: MockScenarioType = 'default';
let forcedDelayMs: number | null = null;

// Isolated Mock Storage Maps
const roomsStore = new Map<string, WatchPartyRoom>();
const participantsStore = new Map<string, WatchPartyParticipant[]>();
const playbackStateStore = new Map<string, WatchPartyPlaybackState>();
const roomCodeToIdIndex = new Map<string, string>();

const isTestEnvironment = (): boolean => {
  return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test';
};

const getEffectiveDelay = (
  defaultDelay = WATCH_PARTY_API_CONFIG.SIMULATED_LATENCY_MS,
): number => {
  if (forcedDelayMs !== null) {
    return forcedDelayMs;
  }
  if (currentScenario === 'delayed') {
    return 1500;
  }
  return isTestEnvironment() ? 0 : defaultDelay;
};

const delay = async (ms?: number): Promise<void> => {
  const waitTime = ms ?? getEffectiveDelay();
  if (waitTime <= 0) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

const cloneRoom = (room: WatchPartyRoom): WatchPartyRoom => ({...room});

const cloneParticipant = (
  participant: WatchPartyParticipant,
): WatchPartyParticipant => ({...participant});

const cloneParticipantsList = (
  list: WatchPartyParticipant[],
): WatchPartyParticipant[] => list.map(cloneParticipant);

const clonePlayback = (
  state: WatchPartyPlaybackState,
): WatchPartyPlaybackState => ({...state});

const createApiError = (
  code: WatchPartyErrorCode,
  customMessage?: string,
  details?: unknown,
): WatchPartyApiError => {
  return {
    code,
    message: customMessage || WATCH_PARTY_ERROR_MESSAGES[code] || 'An error occurred.',
    details,
  };
};

/**
 * Validates room code string format.
 * Valid code: 6 alphanumeric characters without ambiguous characters (0, O, 1, I).
 */
export const validateRoomCodeFormat = (code?: string): boolean => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH) {
    return false;
  }
  const allowedChars = new Set(WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_CHARACTERS);
  for (let i = 0; i < normalized.length; i++) {
    if (!allowedChars.has(normalized[i])) {
      return false;
    }
  }
  return true;
};

/**
 * Generates a unique, human-readable room code.
 */
export const generateUniqueRoomCode = (): string => {
  const chars = WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_CHARACTERS;
  const len = WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH;
  let attempts = 0;
  const maxAttempts = 500;

  while (attempts < maxAttempts) {
    let result = '';
    for (let i = 0; i < len; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    // Check uniqueness among currently active/waiting rooms
    if (!roomCodeToIdIndex.has(result)) {
      return result;
    }
    attempts++;
  }

  // Fallback timestamp based code if collision density is high
  return `WP${Date.now().toString(36).slice(-4).toUpperCase()}`;
};

/**
 * Checks if a room has expired based on expiration timestamp.
 * If expired, updates room status to 'expired' and unindexes code.
 */
const checkAndApplyRoomExpiration = (room: WatchPartyRoom): boolean => {
  if (room.status === 'expired') {
    return true;
  }
  const now = Date.now();
  const expiresAtMs = new Date(room.expiresAt).getTime();
  if (now >= expiresAtMs) {
    room.status = 'expired';
    return true;
  }
  return false;
};

/**
 * Evaluates simulated failure scenarios before executing API logic.
 */
const evaluateFailureScenario = async (): Promise<void> => {
  await delay();
  if (currentScenario === 'network_error') {
    throw createApiError('NETWORK_ERROR');
  }
  if (currentScenario === 'server_error') {
    throw createApiError('SERVER_ERROR');
  }
  if (currentScenario === 'profile_restricted') {
    throw createApiError('PROFILE_RESTRICTED');
  }
};

// ==========================================
// SCENARIO & CONTROLS MANAGEMENT
// ==========================================

export const setMockScenario = (scenario: MockScenarioType): void => {
  currentScenario = scenario;
};

export const getMockScenario = (): MockScenarioType => currentScenario;

export const setForcedDelayMs = (ms: number | null): void => {
  forcedDelayMs = ms;
};

export const resetMockStore = (): void => {
  roomsStore.clear();
  participantsStore.clear();
  playbackStateStore.clear();
  roomCodeToIdIndex.clear();
  currentScenario = 'default';
  forcedDelayMs = null;
};

/**
 * Seeds a room directly into mock storage (useful for deterministic tests).
 */
export const seedMockRoom = (
  room: WatchPartyRoom,
  participants?: WatchPartyParticipant[],
  playback?: WatchPartyPlaybackState,
): void => {
  roomsStore.set(room.id, cloneRoom(room));
  roomCodeToIdIndex.set(room.roomCode.toUpperCase(), room.id);
  if (participants) {
    participantsStore.set(room.id, cloneParticipantsList(participants));
  } else {
    participantsStore.set(room.id, []);
  }
  if (playback) {
    playbackStateStore.set(room.id, clonePlayback(playback));
  } else {
    playbackStateStore.set(room.id, {
      roomId: room.id,
      sessionId: `session_${room.id}`,
      contentId: room.contentId,
      status: 'idle',
      positionSeconds: 0,
      updatedAt: room.createdAt,
      hostId: room.hostId,
      sequenceNumber: 0,
    });
  }
};

/**
 * Seeds preset test rooms into the mock store for manual TV testing.
 */
export const initializeDefaultMockRooms = (): void => {
  PRESET_TEST_ROOMS.forEach(({room, participants, playback}) => {
    seedMockRoom(room, participants, playback);
  });
};

// Seed on startup when not running inside Jest test runner
if (!isTestEnvironment()) {
  initializeDefaultMockRooms();
}

const ensureStoreInitialized = (): void => {
  if (!isTestEnvironment() && roomsStore.size === 0) {
    initializeDefaultMockRooms();
  }
};

// ==========================================
// MOCK API OPERATIONS
// ==========================================

/**
 * Mock API: Create Watch Party Room
 * Contract: POST /api/v1/watch-party/rooms
 */
export const createWatchPartyRoom = async (
  request: CreateWatchPartyRequest,
): Promise<{room: WatchPartyRoom; host: WatchPartyParticipant}> => {
  await evaluateFailureScenario();

  // 1. Validate Content ID
  if (!request.contentId || !request.contentId.trim()) {
    throw createApiError('INVALID_CONTENT_ID');
  }

  // 2. Validate Content Type
  if (
    !request.contentType ||
    (request.contentType !== 'movie' && request.contentType !== 'episode')
  ) {
    throw createApiError('CONTENT_NOT_SUPPORTED');
  }

  // 3. Validate Host Identity
  if (
    !request.hostId ||
    !request.hostId.trim() ||
    !request.hostProfileId ||
    !request.hostProfileId.trim()
  ) {
    throw createApiError('INVALID_HOST_IDENTITY');
  }

  // 4. Validate Max Participants if provided
  let maxParticipants =
    request.maxParticipants ?? WATCH_PARTY_ROOM_CONFIG.DEFAULT_MAX_PARTICIPANTS;
  if (
    maxParticipants < WATCH_PARTY_ROOM_CONFIG.MIN_PARTICIPANTS ||
    maxParticipants > WATCH_PARTY_ROOM_CONFIG.MAX_ALLOWED_PARTICIPANTS
  ) {
    maxParticipants = WATCH_PARTY_ROOM_CONFIG.DEFAULT_MAX_PARTICIPANTS;
  }

  // 5. Content Catalog Resolution & Metadata
  let contentTitle = request.contentTitle?.trim() || '';
  let contentThumbnail = request.contentThumbnail || '';

  if (!contentTitle) {
    const resolved =
      findContentById(request.contentId) ||
      (await resolveContentDetails(request.contentId));
    if (resolved) {
      contentTitle = resolved.title || 'Untitled Content';
      if (!contentThumbnail && resolved.image) {
        contentThumbnail =
          typeof resolved.image === 'string'
            ? resolved.image
            : DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL;
      }
    } else {
      // If content cannot be resolved and no fallback provided
      contentTitle = `Content ${request.contentId}`;
      contentThumbnail = DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL;
    }
  }

  if (!contentThumbnail) {
    contentThumbnail = DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL;
  }

  // 6. Generate Room identifiers
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const roomCode = generateUniqueRoomCode();

  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(
    Date.now() + 1000 * 60 * WATCH_PARTY_ROOM_CONFIG.DEFAULT_EXPIRY_MINUTES,
  ).toISOString();

  // 7. Create Host Participant
  const hostParticipant: WatchPartyParticipant = {
    id: `part_${Date.now()}_host`,
    userId: request.hostId.trim(),
    profileId: request.hostProfileId.trim(),
    displayName: 'Host',
    avatarUrl: undefined,
    isHost: true,
    joinedAt: nowIso,
    status: 'connected',
  };

  // 8. Create Room Object
  const newRoom: WatchPartyRoom = {
    id: roomId,
    roomCode,
    hostId: request.hostId.trim(),
    hostProfileId: request.hostProfileId.trim(),
    contentId: request.contentId.trim(),
    contentType: request.contentType,
    contentTitle,
    contentThumbnail,
    status: 'waiting',
    createdAt: nowIso,
    expiresAt: expiresAtIso,
    participantCount: 1,
    maxParticipants,
    isPrivate: request.isPrivate ?? true,
  };

  // 9. Initialize Playback State
  const initialPlayback: WatchPartyPlaybackState = {
    roomId,
    sessionId: `session_${roomId}`,
    contentId: request.contentId.trim(),
    status: 'idle',
    positionSeconds: 0,
    updatedAt: nowIso,
    hostId: request.hostId.trim(),
    sequenceNumber: 0,
  };

  // 10. Store Records
  roomsStore.set(roomId, newRoom);
  roomCodeToIdIndex.set(roomCode.toUpperCase(), roomId);
  participantsStore.set(roomId, [hostParticipant]);
  playbackStateStore.set(roomId, initialPlayback);

  return {
    room: cloneRoom(newRoom),
    host: cloneParticipant(hostParticipant),
  };
};

/**
 * Mock API: Join Watch Party Room
 * Contract: POST /api/v1/watch-party/rooms/:roomCode/join
 */
export const joinWatchPartyRoom = async (
  request: JoinWatchPartyRequest,
): Promise<{room: WatchPartyRoom; participant: WatchPartyParticipant}> => {
  await evaluateFailureScenario();

  // 1. Validate Room Code Format
  if (!request.roomCode || !request.roomCode.trim()) {
    throw createApiError('INVALID_ROOM_CODE');
  }

  const normalizedCode = request.roomCode.trim().toUpperCase();
  if (!validateRoomCodeFormat(normalizedCode)) {
    throw createApiError('INVALID_ROOM_CODE');
  }

  // 2. Validate Participant Identity
  if (
    !request.userId ||
    !request.userId.trim() ||
    !request.profileId ||
    !request.profileId.trim()
  ) {
    throw createApiError('UNAUTHORIZED', 'Invalid user or profile identity.');
  }

  // 3. Look up Room
  ensureStoreInitialized();
  const roomId = roomCodeToIdIndex.get(normalizedCode);
  if (!roomId) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  const room = roomsStore.get(roomId);
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  // 4. Check Expiration & Status
  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  if (room.status === 'ended' || currentScenario === 'ended') {
    throw createApiError('ROOM_ENDED');
  }

  if (room.status === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  // 5. Check Capacity
  const participants = participantsStore.get(roomId) || [];
  const maxCapacity =
    room.maxParticipants || WATCH_PARTY_ROOM_CONFIG.DEFAULT_MAX_PARTICIPANTS;

  if (participants.length >= maxCapacity || currentScenario === 'room_full') {
    throw createApiError('ROOM_FULL');
  }

  // 6. Check Duplicate Participant
  const isDuplicate = participants.some(
    (p) =>
      (p.profileId === request.profileId.trim() ||
        (p.userId === request.userId.trim() &&
          p.profileId === request.profileId.trim())) &&
      p.status === 'connected',
  );
  if (isDuplicate) {
    throw createApiError('DUPLICATE_PARTICIPANT');
  }

  // 7. Check Content Eligibility & Profile Restrictions
  // If content is found and restricted for profile
  const content = findContentById(room.contentId);
  if (content) {
    // If we have an active profile proxy with isKids/maturity
    const profileProxy = {
      id: request.profileId.trim(),
      name: request.displayName || 'Guest',
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (!canProfileAccessContent(profileProxy, content)) {
      throw createApiError('PROFILE_RESTRICTED');
    }
  }

  // 8. Add Participant
  const newParticipant: WatchPartyParticipant = {
    id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: request.userId.trim(),
    profileId: request.profileId.trim(),
    displayName: request.displayName?.trim() || 'Guest',
    avatarUrl: request.avatarUrl,
    isHost: false,
    joinedAt: new Date().toISOString(),
    status: 'connected',
  };

  participants.push(newParticipant);
  participantsStore.set(roomId, participants);
  room.participantCount = participants.length;

  return {
    room: cloneRoom(room),
    participant: cloneParticipant(newParticipant),
  };
};

/**
 * Mock API: Get Room Details
 * Contract: GET /api/v1/watch-party/rooms/:roomId
 */
export const getWatchPartyRoomDetails = async (
  roomId: string,
): Promise<WatchPartyRoom> => {
  await evaluateFailureScenario();

  if (!roomId || !roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND', 'Invalid room ID.');
  }

  ensureStoreInitialized();
  const room = roomsStore.get(roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  if (room.status === 'ended' || currentScenario === 'ended') {
    throw createApiError('ROOM_ENDED');
  }

  return cloneRoom(room);
};

/**
 * Mock API: Get Room Participants
 * Contract: GET /api/v1/watch-party/rooms/:roomId/participants
 */
export const getWatchPartyParticipants = async (
  roomId: string,
): Promise<WatchPartyParticipant[]> => {
  await evaluateFailureScenario();

  if (!roomId || !roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND', 'Invalid room ID.');
  }

  ensureStoreInitialized();
  const room = roomsStore.get(roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  if (currentScenario === 'empty') {
    return [];
  }

  const participants = participantsStore.get(roomId.trim()) || [];
  return cloneParticipantsList(participants);
};

/**
 * Mock API: Get Room Playback State
 * Contract: GET /api/v1/watch-party/rooms/:roomId/playback
 */
export const getWatchPartyPlaybackState = async (
  roomId: string,
): Promise<WatchPartyPlaybackState> => {
  await evaluateFailureScenario();

  if (!roomId || !roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND', 'Invalid room ID.');
  }

  ensureStoreInitialized();
  const room = roomsStore.get(roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  const state = playbackStateStore.get(roomId.trim());
  if (!state) {
    // Generate fallback initial playback state
    const fallbackPlayback: WatchPartyPlaybackState = {
      roomId: room.id,
      sessionId: `session_${room.id}`,
      contentId: room.contentId,
      status: 'idle',
      positionSeconds: 0,
      updatedAt: room.createdAt,
      hostId: room.hostId,
      sequenceNumber: 0,
    };
    playbackStateStore.set(room.id, fallbackPlayback);
    return clonePlayback(fallbackPlayback);
  }

  return clonePlayback(state);
};

/**
 * Mock API: Initialize Room Playback State (Host Only)
 * Contract: POST /api/v1/watch-party/rooms/:roomId/playback/initialize
 */
export const initializeWatchPartyPlayback = async (
  request: InitializePlaybackRequest,
): Promise<WatchPartyPlaybackState> => {
  await evaluateFailureScenario();

  if (!request.roomId || !request.roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND', 'Invalid room ID.');
  }

  ensureStoreInitialized();
  const room = roomsStore.get(request.roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  if (room.status === 'ended' || currentScenario === 'ended') {
    throw createApiError('ROOM_ENDED');
  }

  // Permission Check: Only the host may initialize playback
  if (!canControlWatchPartyPlayback(room, request.participantId)) {
    throw createApiError(
      'UNAUTHORIZED',
      'Only the room host can initialize Watch Party playback.',
    );
  }

  // Validate content association
  if (request.contentId && request.contentId.trim() !== room.contentId) {
    throw createApiError(
      'CONTENT_NOT_SUPPORTED',
      'Requested content does not match the room content.',
    );
  }

  const existing = playbackStateStore.get(room.id);
  const nowIso = new Date().toISOString();

  // Transition room status to active if waiting
  if (room.status === 'waiting') {
    room.status = 'active';
  }

  const initializedState: WatchPartyPlaybackState = {
    roomId: room.id,
    sessionId: `session_${room.id}_${Date.now()}`,
    contentId: room.contentId,
    contentType: request.contentType || room.contentType,
    status: 'playing',
    positionSeconds: 0,
    positionMs: 0,
    lastAction: 'play',
    updatedAt: nowIso,
    updatedByParticipantId: request.participantId,
    hostId: room.hostId,
    sequenceNumber: (existing?.sequenceNumber || 0) + 1,
    version: (existing?.version || 0) + 1,
  };

  playbackStateStore.set(room.id, initializedState);
  return clonePlayback(initializedState);
};

/**
 * Mock API: Update Room Playback State (Host Only)
 * Contract: PATCH /api/v1/watch-party/rooms/:roomId/playback
 */
export const updateWatchPartyPlaybackState = async (
  request: UpdatePlaybackStateRequest,
): Promise<WatchPartyPlaybackState> => {
  await evaluateFailureScenario();

  if (!request.roomId || !request.roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND', 'Invalid room ID.');
  }

  ensureStoreInitialized();
  const room = roomsStore.get(request.roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  if (checkAndApplyRoomExpiration(room) || currentScenario === 'expired') {
    throw createApiError('ROOM_EXPIRED');
  }

  if (room.status === 'ended' || currentScenario === 'ended') {
    throw createApiError('ROOM_ENDED');
  }

  // Permission Check: Only the host may control playback
  if (!canControlWatchPartyPlayback(room, request.participantId)) {
    throw createApiError(
      'UNAUTHORIZED',
      'Only the room host has permission to update Watch Party playback.',
    );
  }

  const current = playbackStateStore.get(room.id);
  if (!current) {
    throw createApiError(
      'PLAYBACK_NOT_INITIALIZED',
      'Room playback has not been initialized.',
    );
  }

  const update = request.update;

  // Validate Position
  if (update.positionSeconds !== undefined) {
    if (
      typeof update.positionSeconds !== 'number' ||
      !Number.isFinite(update.positionSeconds) ||
      update.positionSeconds < 0
    ) {
      throw createApiError(
        'SERVER_ERROR',
        'Playback position must be a non-negative finite number.',
      );
    }
  }

  // Validate Status
  if (update.status !== undefined) {
    const validStatuses = ['idle', 'loading', 'playing', 'paused', 'ended', 'error'];
    if (!validStatuses.includes(update.status)) {
      throw createApiError('SERVER_ERROR', 'Invalid playback status.');
    }
  }

  const newPositionSeconds =
    update.positionSeconds !== undefined
      ? update.positionSeconds
      : current.positionSeconds;

  const nowIso = new Date().toISOString();
  const updatedState: WatchPartyPlaybackState = {
    ...current,
    status: update.status ?? current.status,
    positionSeconds: newPositionSeconds,
    positionMs:
      update.positionMs !== undefined
        ? update.positionMs
        : Math.round(newPositionSeconds * 1000),
    durationSeconds: update.durationSeconds ?? current.durationSeconds,
    durationMs: update.durationMs ?? current.durationMs,
    lastAction: update.lastAction ?? current.lastAction,
    updatedAt: nowIso,
    updatedByParticipantId: request.participantId,
    sequenceNumber: (current.sequenceNumber || 0) + 1,
    version: (current.version || 0) + 1,
  };

  playbackStateStore.set(room.id, updatedState);
  return clonePlayback(updatedState);
};

/**
 * Mock API: Stop or Reset Room Playback State (Host Only)
 */
export const stopOrResetWatchPartyPlayback = async (
  roomId: string,
  participantId: string,
): Promise<WatchPartyPlaybackState> => {
  return updateWatchPartyPlaybackState({
    roomId,
    participantId,
    update: {
      status: 'ended',
      positionSeconds: 0,
      lastAction: 'stop',
    },
  });
};

/**
 * Mock API: Leave Watch Party Room
 * Contract: POST /api/v1/watch-party/rooms/:roomId/leave
 *
 * Host Leaving Policy (Day 1):
 * When the host leaves a room (whether in 'waiting' or 'active' state),
 * the room is deterministically marked as 'ended' and its room code is unindexed.
 * When a guest leaves, they are removed from the participant list and participant count updates.
 */
export const leaveWatchPartyRoom = async (
  request: LeaveWatchPartyRequest,
): Promise<{success: boolean; roomEnded: boolean; message: string}> => {
  await evaluateFailureScenario();

  if (!request.roomId || !request.roomId.trim()) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  const room = roomsStore.get(request.roomId.trim());
  if (!room) {
    throw createApiError('ROOM_NOT_FOUND');
  }

  const participants = participantsStore.get(request.roomId.trim()) || [];
  const participantIndex = participants.findIndex(
    (p) =>
      p.profileId === request.profileId?.trim() ||
      p.userId === request.userId?.trim(),
  );

  if (participantIndex === -1) {
    throw createApiError('PARTICIPANT_NOT_FOUND');
  }

  const participant = participants[participantIndex];

  // Host Leaving Policy: If host leaves, room status changes to 'ended'
  if (participant.isHost) {
    room.status = 'ended';
    // Mark all participants as disconnected
    participants.forEach((p) => {
      p.status = 'disconnected';
    });
    participantsStore.set(request.roomId.trim(), participants);

    return {
      success: true,
      roomEnded: true,
      message: 'Host has left the Watch Party. The room has ended.',
    };
  }

  // Non-host leaving: remove participant from active list
  participants.splice(participantIndex, 1);
  participantsStore.set(request.roomId.trim(), participants);
  room.participantCount = participants.length;

  return {
    success: true,
    roomEnded: false,
    message: 'Successfully left the Watch Party room.',
  };
};
