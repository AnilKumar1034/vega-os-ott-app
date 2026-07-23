import React from 'react';
import {FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Routes} from '../../constants/routes';
import {HomeContentItem} from '../../data/home';
import {AppDetails} from '../../constants/appDetails';
import {ContentCard} from '../molecules/ContentCard';
import {styles} from '../../screens/MovieDetailScreen.styles';

interface MovieDetailBodyProps {
  selectedMovie: HomeContentItem;
  recommendations: HomeContentItem[];
  focusedAction: 'play' | 'list' | 'back' | null;
  onFocusAction: (action: 'play' | 'list' | 'back') => void;
  onBlurAction: () => void;
  onCardFocus: () => void;
}

export const MovieDetailBody = ({
  selectedMovie,
  recommendations,
  focusedAction,
  onFocusAction,
  onBlurAction,
  onCardFocus,
}: MovieDetailBodyProps) => {
  const navigation = useNavigation<any>();

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
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={`Play ${selectedMovie.title}`}>
              <Text style={styles.playButtonText}>{AppDetails.watchNow}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                focusedAction === 'list' && styles.focusedAction,
              ]}
              onFocus={() => onFocusAction('list')}
              onBlur={onBlurAction}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={`Add ${selectedMovie.title} to My List`}>
              <Text style={styles.secondaryButtonText}>
                {AppDetails.myList}
              </Text>
            </TouchableOpacity>

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
              accessibilityLabel="Go Back"
              testID="detail-back-button">
              <Text style={styles.backButtonText}>{AppDetails.back}</Text>
            </TouchableOpacity>
          </View>
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
