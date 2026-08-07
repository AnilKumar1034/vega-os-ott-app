import React, {useState} from 'react';
import {FlatList, ImageBackground, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentRow} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {strings} from '../constants/strings';
import {filterContentRows} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';

export const MoviesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const filteredRows = filterContentRows(homeContentRows, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const collapseMenu = () => setIsMenuExpanded(false);

  const renderMovieRow = ({
    item: row,
    index,
  }: {
    item: HomeContentRow;
    index: number;
  }) => (
    <ContentRow
      row={row}
      onContentFocus={collapseMenu}
      shouldPreferFocus={index === 0}
    />
  );

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID={AppDetails.moviesTestId}>
      <SideMenu
        activeRoute={Routes.Movies}
        isExpanded={isMenuExpanded}
        onMenuFocus={handleMenuFocus}
        onMenuBlur={handleMenuBlur}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.moviesScreenTitle}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => {
            setIsSearchFocused(true);
            collapseMenu();
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
        />
        <TVFocusGuideView
          style={styles.contentGuide}
          autoFocus={!isSearchFocused}>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => `movies-${row.id}`}
            ListHeaderComponent={
              <View style={styles.moviesHeader}>
                <Text style={styles.moviesTitle}>
                  {strings.nav.moviesHeaderTitle}
                </Text>
                <Text style={styles.moviesSubtitle}>
                  {strings.nav.moviesHeaderSubtitle}
                </Text>
              </View>
            }
            renderItem={renderMovieRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentList}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
