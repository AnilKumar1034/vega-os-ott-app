import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {useShorts} from '../hooks/useShorts';
import {ShortsCard} from '../components/ShortsCard';
import {ShortsMetadata} from '../components/ShortsMetadata';
import {ShortsLoading} from '../components/ShortsLoading';
import {ShortsEmptyState} from '../components/ShortsEmptyState';
import {ShortsErrorState} from '../components/ShortsErrorState';
import {ShortsPlayer} from '../components/ShortsPlayer';
import {ShortsActionRail} from '../components/ShortsActionRail';
import {
  DEFAULT_SHORTS_FALLBACK_THUMBNAIL,
  SHORTS_TEST_IDS,
} from '../constants/shorts.constants';
import {analyticsService} from '../../../analytics';
import {
  isBackEvent,
  isDownEvent,
  isKeyDown,
  isSelectEvent,
  isUpEvent,
} from '../../../utils/inputUtils';
import {styles} from './ShortsScreen.styles';

const useSafeNavigation = () => {
  try {
    return useNavigation<any>();
  } catch {
    return {
      navigate: () => {},
      dispatch: () => {},
      goBack: () => {},
      replace: () => {},
    } as any;
  }
};

export const ShortsScreen = () => {
  const navigation = useSafeNavigation();
  const route = useRoute<any>();
  const initialShortId = route?.params?.shortId;

  const {
    shorts,
    selectedShort,
    selectedIndex,
    categories,
    selectedCategory,
    loading,
    error,
    isEmpty,
    selectCategory,
    selectShort,
    selectNext,
    selectPrevious,
    autoPlayNext,
    toggleLike,
    toggleSave,
    isLiking,
    isSaving,
    retry,
    fetchMore,
    pagination,
  } = useShorts();

  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [focusedNavButton, setFocusedNavButton] = useState<'prev' | 'next' | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const railListRef = useRef<FlatList<any>>(null);
  const hasLoggedImpressionRef = useRef<Record<string, boolean>>({});

  // Select initial short from route param if supplied
  useEffect(() => {
    if (initialShortId && shorts.length > 0) {
      const match = shorts.find((s) => s.id === initialShortId);
      if (match) {
        selectShort(match);
      }
    }
  }, [initialShortId, selectShort, shorts]);

  // Track shorts_opened event
  useEffect(() => {
    analyticsService
      .trackShortsOpened({
        source_screen: 'Home',
        initial_short_id: initialShortId || selectedShort?.id || 'none',
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track shorts_impression when selectedShort changes
  useEffect(() => {
    if (selectedShort?.id && !hasLoggedImpressionRef.current[selectedShort.id]) {
      hasLoggedImpressionRef.current[selectedShort.id] = true;
      analyticsService
        .trackShortsImpression({
          short_id: selectedShort.id,
          title: selectedShort.title,
          category: selectedShort.category || 'all',
          duration_seconds: selectedShort.durationSeconds,
          is_premium: selectedShort.isPremium,
          aspect_ratio: selectedShort.aspectRatio,
        })
        .catch(() => {});
    }
  }, [selectedShort]);

  // Handle remote Back, Up, and Down D-pad buttons
  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      navigation.goBack();
      return;
    }

    if (isUpEvent(type)) {
      selectPrevious();
      return;
    }

    if (isDownEvent(type)) {
      selectNext();
      return;
    }
  });

  const handleCategoryPress = useCallback(
    (cat: string) => {
      selectCategory(cat);
    },
    [selectCategory],
  );

  const handleCardPress = useCallback(
    (item: any, index: number) => {
      selectShort(index);
      railListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.3,
      });
    },
    [selectShort],
  );

  return (
    <View style={styles.container} testID={SHORTS_TEST_IDS.screen}>
      {/* YouTube TV Living Room Ambient Backdrop */}
      {selectedShort?.thumbnailUrl ? (
        <Image
          source={{uri: selectedShort.thumbnailUrl}}
          style={styles.ambientBackdrop}
          blurRadius={20}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.ambientOverlay} pointerEvents="none" />

      <TVFocusGuideView style={{flex: 1}} autoFocus>
        <View style={styles.contentGuide}>
          {/* Header */}
          <View style={styles.headerRow} testID={SHORTS_TEST_IDS.header}>
            <View style={styles.headerTitleArea}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>▶ SHORTS</Text>
              </View>
              <Text style={styles.headerTitle}>LogiXstream Shorts</Text>
              <Text style={styles.headerSubtitle}>
                Trending, highlights and stories on your TV
              </Text>
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.categoryScroll}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              testID={SHORTS_TEST_IDS.categoryTabs}>
              {categories.map((cat, idx) => {
                const isSelected =
                  selectedCategory.toLowerCase() === cat.toLowerCase();
                const isFocused = focusedCategory === cat;
                return (
                  <TouchableOpacity
                    key={`${cat}-${idx}`}
                    activeOpacity={0.8}
                    hasTVPreferredFocus={idx === 0 && !error && !loading}
                    onFocus={() => setFocusedCategory(cat)}
                    onBlur={() => setFocusedCategory(null)}
                    onPress={() => handleCategoryPress(cat)}
                    testID={SHORTS_TEST_IDS.categoryTab(cat)}
                    style={[
                      styles.categoryTab,
                      isSelected && styles.categoryTabActive,
                      isFocused && styles.categoryTabFocused,
                    ]}>
                    <Text
                      style={[
                        styles.categoryTabText,
                        (isSelected || isFocused) &&
                          styles.categoryTabTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Loading State */}
          {loading ? (
            <ShortsLoading />
          ) : error ? (
            /* Error State */
            <ShortsErrorState error={error} onRetry={retry} />
          ) : isEmpty ? (
            /* Empty State */
            <ShortsEmptyState onAction={() => selectCategory('All')} />
          ) : (
            /* Main Content Area */
            <View style={{flex: 1}}>
              <View style={styles.mainStage}>
                {/* 9:16 Portrait Video Playback Stage with Iconic White Rounded Border */}
                <ShortsPlayer
                  short={selectedShort}
                  isActive={!loading && !error && !isEmpty}
                  autoPlay={true}
                  showControls={true}
                  onCompleted={autoPlayNext}
                  testID={SHORTS_TEST_IDS.preview}
                  style={styles.previewContainer}
                />

                {/* Right Info & Actions Panel (matching reference screenshot) */}
                <View style={styles.rightSidePanel}>
                  {/* Title ("Swinging" style), Audio Info ("ılı Original sound"), Creator */}
                  <ShortsMetadata item={selectedShort} />

                  {/* Horizontal Action Buttons Row (Thumbs Up, Thumbs Down, Save, More) */}
                  <ShortsActionRail
                    short={selectedShort}
                    onToggleLike={toggleLike}
                    onToggleSave={toggleSave}
                    isLikeLoading={isLiking}
                    isSaveLoading={isSaving}
                  />

                  {/* Previous / Next Navigation Controls */}
                  <View style={styles.navigationControlsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onFocus={() => setFocusedNavButton('prev')}
                      onBlur={() => setFocusedNavButton(null)}
                      onPress={selectPrevious}
                      disabled={selectedIndex <= 0}
                      testID={SHORTS_TEST_IDS.prevButton}
                      style={[
                        styles.navButton,
                        focusedNavButton === 'prev' && styles.navButtonFocused,
                        selectedIndex <= 0 && {opacity: 0.4},
                      ]}>
                      <Text
                        style={[
                          styles.navButtonText,
                          focusedNavButton === 'prev' &&
                            styles.navButtonTextFocused,
                        ]}>
                        ▲ Previous
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onFocus={() => setFocusedNavButton('next')}
                      onBlur={() => setFocusedNavButton(null)}
                      onPress={selectNext}
                      disabled={selectedIndex >= shorts.length - 1}
                      testID={SHORTS_TEST_IDS.nextButton}
                      style={[
                        styles.navButton,
                        focusedNavButton === 'next' && styles.navButtonFocused,
                        selectedIndex >= shorts.length - 1 && {opacity: 0.4},
                      ]}>
                      <Text
                        style={[
                          styles.navButtonText,
                          focusedNavButton === 'next' &&
                            styles.navButtonTextFocused,
                        ]}>
                        ▼ Next Short
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.remoteHintText}>
                      💡 TV Remote: Press ▲ / ▼ to browse Shorts
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Thumbnail Rail */}
              {/* <View style={styles.bottomRail} testID={SHORTS_TEST_IDS.feedRail}>
                <Text style={styles.bottomRailTitle}>
                  Up Next in {selectedCategory} ({shorts.length})
                </Text>
                <FlatList
                  ref={railListRef}
                  horizontal
                  data={shorts}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railList}
                  onEndReached={() => {
                    if (pagination.hasNextPage) {
                      fetchMore();
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  renderItem={({item, index}) => (
                    <ShortsCard
                      item={item}
                      isSelected={index === selectedIndex}
                      isFocused={focusedCardId === item.id}
                      onFocus={() => setFocusedCardId(item.id)}
                      onBlur={() => setFocusedCardId(null)}
                      onPress={() => handleCardPress(item, index)}
                      width={68}
                      height={96}
                    />
                  )}
                />
              </View> */}
            </View>
          )}
        </View>
      </TVFocusGuideView>
    </View>
  );
};
