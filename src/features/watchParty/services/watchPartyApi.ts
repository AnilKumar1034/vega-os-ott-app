/**
 * Watch Party API Facade
 * Provides a unified, typed API abstraction consumed by UI components and hooks.
 * Delegates to mock implementation or production HTTP client according to configuration.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {WATCH_PARTY_API_CONFIG} from '../constants/watchParty.constants';
import * as mockApi from './watchPartyMockApi';
import {
  CreateWatchPartyRequest,
  JoinWatchPartyRequest,
  LeaveWatchPartyRequest,
  WatchPartyApiResponse,
  WatchPartyParticipant,
  WatchPartyPlaybackState,
  WatchPartyRoom,
} from '../types/watchParty.types';

/**
 * Production backend client placeholder.
 * When real Watch Party backend endpoints are deployed, this client implements the actual HTTP calls.
 */
class ProductionWatchPartyApiClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://api.logixstream.com/v1/watch-party') {
    this.baseUrl = baseUrl;
  }

  async createRoom(
    _request: CreateWatchPartyRequest,
  ): Promise<{room: WatchPartyRoom; host: WatchPartyParticipant}> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }

  async joinRoom(
    _request: JoinWatchPartyRequest,
  ): Promise<{room: WatchPartyRoom; participant: WatchPartyParticipant}> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }

  async getRoomDetails(_roomId: string): Promise<WatchPartyRoom> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }

  async getParticipants(_roomId: string): Promise<WatchPartyParticipant[]> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }

  async getPlaybackState(_roomId: string): Promise<WatchPartyPlaybackState> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }

  async leaveRoom(
    _request: LeaveWatchPartyRequest,
  ): Promise<{success: boolean; roomEnded: boolean; message: string}> {
    throw new Error('Production Watch Party backend API is not yet configured.');
  }
}

const prodClient = new ProductionWatchPartyApiClient();

export const watchPartyApi = {
  createRoom: async (
    request: CreateWatchPartyRequest,
  ): Promise<
    WatchPartyApiResponse<{room: WatchPartyRoom; host: WatchPartyParticipant}>
  > => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.createWatchPartyRoom(request);
      return {
        success: true,
        data,
        message: 'Watch Party room created successfully.',
      };
    }
    const data = await prodClient.createRoom(request);
    return {
      success: true,
      data,
      message: 'Watch Party room created successfully.',
    };
  },

  joinRoom: async (
    request: JoinWatchPartyRequest,
  ): Promise<
    WatchPartyApiResponse<{room: WatchPartyRoom; participant: WatchPartyParticipant}>
  > => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.joinWatchPartyRoom(request);
      return {
        success: true,
        data,
        message: 'Joined Watch Party room successfully.',
      };
    }
    const data = await prodClient.joinRoom(request);
    return {
      success: true,
      data,
      message: 'Joined Watch Party room successfully.',
    };
  },

  getRoomDetails: async (
    roomId: string,
  ): Promise<WatchPartyApiResponse<WatchPartyRoom>> => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.getWatchPartyRoomDetails(roomId);
      return {
        success: true,
        data,
      };
    }
    const data = await prodClient.getRoomDetails(roomId);
    return {
      success: true,
      data,
    };
  },

  getParticipants: async (
    roomId: string,
  ): Promise<WatchPartyApiResponse<WatchPartyParticipant[]>> => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.getWatchPartyParticipants(roomId);
      return {
        success: true,
        data,
      };
    }
    const data = await prodClient.getParticipants(roomId);
    return {
      success: true,
      data,
    };
  },

  getPlaybackState: async (
    roomId: string,
  ): Promise<WatchPartyApiResponse<WatchPartyPlaybackState>> => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.getWatchPartyPlaybackState(roomId);
      return {
        success: true,
        data,
      };
    }
    const data = await prodClient.getPlaybackState(roomId);
    return {
      success: true,
      data,
    };
  },

  leaveRoom: async (
    request: LeaveWatchPartyRequest,
  ): Promise<
    WatchPartyApiResponse<{roomEnded: boolean; message: string}>
  > => {
    if (WATCH_PARTY_API_CONFIG.USE_MOCK_API) {
      const data = await mockApi.leaveWatchPartyRoom(request);
      return {
        success: true,
        data: {
          roomEnded: data.roomEnded,
          message: data.message,
        },
        message: data.message,
      };
    }
    const data = await prodClient.leaveRoom(request);
    return {
      success: true,
      data: {
        roomEnded: data.roomEnded,
        message: data.message,
      },
      message: data.message,
    };
  },

  validateRoomCode: (code?: string): boolean => {
    return mockApi.validateRoomCodeFormat(code);
  },
};

export {WATCH_PARTY_API_CONFIG};
