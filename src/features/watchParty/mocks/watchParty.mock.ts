/**
 * Watch Party Development Mocks & Seed Data
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartyParticipant,
  WatchPartyPlaybackState,
  WatchPartyRoom,
} from '../types/watchParty.types';
import {
  DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
  WATCH_PARTY_ROOM_CONFIG,
} from '../constants/watchParty.constants';

export const MOCK_PARTICIPANTS: WatchPartyParticipant[] = [
  {
    id: 'part_host_001',
    userId: 'user_host_001',
    profileId: 'profile_host_001',
    displayName: 'Alex (Host)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    isHost: true,
    joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'connected',
  },
  {
    id: 'part_guest_002',
    userId: 'user_guest_002',
    profileId: 'profile_guest_002',
    displayName: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    isHost: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    status: 'connected',
  },
  {
    id: 'part_guest_003',
    userId: 'user_guest_003',
    profileId: 'profile_guest_003',
    displayName: 'Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
    isHost: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'connected',
  },
];

export const MOCK_SEED_ROOM: WatchPartyRoom = {
  id: 'room_seed_001',
  roomCode: 'WP7K9P',
  hostId: 'user_host_001',
  hostProfileId: 'profile_host_001',
  contentId: 'hero-1',
  contentType: 'movie',
  contentTitle: 'Cosmic Horizon',
  contentThumbnail: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
  status: 'waiting',
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  expiresAt: new Date(
    Date.now() + 1000 * 60 * WATCH_PARTY_ROOM_CONFIG.DEFAULT_EXPIRY_MINUTES,
  ).toISOString(),
  participantCount: 3,
  maxParticipants: 5,
  isPrivate: true,
};

export const MOCK_SEED_PLAYBACK: WatchPartyPlaybackState = {
  roomId: 'room_seed_001',
  sessionId: 'session_seed_001',
  contentId: 'hero-1',
  status: 'idle',
  positionSeconds: 0,
  updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  hostId: 'user_host_001',
  sequenceNumber: 0,
};

export interface PresetTestRoomDefinition {
  room: WatchPartyRoom;
  participants: WatchPartyParticipant[];
  playback?: WatchPartyPlaybackState;
  description: string;
}

export const PRESET_TEST_ROOMS: PresetTestRoomDefinition[] = [
  {
    description: 'Active Waiting Room (Cosmic Horizon) with 3 participants (2 open spots)',
    room: {
      id: 'room_seed_001',
      roomCode: 'WP7K9P',
      hostId: 'user_host_001',
      hostProfileId: 'profile_host_001',
      contentId: 'hero-1',
      contentType: 'movie',
      contentTitle: 'Cosmic Horizon',
      contentThumbnail: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
      status: 'waiting',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
      participantCount: 3,
      maxParticipants: 5,
      isPrivate: true,
    },
    participants: MOCK_PARTICIPANTS,
  },
  {
    description: 'Fresh Room (Starlight Odyssey) with 1 host (9 open spots)',
    room: {
      id: 'room_seed_002',
      roomCode: 'STAR88',
      hostId: 'user_elena_001',
      hostProfileId: 'profile_elena_001',
      contentId: 'movie_001',
      contentType: 'movie',
      contentTitle: 'Starlight Odyssey',
      contentThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
      status: 'waiting',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
      participantCount: 1,
      maxParticipants: 10,
      isPrivate: true,
    },
    participants: [
      {
        id: 'part_elena_001',
        userId: 'user_elena_001',
        profileId: 'profile_elena_001',
        displayName: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
        isHost: true,
        joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'connected',
      },
    ],
  },
  {
    description: 'Series Episode Room (Chronicles of the Deep) with 2 participants',
    room: {
      id: 'room_seed_003',
      roomCode: 'SER789',
      hostId: 'user_david_001',
      hostProfileId: 'profile_david_001',
      contentId: 'series-deep-s1e2',
      contentType: 'episode',
      contentTitle: 'Chronicles of the Deep: S1 E2',
      contentThumbnail: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=500&q=80',
      status: 'waiting',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
      participantCount: 2,
      maxParticipants: 8,
      isPrivate: true,
    },
    participants: [
      {
        id: 'part_david_001',
        userId: 'user_david_001',
        profileId: 'profile_david_001',
        displayName: 'David Miller',
        isHost: true,
        joinedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        status: 'connected',
      },
      {
        id: 'part_maya_002',
        userId: 'user_maya_002',
        profileId: 'profile_maya_002',
        displayName: 'Maya Lin',
        isHost: false,
        joinedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        status: 'connected',
      },
    ],
  },
  {
    description: 'Full Room (Cyber City 2099) - Rejects with ROOM_FULL',
    room: {
      id: 'room_seed_004',
      roomCode: 'FULL99',
      hostId: 'user_lucas_001',
      hostProfileId: 'profile_lucas_001',
      contentId: 'movie_cyber_2099',
      contentType: 'movie',
      contentTitle: 'Cyber City 2099',
      contentThumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80',
      status: 'waiting',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
      participantCount: 3,
      maxParticipants: 3,
      isPrivate: true,
    },
    participants: [
      {
        id: 'part_lucas_001',
        userId: 'user_lucas_001',
        profileId: 'profile_lucas_001',
        displayName: 'Lucas Vance',
        isHost: true,
        joinedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        status: 'connected',
      },
      {
        id: 'part_emma_002',
        userId: 'user_emma_002',
        profileId: 'profile_emma_002',
        displayName: 'Emma Wright',
        isHost: false,
        joinedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        status: 'connected',
      },
      {
        id: 'part_ryan_003',
        userId: 'user_ryan_003',
        profileId: 'profile_ryan_003',
        displayName: 'Ryan O’Connor',
        isHost: false,
        joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'connected',
      },
    ],
  },
  {
    description: 'Expired Room - Rejects with ROOM_EXPIRED',
    room: {
      id: 'room_seed_005',
      roomCode: 'EXP789',
      hostId: 'user_host_exp',
      hostProfileId: 'profile_host_exp',
      contentId: 'hero-1',
      contentType: 'movie',
      contentTitle: 'Cosmic Horizon (Archive)',
      contentThumbnail: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
      status: 'expired',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      participantCount: 1,
      maxParticipants: 5,
      isPrivate: true,
    },
    participants: [
      {
        id: 'part_host_exp',
        userId: 'user_host_exp',
        profileId: 'profile_host_exp',
        displayName: 'Former Host',
        isHost: true,
        joinedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'disconnected',
      },
    ],
  },
  {
    description: 'Ended Room - Rejects with ROOM_ENDED',
    room: {
      id: 'room_seed_006',
      roomCode: 'END789',
      hostId: 'user_host_end',
      hostProfileId: 'profile_host_end',
      contentId: 'movie_001',
      contentType: 'movie',
      contentTitle: 'Starlight Odyssey (Closed)',
      contentThumbnail: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
      status: 'ended',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      participantCount: 0,
      maxParticipants: 5,
      isPrivate: true,
    },
    participants: [],
  },
];

/**
 * Creates a mock room object for testing and scenarios.
 */
export const createMockRoomFixture = (
  overrides?: Partial<WatchPartyRoom>,
): WatchPartyRoom => {
  const now = Date.now();
  return {
    id: `room_${now}`,
    roomCode: 'TEST99',
    hostId: 'user_001',
    hostProfileId: 'profile_001',
    contentId: 'hero-1',
    contentType: 'movie',
    contentTitle: 'Test Movie',
    contentThumbnail: DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
    status: 'waiting',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(
      now + 1000 * 60 * WATCH_PARTY_ROOM_CONFIG.DEFAULT_EXPIRY_MINUTES,
    ).toISOString(),
    participantCount: 1,
    maxParticipants: WATCH_PARTY_ROOM_CONFIG.DEFAULT_MAX_PARTICIPANTS,
    isPrivate: true,
    ...overrides,
  };
};

/**
 * Creates a mock participant fixture.
 */
export const createMockParticipantFixture = (
  overrides?: Partial<WatchPartyParticipant>,
): WatchPartyParticipant => {
  return {
    id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: 'user_default',
    profileId: 'profile_default',
    displayName: 'Test Participant',
    isHost: false,
    joinedAt: new Date().toISOString(),
    status: 'connected',
    ...overrides,
  };
};
