import React, {useRef, useState} from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import {MenuIcon} from '../atoms/MenuIcon';
import {colors} from '../../theme/colors';
import {styles} from './CommonSearch.styles';

import {strings} from '../../constants/strings';

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
  placeholder = strings.placeholders.search,
  onFocus,
  onBlur,
  testID = 'common-search-input',
  hasTVPreferredFocus,
}: CommonSearchProps) => {
  const [focusedTarget, setFocusedTarget] = useState<'input' | 'clear' | null>(
    null,
  );
  const inputRef = useRef<TextInput>(null);
  const isFocused = focusedTarget !== null;

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const handleFocus = (target: 'input' | 'clear') => {
    setFocusedTarget(target);
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = () => {
    setFocusedTarget(null);
    if (onBlur) {
      onBlur();
    }
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <View
      style={[styles.container, isFocused && styles.focusedContainer]}
      focusable={false}
      accessible={false}
      testID="common-search-container">
      <View style={styles.searchIconContainer} focusable={false}>
        <MenuIcon
          name="Search"
          size={26}
          color={isFocused ? colors.textPrimary : colors.textSecondary}
          style={styles.searchIcon}
          testID="search-icon"
        />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleTextChange}
        onChange={(event: NativeSyntheticEvent<TextInputChangeEventData>) => {
          handleTextChange(event.nativeEvent.text);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        onFocus={() => handleFocus('input')}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        returnKeyType="search"
        autoCorrect={false}
        selectionColor={colors.heroAccent}
        accessibilityRole="search"
        accessibilityLabel={strings.search.moviesShowsGenres}
        testID={testID}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          onFocus={() => handleFocus('clear')}
          onBlur={handleBlur}
          activeOpacity={1}
          style={[
            styles.clearButton,
            focusedTarget === 'clear' && styles.clearButtonFocused,
          ]}
          accessibilityRole="button"
          accessibilityLabel={strings.search.clearText}
          testID="clear-search-button">
          <MenuIcon
            name="Close"
            size={18}
            color={
              focusedTarget === 'clear'
                ? colors.textPrimary
                : colors.textSecondary
            }
            testID="clear-icon"
          />
        </TouchableOpacity>
      )}
      {value.length === 0 && (
        <Text style={styles.inputHint}>{strings.search.pressOk}</Text>
      )}
    </View>
  );
};
