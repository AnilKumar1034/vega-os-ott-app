import React from 'react';
import {Image, ImageSourcePropType, Text, View} from 'react-native';
import {styles} from './CommonHeader.styles';

interface CommonHeaderProps {
  title: string;
  logo?: ImageSourcePropType;
  testID?: string;
}

export const CommonHeader = ({title, logo, testID}: CommonHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>PREMIUM</Text>
      </View>
      {logo && (
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          testID={testID}
        />
      )}
    </View>
  );
};
