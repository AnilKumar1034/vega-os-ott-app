import React, {ReactNode} from 'react';
import {ImageBackground, Text, View} from 'react-native';
import {styles} from './HeroBanner.styles';

interface HeroBannerProps {
  title: string;
  description: ReactNode;
}

export const HeroBanner = ({title, description}: HeroBannerProps) => {
  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      testID="hero-banner">
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LOGIXSTREAM ORIGINAL</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>4K UHD</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>NEW RELEASE</Text>
        </View>
      </View>
    </ImageBackground>
  );
};
