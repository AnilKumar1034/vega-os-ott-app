import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {useNavigation, useRoute} from '@react-navigation/native';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {SideMenu} from '../components/molecules/SideMenu';
import {MenuIcon} from '../components/atoms/MenuIcon';
import {Routes} from '../constants/routes';
import {AppDetails} from '../constants/appDetails';
import {strings} from '../constants/strings';
import {colors} from '../theme/colors';
import {useProfile} from '../profiles/hooks/useProfile';
import {deeplinkManager} from '../utils/deeplink';
import {isBackEvent, isKeyDown} from '../utils/inputUtils';
import {analyticsService} from '../analytics';
import {
  addRecentSearch,
  clearRecentSearches,
  DEFAULT_SEARCH_FILTERS,
  getRecentSearches,
  getSearchSuggestions,
  searchCatalog,
  SearchFilterState,
  SearchResultsPayload,
} from '../services/searchCatalogService';
import {HomeContentRow} from '../data/home';
import {styles} from './SearchScreen.styles';

const DEBOUNCE_DELAY_MS = 250;
const MAX_SEARCH_INPUT_LENGTH = 100;

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {activeProfile} = useProfile();

  const initialQuery = route.params?.q || '';
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [filters, setFilters] = useState<SearchFilterState>(DEFAULT_SEARCH_FILTERS);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
  const [focusedPillId, setFocusedPillId] = useState<string | null>(null);
  const [lastFocusedRowIndex, setLastFocusedRowIndex] = useState<number>(0);

  const contentGuideRef = useRef<any>(null);
  const rowRefs = useRef<{[key: number]: any}>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const suppressSuggestionsRef = useRef<boolean>(false);

  // 1. Initial screen view & deeplink destination tracking
  useEffect(() => {
    isMountedRef.current = true;
    deeplinkManager.onDestinationOpened('search').catch(() => {});
    analyticsService.trackSearchOpened('Home').catch(() => {});

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 2. Load recent searches whenever active profile changes
  useEffect(() => {
    let isCurrent = true;
    getRecentSearches(activeProfile?.id)
      .then((history) => {
        if (isCurrent && isMountedRef.current) {
          setRecentSearches(history);
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [activeProfile?.id]);

  // 3. Debounce search query input to avoid flooding network or JavaScript thread
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = searchQuery.trim();
    if (trimmed !== debouncedQuery.trim()) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setDebouncedQuery(searchQuery);
          setIsLoading(false);
        }
      }, DEBOUNCE_DELAY_MS);
    } else {
      setIsLoading(false);
    }

    // Dynamic suggestions based on query prefix
    if (!suppressSuggestionsRef.current && trimmed.length >= 2) {
      const matchedSuggestions = getSearchSuggestions(trimmed, activeProfile);
      setSuggestions(matchedSuggestions);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, debouncedQuery, activeProfile]);

  // 4. Compute search results based on debounced query, filters, and active profile
  const searchResults: SearchResultsPayload = useMemo(() => {
    const currentRequestId = ++searchRequestIdRef.current;
    try {
      const results = searchCatalog({
        query: debouncedQuery,
        filters,
        activeProfile,
      });

      // Ignore stale requests
      if (currentRequestId === searchRequestIdRef.current) {
        return results;
      }
      return results;
    } catch {
      setIsError(true);
      return {
        totalCount: 0,
        items: [],
        rows: [],
        query: debouncedQuery,
        normalizedQuery: debouncedQuery.trim().toLowerCase(),
        isQueryTooLong: debouncedQuery.length > MAX_SEARCH_INPUT_LENGTH,
        hasActiveFilters: false,
        activeFiltersCount: 0,
      };
    }
  }, [debouncedQuery, filters, activeProfile]);

  // 5. Emit analytics events when search results complete loading
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 0 && !isLoading) {
      const totalResults = searchResults.totalCount;

      analyticsService
        .trackSearchPerformed({
          search_term_length: trimmed.length,
          has_results: totalResults > 0,
          result_count: totalResults,
          source_screen: 'Search',
        })
        .catch(() => {});

      if (totalResults > 0) {
        analyticsService
          .trackSearchResultsViewed({
            search_term_length: trimmed.length,
            result_count: totalResults,
            source_screen: 'Search',
            active_filters_count: searchResults.activeFiltersCount,
          })
          .catch(() => {});
      } else {
        analyticsService
          .trackSearchNoResults({
            search_term_length: trimmed.length,
            active_filters_count: searchResults.activeFiltersCount,
            source_screen: 'Search',
          })
          .catch(() => {});
      }

      // Automatically store valid searches in profile-isolated recent history
      if (trimmed.length >= 2 && totalResults > 0) {
        addRecentSearch(activeProfile?.id, trimmed)
          .then((updated) => {
            if (isMountedRef.current) {
              setRecentSearches(updated);
            }
          })
          .catch(() => {});
      }
    }
  }, [
    debouncedQuery,
    isLoading,
    searchResults.totalCount,
    searchResults.activeFiltersCount,
    activeProfile?.id,
  ]);

  // 6. Vega Remote & Hardware Back Key Handling
  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      if (isMenuExpanded) {
        setIsMenuExpanded(false);
      } else if (isSearchFocused) {
        setIsSearchFocused(false);
      } else if (suggestions.length > 0) {
        setSuggestions([]);
      } else if (searchQuery.length > 0) {
        handleClearSearch();
      } else if (searchResults.hasActiveFilters) {
        handleResetFilters();
      } else {
        navigation.navigate(Routes.Home);
      }
    }
  });

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const handleClearSearch = useCallback(() => {
    suppressSuggestionsRef.current = false;
    setSearchQuery('');
    setDebouncedQuery('');
    setSuggestions([]);
    setIsError(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_SEARCH_FILTERS);
    analyticsService
      .trackSearchFilterCleared({
        filter_type: 'all',
        action: 'reset_all',
        source_screen: 'Search',
      })
      .catch(() => {});
  }, []);

  const handleSelectRecentSearch = useCallback(
    (query: string) => {
      suppressSuggestionsRef.current = true;
      setSearchQuery(query);
      setDebouncedQuery(query);
      setSuggestions([]);
      analyticsService
        .trackSearchSubmitted({
          search_term_length: query.length,
          source_screen: 'Search',
        })
        .catch(() => {});
    },
    [],
  );

  const handleClearRecentHistory = useCallback(() => {
    clearRecentSearches(activeProfile?.id)
      .then(() => {
        if (isMountedRef.current) {
          setRecentSearches([]);
        }
      })
      .catch(() => {});
  }, [activeProfile?.id]);

  const handleSelectSuggestion = useCallback(
    (suggestion: string, position: number) => {
      suppressSuggestionsRef.current = true;
      setSearchQuery(suggestion);
      setDebouncedQuery(suggestion);
      setSuggestions([]);
      analyticsService
        .trackSearchSuggestionSelected({
          suggestion_text: suggestion,
          suggestion_length: suggestion.length,
          source_screen: 'Search',
          position,
        })
        .catch(() => {});
      addRecentSearch(activeProfile?.id, suggestion)
        .then((updated) => {
          if (isMountedRef.current) {
            setRecentSearches(updated);
          }
        })
        .catch(() => {});
    },
    [activeProfile?.id],
  );

  const handleToggleContentType = useCallback(
    (type: SearchFilterState['contentType']) => {
      setFilters((prev) => {
        const nextType = prev.contentType === type ? 'all' : type;
        const nextFilters = {...prev, contentType: nextType};
        analyticsService
          .trackSearchFilterApplied({
            filter_type: 'contentType',
            filter_value: nextType,
            source_screen: 'Search',
          })
          .catch(() => {});
        return nextFilters;
      });
    },
    [],
  );

  const handleToggleGenre = useCallback((genre: string) => {
    setFilters((prev) => {
      const nextGenre = prev.genre === genre ? 'all' : genre;
      const nextFilters = {...prev, genre: nextGenre};
      analyticsService
        .trackSearchFilterApplied({
          filter_type: 'genre',
          filter_value: nextGenre,
          source_screen: 'Search',
        })
        .catch(() => {});
      return nextFilters;
    });
  }, []);

  const handleToggleLanguage = useCallback((lang: string) => {
    setFilters((prev) => {
      const nextLang = prev.language === lang ? 'all' : lang;
      const nextFilters = {...prev, language: nextLang};
      analyticsService
        .trackSearchFilterApplied({
          filter_type: 'language',
          filter_value: nextLang,
          source_screen: 'Search',
        })
        .catch(() => {});
      return nextFilters;
    });
  }, []);

  const handleToggleSort = useCallback((sort: SearchFilterState['sortBy']) => {
    setFilters((prev) => {
      const nextSort = prev.sortBy === sort ? 'relevance' : sort;
      const nextFilters = {...prev, sortBy: nextSort};
      analyticsService
        .trackSearchFilterApplied({
          filter_type: 'sortBy',
          filter_value: nextSort,
          source_screen: 'Search',
        })
        .catch(() => {});
      return nextFilters;
    });
  }, []);

  const renderSearchRow = ({
    item: row,
    index,
  }: {
    item: HomeContentRow;
    index: number;
  }) => (
    <ContentRow
      ref={(node) => {
        rowRefs.current[index] = node;
      }}
      row={row}
      selectionSource="Search"
      onContentFocus={() => {
        setLastFocusedRowIndex(index);
        setIsMenuExpanded(false);
      }}
      shouldPreferFocus={
        index === lastFocusedRowIndex && !isMenuExpanded && !isSearchFocused
      }
      onMenuEscapeLeft={() => {
        setLastFocusedRowIndex(index);
        setIsMenuExpanded(true);
      }}
    />
  );

  const activeDestination =
    rowRefs.current[lastFocusedRowIndex] || contentGuideRef.current;

  const isInitialState =
    searchQuery.trim().length === 0 && !searchResults.hasActiveFilters;

  const showRecentSection =
    isInitialState && recentSearches.length > 0;

  const showSuggestions =
    suggestions.length > 0 && searchQuery.trim().length >= 2;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID="search-screen">
      <SideMenu
        activeRoute={Routes.Search}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
        preferActiveFocus={isMenuExpanded}
        destinations={activeDestination ? [activeDestination] : undefined}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={(text) => {
            suppressSuggestionsRef.current = false;
            setSearchQuery(text);
          }}
          onSearchSubmit={() => {
            const trimmed = searchQuery.trim();
            if (trimmed.length > 0) {
              suppressSuggestionsRef.current = true;
              setDebouncedQuery(trimmed);
              setSuggestions([]);
              addRecentSearch(activeProfile?.id, trimmed)
                .then((updated) => setRecentSearches(updated))
                .catch(() => {});
              analyticsService
                .trackSearchSubmitted({
                  search_term_length: trimmed.length,
                  source_screen: 'Search',
                })
                .catch(() => {});
            }
          }}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            setIsMenuExpanded(false);
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
          searchMaxLength={MAX_SEARCH_INPUT_LENGTH}
        />

        <TVFocusGuideView
          ref={contentGuideRef}
          style={styles.contentGuide}
          autoFocus={!isSearchFocused && !isMenuExpanded}>
          {/* Query Too Long Banner */}
          {searchResults.isQueryTooLong && (
            <View style={styles.queryWarningBanner} testID="search-query-too-long">
              <Text style={styles.queryWarningText}>
                {strings.search.queryTooLong ||
                  'Search query is too long (maximum 100 characters). Showing truncated results.'}
              </Text>
            </View>
          )}

          {/* Search Suggestions Row */}
          {showSuggestions && (
            <View style={styles.filterBarContainer} testID="search-suggestions-container">
              <Text style={styles.filterSectionLabel}>
                {strings.search.suggestions || 'Suggestions'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollContainer}>
                {suggestions.map((suggestion, idx) => {
                  const isFocused = focusedPillId === `sug-${idx}`;
                  return (
                    <TouchableOpacity
                      key={`sug-${idx}`}
                      activeOpacity={0.9}
                      onFocus={() => setFocusedPillId(`sug-${idx}`)}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={() => handleSelectSuggestion(suggestion, idx)}
                      style={[styles.chip, isFocused && styles.chipFocused]}
                      accessibilityRole="button"
                      accessibilityLabel={`Suggestion ${suggestion}`}
                      testID={`search-suggestion-${idx}`}>
                      <MenuIcon
                        name="Search"
                        size={10}
                        color={isFocused ? colors.textPrimary : colors.textSecondary}
                        style={styles.chipIcon}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          isFocused && styles.chipTextFocused,
                        ]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Recent Searches Row */}
          {showRecentSection && (
            <View style={styles.filterBarContainer} testID="recent-searches-container">
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {strings.search.recentSearches || 'Recent Searches'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onFocus={() => setFocusedPillId('clear-recent')}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleClearRecentHistory}
                  style={[
                    styles.clearHistoryButton,
                    focusedPillId === 'clear-recent' &&
                      styles.clearHistoryButtonFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent search history"
                  testID="clear-recent-searches-button">
                  <Text
                    style={[
                      styles.clearHistoryText,
                      focusedPillId === 'clear-recent' &&
                        styles.clearHistoryTextFocused,
                    ]}>
                    {strings.search.clearHistory || 'Clear History'}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollContainer}>
                {recentSearches.map((term, idx) => {
                  const isFocused = focusedPillId === `recent-${idx}`;
                  return (
                    <TouchableOpacity
                      key={`recent-${idx}`}
                      activeOpacity={0.9}
                      onFocus={() => setFocusedPillId(`recent-${idx}`)}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={() => handleSelectRecentSearch(term)}
                      style={[styles.chip, isFocused && styles.chipFocused]}
                      accessibilityRole="button"
                      accessibilityLabel={`Recent search ${term}`}
                      testID={`recent-search-chip-${idx}`}>
                      <Text
                        style={[
                          styles.chipText,
                          isFocused && styles.chipTextFocused,
                        ]}>
                        {term}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Discovery Filter & Sort Bar */}
          <View style={styles.filterBarContainer} testID="search-filters-bar">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContainer}>
              {/* Content Type Filter: Movies */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-movie')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('movie')}
                style={[
                  styles.filterPill,
                  filters.contentType === 'movie' && styles.filterPillActive,
                  focusedPillId === 'filter-type-movie' &&
                    (filters.contentType === 'movie'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter by Movies"
                testID="filter-type-movie">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.contentType === 'movie' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-type-movie' &&
                      styles.filterPillTextFocused,
                  ]}>
                  {strings.search.filterMovies || 'Movies'}
                </Text>
              </TouchableOpacity>

              {/* Content Type Filter: Series */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-series')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('series')}
                style={[
                  styles.filterPill,
                  filters.contentType === 'series' && styles.filterPillActive,
                  focusedPillId === 'filter-type-series' &&
                    (filters.contentType === 'series'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter by Series"
                testID="filter-type-series">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.contentType === 'series' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-type-series' &&
                      styles.filterPillTextFocused,
                  ]}>
                  {strings.search.filterSeries || 'Series'}
                </Text>
              </TouchableOpacity>

              {/* Content Type Filter: Live TV */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-live')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('live')}
                style={[
                  styles.filterPill,
                  filters.contentType === 'live' && styles.filterPillActive,
                  focusedPillId === 'filter-type-live' &&
                    (filters.contentType === 'live'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter by Live TV"
                testID="filter-type-live">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.contentType === 'live' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-type-live' &&
                      styles.filterPillTextFocused,
                  ]}>
                  {strings.search.filterLiveTV || 'Live TV'}
                </Text>
              </TouchableOpacity>

              {/* Genre Filter: Action */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-action')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('action')}
                style={[
                  styles.filterPill,
                  filters.genre === 'action' && styles.filterPillActive,
                  focusedPillId === 'filter-genre-action' &&
                    (filters.genre === 'action'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Action Genre"
                testID="filter-genre-action">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.genre === 'action' && styles.filterPillTextActive,
                    focusedPillId === 'filter-genre-action' &&
                      styles.filterPillTextFocused,
                  ]}>
                  Action
                </Text>
              </TouchableOpacity>

              {/* Genre Filter: Sci-Fi */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-scifi')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('sci-fi')}
                style={[
                  styles.filterPill,
                  filters.genre === 'sci-fi' && styles.filterPillActive,
                  focusedPillId === 'filter-genre-scifi' &&
                    (filters.genre === 'sci-fi'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Sci-Fi Genre"
                testID="filter-genre-scifi">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.genre === 'sci-fi' && styles.filterPillTextActive,
                    focusedPillId === 'filter-genre-scifi' &&
                      styles.filterPillTextFocused,
                  ]}>
                  Sci-Fi
                </Text>
              </TouchableOpacity>

              {/* Genre Filter: Drama */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-drama')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('drama')}
                style={[
                  styles.filterPill,
                  filters.genre === 'drama' && styles.filterPillActive,
                  focusedPillId === 'filter-genre-drama' &&
                    (filters.genre === 'drama'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Drama Genre"
                testID="filter-genre-drama">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.genre === 'drama' && styles.filterPillTextActive,
                    focusedPillId === 'filter-genre-drama' &&
                      styles.filterPillTextFocused,
                  ]}>
                  Drama
                </Text>
              </TouchableOpacity>

              {/* Language Filter: Telugu */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-lang-telugu')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleLanguage('telugu')}
                style={[
                  styles.filterPill,
                  filters.language === 'telugu' && styles.filterPillActive,
                  focusedPillId === 'filter-lang-telugu' &&
                    (filters.language === 'telugu'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Telugu Language"
                testID="filter-lang-telugu">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.language === 'telugu' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-lang-telugu' &&
                      styles.filterPillTextFocused,
                  ]}>
                  Telugu
                </Text>
              </TouchableOpacity>

              {/* Language Filter: Hindi */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-lang-hindi')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleLanguage('hindi')}
                style={[
                  styles.filterPill,
                  filters.language === 'hindi' && styles.filterPillActive,
                  focusedPillId === 'filter-lang-hindi' &&
                    (filters.language === 'hindi'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Hindi Language"
                testID="filter-lang-hindi">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.language === 'hindi' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-lang-hindi' &&
                      styles.filterPillTextFocused,
                  ]}>
                  Hindi
                </Text>
              </TouchableOpacity>

              {/* Sort: Newest */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-sort-newest')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleSort('newest')}
                style={[
                  styles.filterPill,
                  filters.sortBy === 'newest' && styles.filterPillActive,
                  focusedPillId === 'filter-sort-newest' &&
                    (filters.sortBy === 'newest'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sort by Newest"
                testID="filter-sort-newest">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.sortBy === 'newest' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-sort-newest' &&
                      styles.filterPillTextFocused,
                  ]}>
                  {strings.search.sortNewest || 'Newest'}
                </Text>
              </TouchableOpacity>

              {/* Sort: Rating */}
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-sort-rating')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleSort('rating')}
                style={[
                  styles.filterPill,
                  filters.sortBy === 'rating' && styles.filterPillActive,
                  focusedPillId === 'filter-sort-rating' &&
                    (filters.sortBy === 'rating'
                      ? styles.filterPillActiveFocused
                      : styles.filterPillFocused),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sort by Highest Rating"
                testID="filter-sort-rating">
                <Text
                  style={[
                    styles.filterPillText,
                    filters.sortBy === 'rating' &&
                      styles.filterPillTextActive,
                    focusedPillId === 'filter-sort-rating' &&
                      styles.filterPillTextFocused,
                  ]}>
                  {strings.search.sortRating || 'Top Rated'}
                </Text>
              </TouchableOpacity>

              {/* Reset Filters Pill (only shown when non-default) */}
              {searchResults.hasActiveFilters && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onFocus={() => setFocusedPillId('reset-filters')}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleResetFilters}
                  style={[
                    styles.resetFiltersPill,
                    focusedPillId === 'reset-filters' &&
                      styles.resetFiltersPillFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all filters"
                  testID="reset-filters-button">
                  <Text
                    style={[
                      styles.resetFiltersText,
                      focusedPillId === 'reset-filters' &&
                        styles.resetFiltersTextFocused,
                    ]}>
                    {strings.search.resetFilters || 'Reset Filters'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Results Summary Status */}
          {searchQuery.trim().length > 0 && !isLoading && (
            <View style={styles.resultsStatusRow} testID="search-results-summary">
              <Text style={styles.resultsCountText}>
                {searchResults.totalCount}{' '}
                {strings.search.resultsFound || 'results found for'} &quot;
                {searchQuery}&quot;
              </Text>
              {searchResults.hasActiveFilters && (
                <Text style={styles.activeFilterSummaryText}>
                  {searchResults.activeFiltersCount} active filter
                  {searchResults.activeFiltersCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}

          {/* Loading Indicator State */}
          {isLoading && (
            <View style={styles.loadingContainer} testID="search-loading-state">
              <ActivityIndicator size="large" color={colors.heroAccent} />
              <Text style={styles.loadingText}>
                {strings.search.searching || 'Searching catalog…'}
              </Text>
            </View>
          )}

          {/* Error / Offline State */}
          {isError && (
            <View style={styles.errorContainer} testID="search-error-state">
              <Text style={styles.errorTitle}>
                {strings.errors.playbackError || 'Search Unavailable'}
              </Text>
              <Text style={styles.errorSubtitle}>
                {strings.search.searchError ||
                  'Unable to load search results. Please check your network connection.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('retry-button')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => {
                  setIsError(false);
                  setDebouncedQuery(searchQuery);
                }}
                style={[
                  styles.actionButton,
                  focusedPillId === 'retry-button' && styles.actionButtonFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Retry search"
                testID="search-retry-button">
                <Text
                  style={[
                    styles.actionButtonText,
                    focusedPillId === 'retry-button' &&
                      styles.actionButtonTextFocused,
                  ]}>
                  {strings.search.retry || 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No Results Empty State */}
          {!isLoading &&
            !isError &&
            searchResults.totalCount === 0 &&
            (searchQuery.trim().length > 0 || searchResults.hasActiveFilters) && (
              <View style={styles.emptyContainer} testID="search-no-results">
                <View style={styles.emptyIconContainer}>
                  <MenuIcon name="Search" size={24} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {strings.search.noResultsTitle || 'No results found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {strings.search.noResults} &quot;{searchQuery}&quot;.{' '}
                  {strings.search.noResultsHint ||
                    'Try checking for typos, searching for a different actor or genre, or adjusting active filters.'}
                </Text>
                <View style={styles.emptyActionsRow}>
                  {searchQuery.trim().length > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onFocus={() => setFocusedPillId('empty-clear-search')}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={handleClearSearch}
                      style={[
                        styles.actionButton,
                        focusedPillId === 'empty-clear-search' &&
                          styles.actionButtonFocused,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search query"
                      testID="search-clear-action">
                      <Text
                        style={[
                          styles.actionButtonText,
                          focusedPillId === 'empty-clear-search' &&
                            styles.actionButtonTextFocused,
                        ]}>
                        {strings.search.clearSearch || 'Clear Search'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {searchResults.hasActiveFilters && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onFocus={() => setFocusedPillId('empty-reset-filters')}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={handleResetFilters}
                      style={[
                        styles.actionButton,
                        focusedPillId === 'empty-reset-filters' &&
                          styles.actionButtonFocused,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Reset all filters"
                      testID="search-reset-filters-action">
                      <Text
                        style={[
                          styles.actionButtonText,
                          focusedPillId === 'empty-reset-filters' &&
                            styles.actionButtonTextFocused,
                        ]}>
                        {strings.search.resetFilters || 'Reset Filters'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

          {/* Results Content Rows List */}
          {!isLoading && !isError && searchResults.totalCount > 0 && (
            <FlatList
              data={searchResults.rows}
              keyExtractor={(row) => `search-${row.id}`}
              renderItem={renderSearchRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentList}
              testID="search-results-list"
            />
          )}
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
