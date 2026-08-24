import React, {useState} from 'react';
import {Image, ImageSourcePropType, Pressable, Text, View} from 'react-native';
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
  filterLabel?: string;
  onFilterPress?: () => void;
  filterFocusGuideRef?: React.Ref<React.ElementRef<typeof TVFocusGuideView>>;
  filterHasTVPreferredFocus?: boolean;
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
  filterLabel,
  onFilterPress,
  filterFocusGuideRef,
  filterHasTVPreferredFocus,
}: CommonHeaderProps) => {
  const [isFilterFocused, setIsFilterFocused] = useState(false);
  const [filterButton, setFilterButton] = useState<React.ElementRef<
    typeof Pressable
  > | null>(null);

  return (
    <TVFocusGuideView
      style={styles.container}
      autoFocus={Boolean(filterLabel && onFilterPress)}>
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
        {filterLabel && onFilterPress && (
          <TVFocusGuideView
            ref={filterFocusGuideRef}
            autoFocus
            destinations={filterButton ? [filterButton] : []}>
            <Pressable
              ref={setFilterButton}
              style={[
                styles.filterButton,
                isFilterFocused && styles.filterButtonFocused,
              ]}
              onPress={onFilterPress}
              onFocus={() => setIsFilterFocused(true)}
              onBlur={() => setIsFilterFocused(false)}
              hasTVPreferredFocus={filterHasTVPreferredFocus}
              accessibilityRole="button"
              accessibilityLabel={filterLabel}>
              <Text style={styles.filterButtonText}>{filterLabel} ▾</Text>
            </Pressable>
          </TVFocusGuideView>
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
