/**
 * Watch Party Mock API & Core Services Unit Tests
 * Day 1 Foundation & Room Management Test Suite
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  createWatchPartyRoom,
  joinWatchPartyRoom,
  getWatchPartyRoomDetails,
  getWatchPartyParticipants,
  getWatchPartyPlaybackState,
  leaveWatchPartyRoom,
  resetMockStore,
  seedMockRoom,
  setMockScenario,
  validateRoomCodeFormat,
  generateUniqueRoomCode,
} from '../src/features/watchParty/services/watchPartyMockApi';
import {watchPartyApi} from '../src/features/watchParty/services/watchPartyApi';
import {WATCH_PARTY_ROOM_CONFIG} from '../src/features/watchParty/constants/watchParty.constants';
import {
  createMockRoomFixture,
} from '../src/features/watchParty/mocks/watchParty.mock';
import {WatchPartyRoom} from '../src/features/watchParty/types/watchParty.types';

describe('Watch Party Mock API & Room Management Foundation', () => {
  beforeEach(() => {
    resetMockStore();
  });

  afterEach(() => {
    resetMockStore();
  });

  // ==========================================
  // 1. ROOM CREATION TESTS (Requirements 1-10)
  // ==========================================
  describe('Room Creation (Req 1-10)', () => {
    it('1. creates a room successfully with default parameters', async () => {
      const response = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      expect(response.room).toBeDefined();
      expect(response.room.id).toMatch(/^room_/);
      expect(response.room.contentId).toBe('hero-1');
      expect(response.room.contentType).toBe('movie');
      expect(response.room.hostId).toBe('user_001');
      expect(response.room.hostProfileId).toBe('profile_001');
      expect(response.room.participantCount).toBe(1);
      expect(response.room.isPrivate).toBe(true);
      expect(response.host).toBeDefined();
      expect(response.host.isHost).toBe(true);
      expect(response.host.status).toBe('connected');
    });

    it('2. generates a unique room ID', async () => {
      const room1 = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });
      const room2 = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      expect(room1.room.id).not.toBe(room2.room.id);
    });

    it('3. generates a unique, valid 6-character room code without ambiguous characters', async () => {
      const response = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      const {roomCode} = response.room;
      expect(roomCode).toHaveLength(WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH);
      expect(validateRoomCodeFormat(roomCode)).toBe(true);
      // Ensure no ambiguous characters: 0, O, 1, I
      expect(roomCode).not.toMatch(/[0O1I]/);
    });

    it('4. adds host as the initial participant', async () => {
      const response = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      expect(response.host.userId).toBe('user_001');
      expect(response.host.profileId).toBe('profile_001');
      expect(response.host.isHost).toBe(true);

      const participants = await getWatchPartyParticipants(response.room.id);
      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe('user_001');
      expect(participants[0].isHost).toBe(true);
    });

    it('5. sets initial room status to "waiting"', async () => {
      const response = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      expect(response.room.status).toBe('waiting');
    });

    it('6. sets initial playback status to "idle"', async () => {
      const response = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      const playback = await getWatchPartyPlaybackState(response.room.id);
      expect(playback.status).toBe('idle');
      expect(playback.positionSeconds).toBe(0);
      expect(playback.sequenceNumber).toBe(0);
      expect(playback.contentId).toBe('hero-1');
      expect(playback.hostId).toBe('user_001');
    });

    it('7. rejects room creation with missing or empty content ID', async () => {
      await expect(
        createWatchPartyRoom({
          contentId: '',
          contentType: 'movie',
          hostId: 'user_001',
          hostProfileId: 'profile_001',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_CONTENT_ID',
      });
    });

    it('8. rejects room creation with unsupported content type', async () => {
      await expect(
        createWatchPartyRoom({
          contentId: 'hero-1',
          contentType: 'unsupported_type' as any,
          hostId: 'user_001',
          hostProfileId: 'profile_001',
        }),
      ).rejects.toMatchObject({
        code: 'CONTENT_NOT_SUPPORTED',
      });
    });

    it('9. rejects room creation with invalid host identity', async () => {
      await expect(
        createWatchPartyRoom({
          contentId: 'hero-1',
          contentType: 'movie',
          hostId: '',
          hostProfileId: 'profile_001',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_HOST_IDENTITY',
      });

      await expect(
        createWatchPartyRoom({
          contentId: 'hero-1',
          contentType: 'movie',
          hostId: 'user_001',
          hostProfileId: '',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_HOST_IDENTITY',
      });
    });

    it('10. prevents duplicate room codes across active rooms', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const code = generateUniqueRoomCode();
        expect(codes.has(code)).toBe(false);
        codes.add(code);
      }
    });
  });

  // ==========================================
  // 2. ROOM JOINING TESTS (Requirements 11-20)
  // ==========================================
  describe('Room Joining (Req 11-20)', () => {
    let activeRoom: WatchPartyRoom;

    beforeEach(async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host_1',
        hostProfileId: 'profile_host_1',
        maxParticipants: 3,
      });
      activeRoom = created.room;
    });

    it('11. joins a valid room successfully and updates participant count', async () => {
      const result = await joinWatchPartyRoom({
        roomCode: activeRoom.roomCode,
        userId: 'user_guest_2',
        profileId: 'profile_guest_2',
        displayName: 'Guest Two',
      });

      expect(result.room.participantCount).toBe(2);
      expect(result.participant.userId).toBe('user_guest_2');
      expect(result.participant.displayName).toBe('Guest Two');
      expect(result.participant.isHost).toBe(false);
      expect(result.participant.status).toBe('connected');

      const participants = await getWatchPartyParticipants(activeRoom.id);
      expect(participants).toHaveLength(2);
    });

    it('12. rejects joining with invalid room code format', async () => {
      await expect(
        joinWatchPartyRoom({
          roomCode: 'TOO_SHORT',
          userId: 'user_2',
          profileId: 'profile_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_ROOM_CODE',
      });

      await expect(
        joinWatchPartyRoom({
          roomCode: 'ABC01I', // Contains ambiguous characters
          userId: 'user_2',
          profileId: 'profile_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_ROOM_CODE',
      });
    });

    it('13. rejects joining when room is not found', async () => {
      await expect(
        joinWatchPartyRoom({
          roomCode: 'ZZZZ99',
          userId: 'user_2',
          profileId: 'profile_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_NOT_FOUND',
      });
    });

    it('14. rejects joining an expired room', async () => {
      const expiredRoom = createMockRoomFixture({
        id: 'room_expired_test',
        roomCode: 'EXP999',
        expiresAt: new Date(Date.now() - 1000 * 60).toISOString(),
      });
      seedMockRoom(expiredRoom);

      await expect(
        joinWatchPartyRoom({
          roomCode: 'EXP999',
          userId: 'user_2',
          profileId: 'profile_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_EXPIRED',
      });
    });

    it('15. rejects joining an ended room', async () => {
      const endedRoom = createMockRoomFixture({
        id: 'room_ended_test',
        roomCode: 'END999',
        status: 'ended',
      });
      seedMockRoom(endedRoom);

      await expect(
        joinWatchPartyRoom({
          roomCode: 'END999',
          userId: 'user_2',
          profileId: 'profile_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_ENDED',
      });
    });

    it('16. rejects joining when room is full', async () => {
      // Room max is 3: 1 host already in. Add 2 more.
      await joinWatchPartyRoom({
        roomCode: activeRoom.roomCode,
        userId: 'user_guest_2',
        profileId: 'profile_guest_2',
        displayName: 'Guest Two',
      });
      await joinWatchPartyRoom({
        roomCode: activeRoom.roomCode,
        userId: 'user_guest_3',
        profileId: 'profile_guest_3',
        displayName: 'Guest Three',
      });

      // 4th participant should be rejected
      await expect(
        joinWatchPartyRoom({
          roomCode: activeRoom.roomCode,
          userId: 'user_guest_4',
          profileId: 'profile_guest_4',
          displayName: 'Guest Four',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_FULL',
      });
    });

    it('17. rejects duplicate participant in the same room', async () => {
      await joinWatchPartyRoom({
        roomCode: activeRoom.roomCode,
        userId: 'user_guest_2',
        profileId: 'profile_guest_2',
        displayName: 'Guest Two',
      });

      await expect(
        joinWatchPartyRoom({
          roomCode: activeRoom.roomCode,
          userId: 'user_guest_2',
          profileId: 'profile_guest_2',
          displayName: 'Guest Two Duplicate',
        }),
      ).rejects.toMatchObject({
        code: 'DUPLICATE_PARTICIPANT',
      });
    });

    it('18. rejects invalid participant identity (missing userId or profileId)', async () => {
      await expect(
        joinWatchPartyRoom({
          roomCode: activeRoom.roomCode,
          userId: '',
          profileId: 'profile_guest_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });

      await expect(
        joinWatchPartyRoom({
          roomCode: activeRoom.roomCode,
          userId: 'user_guest_2',
          profileId: '',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('19. rejects joining when controlled scenario is profile_restricted', async () => {
      setMockScenario('profile_restricted');
      await expect(
        joinWatchPartyRoom({
          roomCode: activeRoom.roomCode,
          userId: 'user_guest_2',
          profileId: 'profile_guest_2',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'PROFILE_RESTRICTED',
      });
    });
  });

  // ==========================================
  // 3. ROOM DETAILS TESTS (Requirements 21-24)
  // ==========================================
  describe('Room Details (Req 21-24)', () => {
    it('21. fetches valid room details successfully', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_001',
        hostProfileId: 'profile_001',
      });

      const details = await getWatchPartyRoomDetails(created.room.id);
      expect(details.id).toBe(created.room.id);
      expect(details.roomCode).toBe(created.room.roomCode);
      expect(details.status).toBe('waiting');
    });

    it('22. throws ROOM_NOT_FOUND for invalid or non-existent room ID', async () => {
      await expect(
        getWatchPartyRoomDetails('non_existent_id'),
      ).rejects.toMatchObject({
        code: 'ROOM_NOT_FOUND',
      });
    });

    it('23. throws ROOM_EXPIRED for expired room', async () => {
      const expiredRoom = createMockRoomFixture({
        id: 'room_expired_fetch',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      seedMockRoom(expiredRoom);

      await expect(
        getWatchPartyRoomDetails('room_expired_fetch'),
      ).rejects.toMatchObject({
        code: 'ROOM_EXPIRED',
      });
    });

    it('24. throws ROOM_ENDED for ended room', async () => {
      const endedRoom = createMockRoomFixture({
        id: 'room_ended_fetch',
        status: 'ended',
      });
      seedMockRoom(endedRoom);

      await expect(
        getWatchPartyRoomDetails('room_ended_fetch'),
      ).rejects.toMatchObject({
        code: 'ROOM_ENDED',
      });
    });
  });

  // ==========================================
  // 4. PARTICIPANT RETRIEVAL (Req 25-29)
  // ==========================================
  describe('Participant Retrieval (Req 25-29)', () => {
    it('25. fetches participant list successfully', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });

      const participants = await getWatchPartyParticipants(created.room.id);
      expect(Array.isArray(participants)).toBe(true);
      expect(participants).toHaveLength(1);
    });

    it('26. host appears in participant list with isHost=true', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });

      const participants = await getWatchPartyParticipants(created.room.id);
      expect(participants[0].userId).toBe('user_host');
      expect(participants[0].isHost).toBe(true);
    });

    it('27. participant count reflects accurate count after joins', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });

      await joinWatchPartyRoom({
        roomCode: created.room.roomCode,
        userId: 'u2',
        profileId: 'p2',
        displayName: 'Guest 2',
      });
      await joinWatchPartyRoom({
        roomCode: created.room.roomCode,
        userId: 'u3',
        profileId: 'p3',
        displayName: 'Guest 3',
      });

      const participants = await getWatchPartyParticipants(created.room.id);
      expect(participants).toHaveLength(3);
    });

    it('28. returns empty array when controlled scenario is empty', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });

      setMockScenario('empty');
      const participants = await getWatchPartyParticipants(created.room.id);
      expect(participants).toEqual([]);
    });
  });

  // ==========================================
  // 5. PLAYBACK STATE TESTS (Requirements 30-32)
  // ==========================================
  describe('Playback State (Req 30-32)', () => {
    it('30. fetches initial playback state for room', async () => {
      const created = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });

      const playback = await getWatchPartyPlaybackState(created.room.id);
      expect(playback.roomId).toBe(created.room.id);
      expect(playback.status).toBe('idle');
      expect(playback.positionSeconds).toBe(0);
      expect(playback.sequenceNumber).toBe(0);
    });

    it('31. throws ROOM_NOT_FOUND for invalid room playback state', async () => {
      await expect(
        getWatchPartyPlaybackState('invalid_room_id'),
      ).rejects.toMatchObject({
        code: 'ROOM_NOT_FOUND',
      });
    });

    it('32. throws ROOM_EXPIRED when querying playback of expired room', async () => {
      const expiredRoom = createMockRoomFixture({
        id: 'room_playback_exp',
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      });
      seedMockRoom(expiredRoom);

      await expect(
        getWatchPartyPlaybackState('room_playback_exp'),
      ).rejects.toMatchObject({
        code: 'ROOM_EXPIRED',
      });
    });
  });

  // ==========================================
  // 6. LEAVE ROOM TESTS (Requirements 33-37)
  // ==========================================
  describe('Leave Room & Host Departure Policy (Req 33-37)', () => {
    let createdRoom: WatchPartyRoom;

    beforeEach(async () => {
      const res = await createWatchPartyRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_host',
        hostProfileId: 'profile_host',
      });
      createdRoom = res.room;
      await joinWatchPartyRoom({
        roomCode: createdRoom.roomCode,
        userId: 'user_guest',
        profileId: 'profile_guest',
        displayName: 'Guest User',
      });
    });

    it('33. non-host participant leaves successfully and participant count decrements', async () => {
      const leaveRes = await leaveWatchPartyRoom({
        roomId: createdRoom.id,
        userId: 'user_guest',
        profileId: 'profile_guest',
      });

      expect(leaveRes.success).toBe(true);
      expect(leaveRes.roomEnded).toBe(false);

      const participants = await getWatchPartyParticipants(createdRoom.id);
      expect(participants).toHaveLength(1);
      expect(participants[0].isHost).toBe(true);
    });

    it('34. rejects leaving when participant is not found or has already left', async () => {
      await leaveWatchPartyRoom({
        roomId: createdRoom.id,
        userId: 'user_guest',
        profileId: 'profile_guest',
      });

      await expect(
        leaveWatchPartyRoom({
          roomId: createdRoom.id,
          userId: 'user_guest',
          profileId: 'profile_guest',
        }),
      ).rejects.toMatchObject({
        code: 'PARTICIPANT_NOT_FOUND',
      });
    });

    it('35. host leaving policy: ends room deterministically when host leaves', async () => {
      const leaveRes = await leaveWatchPartyRoom({
        roomId: createdRoom.id,
        userId: 'user_host',
        profileId: 'profile_host',
      });

      expect(leaveRes.success).toBe(true);
      expect(leaveRes.roomEnded).toBe(true);

      // Subsequent fetch should report room ended
      await expect(
        getWatchPartyRoomDetails(createdRoom.id),
      ).rejects.toMatchObject({
        code: 'ROOM_ENDED',
      });
    });
  });

  // ==========================================
  // 7. LIFECYCLE & EXPIRATION (Req 38-41)
  // ==========================================
  describe('Room Lifecycle & Expiration (Req 38-41)', () => {
    it('38. enforces room expiry comparing current time to expiration timestamp', async () => {
      const room = createMockRoomFixture({
        id: 'room_exp_check',
        roomCode: 'EXPCHK',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      seedMockRoom(room);

      await expect(getWatchPartyRoomDetails(room.id)).rejects.toMatchObject({
        code: 'ROOM_EXPIRED',
      });
    });

    it('39. expired room cannot be joined', async () => {
      const room = createMockRoomFixture({
        id: 'room_exp_join',
        roomCode: 'EXP789',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      seedMockRoom(room);

      await expect(
        joinWatchPartyRoom({
          roomCode: 'EXP789',
          userId: 'user_1',
          profileId: 'prof_1',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_EXPIRED',
      });
    });

    it('40. ended room cannot be joined', async () => {
      const room = createMockRoomFixture({
        id: 'room_ended_join',
        roomCode: 'END789',
        status: 'ended',
      });
      seedMockRoom(room);

      await expect(
        joinWatchPartyRoom({
          roomCode: 'END789',
          userId: 'user_1',
          profileId: 'prof_1',
          displayName: 'Guest',
        }),
      ).rejects.toMatchObject({
        code: 'ROOM_ENDED',
      });
    });
  });

  // ==========================================
  // 8. WATCH PARTY API FACADE ABSTRACTION
  // ==========================================
  describe('watchPartyApi Abstraction Layer', () => {
    it('routes requests through mock API and wraps responses in WatchPartyApiResponse', async () => {
      const createRes = await watchPartyApi.createRoom({
        contentId: 'hero-1',
        contentType: 'movie',
        hostId: 'user_api_facade',
        hostProfileId: 'profile_api_facade',
      });

      expect(createRes.success).toBe(true);
      expect(createRes.data.room.id).toBeDefined();

      const detailsRes = await watchPartyApi.getRoomDetails(
        createRes.data.room.id,
      );
      expect(detailsRes.success).toBe(true);
      expect(detailsRes.data.id).toBe(createRes.data.room.id);

      const partRes = await watchPartyApi.getParticipants(
        createRes.data.room.id,
      );
      expect(partRes.success).toBe(true);
      expect(partRes.data).toHaveLength(1);

      const playRes = await watchPartyApi.getPlaybackState(
        createRes.data.room.id,
      );
      expect(playRes.success).toBe(true);
      expect(playRes.data.status).toBe('idle');
    });

    it('validates room code through facade', () => {
      expect(watchPartyApi.validateRoomCode('AB7K9P')).toBe(true);
      expect(watchPartyApi.validateRoomCode('123')).toBe(false);
      expect(watchPartyApi.validateRoomCode('0O1I23')).toBe(false);
    });
  });
});
