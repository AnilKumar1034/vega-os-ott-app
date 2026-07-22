import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  tile: {
    width: 320,
    height: 320,
    borderRadius: 44,
    overflow: 'hidden',
    padding: 20,
  },
  topHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: colors.tileDefault,
  },
  focused: {
    backgroundColor: colors.tileFocused,
    transform: [{scale: 1.1}],
    opacity: 1,
  },
  icon: {
    width: 80,
    height: 80,
    tintColor: colors.textPrimary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSizes.tileLabel,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    lineHeight: lineHeights.tileLabel,
    includeFontPadding: false,
  },
});
