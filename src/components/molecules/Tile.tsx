import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {styles} from './Tile.styles';

export interface TileProps {
  label: string;
  icon: ImageSourcePropType;
  isFocused: boolean;
  onFocus: () => void;
  onBlur?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  hasTVPreferredFocus?: boolean;
}

export const Tile = ({
  label,
  icon,
  isFocused,
  onFocus,
  onBlur,
  testID,
  accessibilityLabel,
  hasTVPreferredFocus,
}: TileProps) => {
  return (
    <TouchableOpacity
      style={[styles.tile, isFocused ? styles.focused : styles.default]}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hasTVPreferredFocus={hasTVPreferredFocus}
      activeOpacity={1}>
      <View style={styles.topHalf}>
        <Image
          source={icon}
          style={styles.icon}
          resizeMode="contain"
          accessible={false}
        />
      </View>
      <View style={styles.bottomHalf}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};
