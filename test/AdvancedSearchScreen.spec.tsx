import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {SearchScreen} from '../src/screens/SearchScreen';
import * as profileContext from '../src/profiles/context/profileContext';
import {UserProfile} from '../src/profiles/types/Profile';
import {analyticsService} from '../src/analytics';
import * as searchService from '../src/services/searchCatalogService';
import {Routes} from '../src/constants/routes';

// Mock navigation
const mockNavigate = jest.fn();
let mockRouteParams: Record<string, any> = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

// Mock Kepler TV focus and broadcast event handler to all subscribers
let mockTvEventHandlerCallbacks: ((evt: any) => void)[] = [];
jest.mock('@amazon-devices/react-native-kepler', () => {
  const {View} = require('react-native');
  return {
    TVFocusGuideView: (props: any) => <View {...props} />,
    useTVEventHandler: (cb: (evt: any) => void) => {
      mockTvEventHandlerCallbacks.push(cb);
    },
  };
});

const triggerTVEvent = (evt: any) => {
  mockTvEventHandlerCallbacks.forEach((cb) => {
    try {
      cb(evt);
    } catch {
      // Ignored in test environment
    }
  });
};

const advanceDebounce = async (ms = 300) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe('Advanced Search & Content Discovery Screen (LogiXstream Vega OS)', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult-search',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids-search',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const createMockProfileContext = (profile: UserProfile) => ({
    activeProfile: profile,
    profiles: [adultProfile, kidsProfile],
    isLoadingProfiles: false,
    error: null,
    isParentAuthorized: false,
    parentalSettings: null,
    isLoadingParentalSettings: false,
    setParentAuthorized: jest.fn(),
    setActiveProfile: jest.fn(),
    switchProfile: jest.fn(),
    refreshProfiles: jest.fn(),
    refreshParentalSettings: jest.fn(),
    verifyParentPin: jest.fn(),
    setParentPin: jest.fn(),
    removeParentPin: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    clearActiveProfile: jest.fn(),
  });

  let trackSearchOpenedSpy: jest.SpyInstance;
  let trackSearchPerformedSpy: jest.SpyInstance;
  let trackSearchResultsViewedSpy: jest.SpyInstance;
  let trackSearchNoResultsSpy: jest.SpyInstance;
  let trackSearchFilterAppliedSpy: jest.SpyInstance;
  let trackSearchFilterClearedSpy: jest.SpyInstance;
  let trackSearchSuggestionSelectedSpy: jest.SpyInstance;
  let trackSearchSubmittedSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockRouteParams = {};
    mockTvEventHandlerCallbacks = [];

    searchService.clearCatalogCache();
    searchService.resetRecentSearchesCache();
    await searchService.clearRecentSearches(adultProfile.id);
    await searchService.clearRecentSearches(kidsProfile.id);

    jest
      .spyOn(profileContext, 'useProfile')
      .mockReturnValue(createMockProfileContext(adultProfile));

    trackSearchOpenedSpy = jest
      .spyOn(analyticsService, 'trackSearchOpened')
      .mockResolvedValue();
    trackSearchPerformedSpy = jest
      .spyOn(analyticsService, 'trackSearchPerformed')
      .mockResolvedValue();
    trackSearchResultsViewedSpy = jest
      .spyOn(analyticsService, 'trackSearchResultsViewed')
      .mockResolvedValue();
    trackSearchNoResultsSpy = jest
      .spyOn(analyticsService, 'trackSearchNoResults')
      .mockResolvedValue();
    trackSearchFilterAppliedSpy = jest
      .spyOn(analyticsService, 'trackSearchFilterApplied')
      .mockResolvedValue();
    trackSearchFilterClearedSpy = jest
      .spyOn(analyticsService, 'trackSearchFilterCleared')
      .mockResolvedValue();
    trackSearchSuggestionSelectedSpy = jest
      .spyOn(analyticsService, 'trackSearchSuggestionSelected')
      .mockResolvedValue();
    trackSearchSubmittedSpy = jest
      .spyOn(analyticsService, 'trackSearchSubmitted')
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('1. Initial State & Screen Rendering', () => {
    it('renders search screen, search bar, and discovery filters', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('search-screen')).toBeTruthy();
      expect(screen.getByTestId('common-search-input')).toBeTruthy();
      expect(screen.getByTestId('search-filters-bar')).toBeTruthy();
      expect(screen.getByTestId('filter-type-movie')).toBeTruthy();
      expect(screen.getByTestId('filter-type-series')).toBeTruthy();
      expect(screen.getByTestId('filter-type-live')).toBeTruthy();

      expect(trackSearchOpenedSpy).toHaveBeenCalledWith('Home');
    });

    it('renders recent searches section when recent searches exist for active profile', async () => {
      await searchService.addRecentSearch(adultProfile.id, 'Interstellar');
      await searchService.addRecentSearch(adultProfile.id, 'Kalki');

      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('recent-searches-container')).toBeTruthy();
      expect(screen.getByText('Kalki')).toBeTruthy();
      expect(screen.getByText('Interstellar')).toBeTruthy();
    });

    it('clears recent searches when Clear History button is pressed', async () => {
      await searchService.addRecentSearch(adultProfile.id, 'Interstellar');

      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('recent-searches-container')).toBeTruthy();

      const clearBtn = screen.getByTestId('clear-recent-searches-button');
      await act(async () => {
        fireEvent.press(clearBtn);
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.queryByTestId('recent-searches-container')).toBeNull();
    });

    it('populates search query when a recent search chip is clicked', async () => {
      await searchService.addRecentSearch(adultProfile.id, 'Interstellar');

      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const chip = screen.getByTestId('recent-search-chip-0');
      expect(chip).toBeTruthy();

      await act(async () => {
        fireEvent.press(chip);
      });
      await advanceDebounce(300);

      const input = screen.getByTestId('common-search-input');
      expect(input.props.value).toBe('Interstellar');
      expect(trackSearchSubmittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({search_term_length: 'Interstellar'.length}),
      );
    });
  });

  describe('2. Search Query Execution & Debouncing', () => {
    it('executes debounced search and displays matching results and summary', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Interstellar');
      });
      await advanceDebounce(300);

      expect(screen.getByTestId('search-results-summary')).toBeTruthy();
      expect(screen.getByTestId('search-results-list')).toBeTruthy();

      expect(trackSearchPerformedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search_term_length: 'Interstellar'.length,
          has_results: true,
          source_screen: 'Search',
        }),
      );
      expect(trackSearchResultsViewedSpy).toHaveBeenCalled();
    });

    it('submits search explicitly via keyboard submit event', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Kalki');
      });
      await act(async () => {
        fireEvent(input, 'submitEditing');
      });

      expect(trackSearchSubmittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({search_term_length: 'Kalki'.length}),
      );
    });

    it('clears search query and returns to default state when clear button is pressed', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Jawan');
      });
      await advanceDebounce(300);

      const clearBtn = screen.getByTestId('clear-search-button');
      await act(async () => {
        fireEvent.press(clearBtn);
      });
      await advanceDebounce(300);

      expect(input.props.value).toBe('');
      expect(screen.queryByTestId('search-results-summary')).toBeNull();
    });
  });

  describe('3. Search Suggestions', () => {
    it('displays suggestion chips when query has 2 or more characters', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'int');
      });

      expect(screen.getByTestId('search-suggestions-container')).toBeTruthy();
      expect(screen.getByTestId('search-suggestion-0')).toBeTruthy();
    });

    it('selecting a suggestion sets search query and tracks suggestion selection', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'int');
      });

      expect(screen.getByTestId('search-suggestion-0')).toBeTruthy();

      const suggestionPill = screen.getByTestId('search-suggestion-0');
      await act(async () => {
        fireEvent.press(suggestionPill);
      });
      await advanceDebounce(300);

      expect(trackSearchSuggestionSelectedSpy).toHaveBeenCalled();
      expect(screen.queryByTestId('search-suggestions-container')).toBeNull();
    });
  });

  describe('4. Discovery Filtering & Sorting', () => {
    it('applies Content Type filter and tracks search_filter_applied', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const moviesFilter = screen.getByTestId('filter-type-movie');
      await act(async () => {
        fireEvent.press(moviesFilter);
      });

      expect(trackSearchFilterAppliedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_type: 'contentType',
          filter_value: 'movie',
        }),
      );

      // Reset filters button should become visible
      expect(screen.getByTestId('reset-filters-button')).toBeTruthy();
    });

    it('resets all filters when Reset Filters button is clicked', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const sciFiFilter = screen.getByTestId('filter-genre-scifi');
      await act(async () => {
        fireEvent.press(sciFiFilter);
      });

      const resetBtn = screen.getByTestId('reset-filters-button');
      await act(async () => {
        fireEvent.press(resetBtn);
      });

      expect(trackSearchFilterClearedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_type: 'all',
          action: 'reset_all',
        }),
      );

      expect(screen.queryByTestId('reset-filters-button')).toBeNull();
    });

    it('toggles Sort By options and updates ordering', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const newestSort = screen.getByTestId('filter-sort-newest');
      await act(async () => {
        fireEvent.press(newestSort);
      });

      expect(trackSearchFilterAppliedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_type: 'sortBy',
          filter_value: 'newest',
        }),
      );
    });
  });

  describe('5. Empty State & Error/Retry Handling', () => {
    it('displays empty state with guidance and Clear Search action when query has no matches', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'NonexistentTermXYZ');
      });
      await advanceDebounce(300);

      expect(screen.getByTestId('search-no-results')).toBeTruthy();
      expect(screen.getByTestId('search-clear-action')).toBeTruthy();
      expect(trackSearchNoResultsSpy).toHaveBeenCalled();

      // Clicking clear resets the state
      await act(async () => {
        fireEvent.press(screen.getByTestId('search-clear-action'));
      });
      await advanceDebounce(300);

      expect(screen.queryByTestId('search-no-results')).toBeNull();
    });
  });

  describe('6. Kids Profile Restriction & Parental Controls', () => {
    it('strictly hides adult and mature content when active profile is Kids', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createMockProfileContext(kidsProfile));

      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Kalki');
      });
      await advanceDebounce(300);

      // Kalki is 13_PLUS -> blocked for Kids -> returns no results
      expect(screen.getByTestId('search-no-results')).toBeTruthy();
    });

    it('allows kid-safe content (e.g. The Lion King) when Kids profile is active', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createMockProfileContext(kidsProfile));

      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Lion King');
      });
      await advanceDebounce(300);

      expect(screen.getByTestId('search-results-list')).toBeTruthy();
      expect(screen.queryByTestId('search-no-results')).toBeNull();
    });
  });

  describe('7. Amazon Vega OS Remote D-pad & Hardware Back Navigation', () => {
    it('handles hardware back event to clear search query when query is present', async () => {
      const screen = render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId('common-search-input');
      await act(async () => {
        fireEvent.changeText(input, 'Pushpa');
      });
      await advanceDebounce(300);

      // In SearchScreen, back closes suggestions if visible, then clears query
      await act(async () => {
        triggerTVEvent({
          eventType: 'back',
          eventKeyAction: 0,
        });
      });
      await act(async () => {
        triggerTVEvent({
          eventType: 'back',
          eventKeyAction: 0,
        });
      });
      await advanceDebounce(300);

      expect(input.props.value).toBe('');
    });

    it('handles hardware back event to navigate to Home when query is empty', async () => {
      render(<SearchScreen />);
      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        triggerTVEvent({
          eventType: 'back',
          eventKeyAction: 0,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(Routes.Home);
    });
  });
});
