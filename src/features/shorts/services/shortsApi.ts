import {SHORTS_API_CONFIG} from '../constants/shorts.constants';
import * as mockApi from './shortsMockApi';
import {
  ShortsFeedParams,
  ShortsItem,
  ShortsListResponse,
  ShortsRecommendationsParams,
  ShortsSearchParams,
} from '../types/shorts.types';

/**
 * Production backend client placeholder.
 * When real backend endpoints are available, this client implements the actual HTTP calls.
 */
class ProductionShortsApiClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://api.logixstream.com/v1') {
    this.baseUrl = baseUrl;
  }

  async getFeed(_params?: ShortsFeedParams): Promise<ShortsListResponse> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }

  async getDetails(_shortId: string): Promise<ShortsItem> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }

  async getCategories(): Promise<string[]> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }

  async getByCategory(
    _category: string,
    _page?: number,
    _limit?: number,
  ): Promise<ShortsListResponse> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }

  async getRecommendations(
    _params: ShortsRecommendationsParams | string,
  ): Promise<ShortsItem[]> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }

  async search(_params: ShortsSearchParams): Promise<ShortsListResponse> {
    throw new Error('Production Shorts backend API is not yet configured.');
  }
}

const prodClient = new ProductionShortsApiClient();

/**
 * Shorts API service consumed by the UI.
 * Selects mock or production implementation based on SHORTS_API_CONFIG.USE_MOCK_API.
 */
export const shortsApi = {
  getFeed: async (params?: ShortsFeedParams): Promise<ShortsListResponse> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.getShortsFeed(params);
    }
    return prodClient.getFeed(params);
  },

  getDetails: async (shortId: string): Promise<ShortsItem> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.getShortsDetails(shortId);
    }
    return prodClient.getDetails(shortId);
  },

  getCategories: async (): Promise<string[]> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.getShortsCategories();
    }
    return prodClient.getCategories();
  },

  getByCategory: async (
    category: string,
    page?: number,
    limit?: number,
  ): Promise<ShortsListResponse> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.getShortsByCategory(category, page, limit);
    }
    return prodClient.getByCategory(category, page, limit);
  },

  getRecommendations: async (
    params: ShortsRecommendationsParams | string,
    limit?: number,
  ): Promise<ShortsItem[]> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.getShortsRecommendations(params, limit);
    }
    return prodClient.getRecommendations(params);
  },

  search: async (params: ShortsSearchParams): Promise<ShortsListResponse> => {
    if (SHORTS_API_CONFIG.USE_MOCK_API) {
      return mockApi.searchShorts(params);
    }
    return prodClient.search(params);
  },
};

export {SHORTS_API_CONFIG};
