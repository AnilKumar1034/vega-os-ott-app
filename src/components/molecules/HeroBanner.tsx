import React, {ReactNode, useState} from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {AppDetails} from '../../constants/appDetails';
import {strings} from '../../constants/strings';
import {HeroMetaTag} from '../atoms/HeroMetaTag';
import {styles} from './HeroBanner.styles';

const MetaSeparator = () => <Text style={styles.metaDot}>•</Text>;

interface HeroBannerProps {
  title: string;
  description: ReactNode;
  eyebrow?: string;
  meta?: string[];
  image?: ImageSourcePropType;
  onContentFocus: () => void;
}

export const HeroBanner = ({
  title,
  description,
  eyebrow = strings.hero.original,
  meta = [strings.hero.uhd, strings.hero.newRelease],
  image = require('../../assets/background.png'),
  onContentFocus,
}: HeroBannerProps) => {
  const [focusedAction, setFocusedAction] = useState<'play' | 'list' | null>(
    null,
  );

  return (
    <ImageBackground
      source={image}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      testID="hero-banner">
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <FlatList
          horizontal
          data={meta}
          keyExtractor={(item) => item}
          style={styles.metaRow}
          contentContainerStyle={styles.metaRowContent}
          renderItem={({item}) => <HeroMetaTag item={item} />}
          ItemSeparatorComponent={MetaSeparator}
          showsHorizontalScrollIndicator={false}
        />
        <TVFocusGuideView style={styles.actions} autoFocus>
          <TouchableOpacity
            style={[
              styles.playButton,
              focusedAction === 'play' && styles.focusedAction,
            ]}
            onFocus={() => {
              setFocusedAction('play');
              onContentFocus();
            }}
            onBlur={() => setFocusedAction(null)}
            activeOpacity={1}
            hasTVPreferredFocus
            accessibilityRole="button"
            accessibilityLabel={strings.hero.playAccessibility(title)}>
            <Text style={styles.playButtonText}>{AppDetails.play}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.listButton,
              focusedAction === 'list' && styles.focusedAction,
            ]}
            onFocus={() => {
              setFocusedAction('list');
              onContentFocus();
            }}
            onBlur={() => setFocusedAction(null)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={strings.hero.addToListAccessibility(title)}>
            <Text style={styles.listButtonText}>
              {strings.actions.favourite}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </ImageBackground>
  );
};
