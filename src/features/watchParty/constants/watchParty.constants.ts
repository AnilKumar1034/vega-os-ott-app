/**
 * Watch Party Constants & Configuration
 * LogiXstream Amazon Vega OS React Native Application
 */

import {WatchPartyErrorCode} from '../types/watchParty.types';

export const WATCH_PARTY_API_CONFIG = {
  USE_MOCK_API: true,
  SIMULATED_LATENCY_MS: 80,
};

export const WATCH_PARTY_ROOM_CONFIG = {
  DEFAULT_EXPIRY_MINUTES: 60,
  DEFAULT_MAX_PARTICIPANTS: 5,
  MIN_PARTICIPANTS: 2,
  MAX_ALLOWED_PARTICIPANTS: 10,
  ROOM_CODE_LENGTH: 6,
  /**
   * Character set excludes ambiguous characters like 0, O, 1, I to ensure readability on TV screens.
   */
  ROOM_CODE_CHARACTERS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
};

export const WATCH_PARTY_TEST_IDS = {
  // Screens
  createScreen: 'watch-party-create-screen',
  joinScreen: 'watch-party-join-screen',
  lobbyScreen: 'watch-party-lobby-screen',

  // Components
  header: 'watch-party-header',
  contentInfo: 'watch-party-content-info',
  participantList: 'watch-party-participant-list',
  participantCard: (id: string) => `watch-party-participant-${id}`,
  roomCodeDisplay: 'watch-party-room-code-display',
  loading: 'watch-party-loading',
  errorState: 'watch-party-error-state',
  emptyState: 'watch-party-empty-state',

  // Actions & Controls
  createButton: 'watch-party-create-button',
  joinButton: 'watch-party-join-button',
  leaveButton: 'watch-party-leave-button',
  retryButton: 'watch-party-retry-button',
  backButton: 'watch-party-back-button',
  privacyToggle: 'watch-party-privacy-toggle',
  maxParticipantsSelector: 'watch-party-max-participants-selector',
  roomCodeInput: 'watch-party-room-code-input',
  clearCodeButton: 'watch-party-clear-code-button',
  copyCodeButton: 'watch-party-copy-code-button',
  keypadKey: (key: string) => `watch-party-keypad-${key}`,
  keypadBackspace: 'watch-party-keypad-backspace',
  keypadClear: 'watch-party-keypad-clear',

  // Status & Badges
  hostBadge: 'watch-party-host-badge',
  roomStatusBadge: 'watch-party-room-status-badge',
  participantCountText: 'watch-party-participant-count',
  roomExpiryText: 'watch-party-room-expiry',
};

export const WATCH_PARTY_ERROR_MESSAGES: Record<WatchPartyErrorCode, string> = {
  INVALID_ROOM_CODE: 'Please enter a valid 6-character room code.',
  ROOM_NOT_FOUND: 'Room not found. Please double-check the code.',
  ROOM_EXPIRED: 'This Watch Party room has expired.',
  ROOM_ENDED: 'This Watch Party room has ended.',
  ROOM_FULL: 'This Watch Party room has reached its maximum capacity.',
  DUPLICATE_PARTICIPANT: 'You are already in this Watch Party room.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  CONTENT_UNAVAILABLE: 'The requested content is unavailable for Watch Party.',
  CONTENT_NOT_SUPPORTED: 'This type of content does not support Watch Party.',
  PROFILE_RESTRICTED: 'This profile is restricted from joining this Watch Party.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CONTENT_ID: 'A valid movie or episode is required to create a Watch Party.',
  INVALID_HOST_IDENTITY: 'A valid host profile is required to create a Watch Party.',
  PARTICIPANT_NOT_FOUND: 'Participant record not found in this room.',
  ALREADY_LEFT: 'You have already left this Watch Party.',
};

export const DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=720&q=80';
