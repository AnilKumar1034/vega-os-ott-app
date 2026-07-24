import React, {useRef, useState} from 'react';
import {TextInput, TouchableOpacity} from 'react-native';
import {MenuIcon} from '../atoms/MenuIcon';
import {colors} from '../../theme/colors';
import {styles} from './CommonSearch.styles';

export interface CommonSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
  hasTVPreferredFocus?: boolean;
}

export const CommonSearch = ({
  value,
  onChangeText,
  placeholder = 'Search movies, shows, genre...',
  onFocus,
  onBlur,
  testID = 'common-search-input',
  hasTVPreferredFocus,
}: CommonSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleContainerPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[styles.container, isFocused && styles.focusedContainer]}
      accessibilityRole="search"
      accessibilityLabel="Search movies, shows, and genres"
      testID="common-search-container">
      <MenuIcon
        name="Search"
        size={22}
        color={isFocused ? colors.focusedTint : colors.textPrimary}
        style={styles.searchIcon}
        focused={isFocused}
        testID="search-icon"
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityRole="search"
        accessibilityLabel="Search input field"
        testID={testID}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          testID="clear-search-button">
          <MenuIcon
            name="Close"
            size={20}
            color={colors.heroAccent}
            focused={isFocused}
            testID="clear-icon"
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};
