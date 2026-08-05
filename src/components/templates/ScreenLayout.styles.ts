import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed || 90,
    paddingBottom: spacing.contentBottom,
  },
  body: {
    flex: 1,
  },
  heading: {},
  headingCompact: {
    paddingTop: spacing.xlarge,
    paddingHorizontal: spacing.screenHorizontal,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.screenTitle,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.screenTitle,
    marginTop: spacing.colossal,
    marginLeft: spacing.xlarge,
  },
  titleCompact: {
    fontSize: fontSizes.moviesTitle,
    lineHeight: lineHeights.commonHeaderTitle,
    marginTop: spacing.none,
    marginLeft: spacing.none,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.focusedDescription,
    lineHeight: lineHeights.focusedDescription,
    marginTop: spacing.colossal,
    marginLeft: spacing.xlarge,
  },
  descriptionCompact: {
    color: colors.textSecondary,
    fontSize: fontSizes.button,
    lineHeight: fontSizes.userName,
    marginTop: spacing.xxs,
    marginLeft: spacing.none,
  },
});
