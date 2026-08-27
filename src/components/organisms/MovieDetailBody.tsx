import React from 'react';
import {FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Routes} from '../../constants/routes';
import {HomeContentItem} from '../../data/home';
import {AppDetails} from '../../constants/appDetails';
import {strings} from '../../constants/strings';
import {ContentCard} from '../molecules/ContentCard';
import {styles} from '../../screens/MovieDetailScreen.styles';

interface MovieDetailBodyProps {
  selectedMovie: HomeContentItem;
  recommendations: HomeContentItem[];
  focusedAction: 'play' | 'list' | 'back' | 'favourites' | 'continueWatch' | null;
  continueWatchProgress: number | null;
  isFavourite?: boolean;
  isInWatchlist?: boolean;
  toastMessage?: string | null;
  onFocusAction: (action: 'play' | 'list' | 'back' | 'favourites' | 'continueWatch') => void;
  onBlurAction: () => void;
  onCardFocus: () => void;
  onAddFavourite?: () => void;
  onRemoveFavourite?: () => void;
  onToggleWatchlist?: () => void;
  onRemoveContinueWatch: () => void;
}

export const MovieDetailBody = ({
  selectedMovie,
  recommendations,
  focusedAction,
  continueWatchProgress,
  isFavourite = false,
  isInWatchlist = false,
  toastMessage,
  onFocusAction,
  onBlurAction,
  onCardFocus,
  onAddFavourite,
  onRemoveFavourite,
  onToggleWatchlist,
  onRemoveContinueWatch,
}: MovieDetailBodyProps) => {
  const navigation = useNavigation<any>();
  const inList = isInWatchlist || isFavourite;
  const handleToggleList = onToggleWatchlist || (inList ? onRemoveFavourite : onAddFavourite);

  return (
    <View style={styles.mainCardContainer}>
      <View style={styles.mainCardRow}>
        <Image
          source={selectedMovie.image}
          style={styles.posterImage}
          resizeMode="cover"
        />
        <View style={styles.detailsColumn}>
          <View style={styles.badgeRow}>
            {selectedMovie.badge && (
              <Text style={styles.badge}>{selectedMovie.badge}</Text>
            )}
            {selectedMovie.rating && (
              <Text style={styles.ratingText}>{selectedMovie.rating}</Text>
            )}
            {selectedMovie.genre && (
              <Text style={styles.genreText}>{selectedMovie.genre}</Text>
            )}
          </View>

          <Text style={styles.title}>{selectedMovie.title}</Text>

          {selectedMovie.meta && (
            <View style={styles.metaRow}>
              {selectedMovie.meta.map((m) => (
                <View key={m} style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{m}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.description}>{selectedMovie.description}</Text>

          {continueWatchProgress !== null && continueWatchProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {strings.hero.continueWatching}
                </Text>
                <Text style={styles.progressValueLabel}>
                  {Math.round(continueWatchProgress * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${continueWatchProgress * 100}%`},
                  ]}
                />
              </View>
            </View>
          )}

          {selectedMovie.cast && (
            <View style={styles.castRow}>
              <Text style={styles.castLabel}>
                {AppDetails.castLabel}{' '}
                <Text style={styles.castText}>{selectedMovie.cast}</Text>
              </Text>
            </View>
          )}

          {selectedMovie.director && (
            <View style={styles.castRow}>
              <Text style={styles.castLabel}>
                {AppDetails.directorLabel}{' '}
                <Text style={styles.castText}>{selectedMovie.director}</Text>
              </Text>
            </View>
          )}

          <View style={styles.actionsGuide}>
            <TouchableOpacity
              style={[
                styles.playButton,
                focusedAction === 'play' && styles.focusedAction,
              ]}
              onFocus={() => onFocusAction('play')}
              onBlur={onBlurAction}
              onPress={() =>
                navigation.navigate(Routes.VideoPlayer, {
                  movie: selectedMovie,
                  videoUrl: selectedMovie.videoUrl,
              })
              }
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.hero.playAccessibility(
                selectedMovie.title,
              )}
              testID="detail-play-button">
              <Text style={styles.playButtonText}>{AppDetails.watchNow}</Text>
            </TouchableOpacity>

            {continueWatchProgress !== null && continueWatchProgress > 0 && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.removeWatchlistButton,
                  focusedAction === 'continueWatch' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('continueWatch')}
                onBlur={onBlurAction}
                onPress={onRemoveContinueWatch}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.removeWatchlist} ${selectedMovie.title}`}
                testID="remove-watchlist-button">
                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.removeWatchlistText,
                  ]}>
                  {strings.actions.watchlist}
                </Text>
              </TouchableOpacity>
            )}

            {inList ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.removeFavouriteButton,
                  focusedAction === 'favourites' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('favourites')}
                onBlur={onBlurAction}
                onPress={handleToggleList}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.removeFromMyList} ${selectedMovie.title}`}
                testID="my-list-button">
                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.removeFavouriteText,
                  ]}>
                  {strings.actions.inMyList}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.addFavouriteButton,
                  focusedAction === 'favourites' && styles.focusedAction,
                ]}
                onFocus={() => onFocusAction('favourites')}
                onBlur={onBlurAction}
                onPress={handleToggleList}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel={`${strings.actions.addToMyList} ${selectedMovie.title}`}
                testID="my-list-button">
                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.addFavouriteText,
                  ]}>
                  {strings.actions.addToMyList}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.backButton,
                focusedAction === 'back' && styles.focusedAction,
              ]}
              onFocus={() => onFocusAction('back')}
              onBlur={onBlurAction}
              onPress={() => navigation.navigate(Routes.Home)}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={strings.actions.goBack}
              testID="detail-back-button">
              <Text style={styles.backButtonText}>{AppDetails.back}</Text>
            </TouchableOpacity>
          </View>
          {toastMessage ? (
            <View style={styles.inlineToast}>
              <Text style={styles.inlineToastText}>{toastMessage}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>{AppDetails.moreLikeThisTitle}</Text>
        <FlatList
          horizontal
          data={recommendations}
          keyExtractor={(item) => `rec-${item.id}`}
          renderItem={({item}) => (
            <ContentCard {...item} layout="portrait" onFocus={onCardFocus} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recList}
        />
      </View>
    </View>
  );
};
