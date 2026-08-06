import React from 'react';
import {Image, ImageSourcePropType, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CommonSearch} from './CommonSearch';
import {styles} from './CommonHeader.styles';

import {strings} from '../../constants/strings';

export interface CommonHeaderProps {
  title: string;
  logo?: ImageSourcePropType;
  testID?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  searchHasTVPreferredFocus?: boolean;
  showSearch?: boolean;
}

export const CommonHeader = ({
  title,
  logo = require('../../assets/vega.png'),
  testID,
  searchValue = '',
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  searchHasTVPreferredFocus,
  showSearch = true,
}: CommonHeaderProps) => {
  return (
    <TVFocusGuideView style={styles.container} autoFocus={false}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {strings.subscriptions.premium.toUpperCase()}
        </Text>
      </View>
      <View style={styles.actions} focusable={false}>
        {showSearch && onSearchChange && (
          <CommonSearch
            value={searchValue}
            onChangeText={onSearchChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            hasTVPreferredFocus={searchHasTVPreferredFocus}
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
      </View>
    </TVFocusGuideView>
  );
};
