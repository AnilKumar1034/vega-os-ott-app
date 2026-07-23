import React, {useState} from 'react';
import {FlatList, ImageBackground, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {ContentRow} from '../components/molecules/ContentRow';
import {SideMenu} from '../components/molecules/SideMenu';
import {Routes} from '../constants/routes';
import {homeContentRows, HomeContentRow} from '../data/home';
import {AppDetails} from '../constants/appDetails';
import {styles} from './HomeScreen.styles';

export const MoviesScreen = () => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);

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
        onMenuFocus={() => setIsMenuExpanded(true)}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.moviesScreenTitle}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
        />
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <FlatList
            data={homeContentRows}
            keyExtractor={(row) => `movies-${row.id}`}
            ListHeaderComponent={
              <View style={styles.moviesHeader}>
                <Text style={styles.moviesTitle}>
                  {AppDetails.moviesHeaderTitle}
                </Text>
                <Text style={styles.moviesSubtitle}>
                  {AppDetails.moviesHeaderSubtitle}
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
