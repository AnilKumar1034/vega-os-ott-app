import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, ImageBackground, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentCard} from '../components/molecules/ContentCard';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {HomeContentItem} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {fetchWatchlist} from '../services/watchlistService';
import {WatchlistItem} from '../types/watchlist';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {findContentById} from '../utils/deeplink';
import {filterContentItem} from '../utils/searchUtils';
import {styles} from './MyListScreen.styles';

export const MyListScreen = () => {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [focusedAction, setFocusedAction] = useState<string | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWatchlistData = useCallback(async (profileId?: string) => {
    if (!user || !profileId) {
      setWatchlistItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await fetchWatchlist(profileId);
      setWatchlistItems(items);
    } catch (error: any) {
      console.log('Error loading watchlist:', error);
      setErrorMessage(error?.message || strings.myList.errorTitle);
      setWatchlistItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isCurrent = true;

    // Immediately clear current list when switching profiles
    // to prevent cross-profile data leakage
    setWatchlistItems([]);
    setIsLoading(true);
    setErrorMessage(null);

    if (!user || !activeProfile?.id) {
      setIsLoading(false);
      return;
    }

    const currentProfileId = activeProfile.id;
    (async () => {
      try {
        const items = await fetchWatchlist(currentProfileId);
        if (isCurrent) {
          setWatchlistItems(items);
        }
      } catch (error: any) {
        console.log('Error loading profile watchlist:', error);
        if (isCurrent) {
          setErrorMessage(error?.message || strings.myList.errorTitle);
          setWatchlistItems([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [user, activeProfile?.id]);

  const resolvedContentItems = useMemo<HomeContentItem[]>(() => {
    return watchlistItems
      .map((item) => {
        const fullCatalogItem = findContentById(item.contentId);
        if (fullCatalogItem) {
          return fullCatalogItem;
        }

        return {
          id: item.contentId,
          maturityRating: undefined,
          title: item.title,
          genre: item.genre,
          image: item.image
            ? {uri: item.image}
            : require('../assets/background.png'),
        };
      })
      .filter((item) => canProfileAccessContent(activeProfile, item));
  }, [activeProfile, watchlistItems]);

  const filteredItems = useMemo(() => {
    return resolvedContentItems.filter((item) =>
      filterContentItem(item, searchQuery),
    );
  }, [resolvedContentItems, searchQuery]);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
    setIsSearchFocused(false);
    setFocusedAction(null);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  const renderContentCard = ({
    item,
    index,
  }: {
    item: HomeContentItem;
    index: number;
  }) => (
    <ContentCard
      {...item}
      layout="grid"
      onFocus={collapseMenu}
      hasTVPreferredFocus={index === 0 && !isSearchFocused}
      testID={`my-list-card-${item.id}`}
    />
  );

  const renderEmptyOrErrorState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer} testID="my-list-loading-state">
          <Text style={styles.stateTitle}>{strings.myList.loading}</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerContainer} testID="my-list-error-state">
          <Text style={styles.stateTitle}>{strings.myList.errorTitle}</Text>
          <Text style={styles.stateSubtitle}>{strings.myList.errorSubtitle}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                focusedAction === 'retry' && styles.actionButtonFocused,
              ]}
              onFocus={() => {
                collapseMenu();
                setFocusedAction('retry');
              }}
              onBlur={() => setFocusedAction(null)}
              onPress={() => loadWatchlistData(activeProfile?.id)}
              hasTVPreferredFocus={!isSearchFocused}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.myList.retry}
              testID="my-list-retry-button">
              <Text style={styles.actionButtonText}>{strings.myList.retry}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionButton,
                focusedAction === 'error-explore' && styles.actionButtonFocused,
              ]}
              onFocus={() => {
                collapseMenu();
                setFocusedAction('error-explore');
              }}
              onBlur={() => setFocusedAction(null)}
              onPress={() => navigation.navigate(Routes.Movies)}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.myList.exploreButton}
              testID="my-list-error-explore-button">
              <Text style={styles.secondaryActionButtonText}>
                {strings.myList.exploreButton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <View style={styles.centerContainer} testID="my-list-empty-state">
          <Text style={styles.stateTitle}>
            {searchQuery
              ? `${strings.search.noResults} "${searchQuery}"`
              : strings.myList.emptyTitle}
          </Text>
          <Text style={styles.stateSubtitle}>
            {searchQuery
              ? strings.search.trySearchingElse
              : strings.myList.emptySubtitle}
          </Text>
          <View style={styles.actionsContainer}>
            {searchQuery ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    focusedAction === 'clear-search' && styles.actionButtonFocused,
                  ]}
                  onFocus={() => {
                    collapseMenu();
                    setFocusedAction('clear-search');
                  }}
                  onBlur={() => setFocusedAction(null)}
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchFocused(true);
                  }}
                  hasTVPreferredFocus={!isSearchFocused}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityLabel={strings.search.clearText}
                  testID="my-list-clear-search-button">
                  <Text style={styles.actionButtonText}>
                    {strings.search.clearText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    focusedAction === 'explore' && styles.actionButtonFocused,
                  ]}
                  onFocus={() => {
                    collapseMenu();
                    setFocusedAction('explore');
                  }}
                  onBlur={() => setFocusedAction(null)}
                  onPress={() => navigation.navigate(Routes.Movies)}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityLabel={strings.myList.exploreButton}
                  testID="my-list-explore-button">
                  <Text style={styles.secondaryActionButtonText}>
                    {strings.myList.exploreButton}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    focusedAction === 'explore' && styles.actionButtonFocused,
                  ]}
                  onFocus={() => {
                    collapseMenu();
                    setFocusedAction('explore');
                  }}
                  onBlur={() => setFocusedAction(null)}
                  onPress={() => navigation.navigate(Routes.Movies)}
                  hasTVPreferredFocus={!isSearchFocused}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityLabel={strings.myList.exploreButton}
                  testID="my-list-explore-button">
                  <Text style={styles.actionButtonText}>
                    {strings.myList.exploreButton}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID={AppDetails.myListTestId}>
      <SideMenu
        activeRoute={Routes.MyList}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
        preferActiveFocus={isMenuExpanded}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.myListScreenTitle}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            collapseMenu();
            setFocusedAction(null);
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
        />
        <TVFocusGuideView
          style={styles.contentGuide}
          autoFocus={filteredItems.length > 0 && !isSearchFocused}>
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => `watchlist-${item.id}`}
            numColumns={4}
            ListHeaderComponent={
              <View style={styles.headerSection}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{strings.nav.myListHeaderTitle}</Text>
                  {filteredItems.length > 0 && (
                    <Text style={styles.countBadge}>
                      {strings.myList.itemCount(filteredItems.length)}
                    </Text>
                  )}
                </View>
                <Text style={styles.subtitle}>
                  {activeProfile?.name
                    ? `${strings.nav.myListHeaderSubtitle} (${activeProfile.name})`
                    : strings.nav.myListHeaderSubtitle}
                </Text>
              </View>
            }
            ListEmptyComponent={renderEmptyOrErrorState}
            renderItem={renderContentCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
