import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../theme/fonts';
import {sizes} from '../theme/sizes';

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
    width: sizes.splashLogoWidth,
    height: sizes.splashLogoHeight,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.headerTitle,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.headerTitle,
  },
});
