import React from 'react';
import {Image, ImageSourcePropType, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonSearch} from './CommonSearch';
import {styles} from './CommonHeader.styles';

export interface CommonHeaderProps {
  title: string;
  logo?: ImageSourcePropType;
  testID?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  showSearch?: boolean;
}

export const CommonHeader = ({
  title,
  logo,
  testID,
  searchValue = '',
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  showSearch = true,
}: CommonHeaderProps) => {
  return (
    <TVFocusGuideView style={styles.container} autoFocus={false}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>PREMIUM</Text>
      </View>
      {showSearch && onSearchChange && (
        <CommonSearch
          value={searchValue}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
      )}
      {logo && (
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          testID={testID}
        />
      )}
    </TVFocusGuideView>
  );
};
