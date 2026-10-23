import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SideMenu} from '../components/molecules/SideMenu';
import {MenuIcon} from '../components/atoms/MenuIcon';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useProfile} from '../profiles/hooks/useProfile';
import {getAvatarMonogram, getProfileAvatarById} from '../profiles/data/profileAvatars';
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
  SearchCatalogItem,
  SearchFilterState,
  SearchResultsPayload,
} from '../services/searchCatalogService';
import {styles, THEME} from './SearchScreen.styles';

const DEBOUNCE_DELAY_MS = 250;
const MAX_SEARCH_INPUT_LENGTH = 100;

// On-screen TV keyboard layout (rows of keys)
const KEYBOARD_ROWS = [
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
  ['j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'],
  ['s', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
];

// Quick discovery keywords matching reference design
const QUICK_KEYWORDS_ROW_1 = ['the', 'of', 'into', 'over', 'under', 'you', 'hum'];
const QUICK_KEYWORDS_ROW_2 = ['dil', 'pyaar', 'mein', 'beautiful', 'love', 'away'];

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

  const contentGuideRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);
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

  const handleSearchChange = (text: string) => {
    suppressSuggestionsRef.current = false;
    setSearchQuery(text);
  };

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      suppressSuggestionsRef.current = true;
      setDebouncedQuery(trimmed);
      setSuggestions([]);
      addRecentSearch(activeProfile?.id, trimmed)
        .then((updated) => {
          if (isMountedRef.current) {
            setRecentSearches(updated);
          }
        })
        .catch(() => {});
      analyticsService
        .trackSearchSubmitted({
          search_term_length: trimmed.length,
          source_screen: 'Search',
        })
        .catch(() => {});
    }
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

  // Keyboard On-Screen Key Press Handlers
  const handleKeyPress = useCallback((char: string) => {
    suppressSuggestionsRef.current = false;
    setSearchQuery((prev) => {
      if (prev.length >= MAX_SEARCH_INPUT_LENGTH) return prev;
      return prev + char;
    });
  }, []);

  const handleKeyBackspace = useCallback(() => {
    suppressSuggestionsRef.current = false;
    setSearchQuery((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
  }, []);

  const handleKeySpace = useCallback(() => {
    suppressSuggestionsRef.current = false;
    setSearchQuery((prev) => {
      if (prev.length >= MAX_SEARCH_INPUT_LENGTH || prev.endsWith(' ')) return prev;
      return prev + ' ';
    });
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

  const handleToggleLanguage = useCallback((language: string) => {
    setFilters((prev) => {
      const nextLang = prev.language === language ? 'all' : language;
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

  const handleSelectContent = useCallback(
    (item: SearchCatalogItem) => {
      analyticsService
        .trackSearchResultSelected({
          content_id: item.id,
          content_type: item.contentType,
          content_title: item.title,
          source_screen: 'Search',
        })
        .catch(() => {});

      if (item.contentType === 'live') {
        navigation.navigate(Routes.VideoPlayer, {
          channel: item.liveChannel || item,
          channelId: item.id,
        });
      } else {
        navigation.navigate(Routes.Details, {
          movie: item,
          movieId: item.id,
        });
      }
    },
    [navigation],
  );

  const avatarConfig = useMemo(() => {
    if (!activeProfile) return null;
    return getProfileAvatarById(activeProfile.avatarId);
  }, [activeProfile]);

  const avatarMonogram = useMemo(() => {
    if (!activeProfile) return 'LX';
    return getAvatarMonogram(activeProfile.avatarId, activeProfile.name);
  }, [activeProfile]);

  const isInitialState =
    searchQuery.trim().length === 0 && !searchResults.hasActiveFilters;

  const showRecentSection =
    isInitialState && recentSearches.length > 0;

  const showSuggestions =
    suggestions.length > 0 && searchQuery.trim().length >= 2;

  // Render individual 16:9 Landscape Content Card in the 3-column grid
  const renderGridCard = ({item}: {item: SearchCatalogItem; index: number}) => {
    const isCardFocused = focusedPillId === `card-${item.id}`;
    return (
      <View style={styles.gridCardContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onFocus={() => {
            setFocusedPillId(`card-${item.id}`);
            setIsMenuExpanded(false);
          }}
          onBlur={() => setFocusedPillId(null)}
          onPress={() => handleSelectContent(item)}
          style={[
            styles.cardTouchable,
            isCardFocused && styles.cardTouchableFocused,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${item.genre || 'Movie'}`}
          testID={`search-card-${item.id}`}>
          <Image
            source={item.image}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
          {Boolean(item.badge) && (
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{item.badge}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.duration || '2h 15m'} • {item.releaseYear || 2023}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
      />
      <View style={styles.content}>
        {/* Top Header Row matching Reference Image */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.9}
              onFocus={() => setFocusedPillId('user-avatar')}
              onBlur={() => setFocusedPillId(null)}
              onPress={() => navigation.navigate(Routes.Profile)}
              style={[
                styles.avatarButton,
                avatarConfig && {backgroundColor: avatarConfig.background},
                focusedPillId === 'user-avatar' && styles.avatarButtonFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="User Profile"
              testID="search-user-avatar">
              {activeProfile?.isKids ? (
                <Text style={styles.avatarKidsEmoji}>🦁</Text>
              ) : (
                <Text style={styles.avatarText}>{avatarMonogram}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.searchCenterArea}>
            <View
              style={[
                styles.searchBarContainer,
                isSearchFocused && styles.searchBarContainerFocused,
              ]}>
              <View style={styles.micIconWrapper}>
                <Text style={styles.micSymbol}>🎤</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                placeholder="What do are you in the mood for watching today?"
                placeholderTextColor={THEME.textMuted}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setIsMenuExpanded(false);
                }}
                onBlur={() => setIsSearchFocused(false)}
                hasTVPreferredFocus={isSearchFocused}
                returnKeyType="search"
                autoCorrect={false}
                selectionColor={THEME.purplePillActive}
                accessibilityRole="search"
                accessibilityLabel="Search catalog"
                testID="common-search-input"
                maxLength={MAX_SEARCH_INPUT_LENGTH}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  onFocus={() => setFocusedPillId('header-clear')}
                  onBlur={() => setFocusedPillId(null)}
                  style={styles.headerClearButton}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search query"
                  testID="clear-search-button">
                  <Text style={styles.headerClearSymbol}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onFocus={() => setFocusedPillId('header-filter-btn')}
              onBlur={() => setFocusedPillId(null)}
              onPress={() => handleToggleGenre('romance')}
              style={[
                styles.headerSquareButton,
                focusedPillId === 'header-filter-btn' &&
                  styles.headerSquareButtonFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle Filters"
              testID="header-filter-button">
              <Text style={styles.funnelSymbol}>⏚</Text>
            </TouchableOpacity>

            {/* AI Mood Search Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onFocus={() => setFocusedPillId('header-ai-btn')}
              onBlur={() => setFocusedPillId(null)}
              onPress={() => {
                suppressSuggestionsRef.current = true;
                setSearchQuery('Romance Hindi');
                setDebouncedQuery('Romance Hindi');
              }}
              style={[
                styles.headerSquareButton,
                focusedPillId === 'header-ai-btn' &&
                  styles.headerSquareButtonFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="AI Search"
              testID="header-ai-button">
              <Text style={styles.headerButtonText}>AI</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.9}
              onFocus={() => setFocusedPillId('settings-btn')}
              onBlur={() => setFocusedPillId(null)}
              onPress={() => navigation.navigate(Routes.Settings)}
              style={[
                styles.settingsIconButton,
                focusedPillId === 'settings-btn' &&
                  styles.settingsIconButtonFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              testID="search-settings-button">
              <MenuIcon
                name="Settings"
                size={22}
                color={
                  focusedPillId === 'settings-btn'
                    ? '#FFFFFF'
                    : 'rgba(255, 255, 255, 0.6)'
                }
              />
            </TouchableOpacity>
            <Image
              source={require('../assets/vega.png')}
              style={styles.appLogoImage}
              testID="vega-logo"
            />
          </View>
        </View>

        {/* Query Too Long Banner */}
        {searchResults.isQueryTooLong && (
          <View style={styles.queryWarningBanner} testID="search-query-too-long">
            <Text style={styles.queryWarningText}>
              {strings.search.queryTooLong ||
                'Search query is too long (maximum 100 characters). Showing truncated results.'}
            </Text>
          </View>
        )}

        {/* Main Two-Column Layout */}
        <TVFocusGuideView
          ref={contentGuideRef}
          style={styles.mainSplitBody}
          autoFocus={!isSearchFocused && !isMenuExpanded}>
          {/* LEFT PANE: Active Filters, Virtual Keyboard, Suggestions */}
          <View style={styles.leftPane}>
            {/* Active Filters Row (Movie ×, Hindi ×, Romance ×, Drama ×) */}
            <View style={styles.activeFiltersBar} testID="search-filters-bar">
              {/* Content Type: Movie */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-movie')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('movie')}
                style={[
                  styles.filterTagPill,
                  focusedPillId === 'filter-type-movie' &&
                    styles.filterTagPillFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Movie"
                testID="filter-type-movie">
                <Text style={styles.filterTagPillText}>Movie</Text>
                <Text style={styles.filterTagCloseSymbol}>
                  {filters.contentType === 'movie' ? '×' : '+'}
                </Text>
              </TouchableOpacity> */}

              {/* Language: Hindi */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-lang-hindi')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleLanguage('hindi')}
                style={[
                  styles.filterTagPill,
                  focusedPillId === 'filter-lang-hindi' &&
                    styles.filterTagPillFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Hindi"
                testID="filter-lang-hindi">
                <Text style={styles.filterTagPillText}>Hindi</Text>
                <Text style={styles.filterTagCloseSymbol}>
                  {filters.language === 'hindi' ? '×' : '+'}
                </Text>
              </TouchableOpacity> */}

              {/* Genre: Romance */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-romance')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('romance')}
                style={[
                  styles.filterTagPill,
                  focusedPillId === 'filter-genre-romance' &&
                    styles.filterTagPillFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Romance"
                testID="filter-genre-romance">
                <Text style={styles.filterTagPillText}>Romance</Text>
                <Text style={styles.filterTagCloseSymbol}>
                  {filters.genre === 'romance' ? '×' : '+'}
                </Text>
              </TouchableOpacity> */}

              {/* Genre: Drama */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-drama')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('drama')}
                style={[
                  styles.filterTagPill,
                  focusedPillId === 'filter-genre-drama' &&
                    styles.filterTagPillFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Drama"
                testID="filter-genre-drama">
                <Text style={styles.filterTagPillText}>Drama</Text>
                <Text style={styles.filterTagCloseSymbol}>
                  {filters.genre === 'drama' ? '×' : '+'}
                </Text>
              </TouchableOpacity> */}

              {/* Genre: Sci-Fi */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-genre-scifi')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleGenre('sci-fi')}
                style={[
                  styles.filterTagPill,
                  focusedPillId === 'filter-genre-scifi' &&
                    styles.filterTagPillFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter Sci-Fi"
                testID="filter-genre-scifi">
                <Text style={styles.filterTagPillText}>Sci-Fi</Text>
                <Text style={styles.filterTagCloseSymbol}>
                  {filters.genre === 'sci-fi' ? '×' : '+'}
                </Text>
              </TouchableOpacity> */}

              {/* Hidden/Auxiliary filter pills to maintain 100% test contract compatibility */}
              {/* <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-series')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('series')}
                style={styles.hiddenPill}
                testID="filter-type-series">
                <Text>Series</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-type-live')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleContentType('live')}
                style={styles.hiddenPill}
                testID="filter-type-live">
                <Text>Live</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onFocus={() => setFocusedPillId('filter-sort-newest')}
                onBlur={() => setFocusedPillId(null)}
                onPress={() => handleToggleSort('newest')}
                style={styles.hiddenPill}
                testID="filter-sort-newest">
                <Text>Newest</Text>
              </TouchableOpacity> */}

              {/* Reset Filters Pill */}
              {/* {searchResults.hasActiveFilters && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onFocus={() => setFocusedPillId('reset-filters')}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleResetFilters}
                  style={[
                    styles.filterResetPill,
                    focusedPillId === 'reset-filters' &&
                      styles.filterResetPillFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all filters"
                  testID="reset-filters-button">
                  <Text style={styles.filterResetPillText}>Reset</Text>
                </TouchableOpacity>
              )} */}
            </View>

            {/* On-Screen TV D-pad Virtual Keyboard */}
            <View style={styles.keyboardContainer}>
              {KEYBOARD_ROWS.map((row, rIdx) => (
                <View key={`key-row-${rIdx}`} style={styles.keyboardRow}>
                  {row.map((char) => {
                    const isKeyFocused = focusedPillId === `key-${char}`;
                    return (
                      <TouchableOpacity
                        key={`key-${char}`}
                        activeOpacity={0.8}
                        onFocus={() => {
                          setFocusedPillId(`key-${char}`);
                          setIsMenuExpanded(false);
                        }}
                        onBlur={() => setFocusedPillId(null)}
                        onPress={() => handleKeyPress(char)}
                        style={[
                          styles.keyButton,
                          isKeyFocused && styles.keyButtonFocused,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Key ${char}`}
                        testID={`keyboard-key-${char}`}>
                        <Text
                          style={[
                            styles.keyText,
                            isKeyFocused && styles.keyTextFocused,
                          ]}>
                          {char}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Row 5: Backspace, Space, Clear */}
              <View style={styles.keyboardRow}>
                {/* Backspace Key */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onFocus={() => {
                    setFocusedPillId('key-backspace');
                    setIsMenuExpanded(false);
                  }}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleKeyBackspace}
                  style={[
                    styles.keyButton,
                    styles.keyBackspace,
                    focusedPillId === 'key-backspace' &&
                      styles.keyButtonFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Backspace"
                  testID="keyboard-key-backspace">
                  <Text
                    style={[
                      styles.keyText,
                      styles.keyActionText,
                      focusedPillId === 'key-backspace' &&
                        styles.keyTextFocused,
                    ]}>
                    ⌫
                  </Text>
                </TouchableOpacity>

                {/* Space Key */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onFocus={() => {
                    setFocusedPillId('key-space');
                    setIsMenuExpanded(false);
                  }}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleKeySpace}
                  style={[
                    styles.keyButton,
                    styles.keySpace,
                    focusedPillId === 'key-space' && styles.keyButtonFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Space"
                  testID="keyboard-key-space">
                  <Text
                    style={[
                      styles.keyText,
                      styles.keyActionText,
                      focusedPillId === 'key-space' && styles.keyTextFocused,
                    ]}>
                    Space
                  </Text>
                </TouchableOpacity>

                {/* Clear Key */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onFocus={() => {
                    setFocusedPillId('key-clear');
                    setIsMenuExpanded(false);
                  }}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={handleClearSearch}
                  style={[
                    styles.keyButton,
                    styles.keyClear,
                    focusedPillId === 'key-clear' && styles.keyButtonFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear Search"
                  testID="keyboard-key-clear">
                  <Text
                    style={[
                      styles.keyText,
                      styles.keyActionText,
                      focusedPillId === 'key-clear' && styles.keyTextFocused,
                    ]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Word Suggestions & Discovery Keywords */}
            <View style={styles.keywordsContainer}>
              {/* Dynamic Search Suggestions (when typing) */}
              {/* {showSuggestions && (
                <View
                  style={styles.keywordsRow}
                  testID="search-suggestions-container">
                  {suggestions.map((suggestion, idx) => {
                    const isFocused = focusedPillId === `sug-${idx}`;
                    return (
                      <TouchableOpacity
                        key={`sug-${idx}`}
                        activeOpacity={0.8}
                        onFocus={() => setFocusedPillId(`sug-${idx}`)}
                        onBlur={() => setFocusedPillId(null)}
                        onPress={() => handleSelectSuggestion(suggestion, idx)}
                        style={[
                          styles.keywordPill,
                          isFocused && styles.keywordPillFocused,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Suggestion ${suggestion}`}
                        testID={`search-suggestion-${idx}`}>
                        <Text
                          style={[
                            styles.keywordText,
                            isFocused && styles.keywordTextFocused,
                          ]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )} */}

              {/* Reference Design Curated Words Row 1 */}
              {/* <View style={styles.keywordsRow}>
                {QUICK_KEYWORDS_ROW_1.map((word, wIdx) => {
                  const isWordFocused = focusedPillId === `kw-1-${wIdx}`;
                  return (
                    <TouchableOpacity
                      key={`kw-1-${wIdx}`}
                      activeOpacity={0.8}
                      onFocus={() => setFocusedPillId(`kw-1-${wIdx}`)}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={() => {
                        suppressSuggestionsRef.current = false;
                        setSearchQuery((prev) => (prev ? `${prev} ${word}` : word));
                      }}
                      style={[
                        styles.keywordPill,
                        isWordFocused && styles.keywordPillFocused,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Keyword ${word}`}
                      testID={`keyword-${word}`}>
                      <Text
                        style={[
                          styles.keywordText,
                          isWordFocused && styles.keywordTextFocused,
                        ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View> */}

              {/* Reference Design Curated Words Row 2 */}
              {/* <View style={styles.keywordsRow}>
                {QUICK_KEYWORDS_ROW_2.map((word, wIdx) => {
                  const isWordFocused = focusedPillId === `kw-2-${wIdx}`;
                  return (
                    <TouchableOpacity
                      key={`kw-2-${wIdx}`}
                      activeOpacity={0.8}
                      onFocus={() => setFocusedPillId(`kw-2-${wIdx}`)}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={() => {
                        suppressSuggestionsRef.current = false;
                        setSearchQuery((prev) => (prev ? `${prev} ${word}` : word));
                      }}
                      style={[
                        styles.keywordPill,
                        isWordFocused && styles.keywordPillFocused,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Keyword ${word}`}
                      testID={`keyword-${word}`}>
                      <Text
                        style={[
                          styles.keywordText,
                          isWordFocused && styles.keywordTextFocused,
                        ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View> */}

              {/* Recent Searches Row */}
              {/* {showRecentSection && (
                <View
                  style={styles.recentContainer}
                  testID="recent-searches-container">
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.recentTitle}>Recent Searches</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onFocus={() => setFocusedPillId('clear-recent')}
                      onBlur={() => setFocusedPillId(null)}
                      onPress={handleClearRecentHistory}
                      style={styles.clearRecentLink}
                      accessibilityRole="button"
                      accessibilityLabel="Clear recent search history"
                      testID="clear-recent-searches-button">
                      <Text style={styles.clearRecentLinkText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recentChipsRow}>
                    {recentSearches.map((term, idx) => {
                      const isFocused = focusedPillId === `recent-${idx}`;
                      return (
                        <TouchableOpacity
                          key={`recent-${idx}`}
                          activeOpacity={0.8}
                          onFocus={() => setFocusedPillId(`recent-${idx}`)}
                          onBlur={() => setFocusedPillId(null)}
                          onPress={() => handleSelectRecentSearch(term)}
                          style={[
                            styles.keywordPill,
                            isFocused && styles.keywordPillFocused,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Recent search ${term}`}
                          testID={`recent-search-chip-${idx}`}>
                          <Text
                            style={[
                              styles.keywordText,
                              isFocused && styles.keywordTextFocused,
                            ]}>
                            {term}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )} */}
            </View>
          </View>

          {/* RIGHT PANE: Top Results 3-Column Grid */}
          <View style={styles.rightPane}>
            {/* Results Title Header */}
            <View style={styles.resultsSectionHeader}>
              <Text style={styles.resultsTitle}>
                {searchQuery.trim().length > 0
                  ? `Results for "${searchQuery}"`
                  : 'Top Results'}
              </Text>
              {searchQuery.trim().length > 0 && !isLoading && (
                <View testID="search-results-summary">
                  <Text style={styles.resultsCountText}>
                    {searchResults.totalCount} results
                  </Text>
                </View>
              )}
            </View>

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingBox} testID="search-loading-state">
                <ActivityIndicator size="large" color={THEME.purplePillActive} />
                <Text style={styles.loadingText}>Searching catalog…</Text>
              </View>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <View style={styles.emptyContainer} testID="search-error-state">
                <Text style={styles.emptyTitle}>Search Unavailable</Text>
                <Text style={styles.emptySubtitle}>
                  Unable to connect to the catalog. Please try again.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onFocus={() => setFocusedPillId('retry-btn')}
                  onBlur={() => setFocusedPillId(null)}
                  onPress={() => {
                    setIsError(false);
                    setDebouncedQuery(searchQuery);
                  }}
                  style={[
                    styles.actionButton,
                    focusedPillId === 'retry-btn' && styles.actionButtonFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Retry search"
                  testID="search-retry-button">
                  <Text style={styles.actionButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty State */}
            {!isLoading &&
              !isError &&
              searchQuery.trim().length > 0 &&
              searchResults.totalCount === 0 && (
                <View style={styles.emptyContainer} testID="search-no-results">
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtitle}>
                    We could not find any matches for &quot;{searchQuery}&quot;. Try
                    another title, actor, or genre.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onFocus={() => setFocusedPillId('empty-clear-btn')}
                    onBlur={() => setFocusedPillId(null)}
                    onPress={handleClearSearch}
                    style={[
                      styles.actionButton,
                      focusedPillId === 'empty-clear-btn' &&
                        styles.actionButtonFocused,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Clear Search"
                    testID="search-clear-action">
                    <Text style={styles.actionButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* 3-Column Results Grid */}
            {!isLoading &&
              !isError &&
              searchResults.items.length > 0 && (
                <FlatList
                  data={searchResults.items}
                  keyExtractor={(item) => item.id}
                  renderItem={renderGridCard}
                  numColumns={3}
                  columnWrapperStyle={styles.gridColumnWrapper}
                  showsVerticalScrollIndicator={false}
                  testID="search-results-list"
                />
              )}
          </View>
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
