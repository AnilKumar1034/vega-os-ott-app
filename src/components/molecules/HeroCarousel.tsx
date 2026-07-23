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
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../constants/routes';
import {AppDetails} from '../../constants/appDetails';
import {HeroMetaTag} from '../atoms/HeroMetaTag';
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
  shouldPreferFocus?: boolean;
  testID?: string;
  autoPlayInterval?: number;
  isMenuOpen?: boolean;
  isPaused?: boolean;
}

export const HeroCarousel = ({
  slides,
  onContentFocus,
  shouldPreferFocus = true,
  testID = AppDetails.heroBannerTestId,
  autoPlayInterval = 6000,
  isMenuOpen = false,
  isPaused = false,
}: HeroCarouselProps) => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedAction, setFocusedAction] = useState<
    'play' | 'list' | 'prev' | 'next' | number | null
  >(null);
  const isCarouselFocusedRef = useRef(false);

  const totalSlides = slides?.length || 0;
  const currentSlide = slides?.[activeIndex] || slides?.[0];

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

  const openMovieDetails = () => {
    if (currentSlide) {
      navigation.navigate(Routes.MovieDetail, {
        movie: currentSlide,
      });
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

        <TVFocusGuideView style={styles.actionsRow} autoFocus>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.playButton,
                focusedAction === 'play' && styles.focusedAction,
              ]}
              onFocus={() => handleFocus('play')}
              onBlur={handleBlur}
              onPress={openMovieDetails}
              activeOpacity={1}
              hasTVPreferredFocus={shouldPreferFocus && activeIndex === 0}
              accessibilityRole="button"
              accessibilityLabel={`Play ${currentSlide.title}`}
              testID="hero-play-button">
              <Text style={styles.playButtonText}>{AppDetails.play}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.listButton,
                focusedAction === 'list' && styles.focusedAction,
              ]}
              onFocus={() => handleFocus('list')}
              onBlur={handleBlur}
              onPress={openMovieDetails}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={`Add ${currentSlide.title} to My List`}
              testID="hero-mylist-button">
              <Text style={styles.listButtonText}>{AppDetails.myList}</Text>
            </TouchableOpacity>
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
                accessibilityLabel={AppDetails.previousSlide}
                testID="hero-prev-slide">
                <Text style={styles.navArrowText}>{AppDetails.prevArrow}</Text>
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
                      accessibilityLabel={`Slide ${
                        index + 1
                      } of ${totalSlides}: ${slide.title}`}
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
                accessibilityLabel={AppDetails.nextSlide}
                testID="hero-next-slide">
                <Text style={styles.navArrowText}>{AppDetails.nextArrow}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
