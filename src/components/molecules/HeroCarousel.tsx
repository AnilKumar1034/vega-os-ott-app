import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  ImageBackground,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {strings} from '../../constants/strings';
import {isSelectEvent, isKeyDown} from '../../utils/inputUtils';
import {HeroMetaTag} from '../atoms/HeroMetaTag';
import {useAuth} from '../../context/authContext';
import {useProfile} from '../../profiles/hooks/useProfile';
import {
  addToWatchlist,
  isInWatchlist,
  removeFromWatchlist,
} from '../../services/watchlistService';
import {styles} from './HeroCarousel.styles';

const MetaSeparator = () => <Text style={styles.metaDot}>•</Text>;

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  meta?: string[];
  image: ImageSourcePropType;
  badge?: string;
  rating?: string;
  genre?: string;
  cast?: string;
  director?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  onContentFocus: () => void;
  onLibraryChange?: () => void;
  onUnauthenticatedFavourite?: () => void;
  shouldPreferFocus?: boolean;
  onMenuEscapeLeft?: () => void;
  testID?: string;
  autoPlayInterval?: number;
  isMenuOpen?: boolean;
  isPaused?: boolean;
}

export const HeroCarousel = React.forwardRef<any, HeroCarouselProps>(
  (
    {
      slides,
      onContentFocus,
      onLibraryChange,
      onUnauthenticatedFavourite,
      shouldPreferFocus = true,
      onMenuEscapeLeft,
      testID = 'hero-banner',
      autoPlayInterval = 6000,
      isMenuOpen = false,
      isPaused = false,
    }: HeroCarouselProps,
    ref,
  ) => {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedAction, setFocusedAction] = useState<
    | 'play'
    | 'list'
    | 'prev'
    | 'next'
    | 'favourites'
    | 'continueWatch'
    | number
    | null
  >(null);
  const [isSavedInList, setIsSavedInList] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const isCarouselFocusedRef = useRef(false);

  const totalSlides = slides?.length || 0;
  const currentSlide = slides?.[activeIndex] || slides?.[0];

  const focusedActionRef = useRef(focusedAction);
  focusedActionRef.current = focusedAction;

  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  useTVEventHandler((evt) => {
    if (!evt) return;
    if (!isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (type === 'play' || type === 'playpause') {
      if (!isPaused && !isMenuOpen) {
        playVideo();
      }
      return;
    }

    if (focusedActionRef.current === 'play') {
      if (isSelectEvent(type)) {
        playVideo();
      } else if (type === 'left') {
        onMenuEscapeLeft?.();
      }
    } else if (focusedActionRef.current === 'list') {
      if (isSelectEvent(type)) {
        toggleWatchlist();
      }
    }
  });

  // Auto-play feature: Pauses when carousel is focused, side menu is open, OR any content card is focused
  useEffect(() => {
    if (totalSlides <= 1 || isMenuOpen || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      if (!isCarouselFocusedRef.current) {
        setActiveIndex((prev) => (prev + 1) % totalSlides);
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [totalSlides, autoPlayInterval, isMenuOpen, isPaused]);

  useEffect(() => {
    let active = true;

    const loadWatchlistState = async () => {
      if (!user || !activeProfile?.id || !currentSlide) {
        if (active) {
          setIsSavedInList(false);
        }
        return;
      }

      try {
        const inList = await isInWatchlist(activeProfile.id, currentSlide.id);
        if (active) {
          setIsSavedInList(inList);
        }
      } catch (error) {
        console.log('Hero watchlist load error:', error);
        if (active) {
          setIsSavedInList(false);
        }
      }
    };

    loadWatchlistState();

    return () => {
      active = false;
    };
  }, [activeProfile?.id, currentSlide, user]);

  const handleFocus = (action: 'play' | 'list' | 'prev' | 'next' | number) => {
    isCarouselFocusedRef.current = true;
    setFocusedAction(action);
    onContentFocus();
  };

  const handleBlur = () => {
    isCarouselFocusedRef.current = false;
    setFocusedAction(null);
  };

  const goToPrevSlide = () => {
    if (totalSlides > 0) {
      setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  const goToNextSlide = () => {
    if (totalSlides > 0) {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }
  };

  const playVideo = () => {
    if (currentSlide) {
      navigation.navigate(Routes.VideoPlayer, {
        movie: currentSlide,
        videoUrl: (currentSlide as any).videoUrl,
      });
    }
  };

  const openMovieDetails = () => {
    if (currentSlide) {
      navigation.navigate(Routes.MovieDetail, {
        movie: currentSlide,
      });
    }
  };

  const toggleWatchlist = async () => {
    if (!currentSlide || !user) {
      setToastMsg(strings.toasts.signInToAddToWatchlist);
      setTimeout(() => setToastMsg(null), 2500);
      onUnauthenticatedFavourite?.();
      return;
    }

    if (!activeProfile?.id) {
      setToastMsg(strings.toasts.selectProfileToAddToWatchlist);
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    const profileId = activeProfile.id;
    try {
      if (isSavedInList) {
        await removeFromWatchlist(profileId, currentSlide.id);
        setIsSavedInList(false);
        setToastMsg(strings.toasts.removedFromWatchlist);
      } else {
        await addToWatchlist(profileId, currentSlide as any);
        setIsSavedInList(true);
        setToastMsg(strings.toasts.addedToWatchlist);
      }
      setTimeout(() => setToastMsg(null), 2500);
      onLibraryChange?.();
    } catch (error) {
      console.log('Hero watchlist toggle error:', error);
    }
  };

  if (!currentSlide) {
    return null;
  }

  return (
    <ImageBackground
      source={currentSlide.image}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      testID={testID}>
      <View style={styles.overlay} />
      <View style={styles.gradientOverlay} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {currentSlide.badge && (
            <Text style={styles.badge}>{currentSlide.badge}</Text>
          )}
          {currentSlide.eyebrow && (
            <Text style={styles.eyebrow}>{currentSlide.eyebrow}</Text>
          )}
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        {currentSlide.meta && currentSlide.meta.length > 0 && (
          <FlatList
            horizontal
            data={currentSlide.meta}
            keyExtractor={(item) => item}
            style={styles.metaRow}
            contentContainerStyle={styles.metaRowContent}
            renderItem={({item}) => <HeroMetaTag item={item} />}
            ItemSeparatorComponent={MetaSeparator}
            showsHorizontalScrollIndicator={false}
          />
        )}

        <TVFocusGuideView
          ref={ref}
          style={styles.actionsRow}
          autoFocus={shouldPreferFocus}>
          <View style={styles.actionsWrap}>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  focusedAction === 'play' && styles.focusedAction,
                ]}
                onFocus={() => handleFocus('play')}
                onBlur={handleBlur}
                onPress={playVideo}
                activeOpacity={1}
                focusable={true}
                hasTVPreferredFocus={shouldPreferFocus && activeIndex === 0}
                accessibilityRole="button"
                accessibilityLabel={strings.hero.playAccessibility(
                  currentSlide.title,
                )}
                testID="hero-play-button">
                <Text style={styles.playButtonText}>{strings.actions.playWithIcon}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.listButton,
                  focusedAction === 'list' && styles.focusedAction,
                ]}
                onFocus={() => handleFocus('list')}
                onBlur={handleBlur}
                onPress={toggleWatchlist}
                activeOpacity={1}
                focusable={true}
                accessibilityRole="button"
                accessibilityLabel={
                  isSavedInList
                    ? `${strings.actions.removeFromMyList} ${currentSlide.title}`
                    : `${strings.actions.addToMyList} ${currentSlide.title}`
                }
                testID="hero-mylist-button">
                <Text style={styles.listButtonText}>
                  {isSavedInList
                    ? strings.actions.inMyList
                    : strings.actions.addToMyList}
                </Text>
              </TouchableOpacity>
            </View>
            {toastMsg ? (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toastMsg}</Text>
              </View>
            ) : null}
          </View>

          {totalSlides > 1 && (
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[
                  styles.navArrowButton,
                  focusedAction === 'prev' && styles.focusedNavArrow,
                ]}
                onFocus={() => {
                  handleFocus('prev');
                  goToPrevSlide();
                }}
                onBlur={handleBlur}
                onPress={goToPrevSlide}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.hero.previousSlide}
                testID="hero-prev-slide">
                <Text style={styles.navArrowText}>{strings.hero.prevArrow}</Text>
              </TouchableOpacity>

              <View style={styles.paginationContainer}>
                {slides.map((slide, index) => {
                  const isActive = index === activeIndex;
                  const isFocused = focusedAction === index;

                  return (
                    <TouchableOpacity
                      key={slide.id}
                      style={[
                        styles.paginationDot,
                        isActive && styles.activeDot,
                        isFocused && styles.focusedDot,
                      ]}
                      onFocus={() => {
                        handleFocus(index);
                        setActiveIndex(index);
                      }}
                      onBlur={handleBlur}
                      onPress={() => setActiveIndex(index)}
                      activeOpacity={1}
                      accessibilityRole="button"
                      accessibilityLabel={strings.hero.slideAccessibility(
                        index + 1,
                        totalSlides,
                        slide.title,
                      )}
                      testID={`hero-slide-dot-${index}`}
                    />
                  );
                })}
              </View>

              <TouchableOpacity
                style={[
                  styles.navArrowButton,
                  focusedAction === 'next' && styles.focusedNavArrow,
                ]}
                onFocus={() => {
                  handleFocus('next');
                  goToNextSlide();
                }}
                onBlur={handleBlur}
                onPress={goToNextSlide}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={strings.hero.nextSlide}
                testID="hero-next-slide">
                <Text style={styles.navArrowText}>{strings.hero.nextArrow}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
});
