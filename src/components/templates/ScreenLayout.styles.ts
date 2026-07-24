import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.screenBackground || '#090909',
  },
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed || 90,
    paddingBottom: spacing.contentBottom,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.screenTitle,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.screenTitle,
    marginTop: spacing.colossal,
    marginLeft: spacing.xlarge,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.focusedDescription,
    lineHeight: lineHeights.focusedDescription,
    marginTop: spacing.colossal,
    marginLeft: spacing.xlarge,
  },
});
