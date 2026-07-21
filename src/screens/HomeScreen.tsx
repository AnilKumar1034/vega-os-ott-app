import React, {useState} from 'react';
import {Image, ImageBackground, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Tile} from '../components/Tile';
import {SideMenu} from '../components/SideMenu';
import {Routes} from '../constants/routes';
import {AppDetails, tiles} from '../data/tiles';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => {
  const [focusedTileId, setFocusedTileId] = useState<string>(tiles[0].id);
  const focusedTile = tiles.find((tile) => tile.id === focusedTileId);
  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      testID="home-screen">
      <SideMenu activeRoute={Routes.Home} />
      <View style={styles.content}>
        <View style={styles.headerArea}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{AppDetails.name}</Text>
            <Text style={styles.headerSubtitle}>
              {focusedTile?.description || AppDetails.commingSoonMsg}
            </Text>
          </View>
          <Image
            source={require('../assets/vega.png')}
            style={styles.vegaLogo}
            resizeMode="contain"
            testID="vega-logo"
          />
        </View>

        <TVFocusGuideView style={styles.tileRowContent}>
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              label={tile.label}
              icon={tile.icon}
              isFocused={focusedTileId === tile.id}
              onFocus={() => setFocusedTileId(tile.id)}
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
