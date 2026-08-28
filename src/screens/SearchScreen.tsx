import React, {useState} from 'react';
import {FlatList, ImageBackground, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {
  homeContentRows,
  HomeContentRow,
} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {useProfile} from '../profiles/hooks/useProfile';
import {filterContentRowsForProfile} from '../utils/contentAccessPolicy';
import {filterContentRows} from '../utils/searchUtils';
import {styles} from './HomeScreen.styles';
import {useRoute} from '@react-navigation/native';

export const SearchScreen = () => {
  const route = useRoute<any>();
  const {activeProfile} = useProfile();
  const initialQuery = route.params?.q || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const allowedRows = filterContentRowsForProfile(activeProfile, homeContentRows);
  const filteredRows = filterContentRows(allowedRows, searchQuery);

  const handleMenuFocus = () => {
    setIsMenuExpanded(true);
  };

  const handleMenuBlur = () => {
    setIsMenuExpanded(false);
  };

  const handleHeroFocus = () => {
    setIsMenuExpanded(false);
  };

  const handleCardFocus = () => {
    setIsMenuExpanded(false);
  };

  const renderSearchRow = ({
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
      testID="search-screen">
      <SideMenu
        activeRoute={Routes.Search}
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
          onSearchFocus={() => {
            setIsSearchFocused(true);
            handleHeroFocus();
          }}
          onSearchBlur={() => setIsSearchFocused(false)}
          searchHasTVPreferredFocus={isSearchFocused}
        />
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <FlatList
            data={filteredRows}
            keyExtractor={(row) => `search-${row.id}`}
            renderItem={renderSearchRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentList}
          />
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
