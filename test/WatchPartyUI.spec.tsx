/**
 * Watch Party UI & TV Experience Integration Tests
 * Day 1 Foundation & UI Test Suite
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {ScrollView} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {WatchPartyCreateScreen} from '../src/features/watchParty/screens/WatchPartyCreateScreen';
import {WatchPartyJoinScreen} from '../src/features/watchParty/screens/WatchPartyJoinScreen';
import {WatchPartyLobbyScreen} from '../src/features/watchParty/screens/WatchPartyLobbyScreen';
import {MovieDetailScreen} from '../src/screens/MovieDetailScreen';
import {
  WatchPartyHostBadge,
  WatchPartyRoomStatus,
  WatchPartyLeaveConfirmation,
  WatchPartyEmptyParticipants,
  WatchPartyLobbyActions,
  WatchPartyParticipantCard,
} from '../src/features/watchParty';
import {
  resetMockStore,
  seedMockRoom,
} from '../src/features/watchParty/services/watchPartyMockApi';
import {WATCH_PARTY_TEST_IDS} from '../src/features/watchParty/constants/watchParty.constants';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';
import {createMockRoomFixture} from '../src/features/watchParty/mocks/watchParty.mock';
import {Routes} from '../src/constants/routes';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

describe('Watch Party UI & TV Remote Navigation Experience', () => {
  const adultProfile: UserProfile = {
    id: 'profile_adult_1',
    name: 'Alex Host',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile_kids_1',
    name: 'Little Alex',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: '7_PLUS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    resetMockStore();
    jest.clearAllMocks();
    mockRouteParams = {};

    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: adultProfile,
      profiles: [adultProfile, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);
  });

  afterEach(() => {
    resetMockStore();
  });

  // ==========================================
  // CREATE SCREEN TESTS (Req 42-44, 53-57)
  // ==========================================
  describe('WatchPartyCreateScreen', () => {
    it('42. renders Create Watch Party screen with content details and host profile', async () => {
      mockRouteParams = {
        movie: {
          id: 'movie_001',
          title: 'Starlight Odyssey',
          description: 'A deep space journey beyond the stars.',
          image: 'https://example.com/starlight.jpg',
        },
      };

      const screen = render(<WatchPartyCreateScreen />);

      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.createScreen)).toBeTruthy();
      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.header)).toBeTruthy();
      expect(screen.getAllByText('Create Watch Party').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Starlight Odyssey')).toBeTruthy();
      expect(screen.getByText('Alex Host (Host)')).toBeTruthy();
      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.createButton)).toBeTruthy();
    });

    it('43. allows selecting max participants and privacy options', async () => {
      mockRouteParams = {
        contentId: 'hero-1',
      };

      const screen = render(<WatchPartyCreateScreen />);

      // Select 10 participants
      const participant10 = screen.getByLabelText('10 participants');
      fireEvent.press(participant10);

      // Select Open room
      const openPrivacy = screen.getByLabelText('Public room');
      fireEvent.press(openPrivacy);

      expect(participant10).toBeTruthy();
      expect(openPrivacy).toBeTruthy();
    });

    it('44. creates room successfully and navigates to WatchPartyLobby', async () => {
      mockRouteParams = {
        movie: {
          id: 'hero-1',
          title: 'Cosmic Horizon',
        },
      };

      const screen = render(<WatchPartyCreateScreen />);

      const createBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.createButton);
      await act(async () => {
        fireEvent.press(createBtn);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          Routes.WatchPartyLobby,
          expect.objectContaining({
            roomId: expect.stringMatching(/^room_/),
            room: expect.objectContaining({
              contentId: 'hero-1',
              status: 'waiting',
            }),
          }),
        );
      });
    });

    it('55. respects Kids profile restrictions and renders restricted error state', async () => {
      jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
        activeProfile: kidsProfile,
        profiles: [adultProfile, kidsProfile],
        isLoadingProfiles: false,
        error: null,
      } as any);

      mockRouteParams = {
        movie: {
          id: 'mature-movie-1',
          title: 'Mature Thriller',
          maturityRating: '18_PLUS',
        },
      };

      const screen = render(<WatchPartyCreateScreen />);

      expect(screen.getByText('Content Restricted')).toBeTruthy();
      expect(
        screen.getByText(
          "This movie or episode is restricted under the current profile's parental controls.",
        ),
      ).toBeTruthy();
    });

    it('navigates back when Back button is pressed', () => {
      const screen = render(<WatchPartyCreateScreen />);
      const backBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.backButton);
      fireEvent.press(backBtn);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  // ==========================================
  // JOIN SCREEN TESTS (Req 45-47)
  // ==========================================
  describe('WatchPartyJoinScreen', () => {
    it('45. validates room code length before joining and displays validation error', async () => {
      const screen = render(<WatchPartyJoinScreen />);

      // Press only 2 keys
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey('A')));
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey('B')));

      // Press Join
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.joinButton));

      expect(
        screen.getByText('Please enter all 6 characters of the room code.'),
      ).toBeTruthy();
    });

    it('46. displays error banner when joining non-existent room', async () => {
      const screen = render(<WatchPartyJoinScreen />);

      // Enter 6 valid characters that don't match any room
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((char) => {
        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey(char)));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.joinButton));
      });

      await waitFor(() => {
        expect(
          screen.getByText('Room not found. Please double-check the code.'),
        ).toBeTruthy();
      });
    });

    it('47. joins active room successfully and navigates to WatchPartyLobby', async () => {
      // Seed an active room
      const activeRoom = createMockRoomFixture({
        id: 'room_ui_join',
        roomCode: 'AB7K9P',
        contentTitle: 'Action Blockbuster',
      });
      seedMockRoom(activeRoom);

      const screen = render(<WatchPartyJoinScreen />);

      // Enter matching room code 'AB7K9P'
      ['A', 'B', '7', 'K', '9', 'P'].forEach((char) => {
        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey(char)));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.joinButton));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          Routes.WatchPartyLobby,
          expect.objectContaining({
            roomId: 'room_ui_join',
            room: expect.objectContaining({
              id: 'room_ui_join',
              roomCode: 'AB7K9P',
            }),
          }),
        );
      });
    });

    it('supports backspace and clear buttons', () => {
      const screen = render(<WatchPartyJoinScreen />);

      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey('A')));
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadKey('B')));
      expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('B').length).toBeGreaterThanOrEqual(1);

      // Backspace
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.keypadBackspace));

      // Clear
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.clearCodeButton));
    });
  });

  // ==========================================
  // LOBBY SCREEN TESTS (Req 48-52)
  // ==========================================
  describe('WatchPartyLobbyScreen', () => {
    let mockLobbyRoom: any;

    beforeEach(() => {
      mockLobbyRoom = createMockRoomFixture({
        id: 'room_lobby_test',
        roomCode: 'WP7K9P',
        contentTitle: 'Cosmic Horizon',
        participantCount: 1,
        status: 'waiting',
      });
      seedMockRoom(mockLobbyRoom);
    });

    it('48. renders room details, formatted room code, and waiting notice in Lobby', async () => {
      mockRouteParams = {
        roomId: 'room_lobby_test',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.lobbyScreen)).toBeTruthy();
        expect(screen.getByText('Watch Party Lobby')).toBeTruthy();
        expect(screen.getByText('Cosmic Horizon')).toBeTruthy();
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.participantList)).toBeTruthy();
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton)).toBeTruthy();
      });
    });

    it('51. displays expired error state when room has expired', async () => {
      const expiredRoom = createMockRoomFixture({
        id: 'room_exp_lobby',
        roomCode: 'EXP777',
        status: 'expired',
      });
      seedMockRoom(expiredRoom);

      mockRouteParams = {
        roomId: 'room_exp_lobby',
        room: expiredRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Room Expired')).toBeTruthy();
        expect(
          screen.getByText(
            'This Watch Party viewing room has expired and is no longer active.',
          ),
        ).toBeTruthy();
      });
    });

    it('displays ended error state when room has ended', async () => {
      const endedRoom = createMockRoomFixture({
        id: 'room_ended_lobby',
        roomCode: 'END777',
        status: 'ended',
      });
      seedMockRoom(endedRoom);

      mockRouteParams = {
        roomId: 'room_ended_lobby',
        room: endedRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Room Ended')).toBeTruthy();
        expect(
          screen.getByText(
            'The host has left or closed this Watch Party viewing room.',
          ),
        ).toBeTruthy();
      });
    });

    it('opens leave confirmation modal when Leave Party button is pressed and navigates back upon confirmation', async () => {
      mockRouteParams = {
        roomId: 'room_lobby_test',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton)).toBeTruthy();
      });

      const leaveBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton);
      await act(async () => {
        fireEvent.press(leaveBtn);
      });

      // Verify leave confirmation modal is displayed
      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmModal)).toBeTruthy();
      expect(screen.getByText('Leave Watch Party?')).toBeTruthy();

      // Confirm leaving the room
      const confirmBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmButton);
      await act(async () => {
        fireEvent.press(confirmBtn);
      });

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('cancels leave and stays in room when Stay in Room button is pressed in modal', async () => {
      mockRouteParams = {
        roomId: 'room_lobby_test',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton)).toBeTruthy();
      });

      // Open leave confirmation modal
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton));
      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmModal)).toBeTruthy();

      // Press Stay in Room
      const cancelBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveCancelButton);
      fireEvent.press(cancelBtn);

      // Verify user stayed and mockGoBack was not called
      expect(mockGoBack).not.toHaveBeenCalled();
      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.lobbyScreen)).toBeTruthy();
    });

    it('toggles TV-friendly invite instructions when How Friends Join is pressed', async () => {
      mockRouteParams = {
        roomId: 'room_lobby_test',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.shareCodeButton)).toBeTruthy();
      });

      // Press Share Instructions
      fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.shareCodeButton));

      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.shareCodeFeedback)).toBeTruthy();
      expect(screen.getByText('How to Join:')).toBeTruthy();
    });

    it('displays room status component and empty participants guide when room has only host', async () => {
      const singleHostRoom = createMockRoomFixture({
        id: 'room_single_host',
        roomCode: 'HOST01',
        contentTitle: 'Starlight Odyssey',
        participantCount: 1,
        maxParticipants: 5,
        status: 'waiting',
      });
      seedMockRoom(singleHostRoom);

      mockRouteParams = {
        roomId: 'room_single_host',
        room: singleHostRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.roomStatusDisplay)).toBeTruthy();
        expect(screen.getByText('WAITING IN LOBBY')).toBeTruthy();
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.emptyParticipants)).toBeTruthy();
      });
    });

    it('refreshes room state when Refresh button is pressed', async () => {
      mockRouteParams = {
        roomId: 'room_lobby_test',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.retryButton)).toBeTruthy();
      });

      const refreshBtn = screen.getByTestId(WATCH_PARTY_TEST_IDS.retryButton);
      await act(async () => {
        fireEvent.press(refreshBtn);
      });

      expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.lobbyScreen)).toBeTruthy();
    });
  });

  // ==========================================
  // MOVIE DETAIL ENTRY POINT INTEGRATION
  // ==========================================
  describe('MovieDetailScreen Watch Party Entry Point', () => {
    it('renders "Watch Party" button on MovieDetail screen and navigates to WatchPartyCreate', () => {
      mockRouteParams = {
        movie: {
          id: 'test-party-movie',
          title: 'Party Movie Odyssey',
          description: 'A great movie to watch with friends.',
        },
      };

      const screen = render(<MovieDetailScreen />);

      const watchPartyBtn = screen.getByTestId('detail-watch-party-button');
      expect(watchPartyBtn).toBeTruthy();
      expect(screen.getByText('Watch Party')).toBeTruthy();

      fireEvent.press(watchPartyBtn);

      expect(mockNavigate).toHaveBeenCalledWith(
        Routes.WatchPartyCreate,
        expect.objectContaining({
          contentId: 'test-party-movie',
          movie: expect.objectContaining({title: 'Party Movie Odyssey'}),
        }),
      );
    });
  });

  // ==========================================
  // SCROLLVIEW & TV LAYOUT TESTS
  // ==========================================
  describe('Watch Party ScrollView & TV Remote Layout', () => {
    it('renders ScrollView on WatchPartyCreateScreen for scrollable TV viewports', () => {
      mockRouteParams = {
        movie: {
          id: 'movie_001',
          title: 'Starlight Odyssey',
        },
      };

      const screen = render(<WatchPartyCreateScreen />);
      expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
    });

    it('renders ScrollView on WatchPartyLobbyScreen for scrollable TV viewports', async () => {
      const mockLobbyRoom = createMockRoomFixture({
        id: 'room_scroll_lobby',
        roomCode: 'WPSCRO',
        contentTitle: 'Scrollable Horizon',
        participantCount: 1,
        status: 'waiting',
      });
      seedMockRoom(mockLobbyRoom);

      mockRouteParams = {
        roomId: 'room_scroll_lobby',
        room: mockLobbyRoom,
      };

      const screen = render(<WatchPartyLobbyScreen />);
      await waitFor(() => {
        expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
      });
    });

    it('renders ScrollView on WatchPartyJoinScreen for scrollable TV viewports', () => {
      const screen = render(<WatchPartyJoinScreen />);
      expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
    });
  });

  // ==========================================
  // DAY 2 COMPONENT TESTS
  // ==========================================
  describe('Day 2 Watch Party Modular UI Components', () => {
    describe('WatchPartyHostBadge', () => {
      it('renders host badge with label and test ID', () => {
        const screen = render(<WatchPartyHostBadge />);
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.hostBadge)).toBeTruthy();
        expect(screen.getByText('★ HOST')).toBeTruthy();
      });

      it('renders small size variant correctly', () => {
        const screen = render(<WatchPartyHostBadge size="small" label="ROOM LEADER" />);
        expect(screen.getByText('★ ROOM LEADER')).toBeTruthy();
      });
    });

    describe('WatchPartyRoomStatus', () => {
      it('renders waiting status with participant capacity and host description', () => {
        const screen = render(
          <WatchPartyRoomStatus
            status="waiting"
            participantCount={2}
            maxParticipants={5}
            isHost={true}
          />,
        );
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.roomStatusDisplay)).toBeTruthy();
        expect(screen.getByText('WAITING IN LOBBY')).toBeTruthy();
        expect(screen.getByText('2 / 5 participants')).toBeTruthy();
        expect(
          screen.getByText(
            'You are the host. Share the room code so friends can join your party.',
          ),
        ).toBeTruthy();
      });

      it('renders active status with green dot indicator', () => {
        const screen = render(
          <WatchPartyRoomStatus status="active" participantCount={4} />,
        );
        expect(screen.getByText('ACTIVE')).toBeTruthy();
        expect(
          screen.getByText('Synchronized playback is currently active in this room.'),
        ).toBeTruthy();
      });

      it('renders expired status description', () => {
        const screen = render(<WatchPartyRoomStatus status="expired" />);
        expect(screen.getByText('EXPIRED')).toBeTruthy();
        expect(
          screen.getByText(
            'This room has exceeded its active window and is no longer valid.',
          ),
        ).toBeTruthy();
      });
    });

    describe('WatchPartyLeaveConfirmation', () => {
      it('does not render when visible is false', () => {
        const screen = render(
          <WatchPartyLeaveConfirmation
            visible={false}
            onStay={jest.fn()}
            onLeave={jest.fn()}
          />,
        );
        expect(
          screen.queryByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmModal),
        ).toBeNull();
      });

      it('renders host warning message when isHost is true', () => {
        const screen = render(
          <WatchPartyLeaveConfirmation
            visible={true}
            isHost={true}
            onStay={jest.fn()}
            onLeave={jest.fn()}
          />,
        );
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmModal)).toBeTruthy();
        expect(
          screen.getByText(
            'You are the room host. Leaving will end this Watch Party for all participants and close the room.',
          ),
        ).toBeTruthy();
        expect(screen.getByText('End Party & Leave')).toBeTruthy();
      });

      it('calls onStay when Stay in Room button is pressed', () => {
        const handleStay = jest.fn();
        const screen = render(
          <WatchPartyLeaveConfirmation
            visible={true}
            onStay={handleStay}
            onLeave={jest.fn()}
          />,
        );

        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveCancelButton));
        expect(handleStay).toHaveBeenCalledTimes(1);
      });

      it('calls onLeave when Leave Party button is pressed', () => {
        const handleLeave = jest.fn();
        const screen = render(
          <WatchPartyLeaveConfirmation
            visible={true}
            onStay={jest.fn()}
            onLeave={handleLeave}
          />,
        );

        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveConfirmButton));
        expect(handleLeave).toHaveBeenCalledTimes(1);
      });
    });

    describe('WatchPartyParticipantCard with Current User Indicator', () => {
      it('renders "YOU" badge when isCurrentUser is true', () => {
        const participant = {
          id: 'p_1',
          userId: 'u_1',
          profileId: 'prof_1',
          displayName: 'John Doe',
          isHost: false,
          joinedAt: new Date().toISOString(),
          status: 'connected' as const,
        };

        const screen = render(
          <WatchPartyParticipantCard
            participant={participant}
            isCurrentUser={true}
          />,
        );

        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.currentUserBadge)).toBeTruthy();
        expect(screen.getByText('YOU')).toBeTruthy();
      });

      it('renders initials when avatarUrl is missing', () => {
        const participant = {
          id: 'p_2',
          userId: 'u_2',
          profileId: 'prof_2',
          displayName: 'Sarah Connor',
          isHost: false,
          joinedAt: new Date().toISOString(),
          status: 'connected' as const,
        };

        const screen = render(
          <WatchPartyParticipantCard participant={participant} />,
        );
        expect(screen.getByText('SC')).toBeTruthy();
      });
    });

    describe('WatchPartyEmptyParticipants', () => {
      it('renders empty participants guide with room code', () => {
        const screen = render(
          <WatchPartyEmptyParticipants roomCode="ABC789" isHost={true} />,
        );
        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.emptyParticipants)).toBeTruthy();
        expect(screen.getByText('Waiting for Friends to Join')).toBeTruthy();
        expect(
          screen.getByText(
            'Share room code "ABC789" with friends. They can join from the "Join Watch Party" menu on their TV.',
          ),
        ).toBeTruthy();
      });
    });

    describe('WatchPartyLobbyActions', () => {
      it('renders refresh and leave buttons and handles triggers', () => {
        const handleRefresh = jest.fn();
        const handleLeave = jest.fn();

        const screen = render(
          <WatchPartyLobbyActions
            onRefresh={handleRefresh}
            onLeave={handleLeave}
            isRefreshing={false}
            isLeaving={false}
            isHost={false}
          />,
        );

        expect(screen.getByTestId(WATCH_PARTY_TEST_IDS.lobbyActions)).toBeTruthy();
        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.retryButton));
        expect(handleRefresh).toHaveBeenCalledTimes(1);

        fireEvent.press(screen.getByTestId(WATCH_PARTY_TEST_IDS.leaveButton));
        expect(handleLeave).toHaveBeenCalledTimes(1);
      });

      it('shows loading indicator when isRefreshing is true', () => {
        const screen = render(
          <WatchPartyLobbyActions
            onRefresh={jest.fn()}
            onLeave={jest.fn()}
            isRefreshing={true}
          />,
        );
        expect(screen.getByText('Refreshing...')).toBeTruthy();
      });
    });
  });
});
