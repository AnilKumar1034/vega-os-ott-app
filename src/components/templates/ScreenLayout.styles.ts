import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 120,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.screenTitle,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.screenTitle,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.focusedDescription,
    lineHeight: lineHeights.focusedDescription,
    marginTop: 32,
  },
});
