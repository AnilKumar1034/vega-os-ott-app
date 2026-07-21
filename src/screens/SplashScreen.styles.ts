import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../theme/fonts';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 500,
    height: 350,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.headerTitle,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.headerTitle,
  },
});
