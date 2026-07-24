import React, {useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {HeroCarousel} from '../components/molecules/HeroCarousel';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentRow, homeHeroSlides} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {filterContentRows, filterHeroSlides} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isAnyCardFocused, setIsAnyCardFocused] = useState(false);

  const filteredRows = filterContentRows(homeContentRows, searchQuery);
  const filteredHeroSlides = filterHeroSlides(homeHeroSlides, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
    setIsAnyCardFocused(false);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const handleHeroFocus = () => {
    setIsMenuExpanded(false);
    setIsAnyCardFocused(false);
  };

  const handleCardFocus = () => {
    setIsMenuExpanded(false);
    setIsAnyCardFocused(true);
  };

  const renderHomeRow = ({
    item: row,
    index,
  }: {
    item: HomeContentRow;
    index: number;
  }) => (
    <ContentRow
      row={row}
      onContentFocus={handleCardFocus}
      shouldPreferFocus={index === 0}
    />
  );

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID={AppDetails.homeTestId}>
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={handleHeroFocus}
        />
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => row.id}
            ListHeaderComponent={
              filteredHeroSlides.length > 0 ? (
                <HeroCarousel
                  slides={filteredHeroSlides}
                  onContentFocus={handleHeroFocus}
                  isMenuOpen={isMenuExpanded}
                  isPaused={isAnyCardFocused}
                  testID={AppDetails.heroBannerTestId}
                />
              ) : null
            }
            renderItem={renderHomeRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentList}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
