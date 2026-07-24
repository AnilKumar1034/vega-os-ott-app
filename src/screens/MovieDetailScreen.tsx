import React, {useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {MovieDetailBody} from '../components/organisms/MovieDetailBody';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentItem} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {styles} from './MovieDetailScreen.styles';
import {useRoute} from '@react-navigation/native';
import {filterContentItem} from '../utils/searchUtils';

export const MovieDetailScreen = () => {
  const route = useRoute<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [focusedAction, setFocusedAction] = useState<
    'play' | 'list' | 'back' | null
  >(null);

  const selectedMovie: HomeContentItem =
    route.params?.movie || homeContentRows[0].items[0];
  const allRecommendations =
    homeContentRows[1]?.items || homeContentRows[0].items;

  const recommendations = allRecommendations.filter((item) =>
    filterContentItem(item, searchQuery),
  );

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  const renderDetailItem = () => (
    <MovieDetailBody
      selectedMovie={selectedMovie}
      recommendations={recommendations}
      focusedAction={focusedAction}
      onFocusAction={(action) => {
        setIsMenuExpanded(false);
        setFocusedAction(action);
      }}
      onBlurAction={() => setFocusedAction(null)}
      onCardFocus={collapseMenu}
    />
  );

  return (
    <ImageBackground
      source={selectedMovie.image}
      style={styles.background}
      imageStyle={styles.backdropImage}
      testID="movie-detail-screen">
      <View style={styles.overlay} />
      <SideMenu
        activeRoute={Routes.Details}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <CommonHeader
            title={AppDetails.name}
            logo={require('../assets/vega.png')}
            testID="vega-logo"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchFocus={collapseMenu}
          />
        </View>

        <TVFocusGuideView autoFocus style={styles.background}>
          <FlatList
            data={[selectedMovie]}
            keyExtractor={(item) => item.id || item.title}
            showsVerticalScrollIndicator={false}
            renderItem={renderDetailItem}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
