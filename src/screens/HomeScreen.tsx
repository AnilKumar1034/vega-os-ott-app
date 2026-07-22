import React, {useState} from 'react';
import {ImageBackground, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonHeader} from '../components/molecules/CommonHeader';
import {HeroBanner} from '../components/molecules/HeroBanner';
import {SideMenu} from '../components/molecules/SideMenu';
import {Tile} from '../components/molecules/Tile';
import {Routes} from '../constants/routes';
import {AppDetails, tiles} from '../data/tiles';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => {
  const [focusedTileId, setFocusedTileId] = useState<string>(tiles[0].id);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const focusedTile = tiles.find((tile) => tile.id === focusedTileId);
  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID="home-screen">
      <SideMenu
        activeRoute={Routes.Home}
        isExpanded={isMenuExpanded}
        onMenuFocus={() => setIsMenuExpanded(true)}
      />
      <View style={styles.content}>
        <CommonHeader
          title={AppDetails.name}
          logo={require('../assets/vega.png')}
          testID="vega-logo"
        />
        <HeroBanner
          title={focusedTile?.label || AppDetails.name}
          description={focusedTile?.description || AppDetails.commingSoonMsg}
        />

        <TVFocusGuideView style={styles.tileRowContent}>
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              label={tile.label}
              icon={tile.icon}
              isFocused={focusedTileId === tile.id}
              onFocus={() => {
                setFocusedTileId(tile.id);
                setIsMenuExpanded(false);
              }}
              onBlur={() => {}}
              testID={`tile-${tile.id}`}
              accessibilityLabel={tile.accessibilityLabel}
              hasTVPreferredFocus={tile.id === tiles[0].id}
            />
          ))}
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
