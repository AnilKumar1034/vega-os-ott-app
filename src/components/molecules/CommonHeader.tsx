import React, {useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
} from 'react-native';
import {
  Pressable,
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {CommonSearch} from './CommonSearch';
import {styles} from './CommonHeader.styles';

import {strings} from '../../constants/strings';
import {useAuth} from '../../context/authContext';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';

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
  onFocusEscapeDown?: () => void;
  onFocusEscapeLeft?: () => void;
  filterFocusGuideRef?: React.Ref<any>;
  filterHasTVPreferredFocus?: boolean;
  onSearchSubmit?: () => void;
  searchMaxLength?: number;
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
  onFocusEscapeDown,
  onFocusEscapeLeft,
  filterFocusGuideRef,
  filterHasTVPreferredFocus,
  onSearchSubmit,
  searchMaxLength,
}: CommonHeaderProps) => {
  const [isFilterFocused, setIsFilterFocused] = useState(false);
  const [filterButton, setFilterButton] = useState<any>(null);
  const filterButtonRef = useRef<any>(null);
  const filterGuideRef = useRef<any>(null);

  const focusFilterButton = useCallback(() => {
    setIsFilterFocused(true);
    isFilterFocusedRef.current = true;
    if (
      filterButtonRef.current &&
      typeof filterButtonRef.current.requestTVFocus === 'function'
    ) {
      filterButtonRef.current.requestTVFocus();
    } else if (
      filterButtonRef.current &&
      typeof filterButtonRef.current.focus === 'function'
    ) {
      filterButtonRef.current.focus();
    }
  }, []);

  useImperativeHandle(
    filterFocusGuideRef,
    () => ({
      requestTVFocus: focusFilterButton,
      focus: focusFilterButton,
      getNode: () => filterButtonRef.current,
      setDestinations: (destinations: any[]) => {
        filterGuideRef.current?.setDestinations?.(destinations);
      },
    }),
    [focusFilterButton],
  );

  useEffect(() => {
    if (filterHasTVPreferredFocus) {
      focusFilterButton();
    }
  }, [filterHasTVPreferredFocus, focusFilterButton]);

  const auth = useAuth();
  const currentSub =
    auth?.userProfile?.subscription?.toUpperCase() ||
    strings.subscriptions.premium.toUpperCase();

  const isFilterFocusedRef = useRef(isFilterFocused);
  isFilterFocusedRef.current = isFilterFocused;

  useTVEventHandler((evt) => {
    if (!isFilterFocusedRef.current || !evt) {
      return;
    }
    if (!isKeyDown(evt.eventKeyAction)) {
      return;
    }
    const type = evt.eventType?.toLowerCase();
    if (isSelectEvent(type)) {
      onFilterPress?.();
    } else if (type === 'down' || isBackEvent(type)) {
      onFocusEscapeDown?.();
    } else if (type === 'left') {
      onFocusEscapeLeft?.();
    }
  });

  return (
    <TVFocusGuideView style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{currentSub}</Text>
      </View>
      <View style={styles.actions} focusable={false}>
        {showSearch && onSearchChange && (
          <CommonSearch
            value={searchValue}
            onChangeText={onSearchChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            hasTVPreferredFocus={searchHasTVPreferredFocus}
            onSubmitEditing={onSearchSubmit}
            maxLength={searchMaxLength}
            onFocusEscapeDown={onFocusEscapeDown}
          />
        )}
        {filterLabel && onFilterPress && (
          <TVFocusGuideView
            ref={filterGuideRef}
            destinations={filterButton ? [filterButton] : []}>
            <Pressable
              ref={(node) => {
                filterButtonRef.current = node;
                setFilterButton(node);
              }}
              style={({focused}) => [
                styles.filterButton,
                (focused || isFilterFocused) && styles.filterButtonFocused,
              ]}
              onPress={onFilterPress}
              onFocus={() => {
                setIsFilterFocused(true);
                isFilterFocusedRef.current = true;
              }}
              onBlur={() => {
                setIsFilterFocused(false);
                isFilterFocusedRef.current = false;
              }}
              hasTVPreferredFocus={filterHasTVPreferredFocus}
              accessibilityRole="button"
              accessibilityLabel={filterLabel}
              testID="common-header-filter-button">
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
